import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { FileText, CheckCircle, Clock, XCircle, X, Download, File } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../utils/apiConfig';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../components/AuthContext';
import { useNotifications } from '../components/NotificationContext';

export function Bookings() {
  const { t } = useTranslation();
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { notifications, setUnreadBookings, resetUnreadBookings } = useNotifications();
  const [previousApprovedCount, setPreviousApprovedCount] = useState(0);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    // Poll for booking updates every 5 seconds
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewDocuments([...newDocuments, ...Array.from(e.target.files)]);
    }
  };

  const handleUpload = async (bookingId: number) => {
    if (newDocuments.length === 0) {
      toast.error(t('bookings.selectDocuments'));
      return;
    }

    try {
      const formData = new FormData();
      newDocuments.forEach(file => {
        formData.append('files', file);
      });
      formData.append('bookingId', bookingId.toString());

      const response = await fetch(getApiUrl('/api/bookings/upload-documents'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(t('bookings.uploadFailed'));

      toast.success(t('bookings.uploadSuccess'));
      setUploadingFor(null);
      setNewDocuments([]);
      fetchBookings(); // Refresh to show uploaded docs
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('bookings.uploadFailed'));
    }
  };

  const fetchBookings = () => {
    fetch(getApiUrl('/api/bookings'))
      .then(res => res.json())
      .then(data => {
        const mapped: any[] = data.map((b: any) => ({
          ...b,
          status: b.status === 'confirmed' ? 'Approved' : b.status === 'cancelled' ? 'Rejected' : 'Pending',
          documents: JSON.parse(b.documents || '[]'),
          paymentStatus: b.payment_status,
          time: formatTime(b.time),
          date: new Date(b.date).toLocaleDateString('en-US'),
          documentsRequested: b.status === 'pending' ? ['Birth Certificates', 'Baptismal Certificates', 'Pre-Cana Certificate'] : []
        }));

        // Use actual logged-in user's ID
        const currentUserId = parseInt(user?.id || '0', 10);

        // Count approved bookings for current user
        const userApprovedBookings = mapped.filter(b => b.user_id === currentUserId && b.status === 'Approved').length;

        // Update unread count when bookings are approved
        setUnreadBookings(userApprovedBookings);

        // Show notification if new booking was approved
        if (previousApprovedCount > 0 && userApprovedBookings > previousApprovedCount) {
          const newApprovals = userApprovedBookings - previousApprovedCount;
          toast.success(`${newApprovals === 1 ? 'Your booking has' : newApprovals + ' bookings have'} been approved! 🎉`);
        }

        setPreviousApprovedCount(userApprovedBookings);
        setBookings(mapped);
        setLoading(false);

        // Reset unread count when viewing bookings
        if (notifications.unreadBookings > 0) {
          resetUnreadBookings();
        }
      })
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
  };

  // Filter bookings for the actual logged-in user
  const currentUserId = parseInt(user?.id || '0', 10);
  const userBookings = bookings.filter(b => b.user_id === currentUserId);

  const handleDownloadPDF = (booking: any) => {
    try {
      // Create a simple PDF content
      const pdfContent = `
SERVICE BOOKING CONFIRMATION
========================================

Booking ID: #${booking.id}
Service: ${booking.service}
Date: ${booking.date}
Time: ${booking.time}
Status: ${booking.status}

Location: Sacred Heart of Jesus Parish, Mandaluyong

Payment Status: ${booking.paymentStatus || 'Pending'}

========================================
This is a soft copy of your booking confirmation.
Please keep this for your records.
========================================
Generated on: ${new Date().toLocaleString()}
      `;

      // Create a blob and download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
      element.setAttribute('download', `booking-${booking.id}-${booking.service.replace(/\s+/g, '-')}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast.success('Booking confirmation downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download booking');
    }
  };

  const handleViewDocument = (docPath: string) => {
    try {
      // Build the full URL
      let fullPath = docPath;
      
      // If path starts with /assets, prepend the backend URL
      if (docPath.startsWith('/assets')) {
        fullPath = getApiUrl(docPath);
      } else if (!docPath.startsWith('http')) {
        fullPath = getAssetUrl(`uploads/documents/${docPath}`);
      }
      
      // Open in new tab
      window.open(fullPath, '_blank');
      toast.success('Opening document...');
    } catch (error) {
      console.error('View document error:', error);
      toast.error('Failed to open document. Please try downloading instead.');
    }
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('services.bookings')}</h1>
          <p className="text-muted-foreground">
            {t('bookings.manageRequests')}
          </p>
        </div>

        {/* My Bookings */}
        <section>
          <h2 className="text-2xl font-bold mb-4">{t('dashboard.myBookings')}</h2>
          {loading ? (
            <div className="text-center">{t('common.loading')}</div>
          ) : userBookings.length > 0 ? (
            <div className="grid gap-4 mb-6">
              {userBookings.map((booking, index) => {
                const statusConfig: Record<string, { icon: any; bgColor: string }> = {
                  Approved: { icon: <CheckCircle className="w-4 h-4" />, bgColor: 'bg-green-100 text-green-800' },
                  Pending: { icon: <Clock className="w-4 h-4" />, bgColor: 'bg-yellow-100 text-yellow-800' },
                  Rejected: { icon: <XCircle className="w-4 h-4" />, bgColor: 'bg-red-100 text-red-800' },
                };
                const status = statusConfig[booking.status as keyof typeof statusConfig];

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold">{booking.service}</h3>
                            <p className="text-muted-foreground">{t('services.bookings')} #{booking.id}</p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.bgColor}`}>
                            {status.icon}
                            <span className="ml-1">{booking.status}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody>
                        <div className="grid sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">{t('services.bookingDate')}</p>
                            <p className="font-medium">{booking.date}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{t('common.time')}</p>
                            <p className="font-medium">{booking.time}</p>
                          </div>
                        </div>
                        {/* Action buttons for approved bookings */}
                        {booking.status === 'Approved' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadingFor(booking.id)}
                              className="flex-1"
                            >
                              {t('bookings.uploadDocuments')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(booking)}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                          </div>
                        )}

                        {/* Display uploaded documents */}
                        {booking.documents && booking.documents.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm font-semibold mb-2">{t('bookings.uploadedDocuments') || 'Uploaded Documents'}:</p>
                            <div className="space-y-2">
                              {booking.documents.map((doc: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <File className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{doc.split('/').pop() || `Document ${idx + 1}`}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewDocument(doc)}
                                    className="text-xs"
                                  >
                                    View
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="mb-6">
              <CardBody className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('bookings.noBookings')}</p>
              </CardBody>
            </Card>
          )}
        </section>
      </div>

      {/* Document Upload Dialog */}
      {uploadingFor && (
        <Dialog open={!!uploadingFor} onOpenChange={() => setUploadingFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('bookings.uploadDocuments')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-secondary/50 transition-colors">
                  <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm">{t('bookings.clickToUpload')}</p>
                </div>
              </label>

              {newDocuments.length > 0 && (
                <div className="space-y-2">
                  {newDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                    >
                      <span className="text-sm">{doc.name}</span>
                      <button
                        onClick={() =>
                          setNewDocuments(newDocuments.filter((_, i) => i !== idx))
                        }
                        className="text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpload(uploadingFor)}
                  disabled={newDocuments.length === 0}
                  size="sm"
                  className="flex-1"
                >
                  Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUploadingFor(null);
                    setNewDocuments([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}