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
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import OrderCard from '../components/OrderCard';
import OrderDetails from '../components/OrderDetails';
import Notifications from '../components/Notifications';
import NotificationBadge from '../components/NotificationBadge';
import { OrderService, MarketplaceOrder, GetOrdersParams, LocationItem } from '../services/orderService';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: GetOrdersParams) => void;
  currentFilters: GetOrdersParams;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilters
}) => {
  const [filters, setFilters] = useState<GetOrdersParams>(currentFilters);
  const [regions, setRegions] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [mfys, setMfys] = useState<LocationItem[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMfys, setLoadingMfys] = useState(false);
  const [showRegionOptions, setShowRegionOptions] = useState(false);
  const [showDistrictOptions, setShowDistrictOptions] = useState(false);
  const [showMfyOptions, setShowMfyOptions] = useState(false);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: GetOrdersParams = {};
    setFilters(resetFilters);
    setDistricts([]);
    setMfys([]);
    setShowRegionOptions(false);
    setShowDistrictOptions(false);
    setShowMfyOptions(false);
    onApply(resetFilters);
    onClose();
  };

  const closeAllDropdowns = () => {
    setShowRegionOptions(false);
    setShowDistrictOptions(false);
    setShowMfyOptions(false);
  };

  // Load regions when modal opens
  React.useEffect(() => {
    if (visible) {
      loadRegions();
    }
  }, [visible]);

  const loadRegions = async () => {
    setLoadingRegions(true);
    try {
      const response = await OrderService.getRegions();
      if (response.success) {
        setRegions(response.data);
      }
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadDistricts = async (regionId: string) => {
    setLoadingDistricts(true);
    try {
      const response = await OrderService.getDistricts(regionId);
      if (response.success) {
        setDistricts(response.data);
        setMfys([]); // Clear MFYs when region changes
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadMfys = async (districtId: string) => {
    setLoadingMfys(true);
    try {
      const response = await OrderService.getMfys(districtId);
      if (response.success) {
        setMfys(response.data);
      }
    } catch (error) {
      console.error('Error loading MFYs:', error);
    } finally {
      setLoadingMfys(false);
    }
  };

  const handleRegionChange = (regionId: string) => {
    const newFilters = { ...filters, regionId, districtId: undefined, mfyId: undefined };
    setFilters(newFilters);
    setShowRegionOptions(false);
    if (regionId) {
      loadDistricts(regionId);
    } else {
      setDistricts([]);
      setMfys([]);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    const newFilters = { ...filters, districtId, mfyId: undefined };
    setFilters(newFilters);
    setShowDistrictOptions(false);
    if (districtId) {
      loadMfys(districtId);
    } else {
      setMfys([]);
    }
  };

  const handleMfyChange = (mfyId: string) => {
    setFilters({ ...filters, mfyId });
    setShowMfyOptions(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />
          
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtrlar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Buyurtma holati</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: '', label: 'Barchasi' },
                  { value: 'pending', label: 'Kutilmoqda' },
                  { value: 'confirmed', label: 'Qabul qilingan' },
                  { value: 'processing', label: 'Tayyorlanmoqda' },
                  { value: 'shipped', label: 'Yuborilgan' },
                  { value: 'delivered', label: 'Yetkazilgan' },
                  { value: 'cancelled', label: 'Bekor qilingan' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filters.status === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, status: option.value || undefined }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.status === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>To'lov holati</Text>
              <View style={styles.filterOptions}>
                {[
                  { value: '', label: 'Barchasi' },
                  { value: 'pending', label: 'Kutilmoqda' },
                  { value: 'paid', label: 'To\'langan' },
                  { value: 'failed', label: 'Xato' },
                  { value: 'refunded', label: 'Qaytarilgan' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      filters.paymentStatus === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, paymentStatus: option.value || undefined }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.paymentStatus === option.value && styles.filterOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Manzil bo'yicha</Text>
              
              <View style={styles.locationFilterContainer}>
                {/* Region Selector */}
                <View style={styles.locationSelectorContainer}>
                  <Text style={styles.locationSelectorLabel}>Viloyat:</Text>
                  <View style={styles.selectorWrapper}>
                    {loadingRegions ? (
                      <View style={styles.selectorLoading}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.selectorLoadingText}>Yuklanmoqda...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.selector}
                        onPress={() => {
                          closeAllDropdowns();
                          setShowRegionOptions(!showRegionOptions);
                        }}
                      >
                        <Text style={[styles.selectorText, !filters.regionId && styles.selectorPlaceholder]}>
                          {filters.regionId 
                            ? regions.find(r => r._id === filters.regionId)?.name || 'Viloyat tanlang'
                            : 'Viloyat tanlang'
                          }
                        </Text>
                        <Ionicons 
                          name={showRegionOptions ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#666" 
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {regions.length > 0 && showRegionOptions && (
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        style={[styles.option, !filters.regionId && styles.optionSelected]}
                        onPress={() => handleRegionChange('')}
                      >
                        <Text style={[styles.optionText, !filters.regionId && styles.optionTextSelected]}>
                          Barchasi
                        </Text>
                      </TouchableOpacity>
                      {regions.map((region) => (
                        <TouchableOpacity
                          key={region._id}
                          style={[styles.option, filters.regionId === region._id && styles.optionSelected]}
                          onPress={() => handleRegionChange(region._id)}
                        >
                          <Text style={[styles.optionText, filters.regionId === region._id && styles.optionTextSelected]}>
                            {region.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* District Selector */}
                {filters.regionId && (
                  <View style={styles.locationSelectorContainer}>
                    <Text style={styles.locationSelectorLabel}>Tuman:</Text>
                    <View style={styles.selectorWrapper}>
                      {loadingDistricts ? (
                        <View style={styles.selectorLoading}>
                          <ActivityIndicator size="small" color="#007AFF" />
                          <Text style={styles.selectorLoadingText}>Yuklanmoqda...</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.selector}
                          onPress={() => {
                            closeAllDropdowns();
                            setShowDistrictOptions(!showDistrictOptions);
                          }}
                        >
                          <Text style={[styles.selectorText, !filters.districtId && styles.selectorPlaceholder]}>
                            {filters.districtId 
                              ? districts.find(d => d._id === filters.districtId)?.name || 'Tuman tanlang'
                              : 'Tuman tanlang'
                            }
                          </Text>
                          <Ionicons 
                            name={showDistrictOptions ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {districts.length > 0 && showDistrictOptions && (
                      <View style={styles.optionsContainer}>
                        <TouchableOpacity
                          style={[styles.option, !filters.districtId && styles.optionSelected]}
                          onPress={() => handleDistrictChange('')}
                        >
                          <Text style={[styles.optionText, !filters.districtId && styles.optionTextSelected]}>
                            Barchasi
                          </Text>
                        </TouchableOpacity>
                        {districts.map((district) => (
                          <TouchableOpacity
                            key={district._id}
                            style={[styles.option, filters.districtId === district._id && styles.optionSelected]}
                            onPress={() => handleDistrictChange(district._id)}
                          >
                            <Text style={[styles.optionText, filters.districtId === district._id && styles.optionTextSelected]}>
                              {district.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* MFY Selector */}
                {filters.districtId && (
                  <View style={styles.locationSelectorContainer}>
                    <Text style={styles.locationSelectorLabel}>MFY:</Text>
                    <View style={styles.selectorWrapper}>
                      {loadingMfys ? (
                        <View style={styles.selectorLoading}>
                          <ActivityIndicator size="small" color="#007AFF" />
                          <Text style={styles.selectorLoadingText}>Yuklanmoqda...</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.selector}
                          onPress={() => {
                            closeAllDropdowns();
                            setShowMfyOptions(!showMfyOptions);
                          }}
                        >
                          <Text style={[styles.selectorText, !filters.mfyId && styles.selectorPlaceholder]}>
                            {filters.mfyId 
                              ? mfys.find(m => m._id === filters.mfyId)?.name || 'MFY tanlang'
                              : 'MFY tanlang'
                            }
                          </Text>
                          <Ionicons 
                            name={showMfyOptions ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#666" 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {mfys.length > 0 && showMfyOptions && (
                      <View style={styles.optionsContainer}>
                        <TouchableOpacity
                          style={[styles.option, !filters.mfyId && styles.optionSelected]}
                          onPress={() => handleMfyChange('')}
                        >
                          <Text style={[styles.optionText, !filters.mfyId && styles.optionTextSelected]}>
                            Barchasi
                          </Text>
                        </TouchableOpacity>
                        {mfys.map((mfy) => (
                          <TouchableOpacity
                            key={mfy._id}
                            style={[styles.option, filters.mfyId === mfy._id && styles.optionSelected]}
                            onPress={() => handleMfyChange(mfy._id)}
                          >
                            <Text style={[styles.optionText, filters.mfyId === mfy._id && styles.optionTextSelected]}>
                              {mfy.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.filterActionButton, styles.resetButton]}
              onPress={handleReset}
            >
              <Text style={styles.resetButtonText}>Tozalash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterActionButton, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Qo'llash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MarketplaceOrdersScreen() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GetOrdersParams>({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [orderForPayment, setOrderForPayment] = useState<string | null>(null);
  const [showRejectPaymentModal, setShowRejectPaymentModal] = useState(false);
  const [rejectPaymentReason, setRejectPaymentReason] = useState('');
  const [orderToRejectPayment, setOrderToRejectPayment] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const loadOrders = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (loading && !reset) return;
    
    setLoading(true);
    try {
      const params: GetOrdersParams = {
        page,
        limit: 10,
        ...filters
      };

      console.log('=== LOADING MARKETPLACE ORDERS ===');
      console.log('Params:', params);
      console.log('Filters:', filters);
      
      // Log location filters if present
      if (filters.regionId || filters.districtId || filters.mfyId) {
        console.log('=== LOCATION FILTERS APPLIED ===');
        if (filters.regionId) console.log('Region ID filter:', filters.regionId);
        if (filters.districtId) console.log('District ID filter:', filters.districtId);
        if (filters.mfyId) console.log('MFY ID filter:', filters.mfyId);
      }

      const response = await OrderService.getOrders(params);
      
      console.log('=== MARKETPLACE ORDERS RESPONSE ===');
      console.log('Success:', response.success);
      console.log('Data:', response.data);
      console.log('Orders count:', response.data?.orders?.length || 0);
      console.log('Pagination:', response.data?.pagination);
      
      if (response.success) {
        if (reset || page === 1) {
          setOrders(response.data.orders);
        } else {
          setOrders(prev => [...prev, ...response.data.orders]);
        }
        
        setPagination(response.data.pagination);
      } else {
        console.log('Response not successful:', response);
        Toast.show({
          type: 'error',
          text1: 'Xatolik',
          text2: 'Buyurtmalarni yuklashda xatolik yuz berdi',
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'Serverga ulanishda xatolik yuz berdi',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, loading]);

  useEffect(() => {
    loadOrders(1, true);
  }, [filters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(1, true).finally(() => {
      setRefreshing(false);
      Toast.show({
        type: 'info',
        text1: 'Yangilandi',
        text2: 'Ma\'lumotlar yangilandi',
        visibilityTime: 2000,
      });
    });
  }, [loadOrders]);

  const loadMore = useCallback(() => {
    if (pagination.hasNextPage && !loading) {
      loadOrders(pagination.currentPage + 1);
    }
  }, [pagination, loading, loadOrders]);

  const handleOrderPress = (order: MarketplaceOrder) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleAcceptOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const response = await OrderService.acceptOrder(orderId);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: 'Buyurtma qabul qilindi',
        });
        
        // Refresh the orders list
        await loadOrders(1, true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'Buyurtmani qabul qilishda xatolik yuz berdi',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeliverOrder = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const response = await OrderService.markAsDelivered(orderId);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: 'Buyurtma yetkazildi deb belgilandi',
        });
        
        // Refresh the orders list
        await loadOrders(1, true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'Buyurtmani yetkazildi deb belgilashda xatolik yuz berdi',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const handleConfirmPayment = (orderId: string) => {
    setOrderForPayment(orderId);
    setShowPaymentModal(true);
  };

  const handleRejectPayment = (orderId: string) => {
    setOrderToRejectPayment(orderId);
    setShowRejectPaymentModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setActionLoading(orderToCancel);
    try {
      const response = await OrderService.cancelOrder(orderToCancel, cancelReason.trim() || 'Bekor qilish sababi kiritilmadi');
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: 'Buyurtma bekor qilindi',
        });
        
        setShowCancelModal(false);
        setCancelReason('');
        setOrderToCancel(null);
        
        // Refresh the orders list
        await loadOrders(1, true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'Buyurtmani bekor qilishda xatolik yuz berdi',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmPayment = async () => {
    if (!orderForPayment) return;
    
    setActionLoading(orderForPayment);
    try {
      const response = await OrderService.confirmPayment(orderForPayment, paymentMethod, paymentNotes);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: 'To\'lov tasdiqlandi',
        });
        
        setShowPaymentModal(false);
        setPaymentMethod('cash');
        setPaymentNotes('');
        setOrderForPayment(null);
        
        // Refresh the orders list
        await loadOrders(1, true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'To\'lovni tasdiqlashda xatolik yuz berdi',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmRejectPayment = async () => {
    if (!orderToRejectPayment) return;
    
    setActionLoading(orderToRejectPayment);
    try {
      const response = await OrderService.rejectPayment(orderToRejectPayment, rejectPaymentReason.trim() || 'To\'lov rad etildi');
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: 'To\'lov rad etildi',
        });
        
        setShowRejectPaymentModal(false);
        setRejectPaymentReason('');
        setOrderToRejectPayment(null);
        
        // Refresh the orders list
        await loadOrders(1, true);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error instanceof Error ? error.message : 'To\'lovni rad etishda xatolik yuz berdi',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const applyFilters = (newFilters: GetOrdersParams) => {
    setFilters(newFilters);
  };

  const renderOrderItem = ({ item }: { item: MarketplaceOrder }) => (
    <OrderCard
      order={item}
      onPress={() => handleOrderPress(item)}
      onAccept={() => handleAcceptOrder(item.id)}
      onDeliver={() => handleDeliverOrder(item.id)}
      onCancel={() => handleCancelOrder(item.id)}
      onConfirmPayment={() => handleConfirmPayment(item.id)}
      onRejectPayment={() => handleRejectPayment(item.id)}
      showActions={true}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Buyurtmalar mavjud emas</Text>
      <Text style={styles.emptySubtext}>
        {Object.keys(filters).length > 0 
          ? 'Filtrlar bo\'yicha buyurtma topilmadi'
          : 'Hozircha yangi buyurtmalar yo\'q'
        }
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }
    return null;
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace Buyurtmalari</Text>
        <View style={styles.headerActions}>
          <NotificationBadge onPress={() => setShowNotifications(true)} />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={24} color="#007AFF" />
            {getFilterCount() > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{getFilterCount()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContent}
      />

      <OrderDetails
        order={selectedOrder}
        visible={showDetails}
        onClose={() => setShowDetails(false)}
        onAccept={selectedOrder ? () => handleAcceptOrder(selectedOrder.id) : undefined}
        onDeliver={selectedOrder ? () => handleDeliverOrder(selectedOrder.id) : undefined}
        onCancel={selectedOrder ? () => handleCancelOrder(selectedOrder.id) : undefined}
        onConfirmPayment={selectedOrder ? () => handleConfirmPayment(selectedOrder.id) : undefined}
        onRejectPayment={selectedOrder ? () => handleRejectPayment(selectedOrder.id) : undefined}
        showActions={true}
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={applyFilters}
        currentFilters={filters}
      />

      {/* Cancel Order Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContent}>
            <Text style={styles.cancelModalTitle}>Buyurtmani bekor qilish</Text>
            
            <View style={styles.cancelReasonContainer}>
              <Text style={styles.cancelReasonLabel}>Bekor qilish sababi:</Text>
              <TextInput
                style={styles.cancelReasonInput}
                value={cancelReason}
                onChangeText={setCancelReason}
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
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setOrderToCancel(null);
                }}
                disabled={actionLoading === orderToCancel}
              >
                <Text style={[styles.cancelModalButtonText, { color: '#666' }]}>Yo'q</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cancelModalButton, 
                  styles.cancelModalButtonConfirm,
                  actionLoading === orderToCancel && styles.disabledButton
                ]}
                onPress={confirmCancelOrder}
                disabled={actionLoading === orderToCancel}
              >
                {actionLoading === orderToCancel ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.cancelModalButtonText}>Ha</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.paymentModalTitle}>To'lovni tasdiqlash</Text>
            
            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodLabel}>To'lov usuli:</Text>
              <View style={styles.paymentMethodOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'cash' && styles.paymentMethodOptionActive
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Text style={[
                    styles.paymentMethodOptionText,
                    paymentMethod === 'cash' && styles.paymentMethodOptionTextActive
                  ]}>
                    Naqd
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodOption,
                    paymentMethod === 'card' && styles.paymentMethodOptionActive
                  ]}
                  onPress={() => setPaymentMethod('card')}
                >
                  <Text style={[
                    styles.paymentMethodOptionText,
                    paymentMethod === 'card' && styles.paymentMethodOptionTextActive
                  ]}>
                    Karta
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paymentNotesContainer}>
              <Text style={styles.paymentNotesLabel}>Izoh (ixtiyoriy):</Text>
              <TextInput
                style={styles.paymentNotesInput}
                value={paymentNotes}
                onChangeText={setPaymentNotes}
                placeholder="To'lov haqida qo'shimcha ma'lumot"
                multiline
                numberOfLines={2}
                maxLength={200}
              />
            </View>

            <View style={styles.paymentModalButtons}>
              <TouchableOpacity
                style={[styles.paymentModalButton, styles.paymentModalButtonCancel]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('cash');
                  setPaymentNotes('');
                  setOrderForPayment(null);
                }}
                disabled={actionLoading === orderForPayment}
              >
                <Text style={[styles.paymentModalButtonText, { color: '#666' }]}>Bekor qilish</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentModalButton, 
                  styles.paymentModalButtonConfirm,
                  actionLoading === orderForPayment && styles.disabledButton
                ]}
                onPress={confirmPayment}
                disabled={actionLoading === orderForPayment}
              >
                {actionLoading === orderForPayment ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.paymentModalButtonText}>Tasdiqlash</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Payment Modal */}
      <Modal
        visible={showRejectPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRejectPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cancelModalContent}>
            <Text style={styles.cancelModalTitle}>To'lovni rad etish</Text>
            
            <View style={styles.cancelReasonContainer}>
              <Text style={styles.cancelReasonLabel}>Rad etish sababi:</Text>
              <TextInput
                style={styles.cancelReasonInput}
                value={rejectPaymentReason}
                onChangeText={setRejectPaymentReason}
                placeholder="Sababni kiriting"
                multiline
                numberOfLines={3}
                maxLength={200}
                autoFocus
              />
            </View>

            <View style={styles.cancelModalButtons}>
              <TouchableOpacity
                style={[styles.cancelModalButton, styles.cancelModalButtonCancel]}
                onPress={() => {
                  setShowRejectPaymentModal(false);
                  setRejectPaymentReason('');
                  setOrderToRejectPayment(null);
                }}
                disabled={actionLoading === orderToRejectPayment}
              >
                <Text style={[styles.cancelModalButtonText, { color: '#666' }]}>Yo'q</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cancelModalButton, 
                  styles.cancelModalButtonConfirm,
                  actionLoading === orderToRejectPayment && styles.disabledButton
                ]}
                onPress={confirmRejectPayment}
                disabled={actionLoading === orderToRejectPayment}
              >
                {actionLoading === orderToRejectPayment ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.cancelModalButtonText}>Rad etish</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Notifications
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    position: 'relative',
    padding: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flex: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  locationFilterContainer: {
    gap: 16,
  },
  locationSelectorContainer: {
    gap: 8,
  },
  locationSelectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectorWrapper: {
    position: 'relative',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectorText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
  selectorLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    gap: 8,
  },
  selectorLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionSelected: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
    backgroundColor: '#fff',
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
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
    marginBottom: 20,
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
  paymentModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  paymentMethodOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  paymentMethodOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  paymentMethodOptionTextActive: {
    color: 'white',
  },
  paymentNotesContainer: {
    marginBottom: 20,
  },
  paymentNotesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  paymentNotesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  paymentModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  paymentModalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  paymentModalButtonConfirm: {
    backgroundColor: '#34C759',
  },
  paymentModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
