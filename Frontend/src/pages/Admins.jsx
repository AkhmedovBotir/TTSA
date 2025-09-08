import { useState, useEffect } from 'react';
import {
  AdminTable,
  ViewAdminModal,
  EditAdminModal,
  DeleteAdminModal,
  CreateAdminModal
} from '../components/Admins';
import Snackbar from '../components/Common/Snackbar';

const permissions = [
  { id: 'manage_admins', label: 'Adminlar' },
  { id: 'manage_tariffs', label: 'Tariflar' },
  { id: 'manage_shops', label: "Do'konlar" },
  { id: 'manage_shop_owners', label: "Do'kon egalari" },
  { id: 'manage_assistants', label: 'Yordamchilar' },
  { id: 'manage_categories', label: 'Kategoriyalar' },
  { id: 'manage_products', label: 'Mahsulotlar' },
  { id: 'manage_orders', label: 'Buyurtmalar' },
  { id: 'manage_installments', label: "Muddatli to'lovlar" },
  { id: 'manage_contracts', label: 'Shartnomalar' },
  { id: 'view_statistics', label: 'Statistika' }
];

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editForm, setEditForm] = useState({
    fullname: '',
    phone: '',
    status: '',
    permissions: []
  });
  const [filters, setFilters] = useState({
    status: '',
    permission: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      // Avval to'g'ridan-to'g'ri token olishga harakat qilamiz
      let token = localStorage.getItem('token');
      
      // Agar token topilmasa, user obyektidan olishga harakat qilamiz
      if (!token) {
        const user = JSON.parse(localStorage.getItem('user'));
        token = user?.token;
        
        // Topilgan tokenni alohida saqlaymiz
        if (token) {
          localStorage.setItem('token', token);
        }
      }
  
      if (!token) {
        throw new Error('Token topilmadi. Iltimos, tizimga qayta kiring');
      }
  
              const response = await fetch('http://localhost:3000/api/admin/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        credentials: 'include'
      });
  
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sessiya muddati tugagan. Iltimos, qayta kiring');
      }
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Adminlar ro\'yxatini olishda xatolik');
      }
  
      // General admin doim birinchi o'rinda turishi uchun
      const sortedAdmins = data.admins.sort((a, b) => {
        if (a.role === 'general') return -1;
        if (b.role === 'general') return 1;
        return 0;
      });
  
      setAdmins(sortedAdmins);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const itemsPerPage = 5;

  const filteredAdmins = admins.filter(admin => {
    const searchMatch = (admin.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       admin.username?.toLowerCase().includes(searchTerm.toLowerCase())) ?? false;
    const statusMatch = !filters.status || admin.status === filters.status;
    const permissionMatch = !filters.permission || (admin.permissions && admin.permissions.includes(filters.permission));
    
    return searchMatch && statusMatch && permissionMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAdmins = filteredAdmins.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleViewAdmin = async (admin) => {
    try {
              const response = await fetch(`http://localhost:3000/api/admin/${admin.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedAdmin(data.admin);
        setIsViewModalOpen(true);
      } else {
        setError(data.message || 'Admin ma\'lumotlarini yuklashda xatolik');
      }
    } catch (error) {
      setError('Server bilan bog\'lanishda xatolik');
      console.error('View admin error:', error);
    }
  };

  const handleEditClick = (admin) => {
    if (!admin?.id) {
      console.error('Admin ID topilmadi:', admin);
      setSnackbar({
        open: true,
        message: 'Admin ma\'lumotlari to\'liq emas',
        type: 'error'
      });
      return;
    }

    setSelectedAdmin(admin);
    setEditForm({
      fullname: admin.fullname || '',
      phone: admin.phone || '',
      status: admin.status || 'active',
      permissions: admin.permissions || [],
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (admin) => {
    if (!admin?.id) {
      console.error('Admin ID topilmadi:', admin);
      setSnackbar({
        open: true,
        message: 'Admin ma\'lumotlari to\'liq emas',
        type: 'error'
      });
      return;
    }
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (updatedData) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/${selectedAdmin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
  
      if (!response.ok) {
        throw new Error('Admin ma\'lumotlarini yangilashda xatolik yuz berdi');
      }
  
      const data = await response.json();
      setAdmins(admins.map(admin => 
        admin.id === selectedAdmin.id ? data : admin
      ));
      setSelectedAdmin(null);
      setIsEditModalOpen(false); // setShowEditModal o'rniga setIsEditModalOpen ishlatamiz
      
      setSnackbar({
        open: true,
        message: 'Admin muvaffaqiyatli tahrirlandi',
        type: 'success'
      });
    } catch (error) {
      console.error('Xatolik:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!selectedAdmin?.id) {
        throw new Error('Admin ID topilmadi');
      }

      const response = await fetch(`http://localhost:3000/api/admin/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin o\'chirishda xatolik');
      }

      setSnackbar({
        open: true,
        message: 'Admin muvaffaqiyatli o\'chirildi',
        type: 'success'
      });
      setIsDeleteModalOpen(false);
      fetchAdmins();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
      console.error('Delete admin error:', error);
    }
  };

  const handleCreateAdmin = async (formData) => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAdmins(prev => [...prev, data.admin]);
        setSnackbar({
          open: true,
          message: 'Yangi admin qo\'shildi',
          type: 'success'
        });
        setIsModalOpen(false);
      } else {
        setError(data.message || 'Yangi admin qo\'shishda xatolik');
      }
    } catch (error) {
      setError('Server bilan bog\'lanishda xatolik');
      console.error('Create admin error:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setEditForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        onClose={handleSnackbarClose}
        open={snackbar.open}
      />
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Adminlar
          </h2>
          <p className="text-sm text-gray-600 mt-1">Tizim administratorlari boshqaruvi</p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Yangi admin
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
            placeholder="Admin ismini kiriting..."
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="appearance-none block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200 cursor-pointer [&>*]:py-2 [&>*]:px-4 [&>*]:text-gray-900 [&>*]:bg-white hover:[&>*]:bg-gray-50"
            >
              <option value="" className="py-2 px-4 hover:bg-gray-50">Barcha statuslar</option>
              <option value="active" className="py-2 px-4 hover:bg-gray-50 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 inline-block"></span>
                Faol
              </option>
              <option value="inactive" className="py-2 px-4 hover:bg-gray-50 flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-2 inline-block"></span>
                Faol emas
              </option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Permission Filter */}
        <div className="w-full md:w-64">
          <div className="relative">
            <select
              value={filters.permission}
              onChange={(e) => setFilters(prev => ({ ...prev, permission: e.target.value }))}
              className="appearance-none block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200 cursor-pointer [&>*]:py-2 [&>*]:px-4 [&>*]:text-gray-900 [&>*]:bg-white hover:[&>*]:bg-gray-50"
            >
              <option value="" className="py-2 px-4 hover:bg-gray-50">Barcha ruxsatlar</option>
              {permissions.map(permission => (
                <option 
                  key={permission.id} 
                  value={permission.id}
                  className="py-2 px-4 hover:bg-gray-50 flex items-center gap-2"
                >
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {permission.label}
                  </span>
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <AdminTable
          currentAdmins={currentAdmins}
          totalPages={totalPages}
          currentPage={currentPage}
          filteredAdmins={filteredAdmins}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={handlePageChange}
          onView={handleViewAdmin}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          permissions={permissions}
        />
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl">
              <CreateAdminModal
                permissions={permissions}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateAdmin}
              />
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsViewModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl">
              <ViewAdminModal
                admin={selectedAdmin}
                onClose={() => setIsViewModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsEditModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl">
              <EditAdminModal
                admin={selectedAdmin}
                permissions={permissions}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleEditSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl">
              <DeleteAdminModal
                admin={selectedAdmin}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;
