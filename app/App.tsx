import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import { NotificationProvider } from './components/NotificationContext';
import { Toaster } from 'sonner';

// Auth Pages
import { Login } from './pages/Login';
import { AdminLogin } from './pages/AdminLogin';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyEmail } from './pages/VerifyEmail';

// User Pages
import { UserDashboard } from './pages/UserDashboard';
import { Services } from './pages/Services';
import { Bookings } from './pages/Bookings';
import { Donations } from './pages/Donations';
import { Souvenirs } from './pages/Souvenirs';
import { Messages } from './pages/Messages';
import { Announcements } from './pages/Announcements';
import { Profile } from './pages/Profile';
import { MassSchedules } from './pages/MassSchedules';
import { AboutUs } from './pages/AboutUs';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminServices } from './pages/admin/AdminServices';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminDonations } from './pages/admin/AdminDonations';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminOfficeHours } from './pages/admin/AdminOfficeHours';
import { AdminSouvenirs } from './pages/admin/AdminSouvenirs';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminOrgChart } from './pages/admin/AdminOrgChart';
import { AdminMassSchedules } from './pages/admin/AdminMassSchedules';
import { AdminMessages } from './pages/admin/AdminMessages';
import { AdminCarousel } from './pages/admin/AdminCarousel';


function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="min-h-screen pt-20">
            <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/admin/login"
              element={
                <PublicRoute>
                  <AdminLogin />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <PublicRoute>
                  <VerifyEmail />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations"
              element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/souvenirs"
              element={
                <ProtectedRoute>
                  <Souvenirs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <Announcements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mass-schedules"
              element={
                <ProtectedRoute>
                  <MassSchedules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about-us"
              element={
                <ProtectedRoute>
                  <AboutUs />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute adminOnly>
                  <AdminServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute adminOnly>
                  <AdminBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute adminOnly>
                  <AdminMassSchedules />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/office-hours"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOfficeHours />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/org-chart"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOrgChart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/donations"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/souvenirs"
              element={
                <ProtectedRoute adminOnly>
                  <AdminSouvenirs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute adminOnly>
                  <AdminMessages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/announcements"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute adminOnly>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/carousel"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCarousel />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}