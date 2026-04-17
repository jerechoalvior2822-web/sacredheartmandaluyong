import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useTranslation } from 'react-i18next';
import { Menu, X, Church, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LanguageSwitcher } from './LanguageSwitcher';

export function UserNavbar() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  const closeTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeDropdownWithDelay = (key: string) => {
    closeTimeoutRef.current[key] = setTimeout(() => {
      setOpenDropdowns(prev => ({ ...prev, [key]: false }));
    }, 200);
  };

  const cancelCloseDropdown = (key: string) => {
    if (closeTimeoutRef.current[key]) {
      clearTimeout(closeTimeoutRef.current[key]);
      delete closeTimeoutRef.current[key];
    }
  };

  const closeProfileWithDelay = () => {
    closeTimeoutRef.current['profile'] = setTimeout(() => {
      setProfileMenuOpen(false);
    }, 200);
  };

  const cancelCloseProfile = () => {
    if (closeTimeoutRef.current['profile']) {
      clearTimeout(closeTimeoutRef.current['profile']);
      delete closeTimeoutRef.current['profile'];
    }
  };

  const navGroups = [
    {
      label: 'Services',
      key: 'services',
      items: [
        { path: '/services', labelKey: 'services.services' },
        { path: '/souvenirs', labelKey: 'Souvenirs' },
        { path: '/donations', labelKey: 'Donations' },
      ]
    },
    {
      label: 'Bookings',
      key: 'bookings',
      items: [
        { path: '/bookings', labelKey: 'services.bookings', notificationCount: notifications.unreadBookings },
        { path: '/messages', labelKey: 'messages.messages', notificationCount: notifications.unreadMessages },
      ]
    },
    {
      label: 'Announcements',
      key: 'announcements',
      items: [
        { path: '/announcements', labelKey: 'announcements.announcements' },
        { path: '/mass-schedules', labelKey: 'Mass schedules' },
        { path: '/about-us', labelKey: 'AboutUs' },
      ]
    },
  ];

  const singleItems = [
    { path: '/dashboard', labelKey: 'dashboard.dashboard' },
  ];

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg fixed top-0 left-0 right-0 z-50 w-screen">
      <div className="w-full">
        <div className="flex justify-between items-center h-20 px-4 sm:px-8 lg:px-12">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <Church className="w-8 h-8 flex-shrink-0" />
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight whitespace-nowrap">Sacred Heart</div>
              <div className="text-xs opacity-90 whitespace-nowrap">Mandaluyong Parish</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-4 px-2 flex-1 justify-center">
            {singleItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-5 py-2 rounded-lg text-base whitespace-nowrap transition-colors ${location.pathname === item.path ? 'text-accent font-semibold bg-primary-foreground/10' : 'hover:text-accent hover:bg-primary-foreground/5'}`}
                title={t(item.labelKey)}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            {navGroups.map(group => (
              <div 
                key={group.key} 
                className="relative"
                onMouseLeave={() => closeDropdownWithDelay(group.key)}
                onMouseEnter={() => cancelCloseDropdown(group.key)}
              >
                <button
                  onClick={() => toggleDropdown(group.key)}
                  onMouseEnter={() => {
                    cancelCloseDropdown(group.key);
                    setOpenDropdowns(prev => ({ ...prev, [group.key]: true }));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-base whitespace-nowrap transition-colors hover:text-accent hover:bg-primary-foreground/5"
                >
                  {group.label}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdowns[group.key] ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {openDropdowns[group.key] && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 bg-card text-card-foreground rounded-lg shadow-2xl border border-border mt-2 py-2 min-w-max z-50"
                    >
                      {group.items.map(item => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center justify-between gap-4 px-5 py-3 text-base transition-colors whitespace-nowrap ${location.pathname === item.path ? 'bg-primary/15 text-primary font-semibold' : 'hover:bg-secondary'}`}
                          onClick={() => setOpenDropdowns(prev => ({ ...prev, [group.key]: false }))}
                        >
                          <span>{t(item.labelKey)}</span>
                          {'notificationCount' in item && (item.notificationCount ?? 0) > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse flex-shrink-0">
                              {(item.notificationCount ?? 0) > 9 ? '9+' : item.notificationCount}
                            </span>
                          )}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Profile Menu & Language Switcher */}
          <div className="hidden md:flex items-center gap-4 relative flex-shrink-0">
            <LanguageSwitcher />
            <div 
              className="relative"
              onMouseLeave={() => closeProfileWithDelay()}
              onMouseEnter={() => cancelCloseProfile()}
            >
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                onMouseEnter={() => {
                  cancelCloseProfile();
                  setProfileMenuOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-base whitespace-nowrap transition-colors hover:text-accent hover:bg-primary-foreground/5"
              >
                <User className="w-5 h-5 flex-shrink-0" />
                <span className="max-w-[150px] truncate">{user?.name}</span>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-16 bg-card text-card-foreground rounded-lg shadow-2xl border border-border min-w-max py-2"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-5 py-3 text-base hover:bg-secondary transition-colors whitespace-nowrap"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      {t('common.profile')}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-5 py-3 text-base hover:bg-secondary transition-colors w-full text-left text-destructive whitespace-nowrap"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      {t('common.logout')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-primary border-t border-primary-foreground/20"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Single Items */}
              {singleItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block py-3 px-4 rounded-lg text-base transition-colors font-medium ${location.pathname === item.path ? 'text-accent font-bold bg-primary-foreground/10' : 'hover:text-accent hover:bg-primary-foreground/5'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t(item.labelKey)}
                </Link>
              ))}

              {/* Dropdown Groups */}
              <div className="pt-2">
                {navGroups.map(group => (
                  <div key={group.key} className="py-1">
                    <button
                      onClick={() => toggleDropdown(group.key)}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-lg text-base font-medium hover:bg-primary-foreground/5 transition-colors"
                    >
                      <span>{group.label}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openDropdowns[group.key] ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {openDropdowns[group.key] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1 pt-1"
                        >
                          {group.items.map(item => (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-center justify-between py-3 px-6 rounded-lg text-base ml-2 border-l-4 border-primary-foreground/30 transition-colors ${location.pathname === item.path ? 'bg-primary-foreground/10 text-accent border-l-accent font-semibold' : 'hover:bg-primary-foreground/5'}`}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setOpenDropdowns(prev => ({ ...prev, [group.key]: false }));
                              }}
                            >
                              <span>{t(item.labelKey)}</span>
                              {'notificationCount' in item && (item.notificationCount ?? 0) > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse flex-shrink-0 ml-2">
                                  {(item.notificationCount ?? 0) > 9 ? '9+' : item.notificationCount}
                                </span>
                              )}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <hr className="border-primary-foreground/20 my-4" />
              
              {/* Language Switcher in Mobile */}
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              
              {/* Profile Link */}
              <Link
                to="/profile"
                className="flex items-center gap-3 py-3 px-4 rounded-lg text-base font-medium hover:text-accent hover:bg-primary-foreground/5 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span>{t('common.profile')}</span>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 py-3 px-4 rounded-lg text-base font-medium text-destructive hover:opacity-80 transition-opacity w-full text-left"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
