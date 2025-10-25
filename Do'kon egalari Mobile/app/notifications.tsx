import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './context/AuthContext';
import { API_ENDPOINTS } from './api';
import { Notification, NotificationListResponse, UnreadCountResponse } from './types/notifications';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchNotifications = async (pageNum = 1, isRefreshing = false) => {
    if (!token) return;

    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await fetch(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}?page=${pageNum}&limit=20&status=sent`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: NotificationListResponse = await response.json();
      console.log('Notifications:', JSON.stringify(data, null, 2));

      if (data.success) {
        if (pageNum === 1) {
          setNotifications(data.data);
        } else {
          setNotifications(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === 20);
      } else {
        console.error('Failed to fetch notifications:', data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Xatolik', 'Xabarnomalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token) return;

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
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update notification status locally
        setNotifications(prev =>
          prev.map(notification =>
            notification._id === notificationId
              ? { ...notification, status: 'read' }
              : notification
          )
        );
        
        // Update unread count
        if (unreadCount > 0) {
          setUnreadCount(prev => prev - 1);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    
    // Mark as read if unread
    if (notification.status === 'unread') {
      markAsRead(notification._id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const onRefresh = useCallback(() => {
    setPage(1);
    fetchNotifications(1, true);
    fetchUnreadCount();
  }, [token]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  }, [hasMore, loading, page, token]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
      fetchUnreadCount();
    }, [token])
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
      case 'promotion':
        return 'gift';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#34C759';
      case 'warning':
        return '#FF9500';
      case 'error':
        return '#FF3B30';
      case 'promotion':
        return '#AF52DE';
      default:
        return '#007AFF';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Hozir';
    } else if (diffInHours < 24) {
      return `${diffInHours} soat oldin`;
    } else if (diffInHours < 48) {
      return 'Kecha';
    } else {
      return date.toLocaleDateString('uz-UZ');
    }
  };

  const formatDetailedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'info':
        return 'Ma\'lumot';
      case 'success':
        return 'Muvaffaqiyat';
      case 'warning':
        return 'Ogohlantirish';
      case 'error':
        return 'Xatolik';
      case 'promotion':
        return 'Promo';
      default:
        return 'Ma\'lumot';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Past';
      case 'medium':
        return 'O\'rta';
      case 'high':
        return 'Yuqori';
      case 'urgent':
        return 'Shoshilinch';
      default:
        return 'O\'rta';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.status === 'unread' && styles.unreadNotification,
        item.status === 'read' && styles.readNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getNotificationIcon(item.notification.type)}
            size={24}
            color={getNotificationColor(item.notification.type)}
          />
          <View style={styles.notificationText}>
            <Text style={[
              styles.notificationTitle,
              item.status === 'unread' && styles.unreadText,
              item.status === 'read' && styles.readText
            ]}>
              {item.notification.title}
            </Text>
            <Text style={[
              styles.notificationMessage,
              item.status === 'read' && styles.readMessage
            ]}>
              {item.notification.message}
            </Text>
          </View>
          {item.status === 'unread' && (
            <View style={styles.unreadDot} />
          )}
        </View>
        <Text style={[
          styles.notificationDate,
          item.status === 'read' && styles.readDate
        ]}>
          {formatDate(item.notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Xabarnomalar yo'q</Text>
      <Text style={styles.emptyText}>
        Hozircha sizga yuborilgan xabarnomalar mavjud emas
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Xabarnomalar yuklanmoqda...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xabarnomalar</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item._id}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />

      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Xabarnoma tafsilotlari</Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedNotification && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalNotificationHeader}>
                <Ionicons
                  name={getNotificationIcon(selectedNotification.notification.type)}
                  size={32}
                  color={getNotificationColor(selectedNotification.notification.type)}
                />
                <View style={styles.modalNotificationInfo}>
                  <Text style={styles.modalNotificationTitle}>
                    {selectedNotification.notification.title}
                  </Text>
                  <Text style={styles.modalNotificationType}>
                    {getNotificationTypeLabel(selectedNotification.notification.type)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Xabar matni</Text>
                <Text style={styles.modalMessage}>
                  {selectedNotification.notification.message}
                </Text>
              </View>
              
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Ma'lumotlar</Text>
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Holat:</Text>
                    <Text style={[
                      styles.modalDetailValue,
                      selectedNotification.status === 'unread' ? styles.unreadStatus : styles.readStatus
                    ]}>
                      {selectedNotification.status === 'unread' ? 'O\'qilmagan' : 'O\'qilgan'}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Prioritet:</Text>
                    <Text style={styles.modalDetailValue}>
                      {getPriorityLabel(selectedNotification.notification.priority)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Yuborilgan:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatDetailedDate(selectedNotification.notification.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationText: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
  notificationDate: {
    fontSize: 12,
    color: '#C7C7CC',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyList: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Read/Unread styles
  readNotification: {
    backgroundColor: '#F8F9FA',
    opacity: 0.7,
  },
  readText: {
    fontWeight: '400',
    color: '#6C757D',
  },
  readMessage: {
    color: '#ADB5BD',
  },
  readDate: {
    color: '#ADB5BD',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalNotificationInfo: {
    flex: 1,
    marginLeft: 16,
  },
  modalNotificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  modalNotificationType: {
    fontSize: 14,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  modalDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  unreadStatus: {
    color: '#FF3B30',
  },
  readStatus: {
    color: '#34C759',
  },
});
