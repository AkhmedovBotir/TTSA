import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from "react";
import { getValidToken } from "../utils/auth";
import { getApiUrl, API_CONFIG } from '../config/api';

// Helper function to handle Decimal128 values from MongoDB
const parseDecimal = (value: number | { $numberDecimal: string }): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  return 0;
};
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from 'react-native-toast-message';

interface Product {
  productId: string;
  name: string;
  price: number | { $numberDecimal: string };
  quantity: number | { $numberDecimal: string };
  unit: string;
  unitSize: number;
  _id: string;
}

interface Seller {
  _id: string;
  name: string;
  username: string;
  status: string;
}

interface RestoredProduct {
  id: string;
  name: string;
  restoredQuantity: number | { $numberDecimal: string };
  newInventory: number | { $numberDecimal: string };
}

interface InstallmentInfo {
  duration: number;
  monthlyPayment: number | { $numberDecimal: string };
  startDate?: string;
  endDate?: string;
}

interface PaymentScheduleItem {
  month: number;
  amount: number | { $numberDecimal: string };
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  _id: string;
}

interface Order {
  _id: string;
  orderId: number;
  seller: {
    _id: string;
    fullname?: string;
    fullName?: string;
    username?: string;
    phone?: string;
  };
  storeOwner: string | { _id: string };
  products: Product[];
  totalSum: number | { $numberDecimal: string };
  status: 'completed' | 'pending' | 'cancelled' | 'active';
  paymentMethod: 'cash' | 'installment';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  customer?: {
    fullName: string;
    birthDate?: string;
    passportSeries?: string;
    primaryPhone?: string;
    secondaryPhone?: string;
    image?: string;
  };
  installment?: InstallmentInfo;
  payments?: PaymentScheduleItem[];
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

interface CancelModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Ha",
  cancelText = "Yo'q",
  loading = false
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModalContent}>
        <Text style={styles.confirmModalTitle}>{title}</Text>
        <Text style={styles.confirmModalMessage}>{message}</Text>

        <View style={styles.confirmModalButtons}>
          <TouchableOpacity
            style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.confirmModalButtonText, { color: '#666' }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.confirmModalButton, 
              styles.confirmModalButtonConfirm,
              loading && styles.disabledButton
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.confirmModalButtonText}>{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function SalesScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    currentPage: 1,
    perPage: 10
  });

  // Date filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadOrders();
  }, [pagination.currentPage, startDate, endDate]);

  const loadOrders = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('Avtorizatsiya tokeni topilmadi');
      }
      
      let url = `${getApiUrl(API_CONFIG.ENDPOINTS.ORDER_HISTORY)}?page=${pagination.currentPage}&limit=${pagination.perPage}`;
      
      // Add date filters if provided
      if (startDate) {
        const formattedStartDate = startDate.toISOString().split('T')[0];
        url += `&startDate=${formattedStartDate}`;
      }
      
      if (endDate) {
        const formattedEndDate = endDate.toISOString().split('T')[0];
        url += `&endDate=${formattedEndDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        // Normalize and parse response
        const processedOrders: Order[] = responseData.data.map((order: any) => {
          return {
            ...order,
            seller: order.seller || {},
            storeOwner: order.storeOwner,
            products: (order.products || []).map((product: any) => ({
              ...product,
              price: parseDecimal(product.price),
              quantity: parseDecimal(product.quantity)
            })),
            totalSum: typeof order.totalSum === 'number' ? order.totalSum : parseDecimal(order.totalSum),
            paymentMethod: order.paymentMethod === 'installment' ? 'installment' : 'cash',
            status: order.status,
            customer: order.customer,
            installment: order.installment
              ? {
                  ...order.installment,
                  monthlyPayment: parseDecimal(order.installment.monthlyPayment || 0),
                }
              : undefined,
            payments: (order.payments || []).map((p: any) => ({
              ...p,
              amount: parseDecimal(p.amount),
            })),
          } as Order;
        });
        
        setOrders(processedOrders);
        setPagination({
          total: responseData.pagination?.total || 0,
          pages: responseData.pagination?.pages || 1,
          currentPage: responseData.pagination?.page || 1,
          perPage: responseData.pagination?.limit || 10
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Xatolik',
          text2: responseData.message || 'Buyurtmalarni yuklashda xatolik yuz berdi',
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: 'Serverga ulanishda xatolik yuz berdi',
      });
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const renderDateFilters = () => (
    <View style={styles.dateFilterContainer}>
      <View style={styles.dateFiltersRow}>
        <View style={styles.datePickerWrapper}>
          <Text style={styles.dateLabel}>Boshlanish:</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toLocaleDateString('uz-UZ') : 'Tanlang'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.datePickerWrapper}>
          <Text style={styles.dateLabel}>Tugash:</Text>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toLocaleDateString('uz-UZ') : 'Tanlang'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartDateChange}
          maximumDate={endDate}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={startDate}
        />
      )}
    </View>
  );

  const showConfirmation = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
  }) => {
    setConfirmModalConfig(config);
    setShowConfirmModal(true);
  };

  const handleCancelSale = (saleId: string) => {
    showConfirmation({
      title: "Buyurtmani bekor qilish",
      message: "Ushbu buyurtmani bekor qilishni xohlaysizmi?",
      onConfirm: () => {
        setSelectedSaleId(saleId);
        setShowCancelModal(true);
        setShowConfirmModal(false);
      }
    });
  };

  const confirmCancelSale = async () => {
    if (!selectedSaleId) return;
    
    setCancelLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('Avtorizatsiya tokeni topilmadi');
      }
      
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_ORDERS)}/${selectedSaleId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason.trim() || 'Bekor qilish sababi kiritilmadi'
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', responseData);
        
        if (response.status === 404) {
          throw new Error('Buyurtma topilmadi');
        } else if (response.status === 400) {
          throw new Error(responseData.message || 'Noto\'g\'ri so\'rov');
        } else {
          throw new Error('Serverda xatolik yuz berdi');
        }
      }

      // Update the cancelled order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === selectedSaleId 
            ? { 
                ...order, 
                status: 'cancelled', 
                cancelReason: cancelReason,
                updatedAt: new Date().toISOString()
              } 
            : order
        )
      );
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Muvaffaqiyatli',
        text2: 'Buyurtma bekor qilindi',
      });
      
      // Check if there are restored products in the response
      if (responseData.data?.restoredProducts?.length > 0) {
        const restoredInfo = responseData.data.restoredProducts
          .map((p: any) => `${p.name}: +${p.restoredQuantity}`)
          .join('\n');
        
        Toast.show({
          type: 'info',
          text1: 'Mahsulotlar qaytarildi',
          text2: restoredInfo,
          visibilityTime: 3000,
        });
      }
      
      // Close the modal and reset the form
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedSaleId(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      if (error instanceof Error) {
        Toast.show({
          type: 'error',
          text1: 'Xato',
          text2: error.message,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Xato',
          text2: 'Serverda xatolik yuz berdi',
        });
      }
      // Close the modal even on error
      setShowCancelModal(false);
      setSelectedSaleId(null);
      setCancelReason('');
    } finally {
      setCancelLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    loadOrders().finally(() => {
      setRefreshing(false);
      Toast.show({
        type: 'info',
        text1: 'Yangilandi',
        text2: 'Ma\'lumotlar yangilandi',
        visibilityTime: 2000,
      });
    });
  }, []);

  interface CancelModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    reason: string;
    onReasonChange: (text: string) => void;
  }

  const CancelModal: React.FC<CancelModalProps> = React.memo(({ 
    visible, 
    onClose, 
    onConfirm, 
    loading, 
    reason, 
    onReasonChange 
  }) => {
    // Local state to handle input
    const [inputValue, setInputValue] = React.useState(reason);

    // Update local state when prop changes
    React.useEffect(() => {
      setInputValue(reason);
    }, [reason]);

    const handleConfirm = () => {
      onReasonChange(inputValue);
      onConfirm();
    };

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay} onStartShouldSetResponder={() => true}>
          <View style={styles.cancelModalContent}>
            <Text style={styles.cancelModalTitle}>Buyurtmani bekor qilish</Text>
            
            <View style={styles.cancelReasonContainer}>
              <Text style={styles.cancelReasonLabel}>Bekor qilish sababi:</Text>
              <TextInput
                style={styles.cancelReasonInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Ixtiyoriy"
                multiline
                numberOfLines={3}
                maxLength={200}
                autoFocus
              />
            </View>

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonCancel]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.cancelModalButtonText, { color: '#666' }]}>Yo'q</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cancelModalButton, 
                  styles.cancelModalButtonConfirm,
                  loading && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.cancelModalButtonText}>Ha</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  });

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>#{item.orderId}</Text>
          {item.products.length > 1 && (
            <Text style={styles.productCount}>
              {item.products.length} ta mahsulot
            </Text>
          )}
        </View>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          })}
        </Text>
      </View>

      <View style={styles.productsPreview}>
        {item.products.map((product, index) => {
          const quantity = parseDecimal(product.quantity);
          const price = parseDecimal(product.price);
          const total = quantity * price;
          
          return (
            <View key={product._id} style={styles.productItem}>
              <Text style={styles.productPreview} numberOfLines={1}>
                {quantity} x {product.name} ({price.toLocaleString()} so'm) - {total.toLocaleString()} so'm
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderTotal}>
          {parseDecimal(item.totalSum as any).toLocaleString()} so'm
        </Text>
        <View style={styles.orderMeta}>
          <Text style={styles.orderStatus}>
            {item.paymentMethod === 'installment' ? "Muddatli to'lov" : (
              item.status === 'completed' ? 'Yakunlangan' : 
              item.status === 'cancelled' ? 'Bekor qilingan' : 'Kutilmoqda')}
          </Text>
          {/* {item.status === 'completed' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelSale(item._id)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )} */}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = 1;
    let endPage = pagination.pages;

    if (pagination.pages > maxVisiblePages) {
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = maxVisiblePages - leftOffset - 1;

      if (pagination.currentPage <= leftOffset) {
        // Near the start
        endPage = maxVisiblePages;
      } else if (pagination.currentPage >= pagination.pages - rightOffset) {
        // Near the end
        startPage = pagination.pages - maxVisiblePages + 1;
      } else {
        // Middle
        startPage = pagination.currentPage - leftOffset;
        endPage = pagination.currentPage + rightOffset;
      }
    }

    // Add first page button
    if (startPage > 1) {
      pageNumbers.push(
        <TouchableOpacity
          key="1"
          style={[styles.pageButton]}
          onPress={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
          disabled={loading}
        >
          <Text style={styles.pageButtonText}>1</Text>
        </TouchableOpacity>
      );
      if (startPage > 2) {
        pageNumbers.push(
          <Text key="leftEllipsis" style={styles.ellipsis}>...</Text>
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            i === pagination.currentPage && styles.activePageButton
          ]}
          onPress={() => {
            if (i !== pagination.currentPage && !loading) {
              setPagination(prev => ({ ...prev, currentPage: i }));
            }
          }}
          disabled={loading || i === pagination.currentPage}
        >
          <Text style={[
            styles.pageButtonText,
            i === pagination.currentPage && styles.activePageButtonText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    // Add last page button
    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1) {
        pageNumbers.push(
          <Text key="rightEllipsis" style={styles.ellipsis}>...</Text>
        );
      }
      pageNumbers.push(
        <TouchableOpacity
          key={pagination.pages}
          style={[styles.pageButton]}
          onPress={() => setPagination(prev => ({ ...prev, currentPage: pagination.pages }))}
          disabled={loading}
        >
          <Text style={styles.pageButtonText}>{pagination.pages}</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, pagination.currentPage === 1 && styles.disabledPageButton]}
          onPress={() => {
            if (pagination.currentPage > 1 && !loading) {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
            }
          }}
          disabled={pagination.currentPage === 1 || loading}
        >
          <Ionicons name="chevron-back" size={20} color={pagination.currentPage === 1 ? "#999" : "#333"} />
        </TouchableOpacity>

        {pageNumbers}

        <TouchableOpacity
          style={[styles.pageButton, pagination.currentPage === pagination.pages && styles.disabledPageButton]}
          onPress={() => {
            if (pagination.currentPage < pagination.pages && !loading) {
              setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
            }
          }}
          disabled={pagination.currentPage === pagination.pages || loading}
        >
          <Ionicons name="chevron-forward" size={20} color={pagination.currentPage === pagination.pages ? "#999" : "#333"} />
        </TouchableOpacity>
      </View>
    );
  };

  const handleCancelModalClose = React.useCallback(() => {
    setShowCancelModal(false);
    setSelectedSaleId(null);
    setCancelReason('');
  }, []);

  const handleCancelReasonChange = React.useCallback((text: string) => {
    setCancelReason(text);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sotuvlar tarixi</Text>
        <TouchableOpacity
          style={styles.marketplaceButton}
          onPress={() => router.push('/(tabs)/marketplace-orders')}
        >
          <Ionicons name="storefront" size={20} color="#007AFF" />
          <Text style={styles.marketplaceButtonText}>Marketplace</Text>
        </TouchableOpacity>
      </View>

      {renderDateFilters()}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Sotuvlar mavjud emas</Text>
          </View>
        )}
        ListFooterComponent={() => (
          <>
            {loading && !refreshing && (
              <ActivityIndicator style={styles.loader} color="#007AFF" />
            )}
            {renderPagination()}
          </>
        )}
      />

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buyurtma #{selectedOrder?.orderId}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Sotuvchi</Text>
                <Text style={styles.sellerName}>{selectedOrder?.seller.fullname || selectedOrder?.seller.fullName || '-'}</Text>
                {!!selectedOrder?.seller.username && (
                  <Text style={styles.sellerUsername}>@{selectedOrder?.seller.username}</Text>
                )}
                {!!selectedOrder?.seller.phone && (
                  <Text style={styles.sellerPhone}>{selectedOrder?.seller.phone}</Text>
                )}
              </View>

              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Mahsulotlar</Text>
                {selectedOrder?.products.map((product, index) => (
                  <View key={index} style={styles.productItem}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productDetails}>
                      <Text style={styles.productQuantity}>
                      {parseDecimal(product.quantity)} {product.unit}
                    </Text>
                    <Text style={styles.productPrice}>
                      {parseDecimal(product.price).toLocaleString()} so'm
                    </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>To'lov ma'lumotlari</Text>
                <View style={styles.paymentDetails}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>To'lov turi:</Text>
                    <Text style={styles.paymentValue}>
                      {selectedOrder?.paymentMethod === 'installment' ? "Muddatli to'lov" : 'Naqd'}
                    </Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Sana:</Text>
                    <Text style={styles.paymentValue}>
                      {selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('uz-UZ') : ''}
                    </Text>
                  </View>
                  <View style={[styles.paymentRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Jami:</Text>
                    <Text style={styles.totalAmount}>
                      {selectedOrder ? parseDecimal(selectedOrder.totalSum as any).toLocaleString() : ''} so'm
                    </Text>
                  </View>
                </View>
              </View>

              {selectedOrder?.paymentMethod === 'installment' && (
                <>
                  <View style={styles.orderDetailSection}>
                    <Text style={styles.sectionTitle}>Mijoz</Text>
                    <Text style={styles.sellerName}>{selectedOrder?.customer?.fullName}</Text>
                    {!!selectedOrder?.customer?.primaryPhone && (
                      <Text style={styles.sellerPhone}>{selectedOrder.customer.primaryPhone}</Text>
                    )}
                    {!!selectedOrder?.customer?.passportSeries && (
                      <Text style={styles.sellerUsername}>{selectedOrder.customer.passportSeries}</Text>
                    )}
                  </View>

                  <View style={styles.orderDetailSection}>
                    <Text style={styles.sectionTitle}>Muddatli to'lov</Text>
                    <View style={styles.paymentDetails}>
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Davomiyligi:</Text>
                        <Text style={styles.paymentValue}>{selectedOrder?.installment?.duration} oy</Text>
                      </View>
                      <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Oylik to'lov:</Text>
                        <Text style={styles.paymentValue}>{selectedOrder?.installment ? parseDecimal(selectedOrder.installment.monthlyPayment as any).toLocaleString() : ''} so'm</Text>
                      </View>
                      {!!selectedOrder?.installment?.startDate && (
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Boshlanish:</Text>
                          <Text style={styles.paymentValue}>{new Date(selectedOrder.installment.startDate!).toLocaleDateString('uz-UZ')}</Text>
                        </View>
                      )}
                      {!!selectedOrder?.installment?.endDate && (
                        <View style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>Tugash:</Text>
                          <Text style={styles.paymentValue}>{new Date(selectedOrder.installment.endDate!).toLocaleDateString('uz-UZ')}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!!selectedOrder?.payments?.length && (
                    <View style={styles.orderDetailSection}>
                      <Text style={styles.sectionTitle}>To'lov jadvali</Text>
                      {selectedOrder.payments.map(p => (
                        <View key={p._id} style={styles.paymentRow}>
                          <Text style={styles.paymentLabel}>{p.month}-oy ({new Date(p.dueDate).toLocaleDateString('uz-UZ')}):</Text>
                          <Text style={styles.paymentValue}>{parseDecimal(p.amount as any).toLocaleString()} so'm · {p.status === 'pending' ? 'Kutilmoqda' : p.status === 'paid' ? 'To\'langan' : 'Kechiktirilgan'}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CancelModal 
        visible={showCancelModal}
        onClose={handleCancelModalClose}
        onConfirm={confirmCancelSale}
        loading={cancelLoading}
        reason={cancelReason}
        onReasonChange={handleCancelReasonChange}
      />
      
      <ConfirmationModal
        visible={showConfirmModal}
        {...confirmModalConfig}
        onCancel={() => setShowConfirmModal(false)}
        loading={loading}
      />

      <Toast 
        position='bottom'
        bottomOffset={20}
        visibilityTime={3000}
        autoHide={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  marketplaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 6,
  },
  marketplaceButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateFilterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  datePickerWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  listContent: {
    paddingBottom: 0,
  },
  orderCard: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  productCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  productsPreview: {
    marginVertical: 8,
  },
  productPreview: {
    fontSize: 14,
    color: '#666',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    maxHeight: '80%',
  },
  orderDetailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerPhone: {
    fontSize: 14,
    color: '#666',
  },
  sellerUsername: {
    fontSize: 14,
    color: '#666',
  },
  productItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  paymentDetails: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  pageButton: {
    minWidth: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activePageButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disabledPageButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#333',
  },
  activePageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  ellipsis: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  cancelModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cancelModalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  cancelModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelModalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  cancelModalButtonConfirm: {
    backgroundColor: '#FF3B30',
  },
  cancelModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelReasonContainer: {
    marginBottom: 20,
  },
  cancelReasonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cancelReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  confirmModalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});