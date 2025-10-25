import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
} from 'react-native';
import { API_ENDPOINTS, API_BASE_URL, API_MOBILE_URL } from './api';
import { useAuth } from './context/AuthContext';

interface Seller {
  _id: string;
  id?: string; // API response da id ham bo'lishi mumkin
  fullName: string;
  username: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
  serviceAreas?: ServiceArea[];
}

interface SellerFormData {
  fullName: string;
  username: string;
  password: string;
  phone: string;
}

interface EditSellerData {
  fullName: string;
  username: string;
  phone: string;
}

interface EditPasswordData {
  password: string;
}

interface Region {
  _id: string;
  name: string;
  type: 'region' | 'district' | 'mfy';
  parent: string | null;
  code: string;
  status: 'active' | 'inactive';
}

interface ServiceArea {
  region: {
    _id: string;
    name: string;
  };
  districts: {
    _id: string;
    name: string;
  }[];
  mfys: {
    _id: string;
    name: string;
  }[];
}

const SelectSellerScreen = ({ 
  onSelect, 
  onClose,
  availableSellers
}: { 
  onSelect: (seller: Seller) => void;
  onClose: () => void;
  availableSellers: Seller[];
}) => {
  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Sotuvchi tanlash</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.inputLabel}>Mavjud sotuvchilardan birini tanlang:</Text>
        <FlatList
          data={availableSellers}
          keyExtractor={(item) => item._id || item.id || ''}
          renderItem={({ item }) => (
        <TouchableOpacity
              style={styles.sellerSelectCard}
              onPress={() => onSelect(item)}
            >
              <View style={styles.sellerSelectInfo}>
                <Text style={styles.sellerSelectName}>{item.fullName}</Text>
                <Text style={styles.sellerSelectUsername}>@{item.username}</Text>
                <Text style={styles.sellerSelectPhone}>{item.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Mavjud sotuvchilar yo'q</Text>
      </View>
          }
          />
        </View>
    </View>
  );
};

