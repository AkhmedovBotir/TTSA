import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './context/AuthContext';
import { API_ENDPOINTS } from './api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;
const BOTTOM_SHEET_MIN_HEIGHT = 0;
const MAX_UPWARD_TRANSLATE_Y = -BOTTOM_SHEET_MAX_HEIGHT;
const MIN_DOWNWARD_TRANSLATE_Y = 0;
const DRAG_THRESHOLD = 50;

interface Product {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    unit: string;
    unitSize: number;
    shop: {
      _id: string;
      name: string;
      phone: string;
      address: string;
    };
  };
  quantity: number;
  price: number;
}

interface Seller {
  _id: string;
  name: string;
  username: string;
  status: string;
}

interface Order {
  _id?: string;
  id: string;
  orderId?: number;
  orderNumber: string;
  seller?: Seller;
  user: {
    id: string;
    fullName: string;
    phone: string;
  };
  products?: Product[];
  items: Product[];
  totalSum?: number;
  status: 'completed' | 'cancelled' | 'pending' | 'delivered';
  paymentStatus: 'paid' | 'failed' | 'pending';
  paymentMethod: 'cash' | 'card';
  deliveryAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  deliveryNotes?: string;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  cancelledBy?: string;
  __v?: number;
}

interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

interface OrderResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: PaginationData;
  };
}

interface SingleOrderResponse {
  success: boolean;
  data: Order | null;
  message?: string;
}

// Helper function to safely extract decimal values from MongoDB Decimal128 format
const getDecimalValue = (value: any): number => {
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  return typeof value === 'number' ? value : parseFloat(value) || 0;
};

