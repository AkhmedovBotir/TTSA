import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../components/Button';
import { useCart } from '../contexts/CartContext';
import { apiService, Product } from '../services/api';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isLoading: cartLoading } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProduct(id);
      if (response.success && response.data) {
        setProduct(response.data);
      } else {
        Alert.alert('Xato', 'Mahsulot topilmadi');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Xato', 'Mahsulot yuklanmadi');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      const success = await addToCart(product.id, quantity);
      if (success) {
        Alert.alert('Muvaffaqiyatli', 'Mahsulot savatchaga qo\'shildi');
      } else {
        Alert.alert('Xato', 'Mahsulotni qo\'shishda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Mahsulotni qo\'shishda xatolik yuz berdi');
    }
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
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Mahsulot yuklanmoqda...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mahsulot topilmadi</Text>
        <Button title="Orqaga qaytish" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mahsulot</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: 'http://192.168.100.159:3000/uploads/products/' + product.image }} style={styles.image} />
          {product.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </View>
          )}
          {!product.inStock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Tugagan</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          
          <Text style={styles.category}>
            {product.category.name} • {product.subcategory.name}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Miqdori:</Text>
              <Text style={styles.detailValue}>
                {product.quantity} {product.unit}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>O'lchami:</Text>
              <Text style={styles.detailValue}>{product.unitSize}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Holati:</Text>
              <Text style={[styles.detailValue, { color: product.inStock ? '#34C759' : '#FF3B30' }]}>
                {product.inStock ? 'Mavjud' : 'Tugagan'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Qo'shilgan:</Text>
              <Text style={styles.detailValue}>{formatDate(product.createdAt)}</Text>
            </View>
          </View>

          {/* Shop Info */}
          <View style={styles.shopContainer}>
            <Text style={styles.shopTitle}>Do'kon ma'lumotlari</Text>
            <Text style={styles.shopName}>{product.shop.name}</Text>
            {product.shop.title && (
              <Text style={styles.shopSubtitle}>{product.shop.title}</Text>
            )}
            {product.shop.address && (
              <Text style={styles.shopAddress}>{product.shop.address}</Text>
            )}
            {product.shop.phone && (
              <Text style={styles.shopPhone}>{product.shop.phone}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      {product.inStock && (
        <View style={styles.bottomContainer}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Miqdori:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={cartLoading}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
                disabled={cartLoading}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionButtonsContainer}>
            <Button
              title="Savatchaga qo'shish"
              onPress={handleAddToCart}
              loading={cartLoading}
              style={styles.addButton}
            />
            
            {product.shop.phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => {
                  // Telefon qilish uchun Linking ishlatamiz
                  Linking.openURL(`tel:${product.shop.phone}`);
                }}
              >
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSpacer: {
    width: 40,
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 32,
  },
  category: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  detailLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  shopContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
  },
  shopTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  shopSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  shopPhone: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  quantityButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 16,
  },
  addButton: {
    marginTop: 8,
    flex: 1,
    marginRight: 12,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
  },
  callButton: {
    width: 56,
    height: 56,
    backgroundColor: '#34C759',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
