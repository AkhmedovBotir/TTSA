import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './context/AuthContext';

interface Seller {
  _id: string;
  id?: string; // API response da id ham bo'lishi mumkin
  fullName: string;
  username: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
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

const CreateSellerScreen = ({ 
  onSave, 
  onClose 
}: { 
  onSave: (form: SellerFormData) => void;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<SellerFormData>({
    fullName: '',
    username: '',
    password: '',
    phone: ''
  });

  return (
    <View style={styles.fullScreenModal}>
      <View style={styles.modalHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Yangi sotuvchi</Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => onSave(form)}
        >
          <Text style={styles.saveButtonText}>Saqlash</Text>
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

        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Parol</Text>
          <TextInput
            style={styles.input}
            placeholder="Kirish uchun parol"
            value={form.password}
            onChangeText={(text) => setForm(prev => ({ ...prev, password: text }))}
            secureTextEntry
          />
        </View>
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
  onClose 
}: { 
  seller: Seller;
  onSave: (form: EditSellerData) => void;
  onClose: () => void;
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
        Alert.alert('Muvaffaqiyatli', data.message || 'Parol muvaffaqiyatli yangilandi');
        setShowPasswordModal(false);
        setNewPassword('');
      } else {
        throw new Error(data.message || 'Parolni yangilashda xatolik yuz berdi');
      }
    } catch (error) {
      Alert.alert('Xato', error instanceof Error ? error.message : 'Parolni yangilashda xatolik yuz berdi');
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
          <Text style={styles.saveButtonText}>Saqlash</Text>
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
  const { api, admin, isLoading } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [viewingSeller, setViewingSeller] = useState<Seller | null>(null);

  const fetchSellers = async (refresh = false) => {
    if (isLoading) {
      console.log('Auth is still loading, waiting...');
      return;
    }
    
    // Check for both _id and id fields
    const shopOwnerId = admin?._id || admin?.id;
    if (!shopOwnerId) {
      console.log('No shop owner ID, cannot fetch sellers. Admin data:', admin);
      return;
    }
    
    // Set loading state
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log('Fetching sellers for shop owner...');
      const responseData = await api(`/seller/list`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      console.log('=== SELLERS API RESPONSE ===');
      console.log(JSON.stringify(responseData, null, 2));
      console.log('=== END OF RESPONSE ===');
      
      // Handle different response formats
      let sellersData = [];
      if (responseData.success && Array.isArray(responseData.sellers)) {
        sellersData = responseData.sellers;
      } else if (Array.isArray(responseData)) {
        sellersData = responseData;
      } else if (Array.isArray(responseData.data)) {
        sellersData = responseData.data;
      } else if (responseData.data && typeof responseData.data === 'object') {
        sellersData = [responseData.data];
      }
      
      console.log('Processed sellers data for shop owner:', sellersData);
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

  const handleCreateSeller = async (form: SellerFormData) => {
    if (isLoading || !(admin?._id || admin?.id)) return;
    
    try {
      console.log('Creating seller with data:', {
        fullName: form.fullName,
        username: form.username,
        phone: form.phone
      });
      
      const data = await api('/seller/create', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          password: form.password,
          phone: form.phone
        }),
      });
      
      console.log('Create seller response:', data);
      
      if (data.success) {
        setIsCreating(false);
        fetchSellers();
        Alert.alert('Muvaffaqiyatli', data.message || 'Sotuvchi qo\'shildi');
      } else {
        throw new Error(data.message || 'Sotuvchi qo\'shishda xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error creating seller:', error);
      Alert.alert('Xato', error instanceof Error ? error.message : 'Sotuvchi qo\'shishda xatolik yuz berdi');
    }
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

  const handleDeleteSeller = async (id: string) => {
    Alert.alert(
      'Tasdiqlash',
      'Sotuvchi o\'chirishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await api(`/seller/${id}`, {
                method: 'DELETE'
              });
              
              // Check if the response indicates success
              if (data?.success) {
                // Refresh the sellers list
                await fetchSellers();
                // Show success message from server or default message
                Alert.alert('Muvaffaqiyatli', data?.message || 'Sotuvchi muvaffaqiyatli o\'chirildi');
              } else {
                // If no success flag but we have a message, show it
                if (data?.message) {
                  throw new Error(data.message);
                }
                throw new Error('Sotuvchini o\'chirishda xatolik yuz berdi');
              }
            } catch (error) {
              console.error('Error deleting seller:', error);
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
                Alert.alert('Xato', 'Sotuvchini o\'chirishda noma\'lum xatolik yuz berdi');
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
      
      const data = await api(`/seller/${sellerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (data.success) {
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
      console.log('API endpoint:', `/seller/${sellerId}`);
      
      const response = await api(`/seller/${sellerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      
      console.log('Server response:', JSON.stringify(response, null, 2));
      
      // Check if the response contains seller data (which means success)
      if (response?.success && response?.seller) {
        // Close the edit modal
        setEditingSeller(null);
        // Refresh the sellers list
        await fetchSellers();
        // Show success message
        Alert.alert('Muvaffaqiyatli', response.message || 'Sotuvchi ma\'lumotlari muvaffaqiyatli yangilandi');
      } else {
        // If we have an error message from the server, show it
        if (response?.message) {
          throw new Error(response.message);
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
            onPress={() => setEditingSeller(item)}
          >
            <Ionicons name="create" size={16} color="#FF9500" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSeller(item._id || item.id || '')}
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
            onPress={() => setIsCreating(true)}
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

        {/* Create Seller Modal */}
        {isCreating && (
          <Modal
            visible={true}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <CreateSellerScreen
              onSave={handleCreateSeller}
              onClose={() => setIsCreating(false)}
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
            />
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
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 6,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FF9500',
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
}); 