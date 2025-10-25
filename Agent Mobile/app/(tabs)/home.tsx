import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { clearAuthData, getValidToken } from "../utils/auth";
import ProductSelector from "../components/ProductSelector";
import AnketaSelector from "../components/AnketaSelector";
import NotificationBadge from "../components/NotificationBadge";
import Notifications from "../components/Notifications";
import { getApiUrl, getUploadUrl, API_CONFIG } from '../config/api';

interface Category {
  _id: string;
  name: string;
}

// Helper function to handle Decimal128 values from MongoDB
const parseDecimal = (value: number | { $numberDecimal: string }): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  return 0;
};

interface Product {
  _id: string;
  name: string;
  category: Category;
  price: number;
  unit: string;
  unitSize: number | null;
  inventory: number | { $numberDecimal: string };
  image?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductInDraft {
  _id: string;
  productId: string | {
    _id: string;
    name: string;
  };
  name: string;
  quantity: number | { $numberDecimal: string };
  price: number | { $numberDecimal: string };
  unit: string;
  unitSize: number;
}

interface DraftOrder {
  _id: string;
  orderId: number;
  products: ProductInDraft[];
  totalSum: number | { $numberDecimal: string };
  status: 'draft' | 'completed';
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  seller?: any;
  storeOwner?: any;
  __v?: number;
}

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  showPaymentMethod?: boolean;
  selectedPaymentMethod?: 'cash' | 'card' | 'installment';
  onPaymentMethodChange?: (method: 'cash' | 'card' | 'installment') => void;
  customerData?: any;
  onShowAnketa?: () => void;
  onClearCustomer?: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Ha",
  cancelText = "Yo'q",
  loading = false,
  showPaymentMethod = false,
  selectedPaymentMethod = 'cash',
  onPaymentMethodChange,
  customerData,
  onShowAnketa,
  onClearCustomer
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.confirmModalContent}>
        <Text style={styles.confirmModalTitle}>{title}</Text>
        <Text style={styles.confirmModalMessage}>{message}</Text>

        {showPaymentMethod && (
          <View style={styles.paymentMethodContainer}>
            <Text style={styles.paymentMethodTitle}>To'lov turi:</Text>
            <View style={styles.paymentMethodOptions}>
              <TouchableOpacity 
                style={[
                  styles.paymentMethodOption,
                  styles.paymentMethodFull,
                  selectedPaymentMethod === 'cash' && styles.paymentMethodOptionSelected
                ]}
                onPress={() => onPaymentMethodChange?.('cash')}
              >
                <Ionicons name="cash-outline" size={20} color={selectedPaymentMethod==='cash' ? '#007AFF' : '#666'} />
                <Text
                  style={[styles.paymentMethodText, selectedPaymentMethod==='cash' && styles.paymentMethodTextSelected]}
                  numberOfLines={2}
                >
                  Naqd
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.paymentMethodOption,
                  styles.paymentMethodFull,
                  selectedPaymentMethod === 'installment' && styles.paymentMethodOptionSelected
                ]}
                onPress={() => onPaymentMethodChange?.('installment')}
              >
                <Ionicons name="time-outline" size={20} color={selectedPaymentMethod==='installment' ? '#007AFF' : '#666'} />
                <Text
                  style={[styles.paymentMethodText, selectedPaymentMethod==='installment' && styles.paymentMethodTextSelected]}
                  numberOfLines={2}
                >
                  Muddatli to'lov
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Anketa tugmasi muddatli to'lov tanlanganda ko'rinadi */}
            {selectedPaymentMethod === 'installment' && (
              <View style={styles.installmentFormContainer}>
                <TouchableOpacity 
                  style={styles.anketaButton}
                  onPress={onShowAnketa}
                >
                  <Ionicons name="person-add-outline" size={20} color="white" />
                  <Text style={styles.anketaButtonText}>
                    {customerData ? 'Mijoz ma\'lumotlari tahrirlash' : 'Mijoz ma\'lumotlari'}
                  </Text>
                </TouchableOpacity>
                {customerData && (
                  <View style={styles.customerInfoContainer}>
                    <Text style={styles.customerInfo}>
                      {customerData.fullName} - {customerData.primaryPhone}
                    </Text>
                    <TouchableOpacity 
                      style={styles.clearCustomerButton}
                      onPress={onClearCustomer}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.confirmModalButtons}>
          <TouchableOpacity
            style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.confirmModalButtonText, { color: '#666' }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.confirmModalButton, 
              styles.confirmModalButtonConfirm,
              loading && styles.disabledButton
            ]}
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.confirmModalButtonText}>{confirmText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function HomeScreen() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'installment'>('cash');
  const [showAnketaSelector, setShowAnketaSelector] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [confirmingDraft, setConfirmingDraft] = useState<DraftOrder | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs to avoid stale closures inside modal confirm callback
  const selectedPaymentMethodRef = useRef<'cash' | 'card' | 'installment'>(selectedPaymentMethod);
  const customerDataRef = useRef<any>(customerData);

  useEffect(() => {
    selectedPaymentMethodRef.current = selectedPaymentMethod;
  }, [selectedPaymentMethod]);

  useEffect(() => {
    customerDataRef.current = customerData;
  }, [customerData]);

  // Rasm yuborish funksiyasi
  // Base64 rasmni tekshirish funksiyasi
  const isBase64Image = (imageData: string): boolean => {
    return imageData.startsWith('data:image/');
  };

  // To'lov turi o'zgarganda mijoz ma'lumotlarini tozalash
  const handlePaymentMethodChange = (method: 'cash' | 'card' | 'installment') => {
    console.log('=== PAYMENT METHOD CHANGE DEBUG ===');
    console.log('Changing payment method from:', selectedPaymentMethod, 'to:', method);
    
    // Faqat installmentdan boshqa turga o'tilganda mijoz ma'lumotlarini tozalaymiz
    if (method !== 'installment') {
      setCustomerData(null);
    }
    setSelectedPaymentMethod(method);
    
    console.log('Payment method changed to:', method);
  };

  const scrollViewRef = useRef<ScrollView>(null);

  // Load draft orders when component mounts
  useEffect(() => {
    loadDraftOrders();
  }, []);

  // Debug cartItems changes
  useEffect(() => {
    console.log('cartItems changed:', {
      length: cartItems.length,
      items: cartItems.map(item => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      total: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    });
  }, [cartItems]);

  const loadDraftOrders = async () => {
    setLoadingDrafts(true);
    try {
      const token = await getValidToken();
      if (!token) {
        router.replace('/');
        return; // Return early to prevent further execution
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DRAFT_ORDERS), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await clearAuthData();
          router.replace('/');
          throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
        }
        throw new Error(`HTTP xatosi! Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setDraftOrders(Array.isArray(data.data) ? data.data : []);
      } else {
        throw new Error(data.message || 'Draft buyurtmalarni yuklashda xatolik');
      }
    } catch (error: any) {
      console.error('Error loading draft orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: error?.message || "Serverga ulanishda xatolik yuz berdi",
      });
    } finally {
      setLoadingDrafts(false);
    }
  };

  const handleEditDraft = async (draft: DraftOrder) => {
    try {
      const token = await getValidToken();
      if (!token) {
        router.replace('/');
        throw new Error('Avtorizatsiya tokeni topilmadi yoki muddati o\'tgan. Iltimos, qaytadan kiring.');
      }

      // Filter out any products with invalid or missing IDs
      const validProducts = draft.products.filter(product => {
        const productId = typeof product.productId === 'string' 
          ? product.productId 
          : product.productId?._id;
        return !!productId; // Only keep products with valid IDs
      });

      if (validProducts.length === 0) {
        throw new Error('Tahrirlash uchun hech qanday yaroqli mahsulot topilmadi');
      }

      const cartItemPromises = validProducts.map(async (product) => {
        // Extract product ID - handle both direct ID and nested productId object
        const productId = typeof product.productId === 'string' 
          ? product.productId 
          : product.productId?._id;
          
        if (!productId) {
          console.warn('Mahsulot IDsi topilmadi, bu mahsulot o\'tkazib yuboriladi');
          return null;
        }

        const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.SELLER_PRODUCTS)}/${productId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            await clearAuthData();
            router.replace('/');
            throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
          }
          throw new Error(`HTTP xatosi! Status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Mahsulot ma\'lumotlarini yuklashda xatolik');
        }

        // Parse the quantity and price from Decimal128 if needed
        const quantity = typeof product.quantity === 'number' 
          ? product.quantity 
          : typeof product.quantity === 'object' && product.quantity !== null && '$numberDecimal' in product.quantity
            ? parseFloat(product.quantity.$numberDecimal)
            : 1;

        const price = typeof product.price === 'number'
          ? product.price
          : typeof product.price === 'object' && product.price !== null && '$numberDecimal' in product.price
            ? parseFloat(product.price.$numberDecimal)
            : 0;

        // Create product with correct price - API response strukturasi boshqacha
        // Bitta mahsulot uchun response strukturasi boshqacha bo'lishi mumkin
        const productData = {
          ...(data.product || data.data || data), // Turli xil response strukturalarini sinab ko'ramiz
          _id: productId, // productId ni to'g'ridan-to'g'ri olamiz
          price: price
        };
        
        console.log('Processed product data:', productData);

        return {
          product: productData,
          quantity: quantity,
        };
      });

      const newCartItems = (await Promise.all(cartItemPromises)).filter(Boolean);
      
      if (newCartItems.length === 0) {
        throw new Error('Hech qanday yaroqli mahsulot yuklanmadi');
      }
      
      setCartItems(newCartItems);
      setEditingDraftId(draft._id);
      
      // Debug cartItems after setting
      console.log('handleEditDraft - cartItems set:', {
        cartItemsLength: newCartItems.length,
        totalAmount: newCartItems.reduce((total, item) => item ? total + (item.product.price * item.quantity) : total, 0)
      });
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      }

      const skippedCount = draft.products.length - validProducts.length;
      const message = `Saqlangan sotuv tahrirlash uchun yuklandi${skippedCount > 0 ? ` (${skippedCount} ta noto'g'ri mahsulot o'tkazib yuborildi)` : ''}`;
      
      Toast.show({
        type: 'info',
        text1: 'Tahrirlash',
        text2: message,
      });
    } catch (error: unknown) {
      console.error('Error loading draft for edit:', error);
      if (error instanceof Error) {
        Toast.show({
          type: 'error',
          text1: 'Xato',
          text2: error.message || "Saqlangan sotuvni yuklashda xatolik",
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Xato',
          text2: "Noma'lum xatolik",
        });
      }
    }
  };

  const handleSaveDraft = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: "Savatchada mahsulot yo'q",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        throw new Error('Avtorizatsiya tokeni topilmadi yoki muddati o\'tgan. Iltimos, qaytadan kiring.');
      }

      // Get current user data
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        throw new Error('Foydalanuvchi ma\'lumotlari topilmadi. Iltimos, qaytadan kiring.');
      }
      const user = JSON.parse(userData);
      console.log('Parsed user data:', user);
      
      // User data da id bor, _id emas
      const storeOwner = user.id || user._id;
      
      if (!storeOwner) {
        throw new Error(`Store owner ID topilmadi. User data: ${JSON.stringify(user)}`);
      }

      const totalSum = cartItems.reduce((sum, item) => 
        sum + (item.product.price * item.quantity), 0
      );

      const draftRequest = {
        storeOwner,
        products: cartItems.map(item => {
          const { _id, name, price, unit, unitSize } = item.product;
          
          // productId mavjudligini tekshirish
          if (!_id) {
            console.error('Product ID yo\'q:', item.product);
            throw new Error(`Mahsulot "${name}" uchun ID topilmadi`);
          }
          
          return {
            productId: _id,
            name,
            quantity: item.quantity,
            price,
            unit,
            unitSize: unitSize || 1
          };
        }),
        totalSum
      };

      const url = editingDraftId 
        ? `${getApiUrl(API_CONFIG.ENDPOINTS.DRAFT_ORDERS)}/${editingDraftId}`
        : getApiUrl(API_CONFIG.ENDPOINTS.DRAFT_ORDERS);

      // Log the request data for debugging
      console.log('=== DRAFT REQUEST DEBUG ===');
      console.log('URL:', url);
      console.log('Method:', editingDraftId ? 'PUT' : 'POST');
      console.log('Store Owner:', storeOwner);
      console.log('Total Sum:', totalSum);
      console.log('Products:', JSON.stringify(draftRequest.products, null, 2));
      console.log('Full Request:', JSON.stringify(draftRequest, null, 2));
      console.log('========================');

      const response = await fetch(url, {
        method: editingDraftId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(draftRequest),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await clearAuthData();
          router.replace('/');
          throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
        }
        throw new Error(`HTTP xatosi! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        Toast.show({
          type: 'success',
          text1: 'Muvaffaqiyatli',
          text2: editingDraftId ? "Sotuv yangilandi" : "Sotuv saqlandi",
        });
        setCartItems([]);
        setSelectedProduct(null);
        setQuantity('1');
        setEditingDraftId(null);
        loadDraftOrders();
      } else {
        throw new Error(data.message || 'Draft saqlashda xatolik');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: "Serverga ulanishda xatolik yuz berdi",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSale = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: "Savatchada mahsulot yo'q",
      });
      return;
    }

    showConfirmation({
      title: "Sotuvni tasdiqlash",
      message: "Ushbu sotuvni amalga oshirishni xohlaysizmi?",
      showPaymentMethod: true,
      onConfirm: async () => {
        setLoading(true);
        try {
          const token = await getValidToken();
          if (!token) {
            throw new Error('Avtorizatsiya tokeni topilmadi yoki muddati o\'tgan. Iltimos, qaytadan kiring.');
          }

          const totalSum = cartItems.reduce((sum, item) => 
            sum + (item.product.price * item.quantity), 0
          );

          // Get the token and decode it to get agent information
          const authToken = await getValidToken();
          if (!authToken) {
            throw new Error('Avtorizatsiya tokeni topilmadi. Iltimos, qaytadan kiring.');
          }
          
          // The token contains the agent ID in its payload
          // We can extract it by decoding the token
          const tokenParts = authToken.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Noto\'g\'ri token formati');
          }
          
          // For React Native, we need to use a different method to decode base64
          const base64Url = tokenParts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(base64))));
          const agentId = decodedPayload.id;
          
          if (!agentId) {
            throw new Error('Agent ID si token ichidan topilmadi');
          }
          
          console.log('Agent ID from token:', agentId);

          // Muddatli to'lov uchun maxsus request
          if (selectedPaymentMethod === 'installment') {
            if (!customerData) {
              Toast.show({
                type: 'error',
                text1: 'Xato',
                text2: 'Muddatli to\'lov uchun mijoz ma\'lumotlari kiritilishi shart',
              });
              return;
            }

            // Rasm yuklash (agar mavjud bo'lsa)
                console.log('=== DIRECT SALE CUSTOMER DATA DEBUG ===');
    console.log('Customer data:', customerData);
    console.log('Customer image type:', customerData?.image ? (isBase64Image(customerData.image) ? 'Base64' : 'URI') : 'None');
    
    if (customerData?.image && isBase64Image(customerData.image)) {
      console.log('Customer has Base64 image, ready to send');
    } else {
      console.log('No customer image or not Base64 format');
    }

            const installmentRequest = {
              products: cartItems.map(item => {
                const { _id, name, price, unit, unitSize } = item.product;
                return {
                  productId: _id,
                  name,
                  quantity: item.quantity,
                  price,
                  unit,
                  unitSize: unitSize || 1
                };
              }),
              storeOwner: agentId,
              paymentMethod: "installment",
              installmentDuration: customerData.installmentDuration || 6,
              startDate: customerData.installmentStartDate || new Date().toISOString(),
              customer: {
                ...customerData,
                image: customerData.image // Base64 rasm
              }
            };

            console.log('=== INSTALLMENT REQUEST DEBUG ===');
            console.log('URL:', getApiUrl(API_CONFIG.ENDPOINTS.ORDER_HISTORY));
            console.log('Method: POST');
            console.log('Agent ID:', agentId);
            console.log('Customer Data:', customerData);
            console.log('Customer Image Type:', customerData?.image ? (isBase64Image(customerData.image) ? 'Base64' : 'URI') : 'None');
            console.log('Customer Image Length:', customerData?.image?.length || 0);
            console.log('Full Request:', JSON.stringify(installmentRequest, null, 2));
            console.log('===============================');
            
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ORDER_HISTORY), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
              },
              body: JSON.stringify(installmentRequest),
            });

            const data = await response.json();
            console.log('=== INSTALLMENT RESPONSE DEBUG ===');
            console.log('Status:', response.status);
            console.log('Response Data:', JSON.stringify(data, null, 2));
            console.log('==================================');
            
            if (response.ok) {
              Toast.show({
                type: 'success',
                text1: 'Muvaffaqiyatli',
                text2: "Foizsiz muddatli to'lov buyurtmasi yaratildi",
              });
              setCartItems([]);
              setSelectedProduct(null);
              setQuantity('1');
              setCustomerData(null);
              setSelectedPaymentMethod('cash');
              setShowConfirmModal(false);
            } else {
              Toast.show({
                type: 'error',
                text1: 'Xato',
                text2: data.message || "Muddatli to'lov xatosi",
              });
            }
            return;
          }

          // Oddiy sotuv uchun request
          const saleRequest = {
            storeOwner: agentId,
            products: cartItems.map(item => {
              const { _id, name, price, unit, unitSize } = item.product;
              return {
                productId: _id,
                name,
                quantity: item.quantity,
                price,
                unit,
                unitSize: unitSize || 1
              };
            }),
            totalSum: totalSum,
            paymentMethod: selectedPaymentMethod
          };

          console.log('Sending sale request:', JSON.stringify(saleRequest, null, 2));
          
          const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ORDER_HISTORY_DIRECT), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
            body: JSON.stringify(saleRequest),
          });

          const data = await response.json();
          console.log('API Response status:', response.status);
          console.log('API Response data:', data);
          
          if (response.ok) {
            Toast.show({
              type: 'success',
              text1: 'Muvaffaqiyatli',
              text2: "Sotuv muvaffaqiyatli amalga oshirildi",
            });
            setCartItems([]);
            setSelectedProduct(null);
            setQuantity('1');
            setSelectedPaymentMethod('cash');
            setShowConfirmModal(false);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Xato',
              text2: data.message || "Sotuv xatosi",
            });
          }
        } catch (error) {
          console.error('Direct sale error:', error);
          Toast.show({
            type: 'error',
            text1: 'Xato',
            text2: "Serverga ulanishda xatolik yuz berdi",
          });
        } finally {
          setLoading(false);
          setShowConfirmModal(false);
        }
      }
    });
  };

  const handleConfirmDraft = async (draftId: string) => {
    const draft = draftOrders.find(d => d._id === draftId) || null;
    // Modal ochilganda faqat confirmingDraft ni o'rnatamiz
    setConfirmingDraft(draft);
    showConfirmation({
      title: "Sotuvni tasdiqlash",
      message: "Ushbu sotuvni tasdiqlashni xohlaysizmi?",
      showPaymentMethod: true,
      onConfirm: async () => {
        // Bu yerda customerData ni tozalamaymiz, chunki installment uchun kerak
        setLoadingDrafts(true);
        try {
          const token = await getValidToken();
          if (!token) {
            throw new Error('Avtorizatsiya tokeni topilmadi yoki muddati o\'tgan. Iltimos, qaytadan kiring.');
          }
          
          // Agent ID ni tokendan olish
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Noto\'g\'ri token formati');
          }
          
          const base64Url = tokenParts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decodedPayload = JSON.parse(decodeURIComponent(escape(atob(base64))));
          const agentId = decodedPayload.id;
          
          if (!agentId) {
            throw new Error('Agent ID si token ichidan topilmadi');
          }
          
          console.log('Agent ID from token:', agentId);

          // Shop ID ni cart items dan olish
          let shopId = cartItems.length > 0 ? cartItems[0].product.shop?.id : null;
          console.log('Shop ID from cart items:', shopId);
          console.log('Cart items length:', cartItems.length);
          
          if (cartItems.length === 0) {
            console.log('WARNING: Cart is empty when confirming draft!');
            // Draft dan shop ID ni olishga harakat qilamiz
            if (confirmingDraft && confirmingDraft.products && confirmingDraft.products.length > 0) {
              shopId = confirmingDraft.products[0].shop?.id;
              console.log('Shop ID from draft products:', shopId);
              console.log('Draft products:', confirmingDraft.products);
            } else {
              console.log('No draft products found or confirmingDraft is null');
            }
          }

          // So'rov tanasi
          const requestBody: any = { 
            paymentMethod: selectedPaymentMethodRef.current,
            status: 'completed',
            storeOwner: shopId || agentId  // Shop ID ni birinchi o'rinda ishlatamiz, yo'q bo'lsa agent ID
          };

          console.log('=== DRAFT CONFIRM DEBUG ===');
          console.log('Draft ID:', draftId);
          console.log('Selected Payment Method:', selectedPaymentMethodRef.current);
          console.log('Customer Data:', customerDataRef.current);
          console.log('Agent ID:', agentId);
          console.log('Shop ID from cart items:', shopId);
          console.log('Cart items:', cartItems);
          console.log('Confirming draft:', confirmingDraft);
          console.log('Request Body:', JSON.stringify(requestBody, null, 2));
          console.log('Store Owner being sent:', requestBody.storeOwner);
          console.log('Final shop ID being used:', shopId || agentId);
          console.log('Request Body (before installment check):', JSON.stringify(requestBody, null, 2));

          // Agar installment tanlangan bo'lsa YOKI mijoz ma'lumotlari mavjud bo'lsa, installment yuboramiz
          if (selectedPaymentMethodRef.current === 'installment' || customerDataRef.current) {
            console.log('=== INSTALLMENT VALIDATION DEBUG ===');
            console.log('Selected payment method is installment');
            console.log('Customer data exists:', !!customerDataRef.current);
            console.log('Customer data:', customerDataRef.current);
            console.log('Customer data type:', typeof customerDataRef.current);
            
            // customerData yo'q bo'lsa, confirmingDraft dan olamiz
            const finalCustomerData = customerDataRef.current;
            
            if (!finalCustomerData) {
              console.log('ERROR: Customer data is missing!');
              Toast.show({
                type: 'error',
                text1: 'Xato',
                text2: 'Muddatli to\'lov uchun mijoz ma\'lumotlari kiritilishi shart',
              });
              return;
            }

            console.log('=== DRAFT CONFIRM CUSTOMER DATA DEBUG ===');
            console.log('Final customer data:', finalCustomerData);
            console.log('Customer image type:', finalCustomerData?.image ? (isBase64Image(finalCustomerData.image) ? 'Base64' : 'URI') : 'None');
            
            if (finalCustomerData?.image && isBase64Image(finalCustomerData.image)) {
              console.log('Draft confirm: Customer has Base64 image, ready to send');
            } else {
              console.log('Draft confirm: No customer image or not Base64 format');
            }

            // To'lov turini aniq installment qilib yuboramiz
            requestBody.paymentMethod = 'installment';
            requestBody.installmentDuration = finalCustomerData.installmentDuration || 6;
            requestBody.startDate = finalCustomerData.installmentStartDate || new Date().toISOString();
            requestBody.customer = {
              ...finalCustomerData,
              image: finalCustomerData.image // Base64 rasm
            };

            console.log('Customer Image Type:', finalCustomerData?.image ? (isBase64Image(finalCustomerData.image) ? 'Base64' : 'URI') : 'None');
            console.log('Customer Image Length:', finalCustomerData?.image?.length || 0);
            console.log('Installment Request Body:', JSON.stringify(requestBody, null, 2));
          }

          const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DRAFT_ORDERS)}/${draftId}/confirm`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          const data = await response.json();
          console.log('=== DRAFT CONFIRM RESPONSE ===');
          console.log('Status:', response.status);
          console.log('Response:', JSON.stringify(data, null, 2));
          console.log('=============================');
          
          if (!response.ok) {
            if (response.status === 401) {
              await clearAuthData();
              router.replace('/');
              throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
            }
            throw new Error(data.message || 'Sotuvni tasdiqlashda xatolik');
          }
          
          if (data.success) {
            Toast.show({
              type: 'success',
              text1: 'Muvaffaqiyatli',
              text2: data.data?.message || "Sotuv muvaffaqiyatli tasdiqlandi",
            });
            // Reload draft orders
            await loadDraftOrders();
            // Muvaffaqiyatli bo'lgandan keyin customerData ni tozalaymiz
            setCustomerData(null);
            setSelectedPaymentMethod('cash');
          } else {
            throw new Error(data.message || 'Sotuvni tasdiqlashda xatolik');
          }
        } catch (error) {
          console.error('Confirm draft error:', error);
          Toast.show({
            type: 'error',
            text1: 'Xato',
            text2: error instanceof Error ? error.message : "Serverga ulanishda xatolik yuz berdi",
          });
        } finally {
          setLoadingDrafts(false);
          setShowConfirmModal(false);
          setConfirmingDraft(null);
        }
      }
    });
  };

  const handleDeleteDraft = async (draftId: string, e: any) => {
    e.stopPropagation();
    
    showConfirmation({
      title: "O'chirish",
      message: "Ushbu vaqtinchalik sotuvni o'chirishni xohlaysizmi?",
      onConfirm: async () => {
        setLoadingDrafts(true);
        try {
          const token = await getValidToken();
          if (!token) {
            throw new Error('Avtorizatsiya tokeni topilmadi yoki muddati o\'tgan. Iltimos, qaytadan kiring.');
          }

          const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DRAFT_ORDERS)}/${draftId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              await clearAuthData();
              router.replace('/');
              throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
            }
            if (response.status === 404) {
              throw new Error('Vaqtinchalik sotuv topilmadi');
            } else if (response.status === 403) {
              throw new Error('Vaqtinchalik sotuvni o\'chirish huquqi yo\'q');
            } else {
              throw new Error('Serverda xatolik yuz berdi');
            }
          }

          const data = await response.json();
          
          if (data.success) {
            if (editingDraftId === draftId) {
              setCartItems([]);
              setSelectedProduct(null);
              setQuantity('1');
              setEditingDraftId(null);
            }
            
            setDraftOrders(prev => prev.filter(draft => draft._id !== draftId));
            Toast.show({
              type: 'success',
              text1: 'Muvaffaqiyatli',
              text2: "Vaqtinchalik sotuv o'chirildi",
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Xato',
              text2: data.message || "Vaqtinchalik sotuvni o'chirishda xatolik",
            });
          }
        } catch (error) {
          console.error('Delete draft error:', error);
          Toast.show({
            type: 'error',
            text1: 'Xato',
            text2: error instanceof Error ? error.message : "Serverga ulanishda xatolik yuz berdi",
          });
        } finally {
          setLoadingDrafts(false);
          setShowConfirmModal(false);
        }
      }
    });
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: "Noto'g'ri miqdor. Iltimos, musbat son kiriting (masalan: 1.5)",
      });
      return;
    }

    if (quantityNum > parseDecimal(selectedProduct.inventory)) {
      Toast.show({
        type: 'error',
        text1: 'Xato',
        text2: "Omborda yetarli mahsulot mavjud emas",
      });
      return;
    }

    const existingItemIndex = cartItems.findIndex(item => item.product._id === selectedProduct._id);
    
    if (existingItemIndex !== -1) {
      const newQuantity = cartItems[existingItemIndex].quantity + quantityNum;
      if (newQuantity > parseDecimal(selectedProduct.inventory)) {
        Toast.show({
          type: 'error',
          text1: 'Xato',
          text2: "Omborda yetarli mahsulot mavjud emas",
        });
        return;
      }
      
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity = newQuantity;
      setCartItems(updatedItems);
    } else {
      setCartItems([...cartItems, { 
        product: selectedProduct,
        quantity: quantityNum 
      }]);
    }

    setSelectedProduct(null);
    setQuantity('1');

    Toast.show({
      type: 'success',
      text1: 'Qo\'shildi',
      text2: 'Mahsulot savatchaga qo\'shildi',
    });
  };

  const removeFromCart = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
    Toast.show({
      type: 'info',
      text1: 'O\'chirildi',
      text2: 'Mahsulot savatchadan o\'chirildi',
    });
  };

  const getTotalAmount = () => {
    const total = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    console.log('getTotalAmount called:', {
      cartItemsLength: cartItems.length,
      cartItems: cartItems.map(item => ({
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity
      })),
      total: total
    });
    return total;
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadDraftOrders().finally(() => {
      setRefreshing(false);
      Toast.show({
        type: 'info',
        text1: 'Yangilandi',
        text2: 'Ma\'lumotlar yangilandi',
      });
    });
  }, []);

  const showConfirmation = (config: {
    title: string;
    message: string;
    onConfirm: () => void;
    showPaymentMethod?: boolean;
  }) => {
    setConfirmModalConfig(config);
    setShowConfirmModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Xush kelibsiz!</Text>
              <Text style={styles.subtitle}>
                {editingDraftId ? "Sotuvni tahrirlash" : "Yangi sotuv qo'shish"}
              </Text>
            </View>
            <NotificationBadge onPress={() => setShowNotifications(true)} />
          </View>
        </View>
        
        <View style={styles.saleForm} onStartShouldSetResponder={() => true}>
          <TouchableOpacity 
            style={styles.productSelector}
            onPress={() => setShowProductSelector(true)}
          >
            <Text style={styles.selectorLabel}>
              {selectedProduct ? selectedProduct.name : "Mahsulot tanlang"}
            </Text>
            <Ionicons name="chevron-down" size={24} color="#666" />
          </TouchableOpacity>

          {selectedProduct && (
            <>
              <View style={styles.productInfo}>
                <View style={styles.productInfoHeader}>
                  {selectedProduct.image ? (
                    <>
                      {console.log('=== IMAGE RENDERING DEBUG ===')}
                      {console.log('Selected product image:', selectedProduct.image)}
                      {console.log('Image URL:', selectedProduct.image ? getUploadUrl(selectedProduct.image) : 'No image')}
                      {console.log('===============================')}
                      <Image 
                        source={{ uri: getUploadUrl(selectedProduct.image) }} 
                        style={styles.selectedProductImage}
                        onError={(error) => {
                          console.log('=== IMAGE LOAD ERROR ===');
                          console.log('Error:', error.nativeEvent.error);
                          console.log('Image URI:', selectedProduct.image ? getUploadUrl(selectedProduct.image) : 'No image');
                          console.log('========================');
                        }}
                        onLoad={() => {
                          console.log('=== IMAGE LOADED SUCCESSFULLY ===');
                          console.log('Image URI:', selectedProduct.image ? getUploadUrl(selectedProduct.image) : 'No image');
                          console.log('==================================');
                        }}
                      />
                    </>
                  ) : (
                    <View style={styles.selectedProductImagePlaceholder}>
                      <Ionicons name="image-outline" size={20} color="#ccc" />
                    </View>
                  )}
                  <View style={styles.productInfoTexts}>
                    <Text style={styles.infoText}>Turi: {selectedProduct.category.name}</Text>
                    <Text style={styles.infoText}>
                      Narxi: {selectedProduct.price.toLocaleString()} so'm
                    </Text>
                    <Text style={styles.infoText}>
                      Qoldiq: {parseDecimal(selectedProduct.inventory)} {selectedProduct.unit}
                      {selectedProduct.unitSize ? ` (${selectedProduct.unitSize} ${selectedProduct.unit})` : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.quantityInput}>
                <Text style={styles.inputLabel}>Miqdori:</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (/^\d*\.?\d*$/.test(text) || text === '') {
                      setQuantity(text);
                    }
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                  placeholderTextColor="#999"
                  editable={!loading}
                  onSubmitEditing={() => {
                    // Prevent form submission when pressing enter
                    return false;
                  }}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.addButton]}
                onPress={addToCart}
              >
                <Text style={styles.buttonText}>Qo'shish</Text>
              </TouchableOpacity>
            </>
          )}

          {cartItems.length > 0 && (
            <View style={styles.cartSection}>
              <Text style={styles.cartTitle}>Savatcha</Text>
              {cartItems.map((item, index) => (
                <View key={`${item.product._id}-${index}`} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemDetails}>
                      {item.quantity} {item.product.unit} x {item.product.price.toLocaleString()} so'm
                    </Text>
                  </View>
                  <View style={styles.cartItemRight}>
                    <Text style={styles.cartItemTotal}>
                      {(item.quantity * item.product.price).toLocaleString()} so'm
                    </Text>
                    <TouchableOpacity 
                      onPress={() => removeFromCart(index)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Jami summa:</Text>
                <Text style={styles.totalAmount}>
                  {getTotalAmount().toLocaleString()} so'm
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSaveDraft}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Saqlanmoqda...' : 'Vaqtinchalik saqlash'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.directSaleButton, loading && styles.buttonDisabled]}
                onPress={handleDirectSale}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Saqlanmoqda...' : 'To\'g\'ridan-to\'g\'ri sotuv'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Draft Orders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saqlangan sotuvlar</Text>
          
          {loadingDrafts && !refreshing ? (
            <ActivityIndicator style={styles.loader} />
          ) : draftOrders.length > 0 ? (
            draftOrders.map((draft) => (
              <TouchableOpacity
                key={draft._id}
                style={[
                  styles.draftCard,
                  editingDraftId === draft._id && styles.editingDraftCard
                ]}
                onPress={() => handleEditDraft(draft)}
                activeOpacity={0.7}
              >
                <View style={styles.draftHeader}>
                  <Text style={styles.draftTitle}>Sotuv #{draft.orderId}</Text>
                  <Text style={styles.draftDate}>
                    {(() => {
                      // Debug log qo'shamiz
                      console.log('Draft timestamp:', draft.timestamp);
                      console.log('Draft createdAt:', draft.createdAt);
                      console.log('Draft updatedAt:', draft.updatedAt);
                      
                      // Turli xil date field larni sinab ko'ramiz
                      const dateValue = draft.timestamp || draft.createdAt || draft.updatedAt || new Date();
                      const date = new Date(dateValue);
                      
                      if (isNaN(date.getTime())) {
                        console.error('Invalid date value:', dateValue);
                        return 'Sana topilmadi';
                      }
                      
                      return date.toLocaleDateString('uz-UZ');
                    })()}
                  </Text>
                </View>

                <View style={styles.draftProducts}>
                  {draft.products.map((product, index) => (
                    <Text key={index} style={styles.draftProduct}>
                      {product.name} - {parseDecimal(product.quantity)} {product.unit} x {parseDecimal(product.price).toLocaleString()} so'm
                    </Text>
                  ))}
                </View>

                <View style={styles.draftFooter}>
                  <Text style={styles.draftTotal}>
                    Jami: {parseDecimal(draft.totalSum).toLocaleString()} so'm
                  </Text>
                  {draft.status === 'draft' && (
                    <View style={styles.draftActions}>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={(e) => handleDeleteDraft(draft._id, e)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.confirmButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleConfirmDraft(draft._id);
                        }}
                      >
                        <Text style={styles.confirmButtonText}>Tasdiqlash</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Saqlangan sotuvlar yo'q</Text>
          )}
        </View>
      </ScrollView>

      <ProductSelector
        visible={showProductSelector}
        onClose={() => setShowProductSelector(false)}
        onSelect={(product) => {
          console.log('=== PRODUCT SELECTED DEBUG ===');
          console.log('Selected product:', product);
          console.log('Product image:', product.image);
          console.log('Product image type:', typeof product.image);
          console.log('Full product data:', JSON.stringify(product, null, 2));
          console.log('===============================');
          
          setSelectedProduct(product);
          setShowProductSelector(false);
          addToCart();
        }}
      />

              <ConfirmationModal
          visible={showConfirmModal}
          {...confirmModalConfig}
          onCancel={() => {
            setShowConfirmModal(false);
            // Modal yopilganda default holatga qaytaramiz, ammo installmentda mijoz ma'lumotini saqlaymiz
            if (selectedPaymentMethod !== 'installment') {
              setCustomerData(null);
            }
            setSelectedPaymentMethod('cash');
            setConfirmingDraft(null);
          }}
          loading={loading || loadingDrafts}
          showPaymentMethod={true}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={handlePaymentMethodChange}
          customerData={customerData}
          onShowAnketa={() => {
          // Anketa ochilganda mavjud ma'lumotlar qoladi, to'lov turini installmentga majburan o'rnatamiz
          setSelectedPaymentMethod('installment');
          setShowAnketaSelector(true);
        }}
          onClearCustomer={() => {
            setCustomerData(null);
            setSelectedPaymentMethod('cash');
          }}
        />

      <AnketaSelector
        visible={showAnketaSelector}
        onClose={() => {
          setShowAnketaSelector(false);
          // Modal yopilganda mijoz ma'lumotlarini tozalamaymiz
          // setCustomerData(null);
          // setSelectedPaymentMethod('cash');
          setConfirmingDraft(null);
        }}
        onConfirm={(data, duration, startDate) => {
          console.log('=== ANKETA CONFIRM DEBUG ===');
          console.log('Received customer data:', data);
          console.log('Received duration:', duration);
          console.log('Received start date:', startDate);
          console.log('Customer image:', data.image);
          
          setCustomerData({ 
            ...data, 
            installmentDuration: duration,
            installmentStartDate: startDate.toISOString()
          });
          setShowAnketaSelector(false);
          Toast.show({
            type: 'success',
            text1: 'Muvaffaqiyatli',
            text2: 'Mijoz ma\'lumotlari saqlandi',
          });
          
          console.log('Anketa data set successfully');
        }}
        loading={false}
        totalSum={(() => {
          if (cartItems.length > 0) {
            const sum = cartItems.reduce((s, item) => s + (item.product.price * item.quantity), 0);
            console.log('AnketaSelector totalSum (from cart):', sum);
            return sum;
          }
          if (confirmingDraft) {
            const sum = confirmingDraft.products.reduce((s, p) => {
              const price = typeof p.price === 'number' ? p.price : (p.price && '$numberDecimal' in p.price ? parseFloat(p.price.$numberDecimal) : 0);
              const qty = typeof p.quantity === 'number' ? p.quantity : (p.quantity && '$numberDecimal' in p.quantity ? parseFloat(p.quantity.$numberDecimal) : 0);
              return s + (price * qty);
            }, 0);
            console.log('AnketaSelector totalSum (from draft):', sum);
            return sum;
          }
          return 0;
        })()}
      />

      <Notifications 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <Toast 
        position='bottom'
        bottomOffset={20}
        visibilityTime={3000}
        autoHide={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  saleForm: {
    margin: 20,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
  },
  selectorLabel: {
    fontSize: 16,
    color: "#333",
  },
  productInfo: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  productInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  selectedProductImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  productInfoTexts: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  quantityInput: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  cartSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  cartItemDetails: {
    fontSize: 14,
    color: "#666",
  },
  cartItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginRight: 10,
  },
  removeButton: {
    padding: 5,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  totalLabel: {
    fontSize: 16,
    color: "#333",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#34C759",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  directSaleButton: {
    backgroundColor: '#34C759',
    marginTop: 10,
  },
  draftCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  draftTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  draftDate: {
    fontSize: 14,
    color: '#666',
  },
  draftProducts: {
    marginBottom: 10,
  },
  draftProduct: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  draftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  draftTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editingDraftCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF1F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  confirmModalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  confirmModalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  paymentMethodOptions: {
    flexDirection: 'column',
    gap: 10,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  paymentMethodHalf: {
    flex: 1,
  },
  paymentMethodFull: {
    width: '100%',
  },
  paymentMethodOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  // radio styles removed in favor of icon-based pills
  paymentMethodText: {
    fontSize: 17,
    color: '#333',
    flex: 1,
  },
  paymentMethodTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  installmentFormContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  anketaButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 8,
  },
  anketaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  customerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  clearCustomerButton: {
    padding: 5,
  },
});