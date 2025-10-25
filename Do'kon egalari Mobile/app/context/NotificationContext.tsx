import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { API_ENDPOINTS } from '../api';
import { UnreadCountResponse } from '../types/notifications';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { token } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: UnreadCountResponse = await response.json();

      if (data.success) {
        setUnreadCount(data.data.count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, [token]);

  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Refresh unread count every 30 seconds when app is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (token) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, token]);

  const value = {
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
