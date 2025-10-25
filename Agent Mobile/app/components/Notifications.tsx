import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { OrderService, NotificationItem, NotificationsResponse } from '../services/orderService';

interface NotificationsProps {
  visible: boolean;
  onClose: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [selectedFilter, setSelectedFilter] = useState<string>('');

  const loadNotifications = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    try {
      console.log('=== LOADING NOTIFICATIONS ===');
      console.log('Page:', page, 'Filter:', selectedFilter);

      const response = await OrderService.getNotifications(page, 10, selectedFilter || undefined);
      
      if (response.success) {
        if (reset || page === 1) {
          setNotifications(response.data);
        } else {
          setNotifications(prev => [...prev, ...response.data]);
        }
        setPagination({
          currentPage: response.pagination.currentPage,
          totalPages: response.pagination.totalPages,
          hasNextPage: response.pagination.hasNextPage,
          hasPrevPage: response.pagination.hasPrevPage
        });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Toast.show({
        type: 'error',
        text1: 'Xatolik',
        text2: 'Xabarnomalarni yuklashda xatolik yuz berdi'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications(1, true);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await OrderService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, status: 'read', readAt: new Date().toISOString() }
              : notif
          )
        );

        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyat',
          text2: 'Xabarnoma o\'qilgan deb belgilandi'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Toast.show({
        type: 'error',
        text1: 'Xatolik',
        text2: 'Xabarnomani o\'qilgan deb belgilashda xatolik yuz berdi'
      });
    }
  };

  const loadMore = () => {
    if (pagination.hasNextPage && !loading) {
      loadNotifications(pagination.currentPage + 1);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'close-circle';
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
      default:
        return '#007AFF';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF3B30';
      case 'medium':
        return '#FF9500';
      default:
        return '#34C759';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <View style={[styles.notificationCard, item.status !== 'read' && styles.unreadCard]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Ionicons 
            name={getNotificationIcon(item.notification.type)} 
            size={24} 
            color={getNotificationColor(item.notification.type)} 
          />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.notification.title}</Text>
          <Text style={styles.notificationMessage}>{item.notification.message}</Text>
          
          <View style={styles.notificationMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.notification.priority) }]}>
              <Text style={styles.priorityText}>
                {item.notification.priority === 'high' ? 'Yuqori' : 
                 item.notification.priority === 'medium' ? 'O\'rta' : 'Past'}
              </Text>
            </View>
            <Text style={styles.notificationDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>

      {item.status !== 'read' && (
        <TouchableOpacity
          style={styles.markReadButton}
          onPress={() => handleMarkAsRead(item._id)}
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.markReadText}>O'qildi</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFilterButton = (label: string, value: string) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedFilter === value && styles.filterButtonActive]}
      onPress={() => {
        setSelectedFilter(value);
        loadNotifications(1, true);
      }}
    >
      <Text style={[styles.filterButtonText, selectedFilter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Xabarnomalar yo'q</Text>
      <Text style={styles.emptyMessage}>
        {selectedFilter ? 'Tanlangan filter bo\'yicha xabarnomalar topilmadi' : 'Hali xabarnomalar kelmagan'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerLoaderText}>Yuklanmoqda...</Text>
      </View>
    );
  };

  useEffect(() => {
    if (visible) {
      loadNotifications(1, true);
    }
  }, [visible, loadNotifications]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Xabarnomalar</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {renderFilterButton('Barchasi', '')}
              {renderFilterButton('O\'qilmagan', 'sent')}
              {renderFilterButton('O\'qilgan', 'read')}
              {renderFilterButton('Yetkazilgan', 'delivered')}
            </ScrollView>
          </View>

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item._id}
            style={styles.notificationsList}
            contentContainerStyle={styles.notificationsContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  filtersContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  markReadText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#666',
  },
});

export default Notifications;
