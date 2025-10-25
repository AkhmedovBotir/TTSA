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
    // Grid ko'rinish (modern dizayn)
    return (
      <TouchableOpacity style={styles.gridCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.gridImageWrapper}>
          <Image 
            source={{ uri: 'http://192.168.100.159:3000/uploads/products/' + product.image }} 
            style={styles.gridImage}
            onError={() => console.log('Image load error for:', product.image)}
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
          <View style={styles.gridHeader}>
            <Text style={styles.gridTitle} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.gridCategory}>
              {(product.category && product.category.name) ? product.category.name : ''}
              {product.subcategory && product.subcategory.name ? ` • ${product.subcategory.name}` : ''}
            </Text>
          </View>
          
          <View style={styles.gridPriceSection}>
            <View style={styles.gridPriceRow}>
              <Text style={styles.gridPrice}>{formatPrice(product.price)}</Text>
              {product.originalPrice > product.price && (
                <Text style={styles.gridOldPrice}>
                  {formatPrice(product.originalPrice)}
                </Text>
              )}
            </View>
            
            <View style={styles.gridDetails}>
              <Text style={styles.gridUnit}>
                {product.quantity} {product.unit}
                {product.unitSize ? ` • ${product.unitSize}` : ''}
              </Text>
              <Text style={styles.gridShop}>{product.shop && product.shop.name ? product.shop.name : ''}</Text>
            </View>
          </View>
          
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

  // List ko'rinish (modern dizayn)
  return (
    <TouchableOpacity style={styles.listCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.listImageWrapper}>
        <Image 
          source={{ uri: 'http://192.168.100.159:3000/uploads/products/' + product.image }} 
          style={styles.listImage}
          onError={() => console.log('Image load error for:', product.image)}
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

        <View style={styles.listPriceSection}>
          <View style={styles.listPriceRow}>
            <Text style={styles.listPrice}>{formatPrice(product.price)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.listOldPrice}>
                {formatPrice(product.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.listDetails}>
            <Text style={styles.listUnit}>
              {product.quantity} {product.unit}
              {product.unitSize ? ` • ${product.unitSize}` : ''}
            </Text>
            <Text style={styles.listShop}>{product.shop && product.shop.name ? product.shop.name : ''}</Text>
          </View>
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
  // Grid ko'rinish (kichik va to'g'ri)
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
    overflow: 'hidden',
    width: 160,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  gridImageWrapper: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridInfo: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  gridHeader: {
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    lineHeight: 18,
  },
  gridCategory: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  gridPriceSection: {
    marginBottom: 8,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 6,
  },
  gridOldPrice: {
    fontSize: 12,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  gridDetails: {
    gap: 2,
  },
  gridUnit: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  gridShop: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
  },
  gridButton: {
    marginTop: 0,
  },

  // List ko'rinish (modern dizayn)
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  listImageWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 18,
  },
  listImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 130,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    lineHeight: 24,
  },
  listCategory: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listPriceSection: {
    marginBottom: 16,
  },
  listPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
    marginRight: 12,
  },
  listOldPrice: {
    fontSize: 16,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  listDetails: {
    gap: 6,
  },
  listUnit: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '500',
  },
  listShop: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  listButton: {
    alignSelf: 'flex-start',
  },

  // Umumiy stillar (modern)
  discountTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stockTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
