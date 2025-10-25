import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { API_ENDPOINTS } from './api';

interface quantityValue {
  $numberDecimal: string;
}

interface Product {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  price: number;
  originalPrice: number;
  unit: string;
  unitSize: number;
  quantity: number;
  image?: string;
  status: 'active' | 'inactive' | 'archived';
  deliveryRegions?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FilterParams {
  category?: string;
  subcategory?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface ProductFormData {
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  unitSize: number;
  quantity: number;
  status?: 'active' | 'inactive' | 'archived';
  image?: string;
  deliveryRegions?: string[];
}

interface CategoryResponse {
  success: boolean;
  data: {
    categories: Category[];
    pagination?: {
      total: number;
      pages: number;
      page: number;
    };
  };
  // For backward compatibility
  categories?: Category[];
  pagination?: {
    total: number;
    pages: number;
    page: number;
  };
  // Legacy fields (keep for backward compatibility)
  total?: number;
  pages?: number;
  page?: number;
}

interface FormState {
  name: string;
  category: string;
  subcategory: string;
  price: string;
  originalPrice: string;
  unit: string;
  unitSize: string;
  quantity: string;
  image?: string;
  deliveryRegions: string[];
}

interface Region {
  _id: string;
  id?: string;
  name: string;
  type: string;
  code?: string;
  parent?: {
    _id: string;
    name: string;
    type: string;
  };
}

const INITIAL_FILTER: FilterParams = {
  page: 1,
  limit: 10,
  sort: 'name',
  order: 'asc'
};

// Helper function to safely convert any numeric value to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

const UNITS = ['dona', 'kg', 'litr'];

// Add new ViewScreen component at the top level
const ViewScreen = ({ product: initialProduct, categories, onClose }: {
  product: Product & { subcategoryName?: string },
  categories: Category[],
  onClose: () => void
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product & { subcategoryName?: string }>(initialProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      let response;
      let responseData;
      
      try {
        console.log('Fetching product with ID:', initialProduct.id);
        console.log('Using token:', token ? 'Token exists' : 'No token');
        
        const timestamp = new Date().getTime();
        const url = `https://api.ttsa.uz/api/shop-owner-mobile/product/${initialProduct.id}?_=${timestamp}`;
        console.log('Request URL:', url);
        
        try {
          response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            },
            cache: 'no-store'
          });
          console.log('Response status:', response.status);
        } catch (fetchError: any) {
          console.error('Network error during fetch:', fetchError);
          throw new Error(`Network error: ${fetchError?.message || 'Unknown network error'}`);
        }
        
        // Get response text first for debugging
        const responseText = await response.text();
        console.log('Raw response text:', responseText.substring(0, 200)); // Log first 200 chars
        
        try {
          responseData = JSON.parse(responseText);
          console.log('Parsed response data:', JSON.stringify(responseData, null, 2));
        } catch (parseError: any) {
          console.error('Failed to parse JSON:', parseError);
          console.error('Response headers:', JSON.stringify([...response.headers.entries()]));
          throw new Error(`Invalid JSON response: ${parseError?.message || 'Unknown error'}. Response: ${responseText.substring(0, 200)}`);
        }
        
        if (!response.ok) {
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
          });
          throw new Error(responseData?.message || `HTTP error! status: ${response.status}`);
        }
        
        if (!responseData) {
          console.error('Empty response data');
          throw new Error('Received empty response from server');
        }
        
        if (responseData.success === false) {
          console.error('API returned success: false', responseData);
          throw new Error(responseData.message || 'API request was not successful');
        }
        
        // Check if the response has 'product' or 'data' field
        const productData = responseData.product || responseData.data || responseData;
        
        if (!productData) {
          console.error('No product data in response:', responseData);
          throw new Error('No product data found in response');
        }
        
        console.log('Product data received:', JSON.stringify(productData, null, 2));
        
        // Map the response data to match our Product interface
        const mappedProduct = {
          id: productData.id || initialProduct.id,
          name: productData.name || '',
          price: toNumber(productData.price),
          category: {
            id: (productData.category?.id || '').toString(),
            name: (productData.category?.name || '').toString()
          },
          subcategory: {
            id: (productData.subcategory?.id || '').toString(),
            name: (productData.subcategory?.name || '').toString()
          },
          quantity: toNumber(productData.quantity) || 0,
          unit: (productData.unit || 'dona').toString(),
          unitSize: toNumber(productData.unitSize) || 1,
          originalPrice: toNumber(productData.originalPrice) || toNumber(productData.price) || 0,
          image: productData.image,
          status: (productData.status || 'active') as 'active' | 'inactive' | 'archived',
          deliveryRegions: productData.deliveryRegions || [],
          createdAt: (productData.createdAt || new Date().toISOString()).toString(),
          updatedAt: productData.updatedAt ? productData.updatedAt.toString() : undefined
        };
        
