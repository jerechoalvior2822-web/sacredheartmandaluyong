import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  Trash2,
  Search,
  AlertTriangle,
  User,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { getApiUrl } from '../../utils/apiConfig';
import { Badge } from '../../components/ui/badge';

interface UserWithBookings {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  is_verified: number;
  bookingCount: number;
  totalFees: number;
  bookings: Array<{ id: number; service: string; status: string; date: string; fee: string }>;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserWithBookings[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithBookings | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithBookings | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, bookingsRes] = await Promise.all([
        fetch(getApiUrl('/api/users')),
        fetch(getApiUrl('/api/bookings')),
      ]);

      if (!usersRes.ok) throw new Error('Failed to load users');

      const usersData = await usersRes.json();
      const bookingsData = await (bookingsRes.ok ? bookingsRes.json() : Promise.resolve([]));

      // Group bookings by user_id and calculate stats
      const bookingsByUser = bookingsData.reduce((acc: any, booking: any) => {
        if (!acc[booking.user_id]) {
          acc[booking.user_id] = [];
        }
        acc[booking.user_id].push(booking);
        return acc;
      }, {});

      const usersWithStats = usersData.map((user: any) => {
        const userBookings = bookingsByUser[user.id] || [];
        const totalFees = userBookings.reduce((sum: number, booking: any) => {
          const fee = typeof booking.fee === 'string' 
            ? parseInt(booking.fee.replace(/[^0-9]/g, '')) || 0
            : booking.fee || 0;
          return sum + fee;
        }, 0);

        return {
          ...user,
          bookingCount: userBookings.length,
          totalFees,
          bookings: userBookings,
        };
      });

      setUsers(usersWithStats);
      setFilteredUsers(usersWithStats);
      setError('');
    } catch (err) {
      setError((err as Error).message || 'Failed to load users');
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserWithBookings) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(getApiUrl(`/api/users/${userToDelete.id}`), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast.success(`User ${userToDelete.name} has been deleted`);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      toast.error((err as Error).message || 'Error deleting user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, view their bookings, and remove suspicious accounts
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardBody>
            <div className="flex gap-2">
              <Search className="w-5 h-5 text-muted-foreground absolute mt-2.5 ml-2" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </CardBody>
        </Card>

        {/* Users Grid */}
        {loading ? (
          <div className="text-center py-12">Loading users...</div>
        ) : error ? (
          <Card className="border-destructive">
            <CardBody className="text-destructive">{error}</CardBody>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardBody className="py-8 text-center text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredUsers.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardBody>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1" onClick={() => setSelectedUser(user)}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{user.name}</h3>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Bookings:</span>
                              <p className="font-medium">{user.bookingCount}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total Fees:</span>
                              <p className="font-medium">₱{user.totalFees}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Verified:</span>
                              <Badge variant={user.is_verified ? 'default' : 'secondary'} className="mt-1">
                                {user.is_verified ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Role:</span>
                              <Badge variant="outline" className="mt-1">
                                {user.role || 'User'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedUser.name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Contact Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{selectedUser.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{selectedUser.bookingCount}</p>
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Fees Paid</p>
                  <p className="text-2xl font-bold">₱{selectedUser.totalFees}</p>
                </div>
                <div className="bg-secondary p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <Badge variant={selectedUser.is_verified ? 'default' : 'secondary'}>
                    {selectedUser.is_verified ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              {/* Bookings */}
              {selectedUser.bookings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Booking History ({selectedUser.bookings.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedUser.bookings.map(booking => (
                      <div
                        key={booking.id}
                        className="text-sm p-2 bg-secondary rounded-lg flex justify-between items-start"
                      >
                        <div>
                          <p className="font-medium">{booking.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.date} • {booking.fee}
                          </p>
                        </div>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="border-t p-4 bg-destructive/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive mb-2">Delete User</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently remove this user account. This action cannot be undone.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(selectedUser)}
                    >
                      Delete User Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && userToDelete && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete User?
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{userToDelete.name}</strong>? 
                <br />
                This will remove all their associated data.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-destructive/10 p-3 rounded-lg mb-4">
              <p className="text-sm text-destructive">
                ⚠️ This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}