const formatPrice = (price: any) => {
  const numericPrice = getDecimalValue(price);
  return numericPrice.toLocaleString('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const OrderDetailsBottomSheet = ({ 
  selectedOrder, 
  onClose 
}: { 
  selectedOrder: Order | null;
  onClose: () => void;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastGestureDy.current = (animatedValue as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = lastGestureDy.current + gestureState.dy;
        if (newValue <= MIN_DOWNWARD_TRANSLATE_Y && newValue >= MAX_UPWARD_TRANSLATE_Y) {
          animatedValue.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DRAG_THRESHOLD) {
          // Drag down to close
          onClose();
        } else if (gestureState.dy < -DRAG_THRESHOLD) {
          // Drag up to expand
          Animated.spring(animatedValue, {
            toValue: MAX_UPWARD_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
        } else {
          // Return to previous position
          Animated.spring(animatedValue, {
            toValue: lastGestureDy.current,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (selectedOrder) {
      Animated.spring(animatedValue, {
        toValue: MAX_UPWARD_TRANSLATE_Y,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(animatedValue, {
        toValue: MIN_DOWNWARD_TRANSLATE_Y,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedOrder]);

  if (!selectedOrder) return null;

  return (
    <View style={styles.bottomSheetContainer}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: animatedValue }],
          },
        ]}
      >
        <View style={styles.bottomSheetHeader} {...panResponder.panHandlers}>
          <View style={styles.bottomSheetHandle} />
          <Text style={styles.modalTitle}>Buyurtma № {selectedOrder.orderNumber || selectedOrder.orderId}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.orderDetails}
          contentContainerStyle={styles.orderDetailsContent}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <Text style={styles.detailsTitle}>Foydalanuvchi</Text>
          <Text style={styles.detailsText}>{selectedOrder.user?.fullName || 'Noma\'lum'}</Text>

          <Text style={styles.detailsTitle}>To'lov usuli</Text>
          <Text style={styles.detailsText}>
            {selectedOrder.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}
          </Text>

          <Text style={styles.detailsTitle}>Mahsulotlar</Text>
          {(selectedOrder.products || selectedOrder.items || []).map((product, index) => (
            <View key={index} style={styles.productItemDetails}>
              <Text style={styles.productName}>{product.product?.name || product.name}</Text>
              <Text style={styles.productQuantity}>
                {product.quantity} {product.product?.unit || 'dona'} x {formatPrice(product.price)}
              </Text>
              <Text style={styles.productTotal}>
                {formatPrice(product.quantity * product.price)}
              </Text>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Jami summa:</Text>
            <Text style={styles.totalAmount}>
              {formatPrice(selectedOrder.totalSum || 
                (selectedOrder.products || selectedOrder.items || []).reduce((sum, item) => 
                  sum + (item.price * item.quantity), 0)
              )}
            </Text>
          </View>

          <Text style={styles.detailsTitle}>Sana</Text>
          <Text style={styles.detailsText}>
            Yaratilgan: {formatDate(selectedOrder.createdAt)}
            {selectedOrder.completedAt && (
              `\nYakunlangan: ${formatDate(selectedOrder.completedAt)}`
            )}
          </Text>

          <Text style={styles.detailsTitle}>Status</Text>
          <View style={[
            styles.statusTag,
            (selectedOrder.status === 'completed' || selectedOrder.status === 'delivered') ? styles.completedStatus : 
            selectedOrder.status === 'cancelled' ? styles.cancelledStatus : 
            styles.pendingStatus
          ]}>
            <Text style={[
              styles.statusText,
              (selectedOrder.status === 'completed' || selectedOrder.status === 'delivered') ? styles.completedStatusText : 
              selectedOrder.status === 'cancelled' ? styles.cancelledStatusText : 
              styles.pendingStatusText
            ]}>
              {selectedOrder.status === 'completed' ? 'Yakunlangan' : 
               selectedOrder.status === 'delivered' ? 'Yetkazib berilgan' :
               selectedOrder.status === 'cancelled' ? 'Bekor qilingan' : 
               'Kutilmoqda'}
            </Text>
          </View>

          {selectedOrder.status === 'cancelled' && selectedOrder.cancelReason && (
            <>
              <Text style={styles.detailsTitle}>Bekor qilish sababi</Text>
              <Text style={styles.detailsText}>{selectedOrder.cancelReason}</Text>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export default function SalesScreen() {
  const { token, userId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 10
  });
  
  // Filter states
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async (page = 1, refresh = false) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.perPage.toString(),
      });
      
      if (startDate) {
        params.append('startDate', startDate.toISOString().split('T')[0]);
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const url = `${API_ENDPOINTS.ORDERS.LIST}?${params.toString()}`;
      console.log('=== FETCHING ORDERS ===');
      console.log('Orders URL:', url);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Orders response status:', response.status);
      const data = await response.json();
      console.log('Orders response data:', JSON.stringify(data, null, 2));
      if (data.success) {
        // Update the orders state with the new data
        // The API returns orders directly in the response
        const ordersData = data.orders || data.data || [];
        setOrders(page === 1 ? ordersData : [...orders, ...ordersData]);
        // Update pagination with the new pagination data
        setPagination({
          total: data.total || data.pagination?.total || 0,
          pages: data.totalPages || data.pagination?.pages || 0,
          currentPage: page,
          perPage: data.limit || data.pagination?.limit || pagination.perPage
        });
      } else {
        Alert.alert('Xato', data.message || 'Buyurtmalar ro\'yxatini yuklashda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Buyurtmalar ro\'yxatini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderDetails = async (order: Order) => {
    try {
      console.log('=== FETCHING ORDER DETAILS ===');
      console.log('Order ID:', order.id);
      console.log('Order object:', order);
      
      const response = await fetch(API_ENDPOINTS.ORDERS.DETAIL(order.id), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Order details response status:', response.status);
      const data = await response.json();
      console.log('Order details response data:', data);

      if (data.success && (data.data || data.order)) {
        // The API returns the order data in data or order property
        setSelectedOrder(data.data || data.order);
      } else {
        Alert.alert('Xato', data.message || 'Buyurtma ma\'lumotlarini yuklashda xatolik yuz berdi');
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Xato', 'Buyurtma ma\'lumotlarini yuklashda xatolik yuz berdi');
      setSelectedOrder(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders(1, true);
    }, [startDate, endDate])
  );

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = {
      'completed': styles.completedOrder,
      'delivered': styles.completedOrder,
      'cancelled': styles.cancelledOrder,
      'pending': {}
    }[item.status] || {};
    
    return (
      <TouchableOpacity 
        style={[styles.orderCard, statusStyle]}
        onPress={() => fetchOrderDetails(item)}
      >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderId}>Buyurtma №{item.orderNumber || item.orderId}</Text>
            <View style={[
              styles.statusBadge,
              (item.status === 'completed' || item.status === 'delivered') && styles.completedBadge,
              item.status === 'cancelled' && styles.cancelledBadge,
            ]}>
              <Text style={styles.statusText}>
                {item.status === 'completed' ? 'Yakunlangan' : 
                 item.status === 'delivered' ? 'Yetkazib berilgan' :
                 item.status === 'cancelled' ? 'Bekor qilingan' : 'Kutilmoqda'}
              </Text>
            </View>
          </View>
       
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleString('uz-UZ', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Jami:</Text>
          <Text style={styles.orderTotalSum}>
            {formatPrice(item.totalSum || 
              (item.products || item.items || []).reduce((sum, product) => 
                sum + (product.price * product.quantity), 0)
            )}
          </Text>
        </View>
      </View>
      
      <View style={styles.productsContainer}>
        {(item.products || item.items || []).slice(0, 2).map((product, index) => (
          <View key={index} style={styles.productItemDetails}>
            <Text style={styles.productNameDetails} numberOfLines={1}>
              {product.product?.name || product.name}
            </Text>
            <View style={styles.productDetails}>
              <Text style={styles.productQuantity}>
                {product.quantity} {product.product?.unit || 'dona'}
              </Text>
              <Text style={styles.productPrice}>
                {formatPrice(product.price * product.quantity)}
              </Text>
            </View>
          </View>
        ))}
        {(item.products || item.items || []).length > 2 && (
          <Text style={styles.moreItemsText}>
            + {(item.products || item.items || []).length - 2} ta mahsulot ko'proq
          </Text>
        )}
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.orderMeta}>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod === 'cash' ? '💵 Naqd' : '💳 Karta'}
          </Text>
          {item.status === 'cancelled' && item.cancelReason && (
            <Text style={styles.cancelReason}>
              <Text style={styles.cancelReasonLabel}>Sabab: </Text>
              {item.cancelReason}
            </Text>
          )}
        </View>
      </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sotuvlar tarixi</Text>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDate(true)}
          >
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString() : 'Boshlanish sana'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDate(true)}
          >
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toLocaleDateString() : 'Tugash sana'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchOrders(1, true);
          }}
          onEndReached={() => {
            if (pagination.currentPage < pagination.pages) {
              fetchOrders(pagination.currentPage + 1);
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>Buyurtmalar topilmadi</Text>
            </View>
          }
        />
      )}

      <OrderDetailsBottomSheet
        selectedOrder={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {showStartDate && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowStartDate(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndDate && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowEndDate(false);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  completedOrder: {
    borderLeftColor: '#34A853',
  },
  cancelledOrder: {
    borderLeftColor: '#EA4335',
  },
  orderFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  cancelReason: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  cancelReasonLabel: {
    fontWeight: '500',
  },
  orderHeader: {
    display: "flex",
    flexDirection: 'column',
    marginBottom: 8,
  },
  orderInfo: {
    display: "flex",
    flexDirection: "column",
    width: '100%',
  },
  orderIdRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  completedBadge: {
    backgroundColor: '#E6F4EA',
  },
  cancelledBadge: {
    backgroundColor: '#FCE8E6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1A73E8',
  },
  statusTextDetails: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A73E8',
  },
  sellerName: {
    fontSize: 14,
    color: '#202124',
    marginBottom: 8,
  },
  label: {
    color: '#5F6368',
    fontSize: 14,
  },
  dateText: {
    fontSize: 12,
    color: '#9AA0A6',
    marginBottom: 8,
  },
  totalContainer: {
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  totalLabel: {
    fontSize: 12,
    color: '#5F6368',
    marginBottom: 2,
  },
  totalSum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
  },
  orderTotalSum: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'left',
  },
  productsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    paddingTop: 8,
  },
  productItem: {
    marginBottom: 8,
  },
  productItemDetails: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 14,
    color: '#202124',
    marginBottom: 2,
  },
  productNameDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productQuantity: {
    fontSize: 13,
    color: '#5F6368',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '500',
    color: '#202124',
  },
  productPriceDetails: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  moreItemsText: {
    fontSize: 13,
    color: '#1A73E8',
    textAlign: 'center',
    marginTop: 4,
  },
  completedOrder: {
    borderLeftColor: '#34A853',
  },
  cancelledOrder: {
    borderLeftColor: '#EA4335',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 14,
    color: '#666',
  },

  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMeta: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-start',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedStatus: {
    backgroundColor: '#E8F5E9',
  },
  cancelledStatus: {
    backgroundColor: '#FFEBEE',
  },
  pendingStatus: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedStatusText: {
    color: '#4CAF50',
  },
  cancelledStatusText: {
    color: '#D32F2F',
  },
  pendingStatusText: {
    color: '#FF9800',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  bottomSheetContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    width: '100%',
    height: BOTTOM_SHEET_MAX_HEIGHT,
    bottom: -BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  bottomSheetHeader: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  orderDetails: {
    flex: 1,
  },
  orderDetailsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productItemDetails: {
    marginBottom: 12,
  },
  productNameDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cancelReason: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 8,
  },
}); 