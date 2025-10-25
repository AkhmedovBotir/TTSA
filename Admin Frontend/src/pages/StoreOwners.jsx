import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, EyeIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import CreateStoreOwnerModal from '../components/StoreOwners/CreateStoreOwnerModal';
import EditStoreOwnerModal from '../components/StoreOwners/EditStoreOwnerModal';
import DeleteStoreOwnerModal from '../components/StoreOwners/DeleteStoreOwnerModal';
import ViewStoreOwnerModal from '../components/StoreOwners/ViewStoreOwnerModal';
import Snackbar from '../components/Common/Snackbar';

// These are the valid permissions that the backend accepts for shop owners
const permissionLabels = {
  manage_products: 'Mahsulotlarni boshqarish',
  manage_orders: 'Buyurtmalarni boshqarish',
  manage_categories: 'Kategoriyalarni boshqarish',
  manage_installments: 'Muddatli to\'lovlarni boshqarish',
  manage_contracts: 'Shartnomalarni boshqarish',
  view_statistics: 'Statistikani ko\'rish'
  // Note: 'manage_assistants' has been removed as it's not a valid permission for shop owners
};

const StoreOwners = () => {
  const token = localStorage.getItem('token');
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: ''
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [availablePermissions, setAvailablePermissions] = useState([]);

  useEffect(() => {
    fetchStoreOwners();
    fetchAvailablePermissions();
  }, []);

  const fetchStoreOwners = async () => {
    try {
              const response = await fetch('https://api.ttsa.uz/api/shop-owner/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Do\'kon egalarini yuklashda xatolik');
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setOwners(result.data);
      } else {
        setOwners([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching store owners:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Do\'kon egalarini yuklashda xatolik yuz berdi',
        type: 'error'
      });
      setOwners([]);
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
              const response = await fetch('https://api.ttsa.uz/api/shop-owner/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ruxsatlar ro\'yxatini olishda xatolik yuz berdi');
      }

      setAvailablePermissions(result.permissions);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleCreateOwner = async (data) => {
    try {
              const response = await fetch('https://api.ttsa.uz/api/shop-owner/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasini qo\'shishda xatolik yuz berdi');
      }

      setOwners(prevOwners => [...prevOwners, result.shopOwner]);
      setSnackbar({ open: true, message: 'Do\'kon egasi muvaffaqiyatli qo\'shildi', severity: 'success' });
      return true; // Muvaffaqiyatli bo'lsa true qaytaramiz
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      return false; // Xatolik bo'lsa false qaytaramiz
    }
  };

  const handleEditOwner = async (id, data) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasini o\'zgartirishda xatolik yuz berdi');
      }

      setOwners(prevOwners => 
        prevOwners.map(owner => 
          (owner._id || owner.id) === id ? result.shopOwner : owner
        )
      );
      setSnackbar({ open: true, message: 'Do\'kon egasi muvaffaqiyatli o\'zgartirildi', severity: 'success' });
      return true;
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      return false;
    }
  };

  const handleEditPermissions = async (id, permissions) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner/${id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasi ruxsatlarini o\'zgartirishda xatolik yuz berdi');
      }

      setOwners(prevOwners => 
        prevOwners.map(owner => 
          (owner._id || owner.id) === id ? { ...owner, permissions: result.permissions } : owner
        )
      );
      setSnackbar({ open: true, message: 'Do\'kon egasi ruxsatlari muvaffaqiyatli o\'zgartirildi', severity: 'success' });
      return true;
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
      return false;
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner/${selectedOwner.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasini o\'chirishda xatolik yuz berdi');
      }

      setOwners(prevOwners => prevOwners.filter(owner => (owner._id || owner.id) !== (selectedOwner._id || selectedOwner.id)));
      setSnackbar({ open: true, message: 'Do\'kon egasi muvaffaqiyatli o\'chirildi', severity: 'success' });
      setShowDeleteModal(false);
      setSelectedOwner(null);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      
      if (!id) {
        throw new Error('Owner ID is undefined');
      }

      const response = await fetch(`https://api.ttsa.uz/api/shop-owner/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasi statusini o\'zgartirishda xatolik yuz berdi');
      }

      setOwners(prevOwners => 
        prevOwners.map(owner => 
          (owner._id || owner.id) === id ? result.shopOwner : owner
        )
      );

      setSnackbar({
        open: true,
        message: newStatus === 'active' ? 'Do\'kon egasi muvaffaqiyatli faollashtirildi' : 'Do\'kon egasi muvaffaqiyatli to\'xtatildi',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const handleViewOwner = async (id) => {
    try {
      const response = await fetch(`https://api.ttsa.uz/api/shop-owner/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Do\'kon egasi ma\'lumotlarini olishda xatolik yuz berdi');
      }

      setSelectedOwner(result.shopOwner);
      setShowViewModal(true);
    } catch (error) {
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    }
  };

  const filteredOwners = (owners || []).filter(owner => {
    const searchMatch = 
      (owner.name && owner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (owner.phone && owner.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (owner.username && owner.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const statusMatch = !filters.status || owner.status === filters.status;

    return searchMatch && statusMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOwners.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOwners = filteredOwners.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Do'kon egalari
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Barcha do'kon egalarini boshqarish va yangi do'kon egalari qo'shish
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Yangi qo'shish
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
            placeholder="Ism, telefon yoki username bo'yicha qidirish..."
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

      {/* Owners Table */}
      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Ism familiya
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Telefon
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Username
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ruxsatlar
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentOwners.map((owner) => (
                    <tr key={owner._id || owner.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {owner.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {owner.phone}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {owner.username}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {owner.permissions && owner.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {permissionLabels[permission] || permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleStatusChange(owner._id || owner.id, owner.status === 'active' ? 'inactive' : 'active')}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                              owner.status === 'active' ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                owner.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="ml-3 text-sm">
                            {owner.status === 'active' ? 'Faol' : 'Faol emas'}
                          </span>
                        </div>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          type="button"
                          onClick={() => handleViewOwner(owner._id || owner.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOwner(owner);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOwner(owner);
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
                            Jami <span className="font-medium">{filteredOwners.length}</span> ta do'kon egasi,{' '}
                            <span className="font-medium">{startIndex + 1}</span> dan{' '}
                            <span className="font-medium">{Math.min(endIndex, filteredOwners.length)}</span> gacha ko'rsatilmoqda
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
      <ViewStoreOwnerModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedOwner(null);
        }}
        owner={selectedOwner}
      />

      <CreateStoreOwnerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOwner}
      />

      <EditStoreOwnerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOwner(null);
        }}
        onSubmit={(data) => handleEditOwner(selectedOwner.id, data)}
        onPermissionsSubmit={(permissions) => handleEditPermissions(selectedOwner.id, permissions)}
        owner={selectedOwner}
        availablePermissions={availablePermissions}
      />

      <DeleteStoreOwnerModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedOwner(null);
        }}
        onConfirm={handleDeleteConfirm}
        owner={selectedOwner}
      />

      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default StoreOwners;
