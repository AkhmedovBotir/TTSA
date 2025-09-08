import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { useCart } from '../contexts/CartContext';

export default function CartScreen() {
  const { cart, updateQuantity, removeFromCart, clearCart, isLoading } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      Alert.alert(
        'Mahsulotni o\'chirish',
        'Bu mahsulotni savatchadan o\'chirishni xohlaysizmi?',
        [
          { text: 'Bekor qilish', style: 'cancel' },
          {
            text: 'O\'chirish',
            style: 'destructive',
            onPress: () => removeFromCart(itemId),
          },
        ]
      );
    } else {
      await updateQuantity(itemId, quantity);
    }
  };

  const handleClearCart = () => {
    Alert.alert(
      'Savatchani tozalash',
      'Barcha mahsulotlarni savatchadan o\'chirishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Tozalash',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) {
      Alert.alert('Xato', 'Savatcha bo\'sh');
      return;
    }
    router.push('/checkout');
  };

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImageContainer}>
        {item.product.image && (
          <Image source={{ uri: 'https://api.ttsa.uz/uploads/products/' + item.product.image }} style={styles.itemImage} />
        )}
        {!item.product.image && (
          <Ionicons name="bag-outline" size={40} color="#8E8E93" />
        )}
      </View>
      
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.itemCategory}>
          {item.product.category.name} • {item.product.subcategory.name}
        </Text>
        <Text style={styles.itemUnit}>
          {item.product.quantity} {item.product.unit} • {item.product.unitSize}
        </Text>
        <Text style={styles.itemShop}>{item.product.shop.name}</Text>
      </View>
      
      <View style={styles.itemActions}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isLoading}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isLoading}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemPriceContainer}>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
          disabled={isLoading}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={64} color="#8E8E93" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>Savatcha bo'sh</Text>
      <Text style={styles.emptySubtitle}>
        Savatchangizda hali mahsulot yo'q. Mahsulotlarni ko'rish va qo'shish uchun bosh sahifaga o'ting.
      </Text>
      <Button
        title="Mahsulotlarni ko'rish"
        onPress={() => router.push('/(tabs)')}
        style={styles.emptyButton}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Savatcha yuklanmoqda...</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return renderEmptyCart();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Savatcha</Text>
        <TouchableOpacity onPress={handleClearCart} disabled={isLoading}>
          <Text style={styles.clearButton}>Tozalash</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        style={styles.cartList}
        contentContainerStyle={styles.cartContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Mahsulotlar:</Text>
          <Text style={styles.summaryValue}>{cart.itemCount} ta</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Jami narx:</Text>
          <Text style={styles.summaryValue}>{formatPrice(cart.totalOriginalPrice)}</Text>
        </View>
        
        {cart.totalDiscount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chegirma:</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              -{formatPrice(cart.totalDiscount)}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>To'lov miqdori:</Text>
          <Text style={styles.totalPrice}>{formatPrice(cart.totalPrice)}</Text>
        </View>
        
        <Button
          title="Buyurtma berish"
          onPress={handleCheckout}
          style={styles.checkoutButton}
        />
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  cartList: {
    flex: 1,
  },
  cartContainer: {
    padding: 20,
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  itemShop: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingHorizontal: 12,
  },
  itemPriceContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F2F2F7',
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
    marginBottom: 32,
  },
  emptyButton: {
    minWidth: 200,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  discountText: {
    color: '#FF3B30',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  checkoutButton: {
    marginTop: 16,
  },
});
