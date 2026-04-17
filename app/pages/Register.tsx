import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Church } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.password') + ' ' + t('auth.confirmPassword'));
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
      });
      toast.success(t('auth.verifyEmail'));
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/95 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/40 w-full">
          <div className="bg-gradient-to-r from-[#8B2635] to-[#6B1D28] px-5 sm:px-8 py-8 sm:py-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur rounded-full mb-3 sm:mb-4 border-2 border-white/30"
            >
              <Church className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{t('auth.register')}</h1>
            <p className="text-white/80 text-xs sm:text-sm">Sacred Heart of Jesus Parish</p>
          </div>

          <div className="px-5 sm:px-8 py-6 sm:py-8 max-h-[85vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('auth.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('auth.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('auth.password')}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('auth.confirmPassword')}</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('common.phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3D2817] mb-2">{t('common.address')}</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Church Street"
                  className="w-full px-4 py-3 border-2 border-[#D9B98D]/50 rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-2 focus:ring-[#8B2635]/20 bg-white text-[#3D2817] placeholder-[#9C8B7E] transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? t('common.loading') : t('auth.register')}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 border-t border-accent/20 pt-4 sm:pt-6 text-center">
              <p className="text-sm text-[#3D2817]">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="font-semibold text-[#8B2635] hover:text-[#6B1D28] transition-colors">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
