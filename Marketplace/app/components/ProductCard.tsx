import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCart } from '../contexts/CartContext';
import { Product } from '../services/api';
import { Button } from './Button';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  showAddToCart?: boolean;
  compact?: boolean; // Grid ko'rinish uchun kichikroq
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showAddToCart = true,
  compact = false,
}) => {
  const { addToCart, isLoading } = useCart();

  const handleAddToCart = async () => {
    await addToCart(product.id, 1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (compact) {
    // Grid ko'rinish (to'liq ma'lumotlar)
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.gridImageWrapper}>
          <Image 
            source={{ uri: 'https://api.ttsa.uz/uploads/products/' + product.image }} 
            style={styles.gridImage} 
          />
          {product.discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </View>
          )}
          {!product.inStock && (
            <View style={styles.stockTag}>
              <Text style={styles.stockText}>Tugagan</Text>
            </View>
          )}
        </View>
        
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {product.name}
          </Text>
          
          <Text style={styles.gridCategory}>
            {(product.category && product.category.name) ? product.category.name : ''}
            {product.subcategory && product.subcategory.name ? ` • ${product.subcategory.name}` : ''}
          </Text>
          
          <View style={styles.gridPriceRow}>
            <Text style={styles.gridPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.gridOldPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>
          
          <Text style={styles.gridUnit}>
            {product.quantity} {product.unit}
            {product.unitSize ? ` • ${product.unitSize}` : ''}
          </Text>
          
          <Text style={styles.gridShop}>{product.shop && product.shop.name ? product.shop.name : ''}</Text>
          
          {showAddToCart && product.inStock && (
            <Button
              title="Savatchaga qo'shish"
              onPress={handleAddToCart}
              size="small"
              loading={isLoading}
              style={styles.gridButton}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // List ko'rinish (to'liq ma'lumotlar)
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.listImageWrapper}>
        <Image 
          source={{ uri: 'https://api.ttsa.uz/uploads/products/' + product.image }} 
          style={styles.listImage} 
        />
        {product.discount > 0 && (
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={styles.stockTag}>
            <Text style={styles.stockText}>Tugagan</Text>
          </View>
        )}
      </View>

      <View style={styles.listInfo}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.listCategory}>
            {(product.category && product.category.name) ? product.category.name : ''}
            {product.subcategory && product.subcategory.name ? ` • ${product.subcategory.name}` : ''}
          </Text>
        </View>

        <View style={styles.listDetails}>
          <View style={styles.listPriceRow}>
            <Text style={styles.listPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.listOldPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          <Text style={styles.listUnit}>
            {product.quantity} {product.unit}
            {product.unitSize ? ` • ${product.unitSize}` : ''}
          </Text>

          <Text style={styles.listShop}>{product.shop && product.shop.name ? product.shop.name : ''}</Text>
        </View>

        {showAddToCart && product.inStock && (
          <Button
            title="Savatchaga qo'shish"
            onPress={handleAddToCart}
            size="small"
            loading={isLoading}
            style={styles.listButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Grid ko'rinish (index dagi kabi)
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    overflow: 'hidden',
    width: 160,
  },
  gridImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridInfo: {
    padding: 16,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
    lineHeight: 20,
  },
  gridCategory: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 8,
  },
  gridOldPrice: {
    fontSize: 13,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  gridUnit: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  gridShop: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  gridButton: {
    fontSize: 12,
    marginTop: 0,
  },

  // List ko'rinish (to'liq ma'lumotlar)
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
    lineHeight: 22,
  },
  listCategory: {
    fontSize: 14,
    color: '#8E8E93',
  },
  listDetails: {
    marginBottom: 12,
  },
  listPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listPrice: {
    fontSize: 19,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 10,
  },
  listOldPrice: {
    fontSize: 15,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  listUnit: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  listShop: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 6,
  },

  listButton: {
    alignSelf: 'flex-start',
  },

  // Umumiy stillar
  discountTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stockTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
