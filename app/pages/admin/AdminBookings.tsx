import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody, CardHeader } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea } from '../../components/Input';
import { CheckCircle, XCircle, Clock, FileText, MessageSquare, X, Download, File } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getApiUrl, getAssetUrl } from '../../utils/apiConfig';

export function AdminBookings() {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [requestedDocs, setRequestedDocs] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Fetch bookings and users in parallel
        const [bookingsRes, usersRes] = await Promise.all([
          fetch(getApiUrl('/api/bookings')),
          fetch(getApiUrl('/api/users')),
        ]);

        if (!bookingsRes.ok) throw new Error('Failed to load bookings');
        if (!usersRes.ok) throw new Error('Failed to load users');

        const bookingsData = await bookingsRes.json();
        const usersData = await usersRes.json();

        // Build a lookup map: user_id -> { name, email }
        const usersMap: Record<number, { name: string; email: string }> = {};
        usersData.forEach((u: any) => {
          usersMap[u.id] = { name: u.name || u.username || `User #${u.id}`, email: u.email || 'No email' };
        });

        setBookings(
          bookingsData.map((booking: any) => {
            const userInfo = usersMap[booking.user_id] || {
              name: booking.user || `User #${booking.user_id}`,
              email: booking.email || 'No email provided',
            };
            return {
              ...booking,
              userName: userInfo.name,
              userEmail: userInfo.email,
              documents: booking.documents ? JSON.parse(booking.documents) : [],
            };
          })
        );
      } catch (err) {
        setError((err as Error).message || 'Unable to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const statusConfig = {
    confirmed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    try {
      // Convert UI status to database status
      const dbStatus = newStatus === 'approved' ? 'confirmed' : newStatus === 'rejected' ? 'cancelled' : newStatus;
      
      const response = await fetch(getApiUrl(`/api/bookings/${bookingId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: dbStatus }),
      });

      if (!response.ok) throw new Error('Failed to update booking status');

      const booking = bookings.find(b => b.id === bookingId);

      if (newStatus === 'approved' && booking) {
        const userMessage = `Good news! Your ${booking.service} booking for ${booking.date} at ${booking.time} has been approved. Please be ready and arrive a few minutes early.`;
        try {
          await fetch(getApiUrl('/api/messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: booking.user_id, sender: 'admin', text: userMessage }),
          });
          toast.success('Booking approved and user has been notified! 🎉');
        } catch {
          toast.success('Booking approved (message notification failed)');
        }
      } else if (newStatus === 'rejected' && booking) {
        const userMessage = `Your ${booking.service} booking for ${booking.date} has been rejected. Please contact the parish office for more information.`;
        try {
          await fetch(getApiUrl('/api/messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: booking.user_id, sender: 'admin', text: userMessage }),
          });
          toast.success('Booking rejected and user has been notified');
        } catch {
          toast.success('Booking status updated');
        }
      } else {
        toast.success(`Booking ${newStatus}`);
      }

      setBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status: dbStatus } : b)));
    } catch (err) {
      console.error(err);
      toast.error('Unable to update booking status');
    }
  };

  const handleSaveNotes = () => {
    if (selectedBooking) {
      setBookings(bookings.map(b => (b.id === selectedBooking.id ? { ...b, adminNotes } : b)));
      toast.success('Notes saved');
      setSelectedBooking(null);
      setAdminNotes('');
    }
  };

  const handleRequestDocuments = () => {
    toast.success('Document request sent to user');
    setRequestedDocs('');
  };

  const handleDownloadCertificate = (booking: any) => {
    try {
      const certificateContent = `
╔════════════════════════════════════════════════════════════╗
║        SACRED HEART OF JESUS PARISH                        ║
║           SERVICE COMPLETION CERTIFICATE                   ║
╚════════════════════════════════════════════════════════════╝

SERVICE TYPE: ${booking.service}
RECIPIENT: ${booking.userName}
DATE COMPLETED: ${booking.date}
TIME: ${booking.time}
STATUS: APPROVED & COMPLETED

This certifies that the above-mentioned service has been
successfully completed at Sacred Heart of Jesus Parish,
Mandaluyong.

═════════════════════════════════════════════════════════════
Parish Seal
═════════════════════════════════════════════════════════════

Generated: ${new Date().toLocaleString()}
Certificate ID: CERT-${booking.id}
      `;

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(certificateContent));
      element.setAttribute('download', `certificate-${booking.id}-${booking.service.replace(/\s+/g, '-')}.txt`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast.success('Certificate downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-primary mb-2">Bookings Management</h1>
          <p className="text-muted-foreground">Review and manage service bookings</p>
        </div>

        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Service</th>
                    <th className="px-6 py-3 text-left">Date & Time</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Documents</th>
                    <th className="px-6 py-3 text-left">PDF</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        Loading bookings...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-destructive">
                        {error}
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                        No bookings found in the database.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking, index) => {
                      const statusKey = (booking.status || 'pending') as keyof typeof statusConfig;
                      const statusEntry = statusConfig[statusKey] || { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
                      const StatusIcon = statusEntry.icon;

                      return (
                        <motion.tr
                          key={booking.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-t border-border"
                        >
                          {/* User name + email pulled from users table */}
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium">{booking.userName}</div>
                              <div className="text-sm text-muted-foreground">{booking.userEmail}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{booking.service}</td>
                          <td className="px-6 py-4">
                            <div>{booking.date}</div>
                            <div className="text-sm text-muted-foreground">{booking.time}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 ${statusEntry.color}`}>
                              <StatusIcon className="w-4 h-4" />
                              <span className="capitalize">{booking.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              {Array.isArray(booking.documents) && booking.documents.length > 0 ? (
                                <span className="text-green-600">✓ Uploaded ({booking.documents.length})</span>
                              ) : (
                                <span className="text-yellow-600">⚠ Not uploaded</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {booking.status === 'confirmed' && (
                              <div title="PDF Available">
                                <File className="w-5 h-5 text-red-600" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setAdminNotes(booking.adminNotes || '');
                                }}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              {booking.status === 'confirmed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadCertificate(booking)}
                                  className="flex items-center gap-1"
                                  title="Download certificate"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="hidden sm:inline text-xs">PDF</span>
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(booking.id, 'approved')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStatusChange(booking.id, 'rejected')}
                                    variant="danger"
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Booking Details Modal */}
        <AnimatePresence>
          {selectedBooking && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSelectedBooking(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
              >
                <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2>Booking Details</h2>
                      <button onClick={() => setSelectedBooking(null)}>
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-6">
                      {/* User Info */}
                      <div>
                        <h3 className="mb-3">User Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <p className="font-medium">{selectedBooking.userName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium">{selectedBooking.userEmail}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Service:</span>
                            <p className="font-medium">{selectedBooking.service}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date & Time:</span>
                            <p className="font-medium">
                              {selectedBooking.date} at {selectedBooking.time}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Notes */}
                      {selectedBooking.notes && (
                        <div>
                          <h3 className="mb-2">Booking Details</h3>
                          <div className="p-3 bg-secondary/30 rounded-lg text-sm space-y-2">
                            {(() => {
                              try {
                                const notesObj =
                                  typeof selectedBooking.notes === 'string'
                                    ? JSON.parse(selectedBooking.notes)
                                    : selectedBooking.notes;
                                if (typeof notesObj === 'object' && notesObj !== null) {
                                  return Object.entries(notesObj).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-border/50 pb-1">
                                      <span className="font-medium text-xs text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <span className="text-xs">{String(value)}</span>
                                    </div>
                                  ));
                                }
                                return <p>{selectedBooking.notes}</p>;
                              } catch {
                                return <p>{selectedBooking.notes}</p>;
                              }
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <h3 className="mb-2">Uploaded Documents</h3>
                        {(() => {
                          let docs: string[] = [];
                          if (selectedBooking.documents) {
                            if (typeof selectedBooking.documents === 'string') {
                              try { docs = JSON.parse(selectedBooking.documents); } catch { docs = []; }
                            } else if (Array.isArray(selectedBooking.documents)) {
                              docs = selectedBooking.documents;
                            }
                          }
                          return docs.length > 0 ? (
                            <div className="space-y-2">
                              {docs.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                  <span className="text-sm">{doc}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      const downloadUrl = getApiUrl(`/api/documents/${encodeURIComponent(doc)}`);;
                                      window.open(downloadUrl, '_blank');
                                    }}
                                  >
                                    View
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No documents uploaded</p>
                          );
                        })()}
                      </div>

                      {/* Request Documents */}
                      <div>
                        <h3 className="mb-2">Request Additional Documents</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter document names..."
                            value={requestedDocs}
                            onChange={e => setRequestedDocs(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleRequestDocuments}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Request
                          </Button>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      <div>
                        <h3 className="mb-2">Admin Notes</h3>
                        <Textarea
                          value={adminNotes}
                          onChange={e => setAdminNotes(e.target.value)}
                          rows={4}
                          placeholder="Add notes for this booking..."
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button onClick={handleSaveNotes} className="flex-1">
                          Save Notes
                        </Button>
                        {selectedBooking.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => {
                                handleStatusChange(selectedBooking.id, 'approved');
                                setSelectedBooking(null);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => {
                                handleStatusChange(selectedBooking.id, 'rejected');
                                setSelectedBooking(null);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
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