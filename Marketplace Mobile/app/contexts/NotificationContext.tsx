import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService, UserNotification } from '../services/api';

interface NotificationContextType {
  notifications: UserNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getNotifications({ page: 1, limit: 50 });
      console.log('NotificationContext - API response:', response);
      
      if (response.success && response.data) {
        const notificationsData = response.data || [];
        const unreadCountData = response.unreadCount || 0;
        
        console.log('NotificationContext - notifications data:', notificationsData);
        console.log('NotificationContext - unread count:', unreadCountData);
        
        setNotifications(notificationsData);
        setUnreadCount(unreadCountData);
      } else {
        console.log('NotificationContext - API call failed or no data');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setError('Xabarnomalarni yuklashda xatolik');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          (prev || []).map(notification => 
            notification._id === notificationId 
              ? { ...notification, status: 'read', readAt: new Date().toISOString() }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const refreshUnreadCount = async () => {
    try {
      const response = await apiService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
      setUnreadCount(0);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
