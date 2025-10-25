import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useAuth } from './context/AuthContext';

const API_URL = 'https://api.ttsa.uz/api';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    console.error('Error Boundary caught an error:', error);
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

interface Product {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  quantity: number;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  status?: string;
  createdAt?: string;
}

interface Agent {
  _id?: string;
  id?: string;
  fullname: string;
  phone: string;
  passport?: string;
}

interface AgentProduct {
  _id: string;
  product: Product;
  agent: Agent;
  assignedQuantity: number;
  remainingQuantity: number;
  status: string;
  assignedBy: {
    _id: string;
    fullname: string;
    phone: string;
  };
  createdAt: string;
}

export default function AgentProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentProducts, setAgentProducts] = useState<AgentProduct[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    console.log('Component mounted, checking auth...');
    if (token) {
      console.log('Token exists, fetching data...');
      fetchProducts();
      fetchAgents();
      fetchAgentProducts();
    } else {
      console.log('No token found');
    }
  }, [token]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/shop-owner-mobile/product/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log('Products API response:', data);
      if (data.success) {
        // Map the response to match our Product interface
        const formattedProducts = data.products.map((product: any) => ({
          id: product.id,
          _id: product.id, // Keep both for backward compatibility
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          category: product.category,
          subcategory: product.subcategory
        }));
        console.log('Formatted products:', formattedProducts);
        setProducts(formattedProducts);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!token) {
      console.error('No token available for fetching agents');
      return;
    }
    
    try {
      console.log('Fetching agents from:', `${API_URL}/agent/list`);
      const response = await fetch(`${API_URL}/agent/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Agents API response:', data);
      
      // Handle different possible response structures
      if (data.success && data.agents && Array.isArray(data.agents)) {
        // If the agents are in an 'agents' property
        setAgents(data.agents);
      } else if (data.success && Array.isArray(data.data)) {
        setAgents(data.data);
      } else if (Array.isArray(data)) {
        // If the API returns the array directly
        setAgents(data);
      } else {
        console.error('Unexpected agents response format:', data);
        setAgents([]);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchAgentProducts = async (page: number = 1) => {
    if (!token) {
      console.error('Avtorizatsiya tokeni topilmadi');
      return;
    }
    try {
      console.log('Agent mahsulotlari yuklanmoqda...');
      const response = await fetch(
        `${API_URL}/shop-owner-mobile/agents/products?page=${page}&limit=${itemsPerPage}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Agent mahsulotlarini yuklashda xatolik:', errorText);
        throw new Error(`HTTP xatolik! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Agent mahsulotlari javobi:', data);
      
      if (data.success) {
        setAgentProducts(data.data || []);
        setTotalItems(data.total || 0);
        setCurrentPage(page);
      } else {
        console.error('Noto\'g\'ri formatdagi javob:', data);
        setAgentProducts([]);
      }
    } catch (error) {
      console.error('Error fetching agent products:', error);
    }
  };

  const handleAssignProduct = async () => {
    if (!selectedProduct || !selectedAgent || !quantity || !token) {
      Alert.alert('Xatolik', 'Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }
    
    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Xatolik', 'Iltimos, to\'g\'ri miqdorni kiriting');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/shop-owner-mobile/agents/assign-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          agentId: selectedAgent,
          productId: selectedProduct,
          quantity: quantityNum,
        }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Muvaffaqiyatli', `${quantity} ta mahsulot agentga yuklandi`);
        setSelectedProduct('');
        setSelectedAgent('');
        setQuantity('');
        fetchAgentProducts();
      } else {
        Alert.alert('Xatolik', data.message || 'Xatolik yuz berdi');
      }
    } catch (error) {
      console.error('Error assigning product:', error);
      Alert.alert('Xatolik', 'Server bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnProduct = async (agentProductId: string, maxQuantity: number) => {
    if (!token) {
      Alert.alert('Xatolik', 'Avtorizatsiya xatoligi');
      return;
    }
    Alert.prompt(
      'Mahsulot qaytarish',
      `Qancha miqdorni qaytarmoqchisiz? (Maksimal: ${maxQuantity})`,
      [
        {
          text: 'Bekor qilish',
          style: 'cancel',
        },
        {
          text: 'Tasdiqlash',
          onPress: async (quantity) => {
            const quantityNum = parseInt(quantity || '0', 10);
            if (isNaN(quantityNum) || quantityNum <= 0 || quantityNum > maxQuantity) {
              Alert.alert('Xatolik', `Iltimos, 1 dan ${maxQuantity} gacha to'g'ri miqdor kiriting`);
              return;
            }

            try {
              const response = await fetch(`${API_URL}/shop-owner-mobile/agents/return-product`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  agentProductId,
                  quantity: quantityNum,
                }),
              });

              const data = await response.json();
              if (data.success) {
                Alert.alert('Muvaffaqiyatli', `${quantityNum} ta mahsulot omborga qaytarildi`);
                fetchAgentProducts();
              } else {
                Alert.alert('Xatolik', data.message || 'Xatolik yuz berdi');
              }
            } catch (error) {
              console.error('Error returning product:', error);
              Alert.alert('Xatolik', 'Server bilan bog\'lanishda xatolik yuz berdi');
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    fetchAgentProducts(pageNumber);
  };

  console.log('Rendering with products:', products);
  console.log('Rendering with agents:', agents);
  
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Yuklanmoqda...</Text>
      </View>
    );
  }

  // Render pagination controls
  const renderPagination = () => (
    <View style={styles.pagination}>
      <TouchableOpacity 
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => paginate(1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.pageButtonText}>«</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.pageButtonText}>‹</Text>
      </TouchableOpacity>
      
      <Text style={styles.pageInfo}>
        {currentPage} / {totalPages || 1}
      </Text>
      
      <TouchableOpacity 
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => paginate(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.pageButtonText}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
        onPress={() => paginate(totalPages)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.pageButtonText}>»</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Agentlarga Mahsulot Yuklash</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Mahsulot tanlang:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedProduct}
            onValueChange={(itemValue) => setSelectedProduct(itemValue)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Mahsulot tanlang" value="" />
            {products === null ? (
              <Picker.Item 
                key="loading-products"
                label="Yuklanmoqda..." 
                value="" 
              />
            ) : products.length === 0 ? (
              <Picker.Item 
                key="no-products"
                label="Mahsulotlar topilmadi" 
                value="" 
              />
            ) : (
              products.map((product) => (
                <Picker.Item 
                  key={product.id || product._id || ''}
                  label={`${product.name} - ${product.price.toLocaleString()} so'm (Qolgan: ${product.quantity})`}
                  value={product.id || product._id || ''}
                />
              ))
            )}
          </Picker>
        </View>

        <Text style={styles.label}>Agent tanlang:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedAgent}
            onValueChange={(itemValue) => setSelectedAgent(itemValue)}
            style={styles.picker}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Agent tanlang" value="" />
            {agents === null ? (
              <Picker.Item 
                key="loading"
                label="Yuklanmoqda..." 
                value="" 
              />
            ) : agents.length === 0 ? (
              <Picker.Item 
                key="no-agents"
                label="Agentlar topilmadi" 
                value="" 
              />
            ) : (
              agents.map((agent) => (
                <Picker.Item 
                  key={agent.id || agent._id || ''}
                  label={`${agent.fullname} - ${agent.phone || 'Telefon raqami mavjud emas'}`}
                  value={agent.id || agent._id || ''}
                />
              ))
            )}
          </Picker>
        </View>

        <Text style={styles.label}>Miqdor:</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Miqdorni kiriting"
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleAssignProduct}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Yuklanmoqda...' : 'Yükle'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.subtitle}>Yuklangan Mahsulotlar ({totalItems} ta)</Text>
        {renderPagination()}
        {agentProducts === null ? (
          <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />
        ) : agentProducts.length === 0 ? (
          <Text style={styles.noData}>Hozircha yuklangan mahsulot topilmadi</Text>
        ) : (
          agentProducts.map((item) => (
            <View key={item._id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.agentName}>{item.agent.fullname}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text>Yuklangan: {item.assignedQuantity} ta</Text>
                <Text>Qolgan: {item.remainingQuantity} ta</Text>
                <Text>Holati: {getStatusText(item.status)}</Text>
                <Text>Yuklangan sana: {new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              {item.remainingQuantity > 0 && (
                <TouchableOpacity 
                  style={styles.returnButton}
                  onPress={() => handleReturnProduct(item._id, item.remainingQuantity)}
                >
                  <Text style={styles.returnButtonText}>Qaytarish</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'assigned':
      return 'Yuklangan';
    case 'sold':
      return 'Sotilgan';
    case 'returned':
      return 'Qaytarilgan';
    default:
      return status;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  agentName: {
    color: '#666',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  returnButton: {
    backgroundColor: '#ff9800',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  returnButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  pageButtonText: {
    fontSize: 16,
    color: '#333',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfo: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#666',
  },
});
