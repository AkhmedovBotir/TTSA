import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { getApiUrl, getUploadUrl, API_CONFIG } from '../config/api';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  image: string | null;
}

interface AssignedProduct {
  id: string;
  product: Product;
  assignedBy: {
    _id: string;
    phone: string;
  };
  assignedQuantity: number;
  remainingQuantity: number;
  assignedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface FilterOptions {
  categories: string[];
  subcategories: string[];
  shops: string[];
  deliveryRegions: string[];
  priceRange: {
    min: number;
    max: number;
  };
  sortBy: 'name' | 'price' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

type ExtendedProduct = {
  _id: string;
  id: string;
  name: string;
  price: number;
  category: { _id: string; name: string };
  subcategory: string;
  quantity: number;
  status: string;
  createdAt: string;
  createdBy: string;
  createdByModel: string;
  unit: string;
  unitSize: number;
  inventory: number;
  type: string;
  image?: string;
}

interface ProductSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: ExtendedProduct) => void;
}

interface PaginationState {
  page: number;
  total: number;
  pages: number;
  limit: number;
  hasMore: boolean;
}

export default function ProductSelector({ visible, onClose, onSelect }: ProductSelectorProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    total: 0,
    pages: 1,
    limit: 20,
    hasMore: false,
  });
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    subcategories: [],
    shops: [],
    deliveryRegions: [],
    priceRange: { min: 0, max: 1000000 },
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [availableShops, setAvailableShops] = useState<string[]>([]);
  const [availableDeliveryRegions, setAvailableDeliveryRegions] = useState<string[]>([]);

  // Extract unique categories, subcategories, shops and delivery regions from products
  const extractFilterOptions = (products: any[]) => {
    const categories = new Set<string>();
    const subcategories = new Set<string>();
    const shops = new Set<string>();
    const deliveryRegions = new Set<string>();
    
    products.forEach(product => {
      if (product.category?.name) {
        categories.add(product.category.name);
      }
      if (product.subcategory?.name) {
        subcategories.add(product.subcategory.name);
      }
      if (product.shop?.name) {
        shops.add(product.shop.name);
      }
      if (product.deliveryRegions && Array.isArray(product.deliveryRegions)) {
        product.deliveryRegions.forEach((region: any) => {
          if (region.name) {
            deliveryRegions.add(region.name);
          }
        });
      }
    });
    
    setAvailableCategories(Array.from(categories));
    setAvailableSubcategories(Array.from(subcategories));
    setAvailableShops(Array.from(shops));
    setAvailableDeliveryRegions(Array.from(deliveryRegions));
  };

  // Apply filters to products
  const applyFilters = (products: any[]) => {
    return products.filter(product => {
      // Category filter
      if (filters.categories.length > 0 && product.category?.name) {
        if (!filters.categories.includes(product.category.name)) {
          return false;
        }
      }
      
      // Subcategory filter
      if (filters.subcategories.length > 0 && product.subcategory?.name) {
        if (!filters.subcategories.includes(product.subcategory.name)) {
          return false;
        }
      }
      
      // Shop filter
      if (filters.shops.length > 0 && product.shop?.name) {
        if (!filters.shops.includes(product.shop.name)) {
          return false;
        }
      }
      
      // Delivery regions filter
      if (filters.deliveryRegions.length > 0 && product.deliveryRegions && Array.isArray(product.deliveryRegions)) {
        const hasMatchingRegion = product.deliveryRegions.some((region: any) => 
          region.name && filters.deliveryRegions.includes(region.name)
        );
        if (!hasMatchingRegion) {
          return false;
        }
      }
      
      // Price range filter
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  useEffect(() => {
    if (visible) {
      console.log('=== PRODUCT SELECTOR MODAL OPENED ===');
      console.log('Modal visible:', visible);
      console.log('Loading products for first time...');
      console.log('=====================================');
      
      // Reset products and load first page when modal becomes visible
      setProducts([]);
      setPagination(prev => ({ ...prev, page: 1 }));
      loadProducts(1, true);
    }
  }, [visible]);

  useEffect(() => {
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('=== PRODUCT SEARCH TRIGGERED ===');
      console.log('Search term:', search);
      console.log('Clearing products and loading with search...');
      console.log('==================================');
      
      setProducts([]);
      setPagination(prev => ({ ...prev, page: 1 }));
      loadProducts(1, true);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [search]);

  const loadProducts = async (page: number, reset: boolean = false) => {
    if (page > pagination.pages && !reset) return;
    
    const loadingState = page > 1 ? setLoadingMore : setLoading;
    loadingState(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.SELLER_PRODUCTS));
      url.searchParams.append('page', page.toString());
      if (search) {
        url.searchParams.append('search', search);
      }

      console.log('=== PRODUCTS GET REQUEST DEBUG ===');
      console.log('URL:', url.toString());
      console.log('Method: GET');
      console.log('Page:', page);
      console.log('Search:', search || 'None');
      console.log('Reset:', reset);
      console.log('Token exists:', !!token);
      console.log('===============================');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('=== PRODUCTS RESPONSE DEBUG ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('===============================');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('=== PRODUCTS DATA DEBUG ===');
      console.log('Success:', data.success);
      console.log('Products count:', data.products?.length || 0);
      console.log('Total count:', data.count || 0);
      console.log('Products data:', data.products);
      console.log('===============================');
      
      if (data.success) {
        // API response da products array bor
        const productsData = Array.isArray(data.products) ? data.products : [];
        
        const allProducts = reset ? productsData : [...products, ...productsData];
        setProducts(allProducts);
        
        // Extract filter options from products
        extractFilterOptions(allProducts);
        
        // Pagination count dan hisoblanadi
        const total = data.count || 0;
        const currentPage = page;
        const limit = 20; // Fixed limit
        const pages = Math.ceil(total / limit);
        
        const updatedPagination: PaginationState = {
          page: currentPage,
          total: total,
          pages: pages,
          limit: limit,
          hasMore: currentPage < pages
        };
        setPagination(updatedPagination);
      } else {
        throw new Error(data.message || 'Failed to load products');
      }
    } catch (error) {
      console.log('=== PRODUCTS ERROR DEBUG ===');
      console.error('Error loading products:', error);
      console.log('Error type:', typeof error);
      console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.log('===============================');
      
      if (reset) {
        setProducts([]);
      }
      Alert.alert('Xato', 'Mahsulotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && pagination.hasMore) {
      const nextPage = pagination.page + 1;
      console.log('=== LOAD MORE PRODUCTS ===');
      console.log('Current page:', pagination.page);
      console.log('Next page:', nextPage);
      console.log('Has more:', pagination.hasMore);
      console.log('==========================');
      
      setPagination(prev => ({ ...prev, page: nextPage }));
      loadProducts(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // API response da to'g'ridan-to'g'ri product ma'lumotlari keladi
    const product = item;
    
    console.log('=== PRODUCT RENDER DEBUG ===');
    console.log('Product:', product);
    console.log('Product image:', product.image);
    console.log('Image URL:', product.image ? getUploadUrl(product.image) : 'No image');
    console.log('============================');
    
    // Create extended product with all required fields
    const extendedProduct: ExtendedProduct = {
      _id: product.id || '',
      id: product.id || '',
      name: product.name || 'Nomsiz mahsulot',
      price: product.price || 0,
      category: {
        _id: product.category?.id || 'unknown',
        name: product.category?.name || 'Kategoriya'
      },
      subcategory: product.subcategory?.name || '',
      quantity: product.quantity || 0,
      status: product.status || 'active',
      createdAt: product.createdAt || new Date().toISOString(),
      createdBy: 'unknown',
      createdByModel: 'User',
      unit: product.unit || 'dona',
      unitSize: product.unitSize || 1,
      inventory: product.quantity || 0,
      type: 'product',
      image: product.image || undefined
    };

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => {
          console.log('=== PRODUCT SELECTED FROM SELECTOR ===');
          console.log('Extended product:', extendedProduct);
          console.log('Product image in extended:', extendedProduct.image);
          console.log('Original product image:', product.image);
          console.log('=======================================');
          onSelect(extendedProduct);
        }}
      >
        <View style={styles.productContent}>
          {product.image ? (
            <Image source={{ uri: getUploadUrl(product.image) }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name || 'Nomsiz mahsulot'}
            </Text>
            <Text style={styles.productPrice}>
              {(product.price || 0).toLocaleString()} UZS
            </Text>
            <Text style={styles.stockText}>
              Qoldiq: {product.quantity || 0} dona
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#1E88E5" />
      </View>
    );
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== '') {
        loadProducts(1, true);
      } else {
        loadProducts(1, true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (text: string) => {
    setSearch(text);
  };

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mahsulot tanlang</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Qidirish..."
            value={search}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => setShowFilterModal(true)} 
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={20} color="#1E88E5" />
          </TouchableOpacity>
        </View>

        {loading && pagination.page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : (
          <FlatList
            data={applyFilters(products)}
            renderItem={renderItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {search ? 'Hech qanday natija topilmadi' : 'Mahsulotlar topilmadi'}
                </Text>
              </View>
            }
            onEndReached={() => {
              if (!loadingMore && pagination.hasMore) {
                loadProducts(pagination.page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filter</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Categories Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Kategoriyalar</Text>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.filterOption,
                      filters.categories.includes(category) && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        categories: prev.categories.includes(category)
                          ? prev.categories.filter(c => c !== category)
                          : [...prev.categories, category]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.categories.includes(category) && styles.filterOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                    {filters.categories.includes(category) && (
                      <Ionicons name="checkmark" size={16} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subcategories Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Subkategoriyalar</Text>
                {availableSubcategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory}
                    style={[
                      styles.filterOption,
                      filters.subcategories.includes(subcategory) && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        subcategories: prev.subcategories.includes(subcategory)
                          ? prev.subcategories.filter(c => c !== subcategory)
                          : [...prev.subcategories, subcategory]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.subcategories.includes(subcategory) && styles.filterOptionTextSelected
                    ]}>
                      {subcategory}
                    </Text>
                    {filters.subcategories.includes(subcategory) && (
                      <Ionicons name="checkmark" size={16} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Shops Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Do'konlar</Text>
                {availableShops.map((shop) => (
                  <TouchableOpacity
                    key={shop}
                    style={[
                      styles.filterOption,
                      filters.shops.includes(shop) && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        shops: prev.shops.includes(shop)
                          ? prev.shops.filter(s => s !== shop)
                          : [...prev.shops, shop]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.shops.includes(shop) && styles.filterOptionTextSelected
                    ]}>
                      {shop}
                    </Text>
                    {filters.shops.includes(shop) && (
                      <Ionicons name="checkmark" size={16} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Delivery Regions Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Yetkazib berish joylari</Text>
                {availableDeliveryRegions.map((region) => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.filterOption,
                      filters.deliveryRegions.includes(region) && styles.filterOptionSelected
                    ]}
                    onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        deliveryRegions: prev.deliveryRegions.includes(region)
                          ? prev.deliveryRegions.filter(r => r !== region)
                          : [...prev.deliveryRegions, region]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.deliveryRegions.includes(region) && styles.filterOptionTextSelected
                    ]}>
                      {region}
                    </Text>
                    {filters.deliveryRegions.includes(region) && (
                      <Ionicons name="checkmark" size={16} color="#1E88E5" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Narx oralig'i</Text>
                <View style={styles.priceRangeContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    value={filters.priceRange.min.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 0;
                      setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, min: value }
                      }));
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.priceRangeText}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    value={filters.priceRange.max.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text) || 1000000;
                      setFilters(prev => ({
                        ...prev,
                        priceRange: { ...prev.priceRange, max: value }
                      }));
                    }}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Saralash</Text>
                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>Saralash turi:</Text>
                  <View style={styles.sortOptions}>
                    {['name', 'price', 'createdAt'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.sortOption,
                          filters.sortBy === option && styles.sortOptionSelected
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, sortBy: option as any }))}
                      >
                        <Text style={[
                          styles.sortOptionText,
                          filters.sortBy === option && styles.sortOptionTextSelected
                        ]}>
                          {option === 'name' ? 'Nomi' : option === 'price' ? 'Narxi' : 'Sana'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>Tartib:</Text>
                  <View style={styles.sortOptions}>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        filters.sortOrder === 'asc' && styles.sortOptionSelected
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                    >
                      <Text style={[
                        styles.sortOptionText,
                        filters.sortOrder === 'asc' && styles.sortOptionTextSelected
                      ]}>
                        O'sish
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        filters.sortOrder === 'desc' && styles.sortOptionSelected
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                    >
                      <Text style={[
                        styles.sortOptionText,
                        filters.sortOrder === 'desc' && styles.sortOptionTextSelected
                      ]}>
                        Kamayish
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setFilters({
                    categories: [],
                    subcategories: [],
                    shops: [],
                    deliveryRegions: [],
                    priceRange: { min: 0, max: 1000000 },
                    sortBy: 'name',
                    sortOrder: 'asc'
                  });
                }}
              >
                <Text style={styles.clearFiltersText}>Tozalash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFiltersText}>Qo'llash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 10,
  },
  listContent: {
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItem: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 15,
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 15,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  stockText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingMore: {
    marginVertical: 20,
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
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
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1E88E5',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#1E88E5',
    fontWeight: '500',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    fontSize: 14,
  },
  priceRangeText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 8,
  },
  sortContainer: {
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sortOptionSelected: {
    backgroundColor: '#1E88E5',
    borderColor: '#1E88E5',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#333',
  },
  sortOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearFiltersButton: {
    flex: 1,
    padding: 16,
    marginRight: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  applyFiltersButton: {
    flex: 1,
    padding: 16,
    marginLeft: 8,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});