const ViewSellerModal = ({ 
  seller,
  onClose 
}: { 
  seller: Seller;
  onClose: () => void;
}) => {
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.viewModalContainer}>
        <View style={styles.viewModalContent}>
          <View style={styles.viewModalHeader}>
            <Text style={styles.viewModalTitle}>Sotuvchi ma'lumotlari</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
        </View>

          <View style={styles.viewModalBody}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>F.I.SH:</Text>
              <Text style={styles.infoValue}>{seller.fullName}</Text>
        </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Login:</Text>
              <Text style={styles.infoValue}>@{seller.username}</Text>
        </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telefon:</Text>
              <Text style={styles.infoValue}>{seller.phone}</Text>
      </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <View style={[
                styles.statusTag,
                seller.status === 'active' ? styles.activeStatus : styles.inactiveStatus
              ]}>
                <Text style={[
                  styles.statusTagText,
                  seller.status === 'active' ? styles.activeStatusText : styles.inactiveStatusText
                ]}>
                  {seller.status === 'active' ? 'Faol' : 'Nofaol'}
                </Text>
    </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Qo'shilgan sana:</Text>
              <Text style={styles.infoValue}>
                {new Date(seller.createdAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
            <Text style={styles.closeModalButtonText}>Yopish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const EditSellerScreen = ({ 
  seller,
  onSave, 
  onClose,
  token,
  fetchSellers,
  setAssigningSeller,
  setShowServiceAreaModal
}: { 
  seller: Seller;
  onSave: (form: EditSellerData) => void;
  onClose: () => void;
  token: string | null;
  fetchSellers: () => void;
  setAssigningSeller: (seller: Seller | null) => void;
  setShowServiceAreaModal: (show: boolean) => void;
}) => {
  const { api } = useAuth();
  const [form, setForm] = useState<EditSellerData>({
    fullName: seller.fullName,
    username: seller.username,
    phone: seller.phone
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordSave = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Xato', 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    try {
      const data = await api(`/seller/${seller._id || seller.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });

      if (data.success) {
        setShowPasswordModal(false);
        setNewPassword('');
        Alert.alert('Muvaffaqiyatli', 'Parol muvaffaqiyatli o\'zgartirildi');
      } else {
        Alert.alert('Xato', data.message || 'Parolni o\'zgartirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Xato', error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik yuz berdi');
    }
  };


  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Sotuvchini tahrirlash</Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            console.log('EditSellerScreen Save button pressed with form data:', form);
            onSave(form);
          }}
        >
          <Text style={styles.saveButtonText}>Hududni o'zgartirish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>F.I.SH</Text>
          <TextInput
            style={styles.input}
            placeholder="Sotuvchi F.I.SH"
            value={form.fullName}
            onChangeText={(text) => setForm(prev => ({ ...prev, fullName: text }))}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Login</Text>
          <TextInput
            style={styles.input}
            placeholder="Kirish uchun login"
            value={form.username}
            onChangeText={(text) => setForm(prev => ({ ...prev, username: text }))}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Telefon raqam</Text>
          <TextInput
            style={styles.input}
            placeholder="+998901234567"
            value={form.phone}
            onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.changePasswordButtonText}>Parolni o'zgartirish</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.passwordModalContainer}>
          <View style={styles.passwordModalContent}>
            <Text style={styles.passwordModalTitle}>Yangi parol</Text>
            <TextInput
              style={styles.input}
              placeholder="Yangi parolni kiriting"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={styles.passwordModalButtons}>
              <TouchableOpacity
                style={styles.passwordModalCancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                <Text style={styles.passwordModalCancelButtonText}>Bekor qilish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.passwordModalSaveButton}
                onPress={handlePasswordSave}
              >
                <Text style={styles.passwordModalSaveButtonText}>Saqlash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default function SellersScreen() {
  const { api, admin, isLoading, token } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [viewingSeller, setViewingSeller] = useState<Seller | null>(null);
  
  // Regions state for service area assignment
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [mfys, setMfys] = useState<Region[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedMfys, setSelectedMfys] = useState<string[]>([]);
  const [showServiceAreaModal, setShowServiceAreaModal] = useState(false);
  const [assigningSeller, setAssigningSeller] = useState<Seller | null>(null);
  const [showSelectSellerModal, setShowSelectSellerModal] = useState(false);
  const [availableSellers, setAvailableSellers] = useState<Seller[]>([]);

  // Fetch regions
  const fetchRegions = async (type: 'region' | 'district' | 'mfy' = 'region', parent?: string) => {
    try {
      let url: string;
      
      if (type === 'region') {
        url = API_ENDPOINTS.REGIONS.LIST;
      } else if (type === 'district' && parent) {
        url = API_ENDPOINTS.REGIONS.DISTRICTS(parent);
      } else if (type === 'mfy' && parent) {
        url = API_ENDPOINTS.REGIONS.MFYS(parent);
      } else {
        console.error('Invalid parameters for fetchRegions');
        return [];
      }
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('=== REGIONS API RESPONSE ===');
      console.log('Type:', type);
      console.log('Parent:', parent);
      console.log('URL:', url);
      console.log('Full URL:', `${API_BASE_URL}${url.replace(API_MOBILE_URL, '/api/shop-owner-mobile')}`);
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('=== END OF REGIONS RESPONSE ===');
      
      if (!response.ok) {
        return [];
      }
      
      if (data.success && data.data) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching regions:', error);
      return [];
    }
  };

  // Load regions on component mount
  useFocusEffect(
    useCallback(() => {
      const loadRegions = async () => {
        const regionsData = await fetchRegions('region');
        setRegions(regionsData);
      };
      loadRegions();
    }, [token])
  );



  // Fetch available sellers
  const fetchAvailableSellers = async () => {
    try {
      const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/sellers/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setAvailableSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching available sellers:', error);
    }
  };

  // Handle region selection
  const handleRegionSelect = async (regionId: string) => {
    console.log('Region selected:', regionId);
    const isSelected = selectedRegions.includes(regionId);
    
    if (isSelected) {
      // Remove region and its districts/mfys
      setSelectedRegions(prev => prev.filter(id => id !== regionId));
      setSelectedDistricts(prev => prev.filter(id => {
        // Remove districts that belong to this region
        return !districts.some(d => d._id === id && d.parent === regionId);
      }));
      setSelectedMfys(prev => prev.filter(id => {
        // Remove MFYs that belong to districts of this region
        return !mfys.some(m => m._id === id && m.parent && selectedDistricts.includes(m.parent));
      }));
    } else {
      // Add region
      setSelectedRegions(prev => [...prev, regionId]);
      
      // Load districts for this region
      console.log('Fetching districts for region:', regionId);
      const districtsData = await fetchRegions('district', regionId);
      console.log('Districts data received:', districtsData);
      setDistricts(prev => [...prev, ...districtsData]);
    }
  };

  // Handle district selection
  const handleDistrictSelect = async (districtId: string) => {
    console.log('District selected:', districtId);
    const isSelected = selectedDistricts.includes(districtId);
    if (isSelected) {
      setSelectedDistricts(prev => prev.filter(id => id !== districtId));
    } else {
      setSelectedDistricts(prev => [...prev, districtId]);
    }
    
    // Load MFYs for this district
    console.log('Fetching MFYs for district:', districtId);
    const mfysData = await fetchRegions('mfy', districtId);
    console.log('MFYs data received:', mfysData);
    setMfys(prev => [...prev, ...mfysData]);
  };

  // Handle MFY selection
  const handleMfySelect = (mfyId: string) => {
    console.log('MFY selected:', mfyId);
    const isSelected = selectedMfys.includes(mfyId);
    if (isSelected) {
      setSelectedMfys(prev => prev.filter(id => id !== mfyId));
    } else {
      setSelectedMfys(prev => [...prev, mfyId]);
    }
  };

  // Update service areas for existing seller
  const handleUpdateServiceAreas = async (seller: Seller) => {
    try {
      const sellerId = seller._id || seller.id;
      
      // Get current service areas from seller
      const currentServiceAreas = seller.serviceAreas || [];
      
      if (currentServiceAreas.length === 0) {
        Alert.alert(
          'Xizmat hududlari', 
          `Sotuvchi: ${seller.fullName}\nHududlar: Belgilanmagan\n\nHududlarni belgilash uchun "Yangi sotuvchi" tugmasini bosing.`,
          [
            {
              text: 'Bekor qilish',
              style: 'cancel'
            },
            {
              text: 'Hududlarni belgilash',
              onPress: () => {
                // Hududlarni belgilash uchun modal ochish
                setAssigningSeller(seller);
                setShowServiceAreaModal(true);
              }
            }
          ]
        );
      } else {
        const areasText = currentServiceAreas.map(area => {
          const regionName = area.region?.name || 'Noma\'lum viloyat';
          const districtsCount = area.districts?.length || 0;
          const mfysCount = area.mfys?.length || 0;
          return `• ${regionName} (${districtsCount} tuman, ${mfysCount} MFY)`;
        }).join('\n');
        
        Alert.alert(
          'Xizmat hududlari', 
          `Sotuvchi: ${seller.fullName}\n\nHududlar:\n${areasText}`,
          [
            {
              text: 'Yopish',
              style: 'cancel'
            },
            {
              text: 'Qo\'shimcha hudud qo\'shish',
              onPress: () => {
                // Qo'shimcha hudud qo'shish uchun modal ochish
                setAssigningSeller(seller);
                setShowServiceAreaModal(true);
              }
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Error updating service areas:', error);
      Alert.alert('Xato', 'Xizmat hududlarini yangilashda xatolik yuz berdi');
    }
  };

  // Assign seller with service areas
  const handleAssignSeller = async () => {
    if (!assigningSeller || selectedRegions.length === 0) {
      Alert.alert('Xato', 'Iltimos, kamida bitta viloyatni tanlang');
      return;
    }
    
    try {
      const sellerId = assigningSeller._id || assigningSeller.id;
      
      // Check if seller is already assigned
      const isAlreadyAssigned = sellers.some(seller => 
        (seller._id || seller.id) === sellerId
      );
      
      if (!isAlreadyAssigned) {
        // First assign the seller
        const assignResponse = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/sellers/${sellerId}/assign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!assignResponse.ok) {
          const assignData = await assignResponse.json();
          throw new Error(assignData.message || `Sellerni tayinlashda xatolik, ${assignResponse.status}qaytdi`);
        }
      }

      // Bir nechta hududni qo'shish - viloyatlar + tanlangan tumanlar + tanlangan MFYlar
      const newServiceArea = {
        region: selectedRegions[0] || null, // Birinchi tanlangan viloyat
        districts: selectedDistricts, // Bu district ID lar
        mfys: selectedMfys // Bu MFY ID lar
      };

      // Mavjud service areas ni olish va formatini to'g'irlash
      const existingServiceAreas = (assigningSeller.serviceAreas || []).map(area => ({
        region: area.region?._id || area.region || null, // Region ID ni olish
        districts: area.districts?.map(d => d._id || d) || [], // Agar district obyekt bo'lsa, _id ni olish
        mfys: area.mfys?.map(m => m._id || m) || [] // Agar MFY obyekt bo'lsa, _id ni olish
      }));
      
      // Yangi service area ni qo'shish (bitta hudud)
      const updatedServiceAreas = [...existingServiceAreas, newServiceArea];

      const serviceAreasData = {
        serviceAreas: updatedServiceAreas
      };

      console.log('=== SERVICE AREAS DATA ===');
      console.log('Selected Regions:', selectedRegions);
      console.log('Selected Districts:', selectedDistricts);
      console.log('Selected MFYs:', selectedMfys);
      console.log('Existing Service Areas:', JSON.stringify(existingServiceAreas, null, 2));
      console.log('New Service Area:', JSON.stringify(newServiceArea, null, 2));
      console.log('Service Areas Data:', JSON.stringify(serviceAreasData, null, 2));
      console.log('=== END OF SERVICE AREAS DATA ===');

      const serviceResponse = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/sellers/${sellerId}/service-areas`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceAreasData),
      });

      if (!serviceResponse.ok) {
        const serviceData = await serviceResponse.json();
        console.log('=== SERVICE AREAS ERROR ===');
        console.log('Status:', serviceResponse.status);
        console.log('Response:', JSON.stringify(serviceData, null, 2));
        console.log('=== END OF SERVICE AREAS ERROR ===');
        throw new Error(serviceData.message || `Xizmat hududlarini belgilashda xatolik, ${serviceResponse.status}qaytdi`);
      }

      Alert.alert('Muvaffaqiyatli', 'Hududlar muvaffaqiyatli qo\'shildi');
      
      // Modal yopish
      setShowServiceAreaModal(false);
      setAssigningSeller(null);
      setSelectedRegions([]);
      setSelectedDistricts([]);
      setSelectedMfys([]);
      setDistricts([]);
      setMfys([]);
      
      // Sotuvchilar ro'yxatini yangilash
      fetchSellers();
    } catch (error) {
      console.error('Error assigning seller:', error);
      Alert.alert('Xato', error instanceof Error ? error.message : 'Sotuvchini tayinlashda xatolik yuz berdi');
    }
  };

  const fetchSellers = async (refresh = false) => {
    if (isLoading || !token) {
      console.log('Auth is still loading or no token, waiting...');
      return;
    }
    
    // Set loading state
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching my assigned sellers...');
      // Yangi API endpoint - o'z sotuvchilarini olish
      const response = await fetch('https://api.ttsa.uz/api/shop-owner-mobile/sellers/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      const responseData = await response.json();
      
      console.log('=== SELLERS API RESPONSE ===');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('=== END OF RESPONSE ===');
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Sotuvchilar ro\'yxatini yuklashda xatolik');
      }
      
      // Handle response format
      let sellersData = [];
      if (responseData.success && Array.isArray(responseData.sellers)) {
        sellersData = responseData.sellers;
      } else if (Array.isArray(responseData)) {
        sellersData = responseData;
      } else if (Array.isArray(responseData.data)) {
        sellersData = responseData.data;
      }
      
      console.log('Processed available sellers:', sellersData);
      setSellers(sellersData);
      
    } catch (error) {
      console.error('Error fetching sellers:', error);
      Alert.alert('Xato', error instanceof Error ? error.message : 'Sotuvchilar ro\'yxatini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    console.log('Pull to refresh triggered');
    if (!isLoading) {
      await fetchSellers(true);
    }
  }, [admin?._id, admin?.id, isLoading]);

  useFocusEffect(
    useCallback(() => {
      console.log('Sellers screen focused, refreshing data...');
      if (!isLoading) {
        fetchSellers(true);
      }
    }, [isLoading, admin?._id, admin?.id])
  );

  const handleCreateSeller = async () => {
    // Mavjud sellerlarni yuklash va tanlash modalini ochish
    await fetchAvailableSellers();
    setShowSelectSellerModal(true);
  };

  const handleSelectSeller = (seller: Seller) => {
    // Tanlangan sellerni tayinlash va xizmat hududlarini belgilash uchun modal ochish
    setAssigningSeller(seller);
    setShowSelectSellerModal(false);
    setShowServiceAreaModal(true);
  };

  const handleChangePassword = async (sellerId: string, newPassword: string) => {
    try {
      const data = await api(`/seller/${sellerId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (data.success) {
        Alert.alert('Muvaffaqiyatli', data.message || 'Parol muvaffaqiyatli o\'zgartirildi');
      } else {
        throw new Error(data.message || 'Parolni o\'zgartirishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Xato', error instanceof Error ? error.message : 'Parolni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleRemoveSeller = async (id: string) => {
    Alert.alert(
      'Tasdiqlash',
      'Sotuvchini o\'z ro\'yxatingizdan olib tashlashni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Olib tashlash',
          style: 'destructive',
          onPress: async () => {
            try {
              // Yangi API endpoint - sellerni ro'yxatdan olib tashlash
              const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/sellers/${id}/remove`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              const data = await response.json();
              
              // Check if the response indicates success
              if (response.ok && data.success) {
                // Refresh the sellers list
                await fetchSellers();
                // Show success message from server or default message
                Alert.alert('Muvaffaqiyatli', data.message || 'Sotuvchi o\'z ro\'yxatingizdan muvaffaqiyatli olib tashlandi');
              } else {
                // If no success flag but we have a message, show it
                if (data?.message) {
                  throw new Error(data.message);
                }
                throw new Error('Sotuvchini o\'z ro\'yxatingizdan olib tashlashda xatolik yuz berdi');
              }
            } catch (error) {
              console.error('Error removing seller:', error);
              // Check if the error is already an instance of Error
              if (error instanceof Error) {
                Alert.alert('Xato', error.message);
              } 
              // If the error is a string or has a message property
              else if (typeof error === 'string' || (error as any)?.message) {
                Alert.alert('Xato', typeof error === 'string' ? error : (error as any).message);
              } 
              // Default error message
              else {
                Alert.alert('Xato', 'Sotuvchini o\'z ro\'yxatingizdan olib tashlashda noma\'lum xatolik yuz berdi');
              }
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (seller: Seller) => {
    try {
      const newStatus = seller.status === 'active' ? 'inactive' : 'active';
      const sellerId = seller._id || seller.id;
      
      if (!sellerId) {
        console.log('No seller ID found for status toggle:', seller);
        Alert.alert('Xato', 'Sotuvchi ID topilmadi');
        return;
      }
      
      // Yangi API endpoint - seller statusini o'zgartirish
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/sellers/${sellerId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        fetchSellers();
        Alert.alert('Muvaffaqiyatli', data.message || 'Status muvaffaqiyatli o\'zgartirildi');
      } else {
        Alert.alert('Xato', data.message || 'Status o\'zgartirishda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', 'Status o\'zgartirishda xatolik yuz berdi');
    }
  };

  const handleEditSeller = async (form: EditSellerData) => {
    console.log('handleEditSeller called with form:', form);
    console.log('Current editingSeller:', editingSeller);
    
    // Check for both _id and id fields
    const sellerId = editingSeller?._id || editingSeller?.id;
    if (!sellerId) {
      console.log('No seller ID found, cannot update. Editing seller data:', editingSeller);
      Alert.alert('Xato', 'Sotuvchi ID topilmadi');
      return;
    }
    
    try {
      console.log('Sending update request with data:', JSON.stringify(form, null, 2));
      console.log('Updating seller with ID:', sellerId);
      
      // Yangi API endpoint - seller ma'lumotlarini yangilash
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner-mobile/sellers/${sellerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      console.log('Server response:', JSON.stringify(data, null, 2));
      
      if (response.ok && data.success) {
        // Close the edit modal
        setEditingSeller(null);
        // Refresh the sellers list
        await fetchSellers();
        // Show success message
        Alert.alert('Muvaffaqiyatli', data.message || 'Sotuvchi ma\'lumotlari muvaffaqiyatli yangilandi');
      } else {
        // If we have an error message from the server, show it
        if (data?.message) {
          throw new Error(data.message);
        }
        // If no specific error message, show a generic one
        throw new Error('Sotuvchi ma\'lumotlarini yangilashda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error updating seller:', error);
      // Show appropriate error message
      if (error instanceof Error) {
        Alert.alert('Xato', error.message);
      } else if (typeof error === 'string') {
        Alert.alert('Xato', error);
      } else {
        Alert.alert('Xato', 'Sotuvchi ma\'lumotlarini yangilashda noma\'lum xatolik yuz berdi');
      }
    }
  };

  const renderSeller = ({ item }: { item: Seller }) => (
    <View style={styles.sellerCard}>
      <View style={styles.sellerHeader}>
        <View>
          <Text style={styles.sellerName}>{item.fullName}</Text>
          <Text style={styles.sellerUsername}>@{item.username}</Text>
          <Text style={styles.sellerPhone}>{item.phone}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.statusTag,
              item.status === 'active' ? styles.activeStatus : styles.inactiveStatus
            ]}
            onPress={() => handleToggleStatus(item)}
          >
            <Text style={[
              styles.statusTagText,
              item.status === 'active' ? styles.activeStatusText : styles.inactiveStatusText
            ]}>
              {item.status === 'active' ? 'Faol' : 'Nofaol'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.dateText}>
        Qo'shilgan sana: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      
              <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => setViewingSeller(item)}
          >
            <Ionicons name="eye" size={16} color="#007AFF" />
    </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleUpdateServiceAreas(item)}
          >
            <Ionicons name="location" size={16} color="#34C759" />
            <Text style={styles.editButtonText}>Hudud</Text>
          </TouchableOpacity>
          
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleRemoveSeller(item._id || item.id || '')}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sotuvchilar ro'yxati</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateSeller}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading || isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={sellers}
            renderItem={renderSeller}
            keyExtractor={(item) => item._id || item.id || ''}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007AFF']}
                tintColor="#007AFF"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  Hali sotuvchilar qo'shilmagan{'\n'}
                  Yangi sotuvchi qo'shish uchun yuqoridagi + tugmasini bosing
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => fetchSellers(true)}
                >
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.refreshButtonText}>Yangilash</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}

        {/* Select Seller Modal */}
        {showSelectSellerModal && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <SelectSellerScreen
              onSelect={handleSelectSeller}
              onClose={() => setShowSelectSellerModal(false)}
              availableSellers={availableSellers}
            />
          </Modal>
        )}

        {/* View Seller Modal */}
        {viewingSeller && (
          <ViewSellerModal
            seller={viewingSeller}
            onClose={() => setViewingSeller(null)}
          />
        )}

        {/* Edit Seller Modal */}
        {editingSeller && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <EditSellerScreen
              seller={editingSeller}
              onSave={handleEditSeller}
              onClose={() => setEditingSeller(null)}
              token={token}
              fetchSellers={fetchSellers}
              setAssigningSeller={setAssigningSeller}
              setShowServiceAreaModal={setShowServiceAreaModal}
            />
          </Modal>
        )}

        {/* Service Area Assignment Modal */}
        {showServiceAreaModal && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
          >
            <View style={styles.bottomModalContainer}>
              <View style={styles.bottomModalContent}>
                {/* Modal Header */}
                <View style={styles.bottomModalHeader}>
                  <View style={styles.bottomModalHandle} />
                  <Text style={styles.bottomModalTitle}>
                    {assigningSeller?.fullName} uchun xizmat hududlarini belgilash
                  </Text>
                  <TouchableOpacity
                    style={styles.bottomModalCloseButton}
                    onPress={() => {
                      setShowServiceAreaModal(false);
                      setAssigningSeller(null);
                      setSelectedRegions([]);
                      setSelectedDistricts([]);
                      setSelectedMfys([]);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.bottomModalBody} showsVerticalScrollIndicator={false}>
                  {/* Region Selection */}
                  <View style={styles.regionSection}>
                    <Text style={styles.regionSectionTitle}>Viloyatlar tanlang ({regions.length} ta)</Text>
                    <View style={styles.regionGrid}>
                      {regions.length === 0 ? (
                        <View style={styles.loadingContainer}>
                          <Text style={styles.loadingText}>Viloyatlar yuklanmoqda...</Text>
                        </View>
                      ) : (
                        regions.map((region, index) => (
                          <TouchableOpacity
                            key={`region-${region._id}-${index}`}
                            style={[
                              styles.regionCard,
                              selectedRegions.includes(region._id) && styles.selectedRegionCard
                            ]}
                            onPress={() => handleRegionSelect(region._id)}
                          >
                            <Text style={[
                              styles.regionCardText,
                              selectedRegions.includes(region._id) && styles.selectedRegionCardText
                            ]}>
                              {region.name}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  </View>

                  {/* District Selection */}
                  {selectedRegions.length > 0 && (
                    <View style={styles.regionSection}>
                      <Text style={styles.regionSectionTitle}>Tumanlar tanlang ({districts.length} ta)</Text>
                      <View style={styles.regionGrid}>
                        {districts.length === 0 ? (
                          <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Tumanlar yuklanmoqda...</Text>
                          </View>
                        ) : (
                          districts.map((district, index) => (
                            <TouchableOpacity
                              key={`district-${district._id}-${index}`}
                              style={[
                                styles.regionCard,
                                selectedDistricts.includes(district._id) && styles.selectedRegionCard
                              ]}
                              onPress={() => handleDistrictSelect(district._id)}
                            >
                              <Text style={[
                                styles.regionCardText,
                                selectedDistricts.includes(district._id) && styles.selectedRegionCardText
                              ]}>
                                {district.name}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    </View>
                  )}

                  {/* MFY Selection */}
                  {selectedDistricts.length > 0 && (
                    <View style={styles.regionSection}>
                      <Text style={styles.regionSectionTitle}>MFYlar tanlang ({mfys.length} ta)</Text>
                      <View style={styles.regionGrid}>
                        {mfys.length === 0 ? (
                          <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>MFYlar yuklanmoqda...</Text>
                          </View>
                        ) : (
                          mfys.map((mfy, index) => (
                            <TouchableOpacity
                              key={`mfy-${mfy._id}-${index}`}
                              style={[
                                styles.regionCard,
                                selectedMfys.includes(mfy._id) && styles.selectedRegionCard
                              ]}
                              onPress={() => handleMfySelect(mfy._id)}
                            >
                              <Text style={[
                                styles.regionCardText,
                                selectedMfys.includes(mfy._id) && styles.selectedRegionCardText
                              ]}>
                                {mfy.name}
                              </Text>
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    </View>
                  )}

                  {/* Selected Summary */}
                  {(selectedRegions.length > 0 || selectedDistricts.length > 0 || selectedMfys.length > 0) && (
                    <View style={styles.selectedSummary}>
                      <Text style={styles.selectedSummaryTitle}>Tanlangan hududlar:</Text>
                      {selectedRegions.length > 0 && (
                        <Text style={styles.selectedSummaryText}>
                          • Viloyatlar: {selectedRegions.length} ta ({selectedRegions.map(id => regions.find(r => r._id === id)?.name).filter(Boolean).join(', ')})
                        </Text>
                      )}
                      {selectedDistricts.length > 0 && (
                        <Text style={styles.selectedSummaryText}>
                          • Tumanlar: {selectedDistricts.length} ta
                        </Text>
                      )}
                      {selectedMfys.length > 0 && (
                        <Text style={styles.selectedSummaryText}>
                          • MFYlar: {selectedMfys.length} ta
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.bottomModalFooter}>
                  <TouchableOpacity
                    style={styles.bottomModalCancelButton}
                    onPress={() => {
                      setShowServiceAreaModal(false);
                      setAssigningSeller(null);
                      setSelectedRegions([]);
                      setSelectedDistricts([]);
                      setSelectedMfys([]);
                    }}
                  >
                    <Text style={styles.bottomModalCancelButtonText}>Tugatish</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bottomModalSaveButton,
                      selectedRegions.length === 0 && styles.bottomModalSaveButtonDisabled
                    ]}
                    onPress={handleAssignSeller}
                    disabled={selectedRegions.length === 0}
                  >
                    <Text style={[
                      styles.bottomModalSaveButtonText,
                      selectedRegions.length === 0 && styles.bottomModalSaveButtonTextDisabled
                    ]}>
                      Qo'shish
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  sellerCard: {
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
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerUsername: {
    fontSize: 14,
    color: '#666',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeStatus: {
    backgroundColor: '#E8F5E9',
  },
  inactiveStatus: {
    backgroundColor: '#FFEBEE',
  },
  statusTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusText: {
    color: '#4CAF50',
  },
  inactiveStatusText: {
    color: '#F44336',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  viewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  viewModalBody: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
  },
  formSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  changePasswordButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  changePasswordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordModalContent: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  passwordModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passwordModalCancelButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
  },
  passwordModalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordModalSaveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  passwordModalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sellerPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Service Area Modal Styles
  serviceAreaModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  serviceAreaModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  serviceAreaModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  regionSection: {
    marginBottom: 20,
  },
  regionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  regionList: {
    maxHeight: 120,
    flexDirection: 'row',
  },
  regionItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRegionItem: {
    backgroundColor: '#007AFF',
  },
  regionItemText: {
    fontSize: 14,
    color: '#333',
  },
  selectedRegionItemText: {
    color: '#fff',
    fontWeight: '600',
  },
  serviceAreaModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  serviceAreaModalCancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  serviceAreaModalSaveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  serviceAreaModalCancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  serviceAreaModalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Assign Button Style
  assignButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Select Seller Styles
  sellerSelectCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellerSelectInfo: {
    flex: 1,
  },
  sellerSelectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sellerSelectUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  sellerSelectPhone: {
    fontSize: 14,
    color: '#666',
  },
  // Bottom Modal Styles
  bottomModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  bottomModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bottomModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
  },
  bottomModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  bottomModalCloseButton: {
    padding: 4,
  },
  bottomModalBody: {
    flex: 1,
    padding: 20,
  },
  bottomModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  bottomModalCancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  bottomModalSaveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomModalSaveButtonDisabled: {
    backgroundColor: '#f5f5f5',
  },
  bottomModalSaveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bottomModalSaveButtonTextDisabled: {
    color: '#999',
  },
  // Region Grid Styles
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  regionCard: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: '30%',
    alignItems: 'center',
  },
  selectedRegionCard: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  regionCardText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedRegionCardText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Selected Summary Styles
  selectedSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}); 