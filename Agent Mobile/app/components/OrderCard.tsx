import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceOrder } from '../services/orderService';

interface OrderCardProps {
  order: MarketplaceOrder;
  onPress: () => void;
  onAccept?: () => void;
  onDeliver?: () => void;
  onCancel?: () => void;
  onConfirmPayment?: () => void;
  onRejectPayment?: () => void;
  showActions?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onPress,
  onAccept,
  onDeliver,
  onCancel,
  onConfirmPayment,
  onRejectPayment,
  showActions = true
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'confirmed':
        return '#007AFF';
      case 'processing':
        return '#5856D6';
      case 'shipped':
        return '#32D74B';
      case 'delivered':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Kutilmoqda';
      case 'confirmed':
        return 'Qabul qilingan';
      case 'processing':
        return 'Tayyorlanmoqda';
      case 'shipped':
        return 'Yuborilgan';
      case 'delivered':
        return 'Yetkazilgan';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      case 'refunded':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'To\'langan';
      case 'pending':
        return 'Kutilmoqda';
      case 'failed':
        return 'Xato';
      case 'refunded':
        return 'Qaytarilgan';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const canAccept = order.status === 'pending';
  const canDeliver = order.status === 'confirmed' || order.status === 'processing';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canConfirmPayment = order.paymentStatus === 'pending';
  const canRejectPayment = order.paymentStatus === 'pending';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>
          {order.user.fullName || order.deliveryAddress.fullName}
        </Text>
        <Text style={styles.customerPhone}>
          {order.user.phone || order.deliveryAddress.phone}
        </Text>
      </View>

      <View style={styles.itemsPreview}>
        {order.items.slice(0, 2).map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {item.quantity} x {item.product.name}
            </Text>
            <Text style={styles.itemPrice}>
              {item.totalPrice.toLocaleString()} so'm
            </Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{order.items.length - 2} ta boshqa mahsulot
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Jami:</Text>
          <Text style={styles.totalAmount}>
            {order.totalPrice.toLocaleString()} so'm
          </Text>
        </View>
        
        <View style={styles.paymentStatus}>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(order.paymentStatus) }]}>
            <Text style={styles.paymentText}>
              {getPaymentStatusText(order.paymentStatus)}
            </Text>
          </View>
        </View>
      </View>

      {showActions && (canAccept || canDeliver || canCancel || canConfirmPayment || canRejectPayment) && (
        <View style={styles.actions}>
          {canAccept && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Qabul qilish</Text>
            </TouchableOpacity>
          )}
          
          {canDeliver && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deliverButton]}
              onPress={onDeliver}
            >
              <Ionicons name="car" size={16} color="white" />
              <Text style={styles.actionButtonText}>Yetkazildi</Text>
            </TouchableOpacity>
          )}
          
          {canConfirmPayment && (
            <TouchableOpacity
              style={[styles.actionButton, styles.paymentButton]}
              onPress={onConfirmPayment}
            >
              <Ionicons name="card" size={16} color="white" />
              <Text style={styles.actionButtonText}>To'lov tasdiq</Text>
            </TouchableOpacity>
          )}
          
          {canRejectPayment && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onRejectPayment}
            >
              <Ionicons name="close-circle" size={16} color="white" />
              <Text style={styles.actionButtonText}>To'lov rad</Text>
            </TouchableOpacity>
          )}
          
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancel}
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Bekor qilish</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentStatus: {
    marginLeft: 12,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  deliverButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  paymentButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OrderCard;
