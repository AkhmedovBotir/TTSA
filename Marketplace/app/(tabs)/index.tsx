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
    View,
} from 'react-native';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Product } from '../services/api';

export default function HomeScreen() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await loadNewProducts();
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
        setNewProducts(response.data.products);
      }
    } catch (error) {
      console.error('Failed to load new products:', error);
    }
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/products');
  };

  const handleViewAllProducts = () => {
    router.push('/(tabs)/products');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              {user ? `Xush kelibs, ${user.firstName}!` : 'Xush kelibs!'}
            </Text>
            <Text style={styles.subtitleText}>
              Eng yaxshi mahsulotlarni toping va buyurtma bering
            </Text>
          </View>
          
          <TouchableOpacity style={styles.searchButton} onPress={handleSearchPress}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* New Products Section */}
        {newProducts.length > 0 && (
          <View style={styles.section}>
            {renderSectionHeader('Yangi mahsulotlar', handleViewAllProducts)}
            <FlatList
              data={newProducts}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        )}

        {/* Empty State */}
        {newProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={64} color="#8E8E93" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Hali mahsulot yo'q</Text>
            <Text style={styles.emptySubtitle}>
              Tez orada yangi mahsulotlar qo'shiladi. Kuting!
            </Text>
          </View>
        )}
      </ScrollView>
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
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },

  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  viewAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  productsList: {
    paddingHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
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
  },
});
