import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { useLocation } from '../contexts/LocationContext';
import { apiService, Product } from '../services/api';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [shops, setShops] = useState<Array<{id: string, name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // 'grid' = card ko'rinish, 'list' = ro'yxat ko'rinish
  const { userLocation } = useLocation();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
    loadShops();
  }, []);

  // Reload products when shop or category selection changes
  useEffect(() => {
    if (currentPage === 1) {
      loadProducts(1, true);
    }
  }, [selectedShop, selectedCategory]);

  const loadShops = async () => {
    try {
      // Extract unique shops from products
      const response = await apiService.getProducts({ limit: 1000 });
      if (response.success && response.data) {
        const uniqueShops = response.data.products.reduce((acc: Array<{id: string, name: string}>, product) => {
          const shopObj = product && product.shop ? product.shop : null;
          if (!shopObj || !shopObj.id || !shopObj.name) {
            return acc;
          }
          const existingShop = acc.find(shop => shop.id === shopObj.id);
          if (!existingShop) {
            acc.push({ id: shopObj.id, name: shopObj.name });
          }
          return acc;
        }, []);
        setShops(uniqueShops);
      }
    } catch (error) {
      console.error('Failed to load shops:', error);
    }
  };

  const loadCategories = async (shopId: string) => {
    try {
      const response = await apiService.getProducts({ shop: shopId, limit: 1000 });
      if (response.success && response.data) {
        const uniqueCategories = response.data.products.reduce((acc: Array<{id: string, name: string}>, product) => {
          const categoryObj = product && product.category ? product.category : null;
          if (!categoryObj || !categoryObj.id || !categoryObj.name) {
            return acc;
          }
          const existingCategory = acc.find(cat => cat.id === categoryObj.id);
          if (!existingCategory) {
            acc.push({ id: categoryObj.id, name: categoryObj.name });
          }
          return acc;
        }, []);
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async (page = 1, refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (page === 1) {
        setIsLoading(true);
      }

      const response = await apiService.getProducts({
        page,
        limit: 20,
        search: searchQuery.trim() || undefined,
        shop: selectedShop || undefined,
        category: selectedCategory || undefined,
      });

      if (response.success && response.data) {
        const filteredProducts = filterProductsByRegion(response.data.products);
        
        if (refresh || page === 1) {
          setProducts(filteredProducts);
        } else {
          setProducts(prev => [...prev, ...filteredProducts]);
        }
        
        setHasMore(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  const handleRefresh = () => {
    loadProducts(1, true);
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadProducts(currentPage + 1);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts(1, true);
  };

  const handleShopSelect = (shopId: string) => {
    if (selectedShop === shopId) {
      setSelectedShop(''); // Clear selection if same shop is selected
      setSelectedCategory(''); // Clear category selection
      setCategories([]); // Clear categories
    } else {
      setSelectedShop(shopId);
      setSelectedCategory(''); // Clear category selection
      loadCategories(shopId); // Load categories for selected shop
    }
    setShowShopDropdown(false); // Close dropdown
    setCurrentPage(1);
    loadProducts(1, true);
  };

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(''); // Clear selection if same category is selected
    } else {
      setSelectedCategory(categoryId);
    }
    setShowCategoryDropdown(false); // Close dropdown
    setCurrentPage(1);
    loadProducts(1, true);
  };

  const openFilterModal = () => {
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
    setShowShopDropdown(false);
    setShowCategoryDropdown(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedShop('');
    setSelectedCategory('');
    setCategories([]);
    setShowShopDropdown(false);
    setShowCategoryDropdown(false);
    setCurrentPage(1);
    loadProducts(1, true);
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        showAddToCart={true}
        compact={viewMode === 'grid'}
      />
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Barcha mahsulotlar ko'rsatildi</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {searchQuery.trim() ? `Qidiruv natijalari: "${searchQuery}"` : 'Mahsulotlar'}
        </Text>
        {products.length > 0 && (
          <Text style={styles.resultsCount}>
            {products.length} ta natija topildi
          </Text>
        )}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Mahsulotlarni qidirish..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton} 
            onPress={openFilterModal}
          >
            <Ionicons name="filter" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewModeButton} 
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={20} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtrlar</Text>
              <TouchableOpacity onPress={closeFilterModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Filter Content */}
            <View style={styles.modalBody}>
              {/* Shop Selector */}
              <View style={styles.modalFilterItem}>
                <Text style={styles.modalFilterLabel}>Do'kon tanlang:</Text>
                <View style={styles.modalDropdownContainer}>
                  <TouchableOpacity
                    style={styles.modalDropdownButton}
                    onPress={() => setShowShopDropdown(!showShopDropdown)}
                  >
                    <Text style={[
                      styles.modalDropdownButtonText,
                      !selectedShop && styles.modalDropdownButtonTextActive
                    ]}>
                      {selectedShop ? shops.find(s => s.id === selectedShop)?.name || 'Do\'kon tanlang' : 'Barcha do\'konlar'}
                    </Text>
                    <Ionicons 
                      name={showShopDropdown ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#8E8E93" 
                    />
                  </TouchableOpacity>
                  
                  {/* Shop Options */}
                  {showShopDropdown && (
                    <View style={styles.modalDropdownOptions}>
                      {/* All shops option */}
                      <TouchableOpacity
                        style={[
                          styles.modalDropdownOption,
                          !selectedShop && styles.modalDropdownOptionActive
                        ]}
                        onPress={() => handleShopSelect('')}
                      >
                        <Text style={[
                          styles.modalDropdownOptionText,
                          !selectedShop && styles.modalDropdownOptionTextActive
                        ]}>
                          Barcha do'konlar
                        </Text>
                      </TouchableOpacity>
                      
                      {/* Individual shops */}
                      {(shopSearchQuery.trim() 
                        ? shops.filter(shop => 
                            shop.name.toLowerCase().includes(shopSearchQuery.toLowerCase())
                          )
                        : shops
                      ).map((shop) => (
                        <TouchableOpacity
                          key={shop.id}
                          style={[
                            styles.modalDropdownOption,
                            selectedShop === shop.id && styles.modalDropdownOptionActive
                          ]}
                          onPress={() => handleShopSelect(shop.id)}
                        >
                          <Text style={[
                            styles.modalDropdownOptionText,
                            selectedShop === shop.id && styles.modalDropdownOptionTextActive
                          ]}>
                            {shop.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Category Selector (only when shop is selected) */}
              {selectedShop && categories.length > 0 && (
                <View style={styles.modalFilterItem}>
                  <Text style={styles.modalFilterLabel}>Kategoriya tanlang:</Text>
                  <View style={styles.modalDropdownContainer}>
                    <TouchableOpacity
                      style={styles.modalDropdownButton}
                      onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                      <Text style={[
                        styles.modalDropdownButtonText,
                        !selectedCategory && styles.modalDropdownButtonTextActive
                      ]}>
                        {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name || 'Kategoriya tanlang' : 'Barcha kategoriyalar'}
                      </Text>
                      <Ionicons 
                        name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#8E8E93" 
                      />
                    </TouchableOpacity>
                    
                    {/* Category Options */}
                    {showCategoryDropdown && (
                      <View style={styles.modalDropdownOptions}>
                        {/* All categories option */}
                        <TouchableOpacity
                          style={[
                            styles.modalDropdownOption,
                            !selectedCategory && styles.modalDropdownOptionActive
                          ]}
                          onPress={() => handleCategorySelect('')}
                        >
                          <Text style={[
                            styles.modalDropdownOptionText,
                            !selectedCategory && styles.modalDropdownOptionTextActive
                          ]}>
                            Barcha kategoriyalar
                          </Text>
                        </TouchableOpacity>
                        
                        {/* Individual categories */}
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.modalDropdownOption,
                              selectedCategory === category.id && styles.modalDropdownOptionActive
                            ]}
                            onPress={() => handleCategorySelect(category.id)}
                          >
                            <Text style={[
                              styles.modalDropdownOptionText,
                              selectedCategory === category.id && styles.modalDropdownOptionTextActive
                            ]}>
                              {category.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Shop Search (if many shops) */}
              {shops.length > 10 && (
                <View style={styles.modalFilterItem}>
                  <Text style={styles.modalFilterLabel}>Do'konlarni qidirish:</Text>
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Do'kon nomini kiriting..."
                    value={shopSearchQuery}
                    onChangeText={setShopSearchQuery}
                  />
                </View>
              )}
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalClearButton} 
                onPress={clearFilters}
              >
                <Text style={styles.modalClearButtonText}>Tozalash</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalApplyButton} 
                onPress={closeFilterModal}
              >
                <Text style={styles.modalApplyButtonText}>Qo'llash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        key={viewMode} // Bu numColumns o'zgarishida FlatList ni qayta render qiladi
        style={styles.productsList}
        contentContainerStyle={[
          styles.productsContainer,
          viewMode === 'grid' && styles.gridContainer
        ]}
        numColumns={viewMode === 'grid' ? 2 : 1}
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
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  viewModeButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // Filter Styles
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  filterItemsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-end',
  },
  filterItem: {
    flex: 1,
    minWidth: 120,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  shopSearchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dropdownButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  dropdownOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    padding: 20,
  },
  gridContainer: {
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalFilterItem: {
    marginBottom: 20,
  },
  modalFilterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  modalDropdownContainer: {
    position: 'relative',
  },
  modalDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalDropdownButtonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalDropdownButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalDropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalDropdownOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  modalDropdownOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  modalDropdownOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSearchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalClearButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalClearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
