import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { apiService } from './services/api';

export default function CheckoutScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Pre-fill user data if available
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phoneNumber);
    }
  }, [user]);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Xato', 'To\'liq ism majburiy');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Xato', 'Telefon raqami majburiy');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Xato', 'Manzil majburiy');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (!cart || cart.items.length === 0) {
      Alert.alert('Xato', 'Savatcha bo\'sh');
      return;
    }

    try {
      setIsLoading(true);
      
      const orderData = {
        deliveryAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
        deliveryNotes: deliveryNotes.trim() || undefined,
        paymentMethod: paymentMethod,
      };

      const response = await apiService.createOrder(orderData);
      
      if (response.success) {
        Alert.alert(
          'Muvaffaqiyatli',
          'Buyurtmangiz muvaffaqiyatli yaratildi!',
          [
            {
              text: 'OK',
              onPress: async () => {
                await clearCart();
                router.replace('/(tabs)/orders');
              },
            },
          ]
        );
      } else {
        Alert.alert('Xato', 'Buyurtma yaratishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      Alert.alert('Xato', 'Buyurtma yaratishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color="#8E8E93" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Savatcha bo'sh</Text>
        <Text style={styles.emptySubtitle}>
          Buyurtma berish uchun avval savatchaga mahsulot qo'shing.
        </Text>
        <Button
          title="Mahsulotlarni ko'rish"
          onPress={() => router.push('/(tabs)')}
          style={styles.emptyButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Buyurtma berish</Text>
          <Text style={styles.subtitle}>
            Yetkazib berish ma'lumotlarini to'ldiring
          </Text>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yetkazib berish ma'lumotlari</Text>
          
          <Input
            label="To'liq ism"
            placeholder="Ism va familiyangizni kiriting"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Input
            label="Telefon raqami"
            placeholder="+998901234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Manzil"
            placeholder="To'liq manzilni kiriting"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Izohlar (ixtiyoriy)"
            placeholder="Qo'shimcha ma'lumotlar..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To'lov usuli</Text>
          
          <View style={styles.paymentOptions}>
            <Button
              title="Naqd pul"
              onPress={() => setPaymentMethod('cash')}
              variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
              style={styles.paymentOption}
            />
            
            <Button
              title="Karta orqali"
              onPress={() => setPaymentMethod('card')}
              variant={paymentMethod === 'card' ? 'primary' : 'outline'}
              style={styles.paymentOption}
            />
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma xulosasi</Text>
          
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
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buyurtma mahsulotlari</Text>
          
          {cart.items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} x {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.bottomTotalLabel}>Jami:</Text>
          <Text style={styles.bottomTotalPrice}>{formatPrice(cart.totalPrice)}</Text>
        </View>
        
        <Button
          title="Buyurtmani tasdiqlash"
          onPress={handlePlaceOrder}
          loading={isLoading}
          style={styles.confirmButton}
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
  scrollView: {
    flex: 1,
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
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
  },
  summaryContainer: {
    backgroundColor: '#F2F2F7',
    padding: 16,
    borderRadius: 12,
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
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  bottomTotalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  confirmButton: {
    marginTop: 8,
  },
});
