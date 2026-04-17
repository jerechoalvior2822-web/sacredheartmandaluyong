import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

interface DonationItem {
  id: number;
  user_id: number;
  donation_type: string;
  amount: number;
  payment_method: string;
  message: string;
  proof_file_name: string;
  created_at: string;
}

export function AdminDonations() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<DonationItem | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    donation_type: '',
    amount: '',
    payment_method: '',
    message: '',
    proof_file_name: '',
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(getApiUrl('/api/donations'));
      if (!response.ok) throw new Error('Failed to load donations');
      const data = await response.json();
      setDonations(data);
    } catch (err) {
      setError((err as Error).message || 'Unable to load donations');
    } finally {
      setLoading(false);
    }
  };

  const openNewDonationModal = () => {
    setEditingDonation(null);
    setFormData({
      user_id: '',
      donation_type: '',
      amount: '',
      payment_method: '',
      message: '',
      proof_file_name: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (donation: DonationItem) => {
    setEditingDonation(donation);
    setFormData({
      user_id: donation.user_id.toString(),
      donation_type: donation.donation_type,
      amount: donation.amount.toString(),
      payment_method: donation.payment_method,
      message: donation.message,
      proof_file_name: donation.proof_file_name,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this donation submission?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/donations/${id}`), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete donation');
      toast.success('Donation deleted successfully');
      await fetchDonations();
    } catch (err) {
      console.error(err);
      toast.error('Unable to delete donation');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.donation_type || !formData.amount || !formData.payment_method) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      user_id: parseInt(formData.user_id, 10) || 0,
      donation_type: formData.donation_type,
      amount: parseFloat(formData.amount) || 0,
      payment_method: formData.payment_method,
      message: formData.message,
      proof_file_name: formData.proof_file_name,
    };

    try {
      const url = editingDonation
        ? getApiUrl(`/api/donations/${editingDonation.id}`)
        : getApiUrl('/api/donations');
      const method = editingDonation ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save donation');

      toast.success(`Donation ${editingDonation ? 'updated' : 'created'} successfully`);
      await fetchDonations();
      handleCancel();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Unable to save donation');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingDonation(null);
    setFormData({
      user_id: '',
      donation_type: '',
      amount: '',
      payment_method: '',
      message: '',
      proof_file_name: '',
    });
  };

  const getProofUrl = (proofFileName: string) => {
    if (!proofFileName) return null;
    if (proofFileName.startsWith('/')) {
      return getApiUrl(proofFileName);
    }
    return getAssetUrl(`uploads/${proofFileName}`);
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-primary mb-2">Donations Management</h1>
            <p className="text-muted-foreground">Review and manage donation submissions</p>
          </div>
          <Button onClick={openNewDonationModal}>
            <Plus className="w-5 h-5 mr-2" />
            Add Donation
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading donations...</div>
        ) : error ? (
          <div className="text-center text-destructive py-12">{error}</div>
        ) : donations.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No donation submissions found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {donations.map((donation, index) => (
              <motion.div
                key={donation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card hover>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-[0.24em]">{donation.donation_type}</p>
                        <h3 className="text-lg font-semibold">₱{donation.amount.toLocaleString()}</h3>
                      </div>
                      <span className="text-sm text-muted-foreground">{donation.created_at}</span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                      <p><span className="font-medium text-foreground">User ID:</span> {donation.user_id}</p>
                      <p><span className="font-medium text-foreground">Payment:</span> {donation.payment_method}</p>
                      {donation.message && (
                        <p><span className="font-medium text-foreground">Message:</span> {donation.message}</p>
                      )}
                      {donation.proof_file_name && (
                        <p>
                          <span className="font-medium text-foreground">Proof:</span>{' '}
                          <a
                            href={getProofUrl(donation.proof_file_name) || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline"
                          >
                            View File
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(donation)} className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(donation.id)} className="flex-1">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={handleCancel}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>{editingDonation ? 'Edit Donation' : 'Add Donation'}</h2>
                      <button onClick={handleCancel}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        label="User ID"
                        type="number"
                        value={formData.user_id}
                        onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                        required
                      />
                      <Input
                        label="Donation Type"
                        value={formData.donation_type}
                        onChange={e => setFormData({ ...formData, donation_type: e.target.value })}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Amount"
                          type="number"
                          value={formData.amount}
                          onChange={e => setFormData({ ...formData, amount: e.target.value })}
                          min="0"
                          step="0.01"
                          required
                        />
                        <Input
                          label="Payment Method"
                          value={formData.payment_method}
                          onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                          required
                        />
                      </div>
                      <Textarea
                        label="Message"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                        rows={3}
                      />
                      <Input
                        label="Proof File Name"
                        value={formData.proof_file_name}
                        onChange={e => setFormData({ ...formData, proof_file_name: e.target.value })}
                        placeholder="example.pdf or /assets/uploads/example.pdf"
                      />
                      <div className="flex gap-3 justify-end">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingDonation ? 'Update Donation' : 'Create Donation'}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </Card>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
