import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { LocationPicker } from '../components/LocationPicker';
import { NotificationModal } from '../components/NotificationModal';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { apiService, Product, UserLocation } from '../services/api';

export default function HomeScreen() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [trendProducts, setTrendProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const { user, showLocationModal, setShowLocationModal } = useAuth();
  const { userLocation, updateLocation } = useLocation();
  const { unreadCount } = useNotification();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  // Reload data when location changes
  useEffect(() => {
    if (userLocation) {
      loadData();
    }
  }, [userLocation]);

  // Show location modal if needed
  useEffect(() => {
    if (showLocationModal) {
      setLocationPickerVisible(true);
    }
  }, [showLocationModal]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadNewProducts(),
        loadTrendProducts(),
        loadAllProducts()
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNewProducts = async () => {
    try {
      const response = await apiService.getNewProducts({ limit: 10 });
      if (response.success && response.data) {
        const filteredProducts = filterProductsByRegion(response.data.products);
        setNewProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Failed to load new products:', error);
    }
  };

  const loadTrendProducts = async () => {
    try {
      const response = await apiService.getTrendProducts({ limit: 10 });
      if (response.success && response.data) {
        const filteredProducts = filterProductsByRegion(response.data.products);
        setTrendProducts(filteredProducts);
      }
    } catch (error) {
      console.error('Failed to load trend products:', error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await apiService.getProducts({ limit: 10 });
      if (response.success && response.data) {
        const filteredProducts = filterProductsByRegion(response.data.products);
        setAllProducts(filteredProducts);
        console.log('Filtered products:', filteredProducts);
      }
    } catch (error) {
      console.error('Failed to load all products:', error);
    }
  };

  // Filter products by user's region
  const filterProductsByRegion = (products: Product[]): Product[] => {
    if (!userLocation?.region) {
      return products; // Show all products if no location is set
    }

    return products.filter(product => {
      // Check if product has delivery regions and if user's region is included
      if (product.deliveryRegions && product.deliveryRegions.length > 0) {
        return product.deliveryRegions.some(region => 
          region.id === userLocation.region._id
        );
      }
      return true; // Show product if no delivery regions specified
    });
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleViewAllProducts = () => {
    router.push('/(tabs)/products');
  };

  const handleViewAllNewProducts = () => {
    router.push('/(tabs)/products?filter=new');
  };

  const handleViewAllTrendProducts = () => {
    router.push('/(tabs)/products?filter=trend');
  };

  const handleLocationSelect = async (location: UserLocation) => {
    try {
      await updateLocation(location);
      setLocationPickerVisible(false);
      setShowLocationModal(false);
      // Refresh data with new location
      await loadData();
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const formatLocationString = (location: UserLocation | null): string => {
    if (!location) return 'Hudud tanlang';
    
    const parts = [];
    if (location.region) parts.push(location.region.name);
    if (location.district) parts.push(location.district.name);
    if (location.mfy) parts.push(location.mfy.name);
    
    return parts.join(', ');
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => handleProductPress(item)}
      showAddToCart={true}
      compact={true}
    />
  );

  const renderSectionHeader = (title: string, onPress?: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.viewAllText}>Barchasini ko'rish</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Modern Header with Gradient */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                {user ? `Xush kelibsiz, ${user.firstName}!` : 'Xush kelibsiz!'}
              </Text>
              <Text style={styles.subtitleText}>
                Eng yaxshi mahsulotlarni toping va buyurtma bering
              </Text>
              
              {/* Location Display */}
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={() => setLocationPickerVisible(true)}
              >
                <Ionicons name="location-outline" size={16} color="#E3F2FD" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {formatLocationString(userLocation)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#E3F2FD" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications" size={20} color="#007AFF" />
              {(unreadCount || 0) > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {(unreadCount || 0) > 99 ? '99+' : (unreadCount || 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>


        {/* New Products Section */}
        {newProducts && newProducts.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('🆕 Yangi Mahsulotlar', handleViewAllNewProducts)}
            <FlatList
              data={newProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          </View>
        )}

        {/* Trend Products Section */}
        {trendProducts && trendProducts.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('🔥 Trend Mahsulotlar', handleViewAllTrendProducts)}
            <FlatList
              data={trendProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          </View>
        )}

        {/* All Products Section */}
        {allProducts && allProducts.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('🛍️ Barcha Mahsulotlar', handleViewAllProducts)}
            <FlatList
              data={allProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
            />
          </View>
        )}

        {/* Empty State */}
        {(!newProducts || newProducts.length === 0) && (!trendProducts || trendProducts.length === 0) && (!allProducts || allProducts.length === 0) && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bag-outline" size={64} color="#8E8E93" />
            </View>
            <Text style={styles.emptyTitle}>Hali mahsulot yo'q</Text>
            <Text style={styles.emptySubtitle}>
              Tez orada yangi mahsulotlar qo'shiladi. Kuting!
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.refreshButtonText}>Qayta yuklash</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location Picker Modal */}
        <LocationPicker
          visible={locationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          onSelect={handleLocationSelect}
          currentLocation={userLocation || undefined}
        />

        {/* Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#E3F2FD',
    lineHeight: 22,
    opacity: 0.9,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    maxWidth: '90%',
  },
  locationText: {
    fontSize: 14,
    color: '#E3F2FD',
    marginHorizontal: 6,
    flex: 1,
    fontWeight: '500',
  },
  notificationButton: {
    backgroundColor: '#FFFFFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginTop: -15,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },

  productsList: {
    paddingHorizontal: 4,
  },
  productCard: {
    width: 160,
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
    marginTop: 40,
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
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
