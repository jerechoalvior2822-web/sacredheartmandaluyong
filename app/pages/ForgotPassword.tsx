import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { Church } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '../components/Button';

export function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      toast.success('Reset code sent to your email.');
      setSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successful! You may now sign in.');
      setSent(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/40">
          <div className="bg-gradient-to-r from-[#8B2635] to-[#6B1D28] px-5 sm:px-8 py-8 sm:py-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-full mb-3 sm:mb-4 border-2 border-white/30"
            >
              <Church className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Forgot Password</h1>
            <p className="text-white/80 text-xs sm:text-sm">We will send a reset code to your email</p>
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8">
            <form onSubmit={sent ? handleReset : handleSendCode} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              {sent && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-2">Reset Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter code from email"
                      required
                      className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3D2817] mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Please wait...' : sent ? 'Reset Password' : 'Send Reset Code'}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 border-t border-accent/20 pt-4 sm:pt-6 text-center">
              <Link to="/login" className="text-xs sm:text-sm font-semibold text-[#8B2635] hover:text-[#6B1D28] transition-colors">
                ← {t('common.back')} to {t('auth.login')}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
