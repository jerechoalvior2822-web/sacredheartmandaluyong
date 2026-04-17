import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input, Select, Textarea } from '../components/Input';
import { Upload, CheckCircle, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';

export function Donations() {
  const { t } = useTranslation();
  const [donationType, setDonationType] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [message, setMessage] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);

  useEffect(() => {
    fetch(getApiUrl('/api/donations'))
      .then(res => res.json())
      .then(data => {
        setDonations(data);
        setTotalDonations(data.reduce((sum: number, donation: any) => sum + Number(donation.amount), 0));
      })
      .catch(() => {
        setDonations([]);
        setTotalDonations(0);
      });
  }, []);

  const donationTypes = [
    { value: 'general', label: 'General Fund' },
    { value: 'building', label: 'Building Fund' },
    { value: 'charity', label: 'Charity & Outreach' },
    { value: 'mass', label: 'Mass Intentions' },
    { value: 'other', label: 'Other' },
  ];


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error('Please upload proof of payment');
      return;
    }

    fetch(getApiUrl('/api/donations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 1,
        donation_type: donationType,
        amount: Number(amount),
        payment_method: paymentMethod,
        message,
        proof_file_name: proofFile.name,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        toast.success('Thank you for your generous donation! We will verify your payment shortly.');
        setDonationType('');
        setAmount('');
        setPaymentMethod('');
        setMessage('');
        setProofFile(null);
        return fetch(getApiUrl('/api/donations'));
      })
      .then((res) => res.json())
      .then((data) => {
        setDonations(data);
        setTotalDonations(data.reduce((sum: number, donation: any) => sum + Number(donation.amount), 0));
      })
      .catch((err) => {
        console.error('Donation submit failed', err);
        toast.error('Failed to submit donation');
      });
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Make a Donation</h1>
          <p className="text-muted-foreground">Support our parish and its ministries</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donation Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2>Donation Form</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Select
                    label="Donation Type"
                    value={donationType}
                    onChange={e => setDonationType(e.target.value)}
                    options={[{ value: '', label: 'Select type...' }, ...donationTypes]}
                    required
                  />

                  <Input
                    type="number"
                    label="Amount (PHP)"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    required
                  />

                  <Select
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    options={[
                      { value: '', label: 'Select method...' },
                      { value: 'gcash', label: 'GCash' },
                      { value: 'bpi', label: 'BPI Bank Transfer' },
                    ]}
                    required
                  />

                  {paymentMethod && (
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <h3 className="mb-3">Payment Details</h3>
                      {paymentMethod === 'gcash' && (
                        <div>
                          <p className="font-medium">GCash Number: 09123456789</p>
                          <p className="text-sm text-muted-foreground">
                            Account Name: Sacred Heart Parish
                          </p>
                        </div>
                      )}
                      {paymentMethod === 'bpi' && (
                        <div>
                          <p className="font-medium">Account Number: 1234567890</p>
                          <p className="text-sm text-muted-foreground">
                            Account Name: Sacred Heart Parish
                          </p>
                          <p className="text-sm text-muted-foreground">Branch: Main Branch</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block mb-2">Upload Proof of Payment</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload screenshot or receipt (JPG, PNG, PDF)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => setProofFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="proof-upload"
                        required
                      />
                      <label
                        htmlFor="proof-upload"
                        className="inline-flex items-center justify-center gap-2 rounded-lg transition-all px-3 py-1.5 text-sm border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
                      >
                        Choose File
                      </label>
                      {proofFile && (
                        <p className="text-sm mt-2 text-primary">{proofFile.name}</p>
                      )}
                    </div>
                  </div>

                  <Textarea
                    label="Message (Optional)"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Add a message or dedication..."
                    rows={3}
                  />

                  <Button type="submit" className="w-full">
                    <Heart className="w-5 h-5 mr-2" />
                    Submit Donation
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total Donations */}
            <Card>
              <CardBody className="text-center">
                <Heart className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">Your Total Donations</p>
                <h2 className="text-primary">₱{totalDonations.toLocaleString()}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you for your generosity!
                </p>
              </CardBody>
            </Card>

            {/* Recent Donations */}
            <Card>
              <CardHeader>
                <h3>Recent Donations</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-border">
                  {donations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No donations recorded yet.
                    </div>
                  ) : (
                    donations.map((donation) => (
                      <div key={donation.id} className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">₱{Number(donation.amount).toLocaleString()}</span>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground">{donation.donation_type}</p>
                        <p className="text-xs text-muted-foreground">{donation.created_at}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Impact Message */}
            <Card>
              <CardBody>
                <h3 className="mb-3">Your Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Your donations help us serve our community through various ministries, maintain
                  our church facilities, and support those in need. Thank you for being a vital
                  part of our parish family!
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
