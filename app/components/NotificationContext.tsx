import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface NotificationState {
  unreadMessages: number;
  unreadBookings: number;
  lastMessageTimestamp: string;
  lastBookingCheck: string;
}

interface NotificationContextType {
  notifications: NotificationState;
  setUnreadMessages: (count: number) => void;
  setUnreadBookings: (count: number) => void;
  updateLastMessageTimestamp: () => void;
  updateLastBookingCheck: () => void;
  resetUnreadMessages: () => void;
  resetUnreadBookings: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationState>({
    unreadMessages: 0,
    unreadBookings: 0,
    lastMessageTimestamp: new Date().toISOString(),
    lastBookingCheck: new Date().toISOString(),
  });

  // Load notifications from localStorage
  useEffect(() => {
    if (user) {
      const savedNotifications = localStorage.getItem(`notifications_${user.id}`);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    }
  }, [user]);

  // Save notifications to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const setUnreadMessages = useCallback((count: number) => {
    setNotifications(prev => ({ ...prev, unreadMessages: count }));
  }, []);

  const setUnreadBookings = useCallback((count: number) => {
    setNotifications(prev => ({ ...prev, unreadBookings: count }));
  }, []);

  const updateLastMessageTimestamp = useCallback(() => {
    setNotifications(prev => ({ ...prev, lastMessageTimestamp: new Date().toISOString() }));
  }, []);

  const updateLastBookingCheck = useCallback(() => {
    setNotifications(prev => ({ ...prev, lastBookingCheck: new Date().toISOString() }));
  }, []);

  const resetUnreadMessages = useCallback(() => {
    setUnreadMessages(0);
  }, [setUnreadMessages]);

  const resetUnreadBookings = useCallback(() => {
    setUnreadBookings(0);
  }, [setUnreadBookings]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        setUnreadMessages,
        setUnreadBookings,
        updateLastMessageTimestamp,
        updateLastBookingCheck,
        resetUnreadMessages,
        resetUnreadBookings,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
