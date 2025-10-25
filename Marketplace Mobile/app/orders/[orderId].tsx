import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from '../components/Button';
import { apiService, Order } from '../services/api';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getOrder(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        Alert.alert('Xato', 'Buyurtma topilmadi');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      Alert.alert('Xato', 'Buyurtma yuklanmadi');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    Alert.alert(
      'Buyurtmani bekor qilish',
      `${order.orderNumber} raqamli buyurtmani bekor qilishni xohlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Bekor qilish',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const response = await apiService.cancelOrder(order.id);
              if (response.success) {
                Alert.alert('Muvaffaqiyatli', 'Buyurtma bekor qilindi');
                loadOrder(); // Reload order to update status
              } else {
                Alert.alert('Xato', 'Buyurtmani bekor qilishda xatolik yuz berdi');
              }
            } catch (error) {
              Alert.alert('Xato', 'Buyurtmani bekor qilishda xatolik yuz berdi');
            } finally {
              setIsCancelling(false);
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
      hour: '2-digit',
      minute: '2-digit',
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

  const getPaymentStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Kutilmoqda';
      case 'paid':
        return 'To\'langan';
      case 'failed':
        return 'Xatolik';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Buyurtma yuklanmoqda...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Buyurtma topilmadi</Text>
        <Button title="Orqaga qaytish" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma ma'lumotlari</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Buyurtma sanasi:</Text>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To'lov holati:</Text>
            <Text style={styles.infoValue}>{getPaymentStatusText(order.paymentStatus)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To'lov usuli:</Text>
            <Text style={styles.infoValue}>
              {order.paymentMethod === 'cash' ? 'Naqd pul' : 'Karta orqali'}
            </Text>
          </View>
          
          {order.estimatedDelivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Taxminiy yetkazish:</Text>
              <Text style={styles.infoValue}>{formatDate(order.estimatedDelivery)}</Text>
            </View>
          )}
          
          {order.actualDelivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yetkazilgan sana:</Text>
              <Text style={styles.infoValue}>{formatDate(order.actualDelivery)}</Text>
            </View>
          )}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressName}>{order.deliveryAddress.fullName}</Text>
            <Text style={styles.addressPhone}>{order.deliveryAddress.phone}</Text>
            <Text style={styles.addressText}>{order.deliveryAddress.address}</Text>
          </View>
          
          {order.deliveryNotes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Izohlar:</Text>
              <Text style={styles.notesText}>{order.deliveryNotes}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma mahsulotlari</Text>
          
          {order.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemImageContainer}>
                <Ionicons name="bag-outline" size={40} color="#8E8E93" />
              </View>
              
              <View style={styles.itemContent}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemCategory}>
                  {item.product.category.name} • {item.product.subcategory.name}
                </Text>
                <Text style={styles.itemUnit}>
                  {item.product.quantity} {item.product.unit} • {item.product.unitSize}
                </Text>
                <Text style={styles.itemShop}>{item.product.shop.name}</Text>
              </View>
              
              <View style={styles.itemPriceContainer}>
                <Text style={styles.itemQuantity}>{item.quantity} x</Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma xulosasi</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Mahsulotlar:</Text>
              <Text style={styles.summaryValue}>{order.itemCount} ta</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Jami narx:</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.totalOriginalPrice)}</Text>
            </View>
            
            {order.totalDiscount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Chegirma:</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>
                  -{formatPrice(order.totalDiscount)}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>To'lov miqdori:</Text>
              <Text style={styles.totalPrice}>{formatPrice(order.totalPrice)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {order.status.toLowerCase() === 'pending' && (
        <View style={styles.bottomContainer}>
          <Button
            title="Buyurtmani bekor qilish"
            onPress={handleCancelOrder}
            variant="danger"
            loading={isCancelling}
            style={styles.cancelButton}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F2F2F7',
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  addressContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  notesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemImage: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  itemShop: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  summaryContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  discountText: {
    color: '#FF3B30',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    marginTop: 8,
  },
});
