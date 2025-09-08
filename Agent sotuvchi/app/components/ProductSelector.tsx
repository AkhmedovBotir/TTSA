import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";

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

  useEffect(() => {
    if (visible) {
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

      const url = new URL('https://api.ttsa.uz/api/seller-mobile/products');
      url.searchParams.append('page', page.toString());
      if (search) {
        url.searchParams.append('search', search);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // API response da products array bor
        const productsData = Array.isArray(data.products) ? data.products : [];
        
        setProducts(prev => reset ? productsData : [...prev, ...productsData]);
        
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
      if (reset) {
        setProducts([]);
      }
      console.error('Error loading products:', error);
      Alert.alert('Xato', 'Mahsulotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && pagination.hasMore) {
      const nextPage = pagination.page + 1;
      setPagination(prev => ({ ...prev, page: nextPage }));
      loadProducts(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // API response da to'g'ridan-to'g'ri product ma'lumotlari keladi
    const product = item;
    
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
      type: 'product'
    };

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => onSelect(extendedProduct)}
      >
        <View style={styles.productContent}>
          {product.image ? (
            <Image source={{ uri: `https://api.ttsa.uz/uploads/products/${product.image}` }} style={styles.productImage} />
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
        </View>

        {loading && pagination.page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E88E5" />
          </View>
        ) : (
          <FlatList
            data={products}
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
});