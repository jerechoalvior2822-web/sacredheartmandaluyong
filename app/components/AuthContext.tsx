import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../utils/apiConfig';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  phone?: string;
  address?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; address?: string }) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('parish_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Invalid credentials');
    }

    const data = await response.json();
    const userData: User = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      phone: data.user.phone,
      address: data.user.address,
    };
    setUser(userData);
    localStorage.setItem('parish_user', JSON.stringify(userData));
  };

  const register = async (data: { email: string; password: string; name: string; phone?: string; address?: string }) => {
    const response = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Registration failed');
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    const response = await fetch(getApiUrl('/api/auth/verify-email'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Verification failed');
    }
  };

  const forgotPassword = async (email: string) => {
    const response = await fetch(getApiUrl('/api/auth/forgot-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Unable to send reset code');
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const response = await fetch(getApiUrl('/api/auth/reset-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Password reset failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('parish_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('parish_user', JSON.stringify(updatedUser));
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    // Mock password change
    void oldPassword;
    void newPassword;
    await new Promise(resolve => setTimeout(resolve, 500));
    // In production, this would validate and update the password
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      verifyEmail,
      forgotPassword,
      resetPassword,
      logout,
      updateProfile,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
