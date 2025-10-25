import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { LocationPicker } from './components/LocationPicker';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { useLocation } from './contexts/LocationContext';
import { apiService, UserLocation } from './services/api';

export default function CheckoutScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [orderLocation, setOrderLocation] = useState<UserLocation | null>(null);
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { userLocation, updateLocation } = useLocation();
  const router = useRouter();

  // Pre-fill user data if available
  React.useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phoneNumber);
    }
    // Set default location from user's saved location
    if (userLocation) {
      setOrderLocation(userLocation);
    }
  }, [user, userLocation]);

  const validateForm = () => {
    // To'liq ism validatsiyasi - kamida 2 belgi
    if (!fullName.trim()) {
      Alert.alert('Xato', 'To\'liq ism majburiy');
      return false;
    } else if (fullName.trim().length < 2) {
      Alert.alert('Xato', 'To\'liq ism kamida 2 belgi bo\'lishi kerak');
      return false;
    }

    // Telefon raqam validatsiyasi - kamida 9 belgi
    if (!phone.trim()) {
      Alert.alert('Xato', 'Telefon raqami majburiy');
      return false;
    } else if (phone.trim().length < 9) {
      Alert.alert('Xato', 'Telefon raqami kamida 9 belgi bo\'lishi kerak');
      return false;
    }

    // Manzil validatsiyasi - kamida 10 belgi
    if (!address.trim()) {
      Alert.alert('Xato', 'Manzil majburiy');
      return false;
    } else if (address.trim().length < 10) {
      Alert.alert('Xato', 'Manzil kamida 10 belgi bo\'lishi kerak');
      return false;
    }

    // Hudud validatsiyasi
    if (!orderLocation) {
      Alert.alert('Xato', 'Hududni tanlash majburiy');
      return false;
    }

    return true;
  };

  const handleLocationSelect = async (location: UserLocation) => {
    try {
      setOrderLocation(location);
      setLocationPickerVisible(false);
      // Also update user's saved location
      await updateLocation(location);
    } catch (error) {
      console.error('Failed to update location:', error);
      Alert.alert('Xatolik', 'Hududni yangilashda xatolik yuz berdi');
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
        location: orderLocation ? {
          regionId: orderLocation.region._id,
          districtId: orderLocation.district._id,
          mfyId: orderLocation.mfy._id,
        } : undefined,
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
          {/* Location Selection */}
          <View style={styles.locationSection}>
            <Text style={styles.locationSectionTitle}>Yetkazib berish hududi</Text>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setLocationPickerVisible(true)}
            >
              <View style={styles.locationButtonContent}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Hudud</Text>
                  <Text style={styles.locationValue} numberOfLines={1}>
                    {formatLocationString(orderLocation)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </TouchableOpacity>

            {orderLocation && (
              <View style={styles.locationDetails}>
                <Text style={styles.locationDetailText}>
                  📍 {orderLocation.region.name}
                  {orderLocation.district && ` • ${orderLocation.district.name}`}
                  {orderLocation.mfy && ` • ${orderLocation.mfy.name}`}
                </Text>
              </View>
            )}
          </View>


          <Input
            label="Manzil"
            placeholder="Aniq yetib borishi uchun to'liq manzil yozing"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
          />


          <Input
            label="Telefon raqami"
            placeholder="+998901234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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

      {/* Location Picker Modal */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
        currentLocation={orderLocation || undefined}
      />

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
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  locationDetails: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  locationDetailText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  locationSection: {
    marginVertical: 16,
  },
  locationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
});
