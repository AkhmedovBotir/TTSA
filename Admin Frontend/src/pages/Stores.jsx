import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import CreateStoreModal from '../components/Stores/CreateStoreModal';
import EditStoreModal from '../components/Stores/EditStoreModal';
import DeleteStoreModal from '../components/Stores/DeleteStoreModal';
import ViewStoreModal from '../components/Stores/ViewStoreModal';
import Snackbar from '../components/Common/Snackbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: ''
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  const handleStatusChange = async (storeId) => {
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) {
        throw new Error("Do'kon topilmadi");
      }

      const newStatus = store.status === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

              const response = await fetch(`https://api.ttsa.uz/api/shop/${storeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Do'kon statusini o'zgartirishda xatolik yuz berdi");
      }

      setStores(stores.map(s => {
        if (s.id === storeId) {
          return { ...s, status: newStatus };
        }
        return s;
      }));

      setSnackbar({
        open: true,
        message: "Do'kon statusi muvaffaqiyatli o'zgartirildi",
        severity: 'success'
      });

    } catch (error) {
      console.error('Error updating store status:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredStores = stores.filter(store => {
    const searchMatch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = !filters.status || store.status === filters.status;

    return searchMatch && statusMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStores = filteredStores.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchStores();
      fetchOwners();
    }
  }, [token]);

  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

              const response = await fetch('https://api.ttsa.uz/api/shop-owner/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      
      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egalarini yuklashda xatolik yuz berdi');
      }

      // Try to extract shop owners from different possible response formats
      let shopOwners = [];
      
      if (result.data && Array.isArray(result.data)) {
        shopOwners = result.data; // If data is in result.data
      } else if (result.shopOwners && Array.isArray(result.shopOwners)) {
        shopOwners = result.shopOwners; // If data is in result.shopOwners
      } else if (Array.isArray(result)) {
        shopOwners = result; // If response is directly an array
      }

      setOwners(shopOwners);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }


              const response = await fetch('https://api.ttsa.uz/api/shop/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token'); // Token yaroqsiz bo'lsa o'chiramiz
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'konlarni yuklashda xatolik yuz berdi');
      }

      setStores(result.shops || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const handleDeleteStore = async (store) => {
    try {
      if (!store || !store.id) {
        throw new Error('Do\'kon ma\'lumotlari topilmadi');
      }
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

      const response = await fetch(`https://api.ttsa.uz/api/shop/${store.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      if (response.status === 403) {
        throw new Error('Do\'konni o\'chirish uchun ruxsat yo\'q');
      }

      if (response.status === 404) {
        throw new Error('Do\'kon topilmadi');
      }

      if (response.status === 400) {
        throw new Error('Noto\'g\'ri do\'kon ID formati');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'konni o\'chirishda xatolik yuz berdi');
      }

      setStores(prevStores => prevStores.filter(s => s.id !== store.id));
      setSnackbar({ open: true, message: 'Do\'kon muvaffaqiyatli o\'chirildi', severity: 'success' });
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting store:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  }


  const handleEditStoreClick = async (store) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

      const response = await fetch(`https://api.ttsa.uz/api/shop/${store.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      if (response.status === 403) {
        throw new Error('Sizda bu amalni bajarish uchun ruxsat yo\'q');
      }

      if (response.status === 404) {
        throw new Error('Do\'kon topilmadi');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon ma\'lumotlarini olishda xatolik yuz berdi');
      }

      setSelectedStore(result.shop);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching store details for edit:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const handleViewStore = async (store) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

      const response = await fetch(`https://api.ttsa.uz/api/shop/${store.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      if (response.status === 403) {
        throw new Error('Sizda bu amalni bajarish uchun ruxsat yo\'q');
      }

      if (response.status === 404) {
        throw new Error('Do\'kon topilmadi');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon ma\'lumotlarini olishda xatolik yuz berdi');
      }

      setSelectedStore(result.shop);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching store details:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const handleEditStore = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

      // Make sure we have a valid store ID
      if (!data.id) {
        throw new Error('Do\'kon ID si topilmadi');
      }

      const response = await fetch(`https://api.ttsa.uz/api/shop/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: data.name,
          ownerId: data.owner_id,
          phone: data.phone,
          address: data.address,
          inn: data.inn
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      if (response.status === 403) {
        throw new Error('Sizda bu amalni bajarish uchun ruxsat yo\'q');
      }

      if (response.status === 404) {
        throw new Error('Do\'kon yoki do\'kon egasi topilmadi');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'konni yangilashda xatolik yuz berdi');
      }

      setStores(prevStores => prevStores.map(store => {
        if (store.id === data.id) {
          return result.shop;
        }
        return store;
      }));

      setSnackbar({
        open: true,
        message: 'Do\'kon muvaffaqiyatli yangilandi',
        severity: 'success'
      });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating store:', error);
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
    }
  };

  const handleCreateStore = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }

      // ID formatini tekshirish
      if (!data.ownerId || typeof data.ownerId !== 'string' || !data.ownerId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Iltimos, ro\'yxatdan do\'kon egasini tanlang');
      }

      const requestData = {
        name: data.name,
        ownerId: data.ownerId,
        phone: data.phone,
        address: data.address,
        inn: data.inn
      };

      const response = await fetch('https://api.ttsa.uz/api/shop/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        throw new Error('Sessiya muddati tugagan. Iltimos, tizimga qayta kiring');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Serverda xatolik yuz berdi');
      }

      setStores(prevStores => [...prevStores, result.shop]);
      setSnackbar({ open: true, message: 'Do\'kon muvaffaqiyatli yaratildi', severity: 'success' });
      return true;
    } catch (error) {
      console.error('Error creating store:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      if (error.message.includes('qayta kiring')) {
        navigate('/login');
      }
      return false;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Do'konlar
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Barcha do'konlarni boshqarish va yangi do'konlar qo'shish
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Yangi do'kon
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-8 mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
            placeholder="Do'kon nomi, egasi yoki manzili bo'yicha qidirish..."
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Faol emas</option>
          </select>
        </div>
      </div>

      {/* Stores Table */}
      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Do'kon nomi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Egasi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Telefon
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Manzil
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentStores.map((store, index) => (
                    <tr key={store.id || index}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {store.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {store.owner?.name || 'Noma\'lum'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {store.phone}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {store.address}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleViewStore(store)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditStoreClick(store)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStore(store);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="px-3 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <p className="text-sm text-gray-700">
                            Jami <span className="font-medium">{filteredStores.length}</span> ta do'kon,{' '}
                            <span className="font-medium">{startIndex + 1}</span> dan{' '}
                            <span className="font-medium">{Math.min(endIndex, filteredStores.length)}</span> gacha ko'rsatilmoqda
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                              currentPage === 1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          {[...Array(totalPages)].map((_, index) => (
                            <button
                              key={index + 1}
                              onClick={() => handlePageChange(index + 1)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                                currentPage === index + 1
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                              currentPage === totalPages
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewStoreModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
      />

      <CreateStoreModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateStore}
        owners={owners}
      />

      <EditStoreModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        store={selectedStore}
        onSubmit={handleEditStore}
        owners={owners}
      />

      <DeleteStoreModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
        onConfirm={handleDeleteStore}
      />

      <Snackbar
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        open={snackbar.open}
      />
    </div>
  );
};

export default Stores;
