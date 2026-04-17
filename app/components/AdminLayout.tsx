import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import {
  LayoutDashboard,
  Church,
  Calendar,
  Users,
  FileText,
  Gift,
  MessageSquare,
  Megaphone,
  Clock,
  Building,
  LogOut,
  Menu,
  X,
  BookOpen,
  TrendingUp,
  ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Close sidebar on mobile when resizing to desktop
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/services', label: 'Services', icon: Church },
    { path: '/admin/bookings', label: 'Bookings', icon: BookOpen },
    { path: '/admin/schedules', label: 'Mass Schedules', icon: Calendar },
    { path: '/admin/office-hours', label: 'Office Hours', icon: Clock },
    { path: '/admin/org-chart', label: 'Org Chart', icon: Building },
    { path: '/admin/carousel', label: 'Carousel', icon: ImageIcon },
    { path: '/admin/donations', label: 'Donations', icon: TrendingUp },
    { path: '/admin/souvenirs', label: 'Souvenirs', icon: Gift },
    { path: '/admin/messages', label: 'Messages', icon: MessageSquare, notificationCount: notifications.unreadMessages },
    { path: '/admin/announcements', label: 'Announcements', icon: Megaphone },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar - Always visible */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 80 }}
          className="bg-sidebar text-sidebar-foreground shadow-xl relative z-40 hidden md:block"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-sidebar-border">
              <div className="flex items-center justify-between">
                {sidebarOpen && (
                  <div className="flex items-center gap-2">
                    <Church className="w-6 h-6" />
                    <div>
                      <div className="font-bold text-sm">Sacred Heart Parish</div>
                      <div className="text-xs opacity-70">Admin Panel</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span>{item.label}</span>}
                    {(item.notificationCount ?? 0) > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {(item.notificationCount ?? 0) > 9 ? '9+' : item.notificationCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-sidebar-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                {sidebarOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-xs opacity-70">Administrator</div>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 mt-3 px-3 py-2 w-full text-left hover:bg-sidebar-accent rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </motion.aside>
      )}

      {/* Mobile Sidebar - Full width overlay */}
      {isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
              />
              
              {/* Mobile Sidebar */}
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.3 }}
                className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground shadow-xl z-40 md:hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Church className="w-6 h-6" />
                      <div>
                        <div className="font-bold text-sm">Sacred Heart Parish</div>
                        <div className="text-xs opacity-70">Admin Panel</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'hover:bg-sidebar-accent/50'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {(item.notificationCount ?? 0) > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse flex-shrink-0">
                            {(item.notificationCount ?? 0) > 9 ? '9+' : item.notificationCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-sidebar-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user?.name}</div>
                      <div className="text-xs opacity-70">Administrator</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 mt-3 px-3 py-2 w-full text-left hover:bg-sidebar-accent rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Mobile Header */}
        {isMobile && (
          <div className="sticky top-0 z-20 bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between shadow-md md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              <span className="font-bold">Sacred Heart</span>
            </div>
            <div className="w-10" />
          </div>
        )}
        
        <div className="p-4 md:p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}
