import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { apiService, Order } from '../services/api';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      }

      const response = await apiService.getOrders({
        page,
        limit: 10,
      });

      if (response.success && response.data) {
        if (refresh || page === 1) {
          setOrders(response.data.orders);
        } else {
          setOrders(prev => [...prev, ...response.data.orders]);
        }
        
        setHasMore(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadOrders(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadOrders(currentPage + 1);
    }
  };

  const handleOrderPress = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  const handleCancelOrder = async (order: Order) => {
    Alert.alert(
      'Buyurtmani bekor qilish',
      `${order.orderNumber} raqamli buyurtmani bekor qilishni xohlaysizmi?`,
      [
        { text: 'Yo\'q', style: 'cancel' },
        {
          text: 'Bekor qilish',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.cancelOrder(order.id);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', 'Buyurtma bekor qilindi');
                handleRefresh();
              } else {
                Alert.alert('Xato', 'Buyurtmani bekor qilishda xatolik yuz berdi');
              }
            } catch (error) {
              Alert.alert('Xato', 'Buyurtmani bekor qilishda xatolik yuz berdi');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FF9500';
      case 'processing':
        return '#007AFF';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Kutilmoqda';
      case 'processing':
        return 'Jarayonda';
      case 'delivered':
        return 'Yetkazildi';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => handleOrderPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.itemCount}>{item.itemCount} ta mahsulot</Text>
      </View>

      <View style={styles.orderTotal}>
        <Text style={styles.totalLabel}>Jami:</Text>
        <Text style={styles.totalPrice}>{formatPrice(item.totalPrice)}</Text>
      </View>

      {item.status.toLowerCase() === 'pending' && (
        <Button
          title="Bekor qilish"
          onPress={() => handleCancelOrder(item)}
          variant="danger"
          size="small"
          style={styles.cancelButton}
        />
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Barcha buyurtmalar ko'rsatildi</Text>
        </View>
      );
    }
    return null;
  };

  if (orders.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="list-outline" size={64} color="#8E8E93" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Buyurtmalar yo'q</Text>
        <Text style={styles.emptySubtitle}>
          Hali hech qanday buyurtma bermagansiz. Mahsulotlarni ko'rib chiqing va buyurtma bering.
        </Text>
        <Button
          title="Mahsulotlarni ko'rish"
          onPress={() => router.push('/(tabs)')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buyurtmalar</Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        style={styles.ordersList}
        contentContainerStyle={styles.ordersContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  ordersList: {
    flex: 1,
  },
  ordersContainer: {
    padding: 20,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  cancelButton: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
  },
  emptyIcon: {
    fontSize: 64,
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
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
});
