import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserNavbar } from '../components/UserNavbar';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../components/AuthContext';
import { User, Mail, Phone, MapPin, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileData);
    setIsEditingProfile(false);
    toast.success('Profile updated successfully!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  return (
    <div className="min-h-screen">
      <UserNavbar />

      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-primary mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2>Personal Information</h2>
                  {!isEditingProfile && (
                    <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input
                      label="Full Name"
                      value={profileData.name}
                      onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                    <Input
                      type="email"
                      label="Email"
                      value={profileData.email}
                      onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone Number"
                      value={profileData.phone}
                      onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                    <Input
                      label="Address"
                      value={profileData.address}
                      onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                    />
                    <div className="flex gap-3">
                      <Button type="submit">Save Changes</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          setProfileData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            address: user?.address || '',
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{user?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{user?.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2>Change Password</h2>
                  {!isChangingPassword && (
                    <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  )}
                </div>
              </CardHeader>
              {isChangingPassword && (
                <CardBody>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      type="password"
                      label="Current Password"
                      value={passwordData.oldPassword}
                      onChange={e =>
                        setPasswordData({ ...passwordData, oldPassword: e.target.value })
                      }
                      required
                    />
                    <Input
                      type="password"
                      label="New Password"
                      value={passwordData.newPassword}
                      onChange={e =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      required
                    />
                    <Input
                      type="password"
                      label="Confirm New Password"
                      value={passwordData.confirmPassword}
                      onChange={e =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      required
                    />
                    <div className="flex gap-3">
                      <Button type="submit">Update Password</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardBody>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
