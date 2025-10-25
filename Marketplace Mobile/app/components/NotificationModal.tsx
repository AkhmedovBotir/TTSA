import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNotification } from '../contexts/NotificationContext';
import { UserNotification } from '../services/api';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { notifications, unreadCount, isLoading, loadNotifications, markAsRead } = useNotification();

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const getNotificationIcon = (type: string, priority: string) => {
    if (priority === 'urgent') return 'warning';
    if (priority === 'high') return 'alert-circle';
    
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      case 'promotion': return 'gift';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return '#FF3B30';
    if (priority === 'high') return '#FF9500';
    
    switch (type) {
      case 'success': return '#34C759';
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      case 'promotion': return '#AF52DE';
      default: return '#007AFF';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hozir';
    if (diffInHours < 24) return `${diffInHours} soat oldin`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} kun oldin`;
    
    return date.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleNotificationPress = async (notification: UserNotification) => {
    if (notification.status !== 'read') {
      await markAsRead(notification._id);
    }
  };

  const renderNotificationItem = ({ item }: { item: UserNotification }) => {
    console.log('renderNotificationItem - item:', item);
    
    const isUnread = item.status === 'sent' || item.status === 'delivered';
    const notificationData = item.notification || {};
    const iconName = getNotificationIcon(notificationData.type || 'info', notificationData.priority || 'medium');
    const iconColor = getNotificationColor(notificationData.type || 'info', notificationData.priority || 'medium');

    return (
      <View
        style={[
          styles.notificationItem,
          isUnread && styles.unreadNotification
        ]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationIconContainer}>
              <Ionicons name={iconName} size={20} color={iconColor} />
            </View>
            <View style={styles.notificationTextContainer}>
              <Text style={[
                styles.notificationTitle,
                isUnread && styles.unreadText
              ]}>
                {notificationData.title || 'Xabarnoma'}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notificationData.message || 'Xabarnoma matni'}
              </Text>
            </View>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationTime}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Xabarnomalar</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#1C1C1E" />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    console.log('NotificationModal - notifications:', notifications);
    console.log('NotificationModal - isLoading:', isLoading);
    console.log('NotificationModal - notifications length:', notifications?.length);
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Xabarnomalar yuklanmoqda...</Text>
        </View>
      );
    }

    if (!notifications || notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-outline" size={64} color="#8E8E93" />
          </View>
          <Text style={styles.emptyTitle}>Xabarnomalar yo'q</Text>
          <Text style={styles.emptySubtitle}>
            Yangi xabarnomalar paydo bo'lganda bu yerda ko'rinadi
            </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={notifications || []}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item._id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.notificationsListContent}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        {renderContent()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  badgeContainer: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationsList: {
    flex: 1,
  },
  notificationsListContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '700',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
  },
});
