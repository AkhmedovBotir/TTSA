import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceOrder } from '../services/orderService';

interface OrderDetailsProps {
  order: MarketplaceOrder | null;
  visible: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onDeliver?: () => void;
  onCancel?: () => void;
  onConfirmPayment?: () => void;
  onRejectPayment?: () => void;
  showActions?: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  visible,
  onClose,
  onAccept,
  onDeliver,
  onCancel,
  onConfirmPayment,
  onRejectPayment,
  showActions = true
}) => {
  console.log('=== ORDER DETAILS COMPONENT RENDERED ===');
  console.log('Order received:', order);
  console.log('Order visible:', visible);
  console.log('Order location:', order?.location);
  console.log('Order keys:', Object.keys(order || {}));
  console.log('Has location property:', 'location' in (order || {}));
  
  if (!order) {
    console.log('No order data, returning null');
    return null;
  }

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
        return 'To\'lov kutilmoqda';
      case 'failed':
        return 'To\'lov xatosi';
      case 'refunded':
        return 'To\'lov qaytarildi';
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
      year: 'numeric'
    });
  };

  const canAccept = order.status === 'pending';
  const canDeliver = order.status === 'confirmed' || order.status === 'processing';
  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const canConfirmPayment = order.paymentStatus === 'pending';
  const canRejectPayment = order.paymentStatus === 'pending';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Buyurtma #{order.orderNumber}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Order Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buyurtma holati</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
                <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(order.paymentStatus) }]}>
                  <Text style={styles.paymentText}>{getPaymentStatusText(order.paymentStatus)}</Text>
                </View>
              </View>
            </View>

            {/* Customer Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {order.user.fullName || order.deliveryAddress.fullName}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {order.user.phone || order.deliveryAddress.phone}
                  </Text>
                </View>
                {order.user.email && (
                  <View style={styles.infoRow}>
                    <Ionicons name="mail" size={20} color="#666" />
                    <Text style={styles.infoText}>{order.user.email}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yetkazib berish manzili</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color="#666" />
                  <Text style={styles.infoText}>{order.deliveryAddress.address}</Text>
                </View>
                {order.location && (
                  <>
                    <View style={styles.infoRow}>
                      <Ionicons name="map" size={20} color="#666" />
                      <Text style={styles.infoText}>
                        Viloyat: {order.location.region.name}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="business" size={20} color="#666" />
                      <Text style={styles.infoText}>
                        Tuman: {order.location.district.name}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="home" size={20} color="#666" />
                      <Text style={styles.infoText}>
                        MFY: {order.location.mfy.name}
                      </Text>
                    </View>
                  </>
                )}
                {order.deliveryNotes && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text" size={20} color="#666" />
                    <Text style={styles.infoText}>{order.deliveryNotes}</Text>
                  </View>
                )}
                {order.estimatedDelivery && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      Taxminiy yetkazish: {formatDate(order.estimatedDelivery)}
                    </Text>
                  </View>
                )}
                {order.actualDelivery && (
                  <View style={styles.infoRow}>
                    <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                    <Text style={styles.infoText}>
                      Yetkazilgan: {formatDate(order.actualDelivery)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mahsulotlar ({order.itemCount} ta)</Text>
              {order.items.map((item, index) => (
                <View key={index} style={styles.productCard}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{item.product.name}</Text>
                    <Text style={styles.productCategory}>
                      {item.product.category.name} / {item.product.subcategory.name}
                    </Text>
                  </View>
                  
                  <View style={styles.productDetails}>
                    <View style={styles.productRow}>
                      <Text style={styles.productLabel}>Miqdor:</Text>
                      <Text style={styles.productValue}>
                        {item.quantity} {item.product.unit}
                      </Text>
                    </View>
                    <View style={styles.productRow}>
                      <Text style={styles.productLabel}>Narx:</Text>
                      <Text style={styles.productValue}>
                        {item.price.toLocaleString()} so'm
                      </Text>
                    </View>
                    {item.discount > 0 && (
                      <View style={styles.productRow}>
                        <Text style={styles.productLabel}>Chegirma:</Text>
                        <Text style={styles.productValue}>
                          {item.discount}% ({item.originalPrice.toLocaleString()} so'm)
                        </Text>
                      </View>
                    )}
                    <View style={[styles.productRow, styles.totalRow]}>
                      <Text style={styles.productLabel}>Jami:</Text>
                      <Text style={styles.productTotal}>
                        {item.totalPrice.toLocaleString()} so'm
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>To'lov ma'lumotlari</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="card" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    To'lov usuli: {order.paymentMethod === 'cash' ? 'Naqd' : 
                                 order.paymentMethod === 'card' ? 'Karta' : 'Muddatli to\'lov'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    Buyurtma sanasi: {formatDate(order.createdAt)}
                  </Text>
                </View>
                {order.totalOriginalPrice && order.totalDiscount && (
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag" size={20} color="#666" />
                    <Text style={styles.infoText}>
                      Jami chegirma: {order.totalDiscount.toLocaleString()} so'm
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buyurtma xulosasi</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mahsulotlar soni:</Text>
                  <Text style={styles.summaryValue}>{order.itemCount} ta</Text>
                </View>
                {order.totalOriginalPrice && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Jami narx:</Text>
                    <Text style={styles.summaryValue}>
                      {order.totalOriginalPrice.toLocaleString()} so'm
                    </Text>
                  </View>
                )}
                {order.totalDiscount && order.totalDiscount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Chegirma:</Text>
                    <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                      -{order.totalDiscount.toLocaleString()} so'm
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.finalTotalRow]}>
                  <Text style={styles.finalTotalLabel}>To'lov summasi:</Text>
                  <Text style={styles.finalTotalValue}>
                    {order.totalPrice.toLocaleString()} so'm
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          {showActions && (canAccept || canDeliver || canCancel || canConfirmPayment || canRejectPayment) && (
            <View style={styles.actions}>
              {canAccept && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={onAccept}
                >
                  <Ionicons name="checkmark" size={24} color="white" />
                </TouchableOpacity>
              )}
              
              {canDeliver && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.deliverButton]}
                  onPress={onDeliver}
                >
                  <Ionicons name="car" size={24} color="white" />
                </TouchableOpacity>
              )}
              
              {canConfirmPayment && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.paymentButton]}
                  onPress={onConfirmPayment}
                >
                  <Ionicons name="card" size={24} color="white" />
                </TouchableOpacity>
              )}
              
              {canRejectPayment && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={onRejectPayment}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              )}
              
              {canCancel && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paymentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  productCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productHeader: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  productDetails: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productLabel: {
    fontSize: 14,
    color: '#666',
  },
  productValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  productTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  finalTotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 60,
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
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderDetails;
