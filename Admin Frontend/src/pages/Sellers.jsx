import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';
import Snackbar from '../components/Common/Snackbar';
import {
  SellerTable,
  CreateSellerModal,
  EditSellerModal,
  DeleteSellerModal,
  ViewSellerModal
} from '../components/Sellers';

const permissions = [
  { id: 'manage_products', label: 'Mahsulotlar' },
  { id: 'manage_orders', label: 'Buyurtmalar' },
  { id: 'manage_installments', label: "Muddatli to'lovlar" }
];

const Sellers = () => {
  const [sellers, setSellers] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    store: ''
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSellers();
      fetchStores();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

              const response = await fetch('https://api.ttsa.uz/api/shop/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });


      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        throw new Error('Avtorizatsiyadan o\'tilmagan');
      }


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Do\'konlarni yuklashda xatolik yuz berdi');
      }

      setStores(data.shops || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

              let url = 'https://api.ttsa.uz/api/admin/sellers/list';
      const params = new URLSearchParams();
      
      if (filters.store) params.append('shopId', filters.store);
      if (filters.status) params.append('status', filters.status);
      if (searchTerm) params.append('search', searchTerm);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Sotuvchilarni yuklashda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchilarni yuklashda xatolik yuz berdi');
      }

      const mappedSellers = data.sellers.map(seller => {
        // Shop owners ma'lumotlarini olish
        const shopOwners = seller.shopOwners || [];
        const shops = seller.shops || [];
        
        // Do'konlar ro'yxatini yaratish
        const connectedShops = shopOwners.map(shopOwner => ({
          id: shopOwner.shopOwner._id,
          name: shopOwner.shopOwner.name,
          phone: shopOwner.shopOwner.phone,
          username: shopOwner.shopOwner.username,
          assignedAt: shopOwner.assignedAt,
          serviceAreas: shopOwner.serviceAreas || []
        }));

        return {
          id: seller.id,
          name: seller.fullName,
          username: seller.username,
          phone: seller.phone,
          shopOwners: connectedShops,
          shops: shops,
          status: seller.status,
          createdAt: new Date(seller.createdAt).toLocaleString('uz-UZ'),
          createdBy: seller.createdBy ? `${seller.createdBy.fullname} (${seller.createdBy.username})` : 'Noma\'lum'
        };
      });

      setSellers(mappedSellers);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setSellers([]);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSeller = async (sellerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/sellers/${sellerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Sotuvchi topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Sotuvchini yuklashda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchini yuklashda xatolik yuz berdi');
      }

      const mappedSeller = {
        id: data.seller.id,
        name: data.seller.fullName,
        username: data.seller.username,
        phone: data.seller.phone,
        store: data.seller.shop ? { id: data.seller.shop._id, name: data.seller.shop.name } : null,
        status: data.seller.status,
        createdAt: new Date(data.seller.createdAt).toLocaleString('uz-UZ'),
        createdBy: data.seller.createdBy ? `${data.seller.createdBy.fullname} (${data.seller.createdBy.username})` : 'Noma\'lum'
      };

      setSelectedSeller(mappedSeller);
    } catch (error) {
      console.error('Error fetching seller:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleCreateSeller = async (sellerData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch('https://api.ttsa.uz/api/admin/sellers/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: sellerData.name,
          phone: sellerData.phone,
          username: sellerData.username,
          password: sellerData.password
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Sotuvchi yaratishda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchi yaratishda xatolik yuz berdi');
      }

      setShowCreateModal(false);
      fetchSellers();
      setSnackbar({
        open: true,
        message: 'Sotuvchi muvaffaqiyatli yaratildi',
        type: 'success'
      });
      return true;
    } catch (error) {
      console.error('Error creating seller:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
      return false;
    }
  };

  const handleEditSeller = async (sellerData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/sellers/${sellerData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: sellerData.name,
          phone: sellerData.phone,
          username: sellerData.username
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Sotuvchi yoki do\'kon topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri ma\'lumotlar kiritildi');
        }
        throw new Error('Sotuvchini tahrirlashda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchini tahrirlashda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Sotuvchi muvaffaqiyatli tahrirlandi',
        type: 'success'
      });

      setShowEditModal(false);
      fetchSellers();
    } catch (error) {
      console.error('Error editing seller:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDelete = async (sellerId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/sellers/${sellerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Sotuvchi topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Sotuvchini o\'chirishda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchini o\'chirishda xatolik yuz berdi');
      }

      // Sotuvchini ro'yxatdan olib tashlash
      setSellers(prev => prev.filter(s => s.id !== sellerId));

      // Modalni yopish
      setShowDeleteModal(false);

      // Xabar ko'rsatish
      setSnackbar({
        open: true,
        message: 'Sotuvchi muvaffaqiyatli o\'chirildi',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting seller:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteConfirm = () => {
    handleDelete(selectedSeller.id);
  };

  const handleStatusChange = async (sellerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/sellers/${sellerId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Sotuvchi topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri so\'rov');
        }
        throw new Error('Sotuvchi statusini o\'zgartirishda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Sotuvchi statusini o\'zgartirishda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Sotuvchi statusi muvaffaqiyatli o\'zgartirildi',
        type: 'success'
      });

      fetchSellers();
    } catch (error) {
      console.error('Error changing seller status:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handlePasswordChange = async (sellerId, password) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/admin/sellers/${sellerId}/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 404) {
          throw new Error('Sotuvchi topilmadi');
        }
        if (response.status === 400) {
          throw new Error('Noto\'g\'ri parol (kamida 6 ta belgi bo\'lishi kerak)');
        }
        throw new Error('Parolni o\'zgartirishda xatolik yuz berdi');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Parolni o\'zgartirishda xatolik yuz berdi');
      }

      setSnackbar({
        open: true,
        message: 'Parol muvaffaqiyatli o\'zgartirildi',
        type: 'success'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleEdit = (seller) => {
    fetchSeller(seller.id);
    setShowEditModal(true);
  };

  const filteredSellers = sellers.filter(seller => {
    const searchMatch = (
      seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seller.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const statusMatch = !filters.status || seller.status === filters.status;
    const storeMatch = !filters.store || seller.store?._id === filters.store;
    
    return searchMatch && statusMatch && storeMatch;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredSellers.length);
  const currentItems = filteredSellers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Sotuvchilar</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span>Yangi sotuvchi</span>
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Qidirish
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Ism yoki telefon raqami..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option key="all" value="">Barchasi</option>
                <option key="active" value="active">Faol</option>
                <option key="inactive" value="inactive">Faol emas</option>
              </select>
            </div>

            <div>
              <label htmlFor="store" className="block text-sm font-medium text-gray-700 mb-1">
                Do'kon
              </label>
              <select
                id="store"
                value={filters.store}
                onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Barchasi</option>
                {stores.map(store => (
                  <option key={store._id} value={store._id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <SellerTable
            currentSellers={currentItems}
            totalPages={totalPages}
            currentPage={currentPage}
            filteredSellers={filteredSellers}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={handlePageChange}
            onView={(seller) => {
              setSelectedSeller(seller);
              setShowViewModal(true);
            }}
            onEdit={handleEdit}
            onDelete={(seller) => {
              setSelectedSeller(seller);
              setShowDeleteModal(true);
            }}
            onStatusChange={handleStatusChange}
            onPasswordChange={handlePasswordChange}
            permissions={permissions}
          />
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Modals */}
      <CreateSellerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSeller}
        stores={stores}
      />

      <EditSellerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onEdit={handleEditSeller}
        onPasswordChange={handlePasswordChange}
        seller={selectedSeller}
        stores={stores}
      />

      <DeleteSellerModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        seller={selectedSeller}
      />

      <ViewSellerModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        seller={selectedSeller}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default Sellers;