        console.log('Mapped product:', JSON.stringify(mappedProduct, null, 2));
        setProduct(mappedProduct);
      } catch (error) {
        console.error('Error in fetchProduct:', error);
        const errorMessage = error instanceof Error ? error.message : 'Noma\'lum xatolik';
        Alert.alert(
          'Xato', 
          `Mahsulot ma'lumotlarini yuklashda xatolik yuz berdi: ${errorMessage}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [initialProduct.id, token, categories]);

  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.viewScreenHeader}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.viewScreenTitle}>Mahsulot ma'lumotlari</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView style={styles.viewScreenContent}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Nomi</Text>
            <Text style={styles.detailValue}>{product.name}</Text>
          </View>

          {product.image && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Rasm</Text>
              <View style={styles.imagePreviewContainer}>
                  <Image 
                  source={{ uri: `https://api.ttsa.uz/uploads/products/${product.image}` }} 
                  style={styles.imagePreview} 
                  resizeMode="cover"
                />
              </View>
            </View>
          )}

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Kategoriya</Text>
            <Text style={styles.detailValue}>{product.category.name}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Subkategoriya</Text>
            <Text style={styles.detailValue}>{product.subcategory?.name || 'Subkategoriya yo\'q'}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Narx</Text>
            {product.originalPrice && product.originalPrice !== product.price ? (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={[styles.detailLabel, { width: 120 }]}>Asl narxi:</Text>
                  <Text style={[styles.detailValue, { color: '#999' }]}>
                    {product.originalPrice.toLocaleString()} so'm / {product.unit}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.detailLabel, { width: 120 }]}>Sotuvdagi narxi:</Text>
                  <Text style={[styles.detailValue, { color: '#e74c3c', fontWeight: 'bold' }]}>
                    {product.price.toLocaleString()} so'm / {product.unit}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.detailLabel, { width: 120 }]}>Narxi:</Text>
                <Text style={styles.detailValue}>
                  {product.price.toLocaleString()} so'm / {product.unit}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Birlik o'lchami</Text>
            <Text style={styles.detailValue}>{product.unitSize} {product.unit}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Ombordagi miqdori</Text>
            <Text style={styles.detailValue}>
              {typeof product.quantity === 'object' && product.quantity !== null && '$numberDecimal' in product.quantity
                ? parseFloat(product.quantity.$numberDecimal).toLocaleString('uz-UZ')
                : (product.quantity || 0).toLocaleString('uz-UZ')} {product.unit}
            </Text>
          </View>

          {product.deliveryRegions && product.deliveryRegions.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Yetkazib berish hududlari</Text>
              <Text style={styles.detailValue}>
                {product.deliveryRegions.map(region => region.name).join(', ')}
              </Text>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
};

// Add new EditScreen component at the top level
const EditScreen = ({
  product,
  categories: initialCategories,
  onSave,
  onClose
}: {
  product: Product,
  categories: Category[],
  onSave: (form: ProductFormData) => void,
  onClose: () => void
}) => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  
  // Regions state
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [showRegionsModal, setShowRegionsModal] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: product?.name || '',
    category: product?.category?.id.toString() || '',
    subcategory: product?.subcategory?.id || '',
    price: product?.price ? product.price.toString() : '0',
    originalPrice: product?.originalPrice ? product.originalPrice.toString() : '',
    unit: product?.unit || 'dona',
    unitSize: (product?.unitSize || 1).toString(),
    quantity: (product?.quantity || 0).toString(),
    image: product?.image,
    deliveryRegions: [],
  });

  // Fetch regions on component mount
  useEffect(() => {
    console.log('EditScreen useEffect - fetching regions...');
    fetchRegions();
  }, []);

  // Initialize selected regions when product has delivery regions
  useEffect(() => {
    if (product?.deliveryRegions && product.deliveryRegions.length > 0) {
      console.log('EditScreen - Product delivery regions:', product.deliveryRegions);
      // Convert product delivery regions to Region format for selectedRegions
      const productRegions = product.deliveryRegions.map(region => ({
        _id: region.id,
        id: region.id,
        name: region.name,
        type: region.type
      }));
      console.log('EditScreen - Converted regions:', productRegions);
      setSelectedRegions(productRegions);
    }
  }, [product?.deliveryRegions]);

  // Update form.deliveryRegions when selectedRegions changes
  useEffect(() => {
    if (selectedRegions.length > 0) {
      setForm(prev => ({
        ...prev,
        deliveryRegions: selectedRegions.map(region => region._id)
      }));
    }
  }, [selectedRegions]);

  const fetchRegions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.REGIONS.LIST, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
        if (data.success && data.data) {
          console.log('Regions loaded:', data.data);
          console.log('Regions count:', data.data.length);
          setRegions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleRegionToggle = (region: Region) => {
    console.log('Region toggled:', region);
    setSelectedRegions(prev => {
      const isSelected = prev.some(r => r._id === region._id);
      console.log('Is selected:', isSelected);
      if (isSelected) {
        const newRegions = prev.filter(r => r._id !== region._id);
        console.log('Removed region, new count:', newRegions.length);
        return newRegions;
      } else {
        const newRegions = [...prev, region];
        console.log('Added region, new count:', newRegions.length);
        return newRegions;
      }
    });
  };

  const handleRegionsSave = () => {
    console.log('Saving regions:', selectedRegions);
    setForm(prev => ({
      ...prev,
      deliveryRegions: selectedRegions.map(region => region._id)
    }));
    console.log('Form updated with delivery regions:', selectedRegions.map(region => region._id));
    setShowRegionsModal(false);
  };

  console.log('EditScreen - Product image:', product?.image);
  console.log('EditScreen - Form image:', form.image);

  // Load subcategories when the selected category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!form.category) return;
      
      try {
        const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/category/${form.category}?includeSubcategories=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        const responseData = await response.json();
        
        if (responseData.success) {
          const subcategories = responseData.data?.subcategories || [];
          console.log('Fetched subcategories:', subcategories);
          
          // Update the categories state with the new subcategories
          setCategories(prevCategories => 
            prevCategories.map(cat => 
              cat.id === form.category 
                ? { ...cat, subcategories } 
                : cat
            )
          );
        }
      } catch (error) {
        console.error('Error loading subcategories:', error);
      }
    };
    
    loadSubcategories();
  }, [form.category, token]);

  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'category'

  // Image picker function
  const pickImage = async () => {
    try {
      console.log('=== PICK IMAGE DEBUG ===');
      console.log('Opening image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);
      console.log('Result canceled:', result.canceled);
      console.log('Result assets:', result.assets);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage);
        console.log('Image URI:', selectedImage.uri);
        console.log('Image type:', selectedImage.type);
        console.log('Image width:', selectedImage.width);
        console.log('Image height:', selectedImage.height);
        
        setForm(prev => {
          console.log('Previous form state:', prev);
          const newState = {
            ...prev,
            image: selectedImage.uri
          };
          console.log('New form state:', newState);
          return newState;
        });
      } else {
        console.log('No image selected or picker was canceled');
      }
      
      console.log('=== END PICK IMAGE DEBUG ===');
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Xato', 'Rasm tanlashda xatolik yuz berdi');
    }
  };

  const handleSave = () => {
    // Convert string values to numbers before saving
    const price = parseFloat(form.price) || 0;
    const unitSize = parseFloat(form.unitSize) || 1;
    const quantity = parseFloat(form.quantity) || 0;
    
    // Parse originalPrice if provided, otherwise set to undefined
    let originalPrice: number | undefined;
    if (form.originalPrice && form.originalPrice.trim() !== '') {
      const parsed = parseFloat(form.originalPrice);
      if (!isNaN(parsed) && parsed > 0) {
        originalPrice = parsed;
      }
    }
    
    // Validate inputs
    if (isNaN(price) || price <= 0) {
      Alert.alert('Xato', 'Noto\'g\'ri narx kiritilgan');
      return;
    }
    
    if (isNaN(unitSize) || unitSize <= 0) {
      Alert.alert('Xato', 'Noto\'g\'ri birlik o\'lchami kiritilgan');
      return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Xato', 'Noto\'g\'ri miqdor kiritilgan');
      return;
    }
    
    // Only include originalPrice in the saved data if it's a valid number
    const saveData: any = {
      ...form,
      price,
      unitSize,
      quantity
    };
    
    if (originalPrice !== undefined) {
      saveData.originalPrice = originalPrice;
    }
    
    // Include image if it exists
    if (form.image) {
      saveData.image = form.image;
    }
    
    onSave(saveData);
  };

  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.editScreenHeader}>
        <View style={styles.editHeaderLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.editScreenTitle}>Mahsulotni tahrirlash</Text>
        </View>
        <TouchableOpacity
          style={styles.editSaveButton}
          onPress={handleSave}
        >
          <Text style={styles.editSaveButtonText}>Saqlash</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.editTabsContainer}>
        <TouchableOpacity
          style={[styles.editTab, activeTab === 'basic' && styles.editTabActive]}
          onPress={() => setActiveTab('basic')}
        >
          <Text style={[styles.editTabText, activeTab === 'basic' && styles.editTabTextActive]}>
            Asosiy ma'lumotlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editTab, activeTab === 'category' && styles.editTabActive]}
          onPress={() => setActiveTab('category')}
        >
          <Text style={[styles.editTabText, activeTab === 'category' && styles.editTabTextActive]}>
            Kategoriya
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'basic' ? (
        <ScrollView style={styles.editScreenContent}>
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Mahsulot nomi</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Mahsulot nomini kiriting"
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Narx va miqdor</Text>
            <View style={styles.editRow}>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Narxi</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="0"
                  value={form.price.toString()}
                  onChangeText={(text) => setForm(prev => ({
                    ...prev,
                    price: parseInt(text) || 0
                  }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Asl narxi (ixtiyoriy)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="0"
                  value={form.originalPrice}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({
                        ...prev,
                        originalPrice: text
                      }));
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Miqdori</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="0"
                  value={form.quantity}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({
                        ...prev,
                        quantity: text
                      }));
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Yetkazib berish hududlari</Text>
            <View style={styles.editFullInput}>
              <Text style={styles.editInputLabel}>Hududlarni tanlang</Text>
              <TouchableOpacity
                style={styles.regionSelector}
                onPress={() => setShowRegionsModal(true)}
              >
                <Text style={styles.regionSelectorText}>
                  {selectedRegions.length > 0 
                    ? `${selectedRegions.length} ta hudud tanlangan (${selectedRegions.map(r => r.name).join(', ')})`
                    : 'Hududlarni tanlang'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>


          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>O'lchov birligi</Text>
            <View style={styles.unitsContainer}>
              {UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    form.unit === unit && styles.unitButtonActive
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, unit }))}
                >
                  <Text style={[
                    styles.unitButtonText,
                    form.unit === unit && styles.unitButtonTextActive
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.editRow}>
              <View style={styles.editFullInput}>
                <Text style={styles.editInputLabel}>Birlik o'lchami</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="1"
                  value={form.unitSize}
                  onChangeText={(text) => {
                    // Replace comma with dot
                    text = text.replace(',', '.');
                    // Allow only numbers and one decimal point
                    if (/^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({ ...prev, unitSize: text }));
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Mahsulot rasmi (ixtiyoriy)</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              {form.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ 
                      uri: form.image.startsWith('http') || form.image.startsWith('file://') || form.image.startsWith('data:')
                        ? form.image 
                        : `https://api.ttsa.uz/uploads/products/${form.image}` 
                    }} 
                    style={styles.imagePreview} 
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setForm(prev => ({ ...prev, image: undefined }))}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={48} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Rasm qo'shish</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.editScreenContent}>
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Kategoriyani tanlang</Text>
            {categories.map((category) => (
              <View key={category._id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    form.category === category._id && styles.categoryButtonActive
                  ]}
                  onPress={() => {
                    setForm(prev => ({
                      ...prev,
                      category: category._id,
                      subcategory: undefined
                    }));
                  }}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    form.category === category._id && styles.categoryButtonTextActive
                  ]}>
                    {category.name}
                  </Text>
                  {form.category === category._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>

                {form.category === category._id && category.subcategories.length > 0 && (
                  <View style={styles.subcategoriesContainer}>
                    {category.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub._id}
                        style={[
                          styles.subcategoryButton,
                          form.subcategory === sub._id && styles.subcategoryButtonActive
                        ]}
                        onPress={() => setForm(prev => ({
                          ...prev,
                          subcategory: sub._id
                        }))}
                      >
                        <Text style={[
                          styles.subcategoryButtonText,
                          form.subcategory === sub._id && styles.subcategoryButtonTextActive
                        ]}>
                          {sub.name}
                        </Text>
                        {form.subcategory === sub._id && (
                          <Ionicons name="checkmark" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Regions Modal */}
      <Modal
        visible={showRegionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRegionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hududlarni tanlang</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleRegionsSave}
            >
              <Text style={styles.modalSaveButtonText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.regionsList}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region._id}
                style={[
                  styles.regionItem,
                  selectedRegions.some(r => r._id === region._id) && styles.regionItemSelected
                ]}
                onPress={() => handleRegionToggle(region)}
              >
                <Text style={[
                  styles.regionItemText,
                  selectedRegions.some(r => r._id === region._id) && styles.regionItemTextSelected
                ]}>
                  {region.name}
                </Text>
                {selectedRegions.some(r => r._id === region._id) && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// Add new CreateScreen component at the top level
const CreateScreen = ({
  categories,
  onSave,
  onClose
}: {
  categories: Category[],
  onSave: (form: ProductFormData) => void,
  onClose: () => void
}) => {
  const [form, setForm] = useState<FormState>({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    unit: 'dona',
    unitSize: '1',
    quantity: '0',
    image: undefined,
    deliveryRegions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Regions state
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [mfys, setMfys] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [showRegionsModal, setShowRegionsModal] = useState(false);
  const { token } = useAuth();

  // Fetch regions on component mount
  useEffect(() => {
    console.log('EditScreen useEffect - fetching regions...');
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.REGIONS.LIST, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
        if (data.success && data.data) {
          console.log('Regions loaded:', data.data);
          console.log('Regions count:', data.data.length);
          setRegions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const handleRegionToggle = (region: Region) => {
    console.log('Region toggled:', region);
    setSelectedRegions(prev => {
      const isSelected = prev.some(r => r._id === region._id);
      console.log('Is selected:', isSelected);
      if (isSelected) {
        const newRegions = prev.filter(r => r._id !== region._id);
        console.log('Removed region, new count:', newRegions.length);
        return newRegions;
      } else {
        const newRegions = [...prev, region];
        console.log('Added region, new count:', newRegions.length);
        return newRegions;
      }
    });
  };

  const handleRegionsSave = () => {
    console.log('Saving regions:', selectedRegions);
    setForm(prev => ({
      ...prev,
      deliveryRegions: selectedRegions.map(region => region._id)
    }));
    console.log('Form updated with delivery regions:', selectedRegions.map(region => region._id));
    setShowRegionsModal(false);
  };

  // Image picker function
  const pickImage = async () => {
    try {
      console.log('=== PICK IMAGE DEBUG ===');
      console.log('Opening image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);
      console.log('Result canceled:', result.canceled);
      console.log('Result assets:', result.assets);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage);
        console.log('Image URI:', selectedImage.uri);
        console.log('Image type:', selectedImage.type);
        console.log('Image width:', selectedImage.width);
        console.log('Image height:', selectedImage.height);
        
        setForm(prev => {
          console.log('Previous form state:', prev);
          const newState = {
            ...prev,
            image: selectedImage.uri
          };
          console.log('New form state:', newState);
          return newState;
        });
      } else {
        console.log('No image selected or picker was canceled');
      }
      
      console.log('=== END PICK IMAGE DEBUG ===');
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Xato', 'Rasm tanlashda xatolik yuz berdi');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = 'Mahsulot nomi kiritilishi shart';
    if (!form.category) newErrors.category = 'Kategoriya tanlanishi shart';
    if (!form.subcategory) newErrors.subcategory = 'Subkategoriya tanlanishi shart';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) 
      newErrors.price = 'Noto\'g\'ri narx kiritilgan';
    if (form.originalPrice && (isNaN(Number(form.originalPrice)) || Number(form.originalPrice) <= 0))
      newErrors.originalPrice = 'Noto\'g\'ri asl narx kiritilgan';
    if (isNaN(Number(form.quantity)) || Number(form.quantity) < 0)
      newErrors.quantity = 'Noto\'g\'ri miqdor kiritilgan';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const price = parseFloat(form.price.toString());
      const unitSize = parseFloat(form.unitSize.toString());
      const quantity = parseFloat(form.quantity.toString());
      const originalPrice = form.originalPrice ? parseFloat(form.originalPrice.toString()) : undefined;
      
      // Ensure we have valid numbers
      if (isNaN(price) || isNaN(unitSize) || isNaN(quantity)) {
        throw new Error('Invalid number format');
      }
      
      console.log('=== HANDLE SAVE DEBUG ===');
      console.log('Form state before creating productData:', form);
      console.log('Form image value:', form.image);
      console.log('Form image type:', typeof form.image);
      
      const productData: ProductFormData = {
        name: form.name.trim(),
        category: form.category.toString(),
        subcategory: form.subcategory.toString(),
        price,
        unit: form.unit,
        unitSize,
        quantity,  // Changed from quantity to quantity
        status: 'active',
        ...(originalPrice && { originalPrice }),
        ...(form.image && { image: form.image })
      };
      
      console.log('Product data being sent to onSave:', productData);
      console.log('Product data image field:', productData.image);
      console.log('=== END HANDLE SAVE DEBUG ===');
      
      onSave(productData);
    } catch (error) {
      console.error('Error preparing product data:', error);
      Alert.alert('Xato', 'Ma\'lumotlarni tayyorlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.editScreenHeader}>
        <View style={styles.editHeaderLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.editScreenTitle}>Yangi mahsulot</Text>
        </View>
        <TouchableOpacity
          style={[styles.editSaveButton, isSubmitting && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.editSaveButtonText}>Saqlash</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.editTabsContainer}>
        <TouchableOpacity
          style={[styles.editTab, activeTab === 'basic' && styles.editTabActive]}
          onPress={() => setActiveTab('basic')}
        >
          <Text style={[styles.editTabText, activeTab === 'basic' && styles.editTabTextActive]}>
            Asosiy ma'lumotlar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.editTab, activeTab === 'category' && styles.editTabActive]}
          onPress={() => setActiveTab('category')}
        >
          <Text style={[styles.editTabText, activeTab === 'category' && styles.editTabTextActive]}>
            Kategoriya
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'basic' ? (
        <ScrollView style={styles.editScreenContent}>
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Mahsulot nomi</Text>
            <TextInput
              style={styles.editInput}
              placeholder="Mahsulot nomini kiriting"
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Narx va miqdor</Text>
            <View style={styles.editRow}>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Narxi *</Text>
                <TextInput
                  style={[styles.editInput, errors.price && styles.inputError]}
                  placeholder="0"
                  value={form.price}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({
                        ...prev,
                        price: text
                      }));
                      if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                    }
                  }}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
              </View>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Asl narxi (ixtiyoriy)</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="0"
                  value={form.originalPrice}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({
                        ...prev,
                        originalPrice: text
                      }));
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.editHalfInput}>
                <Text style={styles.editInputLabel}>Miqdori *</Text>
                <TextInput
                  style={[styles.editInput, errors.quantity && styles.inputError]}
                  placeholder="0"
                  value={form.quantity}
                  onChangeText={(text) => {
                    // Allow only numbers and one decimal point
                    if (text === '' || /^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({
                        ...prev,
                        quantity: text
                      }));
                      if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
                    }
                  }}
                  keyboardType="numeric"
                />
                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
              </View>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Yetkazib berish hududlari</Text>
            <View style={styles.editFullInput}>
              <Text style={styles.editInputLabel}>Hududlarni tanlang</Text>
              <TouchableOpacity
                style={styles.regionSelector}
                onPress={() => setShowRegionsModal(true)}
              >
                <Text style={styles.regionSelectorText}>
                  {selectedRegions.length > 0 
                    ? `${selectedRegions.length} ta hudud tanlangan (${selectedRegions.map(r => r.name).join(', ')})`
                    : 'Hududlarni tanlang'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>


          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>O'lchov birligi</Text>
            <View style={styles.unitsContainer}>
              {UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    form.unit === unit && styles.unitButtonActive
                  ]}
                  onPress={() => setForm(prev => ({ ...prev, unit }))}
                >
                  <Text style={[
                    styles.unitButtonText,
                    form.unit === unit && styles.unitButtonTextActive
                  ]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.editRow}>
              <View style={styles.editFullInput}>
                <Text style={styles.editInputLabel}>Birlik o'lchami</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="1"
                  value={form.unitSize}
                  onChangeText={(text) => {
                    // Replace comma with dot
                    text = text.replace(',', '.');
                    // Allow only numbers and one decimal point
                    if (/^\d*\.?\d*$/.test(text)) {
                      setForm(prev => ({ ...prev, unitSize: text }));
                    }
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Mahsulot rasmi (ixtiyoriy)</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              {form.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ 
                      uri: form.image.startsWith('http') || form.image.startsWith('file://') || form.image.startsWith('data:')
                        ? form.image 
                        : `https://api.ttsa.uz/uploads/products/${form.image}` 
                    }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setForm(prev => ({ ...prev, image: undefined }))}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Ionicons name="camera-outline" size={48} color="#007AFF" />
                  <Text style={styles.imagePickerText}>Rasm qo'shish</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.editScreenContent}>
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Kategoriyani tanlang</Text>
            {categories.map((category) => (
              <View key={category._id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    form.category === category._id && styles.categoryButtonActive
                  ]}
                  onPress={() => {
                    setForm(prev => ({
                      ...prev,
                      category: category._id,
                      subcategory: undefined
                    }));
                  }}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    form.category === category._id && styles.categoryButtonTextActive
                  ]}>
                    {category.name}
                  </Text>
                  {form.category === category._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  )}
                </TouchableOpacity>

                {form.category === category._id && category.subcategories.length > 0 && (
                  <View style={styles.subcategoriesContainer}>
                    {category.subcategories.map((sub) => (
                      <TouchableOpacity
                        key={sub._id}
                        style={[
                          styles.subcategoryButton,
                          form.subcategory === sub._id && styles.subcategoryButtonActive
                        ]}
                        onPress={() => setForm(prev => ({
                          ...prev,
                          subcategory: sub._id
                        }))}
                      >
                        <Text style={[
                          styles.subcategoryButtonText,
                          form.subcategory === sub._id && styles.subcategoryButtonTextActive
                        ]}>
                          {sub.name}
                        </Text>
                        {form.subcategory === sub._id && (
                          <Ionicons name="checkmark" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Regions Modal */}
      <Modal
        visible={showRegionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRegionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Hududlarni tanlang</Text>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleRegionsSave}
            >
              <Text style={styles.modalSaveButtonText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.regionsList}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region._id}
                style={[
                  styles.regionItem,
                  selectedRegions.some(r => r._id === region._id) && styles.regionItemSelected
                ]}
                onPress={() => handleRegionToggle(region)}
              >
                <Text style={[
                  styles.regionItemText,
                  selectedRegions.some(r => r._id === region._id) && styles.regionItemTextSelected
                ]}>
                  {region.name}
                </Text>
                {selectedRegions.some(r => r._id === region._id) && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default function ProductsScreen() {
  const router = useRouter();
  const { token, admin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Add loading state for initial load

  // Filter states
  const [filterParams, setFilterParams] = useState<FilterParams>(INITIAL_FILTER);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Regions state
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [mfys, setMfys] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [showRegionsModal, setShowRegionsModal] = useState(false);

  // Product form states
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: 0,
    originalPrice: 0,
    unit: 'dona',
    unitSize: 1,
    quantity: 0,
    image: undefined
  });

  // Pagination
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    page: 1
  });

  const [viewingProduct, setViewingProduct] = useState<(Product & { subcategoryName?: string }) | null>(null);
  const [editingFullScreen, setEditingFullScreen] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Image picker function
  const pickImage = async () => {
    try {
      console.log('=== PICK IMAGE DEBUG ===');
      console.log('Opening image picker...');
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);
      console.log('Result canceled:', result.canceled);
      console.log('Result assets:', result.assets);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage);
        console.log('Image URI:', selectedImage.uri);
        console.log('Image type:', selectedImage.type);
        console.log('Image width:', selectedImage.width);
        console.log('Image height:', selectedImage.height);
        
        console.log('Previous productForm state:', productForm);
        
        setProductForm(prev => {
          console.log('Setting productForm with image, prev state:', prev);
          const newState = {
            ...prev,
            image: selectedImage.uri
          };
          console.log('New productForm state:', newState);
          return newState;
        });
        
        console.log('productForm state after setProductForm call:', productForm);
      } else {
        console.log('No image selected or picker was canceled');
      }
      
      console.log('=== END PICK IMAGE DEBUG ===');
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Xato', 'Rasm tanlashda xatolik yuz berdi');
    }
  };

  // Function to fetch subcategories for a category
  const fetchSubcategories = async (categoryId: string) => {
    if (!token) {
      console.log('No token available for fetching subcategories');
      return [];
    }
    
    try {
              const url = `https://api.ttsa.uz/api/shop-owner-mobile/category/${categoryId}?includeSubcategories=true`;
      console.log('Fetching subcategories from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const responseText = await response.text();
      console.log('Raw subcategories response:', responseText.substring(0, 200)); // Log first 200 chars
      
      if (!response.ok) {
        console.error('Error response status:', response.status);
        console.error('Error response text:', responseText);
        throw new Error(`Failed to fetch subcategories: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Response content type:', response.headers.get('content-type'));
        throw new Error('Invalid JSON response from server');
      }
      
      if (!data.success) {
        console.error('API returned success:false', data);
        return [];
      }
      
      if (data.category?.subcategories) {
        // Map the subcategories to match the expected format
        const subcategories = data.category.subcategories.map((sub: any) => ({
          _id: sub.id || sub._id,
          name: sub.name,
          description: sub.description || ''
        }));
        console.log(`Fetched ${subcategories.length} subcategories`);
        return subcategories;
      }
      
      console.log('No subcategories found in response');
      return [];
    } catch (error) {
      console.error(`Error fetching subcategories for category ${categoryId}:`, error);
      return [];
    }
  };

  // Load categories for filter
  const fetchCategories = async () => {
    console.log('Fetching categories, token exists:', !!token);

    if (!token) {
      console.log('No token, clearing categories');
      setCategories([]);
      return;
    }
    
    try {
              const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/category/list', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      const responseData = await response.json();
      console.log('Categories API Response:', JSON.stringify(responseData, null, 2));

      if (responseData.success) {
        // Handle both possible response structures
        const categoriesData = responseData.data?.categories || responseData.categories || [];
        
        // First, map categories without subcategories
        let formattedCategories = categoriesData.map((category: any) => ({
          _id: category.id || category._id,
          name: category.name,
          subcategories: []
        }));
        
        console.log('Initial formatted categories:', formattedCategories);
        
        // Then fetch subcategories for each category
        const categoriesWithSubcategories = await Promise.all(
          formattedCategories.map(async (category: any) => {
            const subcategories = await fetchSubcategories(category._id);
            return {
              ...category,
              subcategories
            };
          })
        );
        
        console.log('Categories with subcategories:', categoriesWithSubcategories);
        setCategories(categoriesWithSubcategories);
      } else {
        console.error('Failed to fetch categories:', responseData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products with filters
  const fetchProducts = async (page = 1, refresh = false) => {
    console.log('Fetching products, page:', page, 'refresh:', refresh, 'token exists:', !!token);

    if (!token) {
      console.log('No token available');
      return;
    }

    // Set loading states
    if (page === 1 || refresh) {
      setLoading(true);
      setProducts([]);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Prepare query parameters
      const queryParams = new URLSearchParams({
        ...(filterParams.category && { category: filterParams.category }),
        ...(filterParams.subcategory && { subcategory: filterParams.subcategory }),
        ...(filterParams.search && { search: filterParams.search }),
        sort: filterParams.sort || 'name',
        order: filterParams.order || 'asc',
        page: page.toString(),
        limit: filterParams.limit.toString()
      });

      // Make API request
              const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/list?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();
      console.log('Products API Response:', JSON.stringify(responseData, null, 2));

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch products');
      }

      // Handle successful response
      if (responseData.success) {
        // Get products from the response
        const apiProducts = responseData.products || [];
        const totalCount = responseData.count || 0;

        // Map API products to match our Product interface
        const mappedProducts = apiProducts.map((apiProduct: any) => {
          console.log('API Product:', JSON.stringify(apiProduct, null, 2));
          return {
            id: apiProduct.id,
            name: apiProduct.name,
            price: apiProduct.price,
            originalPrice: apiProduct.originalPrice || apiProduct.price,
            category: {
              id: apiProduct.category?.id || '',
              name: apiProduct.category?.name || '',
            },
            subcategory: {
              id: apiProduct.subcategory?.id || '',
              name: apiProduct.subcategory?.name || '',
            },
            quantity: apiProduct.quantity || 0,
            unit: apiProduct.unit || 'dona',
            unitSize: apiProduct.unitSize || 1,
            image: apiProduct.image,
            status: apiProduct.status || 'active',
            deliveryRegions: apiProduct.deliveryRegions || [],
            createdAt: apiProduct.createdAt,
            updatedAt: apiProduct.updatedAt
          };
        });

        // Update state based on pagination
        if (refresh || page === 1) {
          setProducts(mappedProducts);
        } else {
          setProducts(prev => [...prev, ...mappedProducts]);
        }
        
        // Update pagination
        setPagination({
          total: totalCount,
          pages: Math.ceil(totalCount / filterParams.limit),
          page: page
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Xato', 'Mahsulotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Fetch products by status
  const fetchProductsByStatus = async (status: 'active' | 'inactive' | 'archived') => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/list?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        return data.products;
      } else {
        throw new Error(data.message || 'Failed to fetch products by status');
      }
    } catch (error) {
      console.error('Error fetching products by status:', error);
      throw error;
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/list?category=${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        return data.products;
      } else {
        throw new Error(data.message || 'Failed to fetch products by category');
      }
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  };

  // Fetch products by subcategory
  const fetchProductsBySubcategory = async (subcategoryId: string) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/list?subcategory=${subcategoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        return data.products;
      } else {
        throw new Error(data.message || 'Failed to fetch products by subcategory');
      }
    } catch (error) {
      console.error('Error fetching products by subcategory:', error);
      throw error;
    }
  };

  // Handle initial load and token changes
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      console.log('Initializing data, token exists:', !!token);

      if (!token) {
        console.log('No token, redirecting to login');
        router.replace('/login');
        return;
      }

      try {
        // Reset all states first
        if (isMounted) {
          setProducts([]);
          setCategories([]);
          setPagination({
            total: 0,
            pages: 0,
            page: 1,
          });
          setSelectedCategory('');
          setSelectedSubcategory('');
          setSearchQuery('');
          setFilterParams(INITIAL_FILTER);
          setLoading(true);
        }

        // Fetch data
        await fetchCategories();
        await fetchProducts(1, true);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const fetchRegions = async () => {
    try {
      if (!token) return;
      
      const response = await fetch(API_ENDPOINTS.REGIONS.LIST, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
        if (data.success && data.data) {
          console.log('Regions loaded:', data.data);
          console.log('Regions count:', data.data.length);
          setRegions(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  // Handle screen focus
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace('/login');
        return;
      }

      const refreshData = async () => {
        try {
          console.log('Screen focused, refreshing data...');
          setRefreshing(true);
          await fetchCategories();
          await fetchRegions();
          await fetchProducts(1, true);
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          setRefreshing(false);
        }
      };

      refreshData();
    }, [token])
  );

  // Handle filter changes
  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => {
        fetchProducts(1, true);
      }, 300); // Add debounce to prevent rapid requests

      return () => clearTimeout(timer);
    }
  }, [filterParams, token]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    console.log('Pull to refresh triggered, token exists:', !!token);

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      setRefreshing(true);
      // Reset pagination and fetch fresh data
      setPagination(prev => ({
        ...prev,
        page: 1,
        pages: 0,
        total: 0
      }));

      // Reset filters
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSearchQuery('');
      setFilterParams(INITIAL_FILTER);

      // Fetch fresh data
      await Promise.all([
        fetchCategories(),
        fetchProducts(1, true)
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  // Load more
  const loadMore = useCallback(() => {
    if (!loadingMore && pagination.page < pagination.pages && token) {
      setLoadingMore(true);
      fetchProducts(pagination.page + 1);
    }
  }, [loadingMore, pagination, token]);

  // Apply filters
  const applyFilters = () => {
    const newFilters: FilterParams = {
      ...filterParams,
      page: 1, // Reset to first page when filters change
    };

    // Only include non-empty filters
    if (selectedCategory) newFilters.category = selectedCategory;
    if (selectedSubcategory) newFilters.subcategory = selectedSubcategory;
    if (searchQuery) newFilters.search = searchQuery;

    setFilterParams(newFilters);
    setFilterModalVisible(false);
    fetchProducts(1, true); // Force refresh with new filters
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSearchQuery('');
    setFilterParams(INITIAL_FILTER);
    setFilterModalVisible(false);
    fetchProducts(1, true); // Force refresh with reset filters
  };

  // Render product item in the list
  const renderProduct = ({ item }: { item: Product & { subcategoryName?: string } }) => (
    <ProductCard
      item={item}
      onView={(id) => {
        // Find the product to view
        const productToView = products.find(p => p.id === id);
        if (productToView) {
          setViewingProduct({
            ...productToView,
            subcategoryName: categories
              .flatMap(cat => cat.subcategories)
              .find(sub => sub.id === productToView.subcategory.id)?.name
          });
        }
      }}
      onEdit={setEditingFullScreen}
      onDelete={handleDeleteProduct}
      token={token}
      categories={categories}
    />
  );

  // Product management functions
  // Create product function with new API format
  const createProduct = async (productData: ProductFormData) => {
    try {
      console.log('=== CREATE PRODUCT DEBUG ===');
      console.log('Input productData:', productData);
      
      // Prepare request body according to new API format
      const requestBody: any = {
        name: productData.name,
        price: productData.price,
        originalPrice: productData.originalPrice,
        subcategory: productData.subcategory,
        quantity: productData.quantity,
        unit: productData.unit,
        unitSize: productData.unitSize,
        status: productData.status || 'active',
        deliveryRegions: productData.deliveryRegions || [],
      };
      
      // Handle image
      if (productData.image) {
        if (productData.image.startsWith('data:image')) {
          // Image is already base64, keep as is
          requestBody.image = productData.image;
          console.log('Image is base64 format');
        } else if (productData.image.startsWith('file://')) {
          // Convert file URI to base64
          console.log('Converting file URI to base64');
          try {
            const base64 = await FileSystem.readAsStringAsync(productData.image, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const fileExtension = productData.image.split('.').pop() || 'jpeg';
            const mimeType = `image/${fileExtension}`;
            requestBody.image = `data:${mimeType};base64,${base64}`;
            console.log('Image converted to base64 successfully');
          } catch (error) {
            console.error('Error converting image to base64:', error);
            throw new Error('Rasmni yuklashda xatolik yuz berdi');
          }
        }
      }
      
      console.log('Final product data to send:', requestBody);
      
      const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/product/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Mahsulot yaratishda xatolik');
      }
      
      console.log('=== END CREATE PRODUCT DEBUG ===');
      return result;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      console.log('=== VALIDATION DEBUG ===');
      console.log('productForm:', productForm);
      console.log('name:', productForm.name, 'type:', typeof productForm.name);
      console.log('price:', productForm.price, 'type:', typeof productForm.price);
      console.log('category:', productForm.category, 'type:', typeof productForm.category);
      console.log('subcategory:', productForm.subcategory, 'type:', typeof productForm.subcategory);
      console.log('quantity:', productForm.quantity, 'type:', typeof productForm.quantity);
      console.log('=== END VALIDATION DEBUG ===');
      
      if (!productForm.name || !productForm.price || !productForm.category || !productForm.subcategory || productForm.quantity === undefined) {
        Alert.alert('Xato', 'Iltimos, barcha majburiy maydonlarni to\'ldiring');
        return;
      }

      // Convert numeric fields to numbers
      const price = Number(productForm.price);
      const quantity = Number(productForm.quantity);
      const unitSize = Number(productForm.unitSize) || 1;
      const originalPrice = productForm.originalPrice && productForm.originalPrice > 0 
        ? Number(productForm.originalPrice)
        : price; // Default to price if not provided

      // Prepare product data
      const productData = {
        name: productForm.name.trim(),
        price: price,
        category: productForm.category,
        subcategory: productForm.subcategory,
        quantity: quantity,
        originalPrice: originalPrice,
        unit: productForm.unit || 'dona',
        unitSize: unitSize,
        status: 'active',
        ...(productForm.image && { image: productForm.image })
      };

      // Validate numeric fields
      if (isNaN(price) || price <= 0) {
        Alert.alert('Xato', 'Noto\'g\'ri narx kiritilgan');
        return;
      }
      
      if (isNaN(quantity) || quantity < 0) {
        Alert.alert('Xato', 'Noto\'g\'ri miqdor kiritilgan');
        return;
      }
      
      if (isNaN(unitSize) || unitSize <= 0) {
        Alert.alert('Xato', 'Noto\'g\'ri birlik o\'lchami kiritilgan');
        return;
      }

      console.log('Creating product with data:', productData);

      // Use the new createProduct function
      const result = await createProduct(productData);

      if (result.success) {
        setProductModalVisible(false);
        setEditingFullScreen(null);
        setIsCreating(false);
        setProductForm({
          name: '',
          category: '',
          subcategory: '',
          price: 0,
          originalPrice: 0,
          unit: 'dona',
          unitSize: 1,
          quantity: 0,
          image: undefined,
          deliveryRegions: [],
        });
        fetchProducts(1, true);
        Alert.alert('Muvaffaqiyatli', result.message || 'Mahsulot muvaffaqiyatli yaratildi');
      } else {
        const errorMessage = result.message || result.error || 'Mahsulot qo\'shishda xatolik yuz berdi';
        console.error('API Error:', errorMessage);
        Alert.alert('Xato', errorMessage);
      }
    } catch (error) {
      console.error('Add product error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Noma\'lum xatolik';
      Alert.alert('Xato', `Mahsulot qo'shishda xatolik: ${errorMessage}`);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      // Prepare request body according to new API format
      const requestBody: any = {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice && productForm.originalPrice > 0 
          ? Number(productForm.originalPrice)
          : undefined,
        subcategory: productForm.subcategory,
        quantity: Number(productForm.quantity),
        unit: productForm.unit || 'dona',
        unitSize: Number(productForm.unitSize) || 1,
        status: 'active',
        deliveryRegions: productForm.deliveryRegions || [],
      };

      // Handle image
      if (productForm.image) {
        if (productForm.image.startsWith('data:image')) {
          // Image is already base64, keep as is
          requestBody.image = productForm.image;
          console.log('Image is base64 format for edit');
        } else if (productForm.image.startsWith('file://')) {
          // Convert file URI to base64
          console.log('Converting file URI to base64 for edit');
          try {
            const base64 = await FileSystem.readAsStringAsync(productForm.image, {
              encoding: FileSystem.EncodingType.Base64,
            });
            const fileExtension = productForm.image.split('.').pop() || 'jpeg';
            const mimeType = `image/${fileExtension}`;
            requestBody.image = `data:${mimeType};base64,${base64}`;
            console.log('Image converted to base64 successfully for edit');
          } catch (error) {
            console.error('Error converting image to base64 for edit:', error);
            throw new Error('Rasmni yuklashda xatolik yuz berdi');
          }
        }
      }

      console.log('Updating product with data:', requestBody);

      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Edit product response:', data);
      
      if (response.status === 200 && data.success) {
        console.log('Product updated successfully:', data.product);
        setProductModalVisible(false);
        setEditingProduct(null);
        setProductForm({
          name: '',
          category: '',
          subcategory: '',
          price: 0,
          originalPrice: 0,
          unit: 'dona',
          unitSize: 1,
          quantity: 0,
          image: undefined,
          deliveryRegions: [],
        });
        fetchProducts(1, true);
        Alert.alert('Muvaffaqiyatli', data.message || 'Mahsulot yangilandi');
      } else {
        console.error('Update failed:', data);
        const errorMessage = data.message || data.error || 'Mahsulotni yangilashda xatolik yuz berdi';
        Alert.alert('Xato', errorMessage);
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Xato', 'Mahsulotni yangilashda xatolik yuz berdi');
    }
  };

  // Get single product by ID
  const fetchProductById = async (productId: string) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.status === 200 && data.success) {
        return data.product;
      } else {
        throw new Error(data.message || 'Failed to fetch product');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Tasdiqlash',
      'Mahsulotni o\'chirishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${productId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
              
              if (response.status === 200 && data.success) {
                fetchProducts(1, true);
                Alert.alert('Muvaffaqiyatli', data.message || 'Mahsulot o\'chirildi');
              } else {
                Alert.alert('Xato', data.message || 'Mahsulotni o\'chirishda xatolik yuz berdi');
              }
            } catch (error) {
              Alert.alert('Xato', 'Mahsulotni o\'chirishda xatolik yuz berdi');
            }
          },
        },
      ]
    );
  };

  const handleUpdatequantity = async (productId: string, quantity: number, isAddition: boolean) => {
    try {
              const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${productId}/quantity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity, isAddition }),
      });

      const data = await response.json();
      if (response.status === 200) {
        fetchProducts(1, true);
        Alert.alert('Muvaffaqiyatli', 'Inventar yangilandi');
      } else {
        Alert.alert('Xato', data.message || 'Inventarni yangilashda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Inventarni yangilashda xatolik yuz berdi');
    }
  };

  // Helper function to safely convert MongoDB Decimal128 to number
  const safeToNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && '$numberDecimal' in value) {
      return parseFloat(value.$numberDecimal);
    }
    return Number(value) || 0;
  };

  // Helper function to format currency
  const formatCurrency = (amount: any): string => {
    let num: number;

    // Handle different possible formats of amount
    if (amount === null || amount === undefined) {
      num = 0;
    } else if (typeof amount === 'object' && '$numberDecimal' in amount) {
      num = parseFloat(amount.$numberDecimal);
    } else if (typeof amount === 'number') {
      num = amount;
    } else if (typeof amount === 'string') {
      num = parseFloat(amount) || 0;
    } else {
      num = 0;
    }

    // Format the number with Uzbek locale and currency
    return num.toLocaleString('uz-UZ', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' so\'m';
  };

  // Helper function to safely convert any numeric value to number
  const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && '$numberDecimal' in value) {
      return parseFloat(value.$numberDecimal);
    }
    return parseFloat(value) || 0;
  };

  // Product Card Component
  const ProductCard = ({ item, onView, onEdit, onDelete, token, categories }: {
    item: Product & { subcategoryName?: string },
    onView: (id: string) => void,
    onEdit: (product: Product) => void,
    onDelete: (id: string) => void,
    token: string | null,
    categories: Category[]
  }) => {
    const getPriceValue = (price: any): number => {
      if (price === null || price === undefined) return 0;
      if (typeof price === 'number') return price;
      if (typeof price === 'object' && '$numberDecimal' in price) {
        return parseFloat(price.$numberDecimal);
      }
      return Number(price) || 0;
    };

    const toNumber = (value: any): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && '$numberDecimal' in value) {
        return parseFloat(value.$numberDecimal);
      }
      return parseFloat(value) || 0;
    };

    const priceValue = getPriceValue(item.price);
    const originalPriceValue = item.originalPrice ? getPriceValue(item.originalPrice) : null;
    const hasDiscount = originalPriceValue !== null;

    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.categoryText}>
              {item.category.name}
            </Text>
          </View>
          {item.image && (
            <View style={styles.productImageContainer}>
              <Image 
                source={{ uri: `https://api.ttsa.uz/uploads/products/${item.image}` }} 
                style={styles.productImage} 
                resizeMode="cover"
              />
            </View>
          )}
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
              onPress={async () => {
                try {
                  console.log('Fetching product with ID:', item.id);
                  // Fetch fresh product data
                  const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${item.id}`, {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  const responseText = await response.text();
                  console.log('Raw API Response:', responseText);
                  
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
                  }

                  let responseData;
                  try {
                    responseData = JSON.parse(responseText);
                    console.log('Parsed API Response:', JSON.stringify(responseData, null, 2));
                  } catch (parseError) {
                    console.error('Failed to parse JSON response:', parseError);
                    throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
                  }
                  
                  // Handle different possible response structures
                  const productData = responseData.data || responseData.product || responseData;
                  
                  if (!productData) {
                    throw new Error('No product data found in response');
                  }

                  console.log('Product data:', JSON.stringify(productData, null, 2));
                  
                  // Safely get category and subcategory
                  let subcategoryName = '';
                  
                  try {
                    if (productData.category) {
                      // If category is an object with id
                      if (typeof productData.category === 'object' && productData.category.id) {
                        const category = categories.find(cat => cat.id === productData.category.id);
                        if (category?.subcategories) {
                          const subcategory = category.subcategories.find(
                            sub => sub.id === (productData.subcategory?.id || productData.subcategory)
                          );
                          subcategoryName = subcategory?.name || '';
                        }
                      } 
                      // If category is just an ID string
                      else if (typeof productData.category === 'string') {
                        const category = categories.find(cat => cat.id === productData.category);
                        if (category?.subcategories) {
                          const subcategory = category.subcategories.find(
                            sub => sub.id === (productData.subcategory?.id || productData.subcategory)
                          );
                          subcategoryName = subcategory?.name || '';
                        }
                      }
                    }

                    // Prepare product data for viewing
                    const viewProduct = {
                      ...productData,
                      // Ensure we have all required fields with fallbacks
                      id: productData.id || item.id,
                      name: productData.name || 'Nomsiz mahsulot',
                      price: productData.price || 0,
                      quantity: productData.quantity || 0,
                      unit: productData.unit || 'dona',
                      unitSize: productData.unitSize || 1,
                      subcategoryName: subcategoryName || productData.subcategoryName || productData.subcategory?.name || ''
                    };

                    console.log('Setting view product:', JSON.stringify(viewProduct, null, 2));
                    setViewingProduct(viewProduct);
                  } catch (dataError) {
                    console.error('Error processing product data:', dataError);
                    // Even if there's an error processing some data, still try to show what we have
                    setViewingProduct({
                      ...productData,
                      id: productData.id || item.id,
                      name: productData.name || 'Nomsiz mahsulot',
                      price: productData.price || 0,
                      quantity: productData.quantity || 0,
                      unit: productData.unit || 'dona',
                      unitSize: productData.unitSize || 1,
                      subcategoryName: ''
                    });
                  }
                } catch (error: any) {
                  console.error('Error loading product details:', {
                    error,
                    message: error?.message || 'No error message',
                    stack: error?.stack || 'No stack trace'
                  });
                  Alert.alert('Xato', 'Mahsulot ma\'lumotlarini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
                }
              }}
            >
              <Ionicons name="eye" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => {
                console.log('Edit button pressed for item:', JSON.stringify(item, null, 2));
                console.log('Item ID:', item.id);
                setEditingFullScreen(item);
              }}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            {hasDiscount ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.detailText, { color: '#999', marginRight: 4 }]}>
                  {formatCurrency(priceValue)} / {item.unit}
                </Text>

              </View>
            ) : (
              <Text style={styles.detailText}>
                {formatCurrency(priceValue)} / {item.unit}
              </Text>
            )}
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {typeof item.quantity === 'object' && item.quantity !== null && '$numberDecimal' in item.quantity
                ? parseFloat(item.quantity.$numberDecimal).toLocaleString('uz-UZ')
                : (item.quantity || 0).toLocaleString('uz-UZ')} {item.unit}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ProtectedRoute>
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Qidirish..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => applyFilters()}
              />
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setSearchQuery('');
                    applyFilters();
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons name="filter" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsCreating(true)}
              >
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#007AFF']}
                  tintColor="#007AFF"
                />
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={48} color="#666" />
                  <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
                </View>
              }
            />
          )}

          {/* Filter Modal */}
          <Modal
            visible={filterModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setFilterModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Filtrlash</Text>

                <Text style={styles.inputLabel}>Kategoriya</Text>
                <ScrollView style={styles.categoryList}>
                  {categories.map((category) => (
                    <View key={category.id}>
                      <TouchableOpacity
                        style={[
                          styles.categoryItem,
                          selectedCategory === category.id && styles.selectedItem
                        ]}
                        onPress={() => {
                          setSelectedCategory(category.id);
                          setSelectedSubcategory('');
                        }}
                      >
                        <Text style={[
                          styles.categoryItemText,
                          selectedCategory === category.id && styles.selectedItemText
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>

                      {selectedCategory === category.id && category.subcategories.length > 0 && (
                        <View style={styles.subcategoryList}>
                          {category.subcategories.map((sub) => (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.subcategoryItem,
                                selectedSubcategory === sub.id && styles.selectedItem
                              ]}
                              onPress={() => setSelectedSubcategory(sub.id)}
                            >
                              <Text style={[
                                styles.subcategoryItemText,
                                selectedSubcategory === sub.id && styles.selectedItemText
                              ]}>
                                {sub.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.resetButton]}
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetButtonText}>Tozalash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.applyButton]}
                    onPress={applyFilters}
                  >
                    <Text style={styles.applyButtonText}>Qo'llash</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Create Product Screen */}
          {isCreating && (
            <Modal
              visible={true}
              animationType="slide"
              presentationStyle="fullScreen"
            >
              <CreateScreen
                categories={categories}
                onSave={async (form) => {
                  try {
                    // Validate form data
                    if (!form.name) {
                      Alert.alert('Xato', 'Mahsulot nomini kiriting');
                      return;
                    }
                    if (!form.category) {
                      Alert.alert('Xato', 'Iltimos, to\'g\'ri kategoriyani tanlang');
                      return;
                    }
                    if (!form.price || form.price <= 0) {
                      Alert.alert('Xato', 'To\'g\'ri narx kiriting');
                      return;
                    }
                    if (!form.unitSize || parseFloat(form.unitSize.toString()) <= 0) {
                      Alert.alert('Xato', 'To\'g\'ri birlik o\'lchamini kiriting');
                      return;
                    }

                    // Find the selected category
                    const selectedCategory = categories.find(cat => cat._id === form.category);
                    if (!selectedCategory) {
                      Alert.alert('Xato', 'Iltimos, to\'g\'ri kategoriyani tanlang');
                      return;
                    }

                    // Validate subcategory if provided
                    let selectedSubcategory;
                    if (form.subcategory) {
                      selectedSubcategory = selectedCategory.subcategories.find(
                        sub => sub._id === form.subcategory
                      );
                      if (!selectedSubcategory) {
                        Alert.alert('Xato', 'Iltimos, to\'g\'ri subkategoriyani tanlang');
                        return;
                      }
                    }

                    // Prepare the request body according to API documentation
                    let imageBase64 = undefined;
                    
                    // Convert image to base64 if it exists and is a local file URI
                    if (form.image && form.image.startsWith('file://')) {
                      try {
                        console.log('Converting image to base64 for create:', form.image);
                        imageBase64 = await FileSystem.readAsStringAsync(form.image, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                        
                        // Get file extension and create proper base64 data URL
                        const fileExtension = form.image.split('.').pop() || 'jpeg';
                        const mimeType = `image/${fileExtension}`;
                        imageBase64 = `data:${mimeType};base64,${imageBase64}`;
                        
                        console.log('Image converted to base64 successfully for create');
                      } catch (error) {
                        console.error('Error converting image to base64 for create:', error);
                        Alert.alert('Xato', 'Rasmni yuklashda xatolik yuz berdi');
                        return;
                      }
                    } else if (form.image && form.image.startsWith('data:image')) {
                      // Image is already base64
                      imageBase64 = form.image;
                    } else if (form.image) {
                      // Image is a server URL, keep as is
                      imageBase64 = form.image;
                    }

                    const requestBody = {
                      name: form.name,
                      category: selectedCategory.id,
                      subcategory: form.subcategory || undefined,
                      price: parseFloat(form.price.toString()),
                      originalPrice: form.originalPrice ? parseFloat(form.originalPrice.toString()) : undefined,
                      unit: form.unit,
                      unitSize: parseFloat(form.unitSize.toString()) || 1,
                      quantity: form.quantity || 0,
                      status: 'active',
                      deliveryRegions: form.deliveryRegions || [],
                      ...(imageBase64 && { image: imageBase64 })
                    };

                    console.log('Creating product with data:', JSON.stringify(requestBody, null, 2));

                    const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/product/create', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(requestBody),
                    });

                    const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
                    if (response.status === 201) {
                      setIsCreating(false);
                      fetchProducts(1, true);
                      Alert.alert('Muvaffaqiyatli', 'Mahsulot qo\'shildi');
                    } else {
                      Alert.alert('Xato', data.message || 'Mahsulot qo\'shishda xatolik yuz berdi');
                    }
                  } catch (error) {
                    Alert.alert('Xato', 'Mahsulot qo\'shishda xatolik yuz berdi');
                  }
                }}
                onClose={() => setIsCreating(false)}
              />
            </Modal>
          )}

          {/* View Product Screen */}
          {viewingProduct && (
            <Modal
              visible={true}
              animationType="slide"
              presentationStyle="fullScreen"
            >
              <ViewScreen
                product={viewingProduct}
                categories={categories}
                onClose={() => setViewingProduct(null)}
              />
            </Modal>
          )}

          {/* Edit Product Full Screen */}
          {editingFullScreen && (
            <Modal
              visible={true}
              animationType="slide"
              presentationStyle="fullScreen"
            >
              <EditScreen
                product={editingFullScreen}
                categories={categories}
                onSave={async (form) => {
                  try {
                    // Validate form data
                    if (!form.name) {
                      Alert.alert('Xato', 'Mahsulot nomini kiriting');
                      return;
                    }
                    if (!form.category) {
                      Alert.alert('Xato', 'Iltimos, to\'g\'ri kategoriyani tanlang');
                      return;
                    }

                    // Find the selected category
                    const selectedCategory = categories.find(cat => cat._id === form.category);
                    if (!selectedCategory) {
                      Alert.alert('Xato', 'Iltimos, to\'g\'ri kategoriyani tanlang');
                      return;
                    }

                    // Validate subcategory if provided
                    let selectedSubcategory;
                    if (form.subcategory) {
                      selectedSubcategory = selectedCategory.subcategories.find(
                        sub => sub._id === form.subcategory
                      );
                      if (!selectedSubcategory) {
                        Alert.alert('Xato', 'Iltimos, to\'g\'ri subkategoriyani tanlang');
                        return;
                      }
                    }

                    // Prepare the request body with all required fields
                    let imageBase64 = undefined;
                    
                    // Convert image to base64 if it exists and is a local file URI
                    if (form.image && form.image.startsWith('file://')) {
                      try {
                        console.log('Converting image to base64 for edit:', form.image);
                        imageBase64 = await FileSystem.readAsStringAsync(form.image, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                        
                        // Get file extension and create proper base64 data URL
                        const fileExtension = form.image.split('.').pop() || 'jpeg';
                        const mimeType = `image/${fileExtension}`;
                        imageBase64 = `data:${mimeType};base64,${imageBase64}`;
                        
                        console.log('Image converted to base64 successfully for edit');
                      } catch (error) {
                        console.error('Error converting image to base64 for edit:', error);
                        Alert.alert('Xato', 'Rasmni yuklashda xatolik yuz berdi');
                        return;
                      }
                    } else if (form.image && form.image.startsWith('data:image')) {
                      // Image is already base64
                      imageBase64 = form.image;
                    } else if (form.image) {
                      // Image is a server URL, keep as is
                      imageBase64 = form.image;
                    }

                    const requestBody = {
                      name: form.name,
                      category: selectedCategory.id,
                      subcategory: form.subcategory || undefined,
                      price: parseFloat(form.price.toString()),
                      originalPrice: form.originalPrice ? parseFloat(form.originalPrice.toString()) : undefined,
                      unit: form.unit,
                      unitSize: parseFloat(form.unitSize.toString()) || 1,
                      quantity: form.quantity || 0,
                      status: 'active',
                      deliveryRegions: form.deliveryRegions || [],
                      ...(imageBase64 && { image: imageBase64 })
                    };

                    console.log('Updating product with data:', JSON.stringify(requestBody, null, 2));
                    console.log('Editing product ID:', editingFullScreen?.id);
                    console.log('Editing product full object:', JSON.stringify(editingFullScreen, null, 2));

                    if (!editingFullScreen?.id) {
                      Alert.alert('Xato', 'Mahsulot ID topilmadi');
                      return;
                    }

                    const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/product/${editingFullScreen.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify(requestBody),
                    });

                    const data = await response.json();
        console.log('=== PRODUCTS REGIONS API RESPONSE ===');
        console.log('URL:', API_ENDPOINTS.REGIONS.LIST);
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('=== END OF PRODUCTS REGIONS RESPONSE ===');
                    if (response.status === 200) {
                      setEditingFullScreen(null);
                      fetchProducts(1, true);
                      Alert.alert('Muvaffaqiyatli', 'Mahsulot yangilandi');
                    } else {
                      console.error('Update failed:', data);
                      Alert.alert('Xato', data.message || 'Mahsulotni yangilashda xatolik yuz berdi');
                    }
                  } catch (error) {
                    console.error('Update error:', error);
                    Alert.alert('Xato', 'Mahsulotni yangilashda xatolik yuz berdi');
                  }
                }}
                onClose={() => setEditingFullScreen(null)}
              />
            </Modal>
          )}
        </View>
      </ProtectedRoute>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
    paddingTop: 10,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingMore: {
    padding: 10,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  quantityControls: {
    flexDirection: 'row',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  decreaseButton: {
    backgroundColor: '#FF3B30',
  },
  increaseButton: {
    backgroundColor: '#4CD964',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  addButton: {
    backgroundColor: '#4CD964',
    padding: 16,
    borderRadius: 10,
    margin: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
    height: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  categoryList: {
    marginBottom: 16,
    height: '100%',
    maxHeight: '100%',
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    color: '#fff',
  },
  subcategoryList: {
    marginLeft: 16,
  },
  subcategoryItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  subcategoryItemText: {
    fontSize: 14,
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
    marginHorizontal: 4,
  },
  unitList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  unitItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitItemText: {
    fontSize: 14,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    padding: 10,
    borderRadius: 10,
    fontWeight: '500',
  },
  resetButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  viewButton: {
    backgroundColor: '#5856D6',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  viewScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  viewScreenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewScreenContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  editScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editSaveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  editHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editScreenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  editTabText: {
    fontSize: 16,
    color: '#666',
  },
  editTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  editScreenContent: {
    flex: 1,
    padding: 16,
  },
  editSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  editSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  editRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  editHalfInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  editFullInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  editInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  unitsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 16,
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  // Add these styles to your StyleSheet.create object
  categoryContainer: {
    marginBottom: 8,
  },
  categoryButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subcategoriesContainer: {
    marginLeft: 16,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
    paddingLeft: 12,
  },
  subcategoryButton: {
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subcategoryButtonActive: {
    backgroundColor: '#e6f2ff',
  },
  subcategoryButtonText: {
    fontSize: 14,
    color: '#555',
  },
  subcategoryButtonTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  // Regions selection styles
  regionsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  regionsButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedRegionsContainer: {
    marginTop: 8,
  },
  selectedRegionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e6f2ff',
    borderRadius: 6,
    marginBottom: 4,
  },
  selectedRegionText: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  regionsList: {
    flex: 1,
    padding: 16,
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionItemSelected: {
    backgroundColor: '#e6f2ff',
  },
  regionItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  regionItemTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  regionSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  regionSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  // Installment options styles
  installmentOptions: {
    marginTop: 8,
  },
  installmentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  installmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  installmentButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  installmentButtonText: {
    fontSize: 14,
    color: '#666',
  },
  installmentButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  // Image picker styles
  imagePickerButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
});