import { useState, useEffect } from 'react';
import CreateCategoryModal from '../components/Categories/CreateCategoryModal';
import ViewCategoryModal from '../components/Categories/ViewCategoryModal';
import Snackbar from '../components/Common/Snackbar';
import { PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAccess, setHasAccess] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' });
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) {
      console.error('No token found. User is not authenticated.');
      setError('Iltimos, tizimga kiring');
      setSnackbar({ open: true, message: 'Iltimos, tizimga kiring', type: 'error' });
      return;
    }
    
    // Allow access to both admin and shop-owner roles
    if (user?.type === 'admin' || user?.type === 'shop-owner') {
      fetchCategories();
    } else {
      setHasAccess(false);
      setError('Sizda ushbu bo\'limga kirish uchun ruxsat yo\'q');
      setLoading(false);
    }
  }, [token, user]);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/category/list', token);
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.message === 'Admin topilmadi' 
        ? 'Sizda ushbu bo\'limga kirish uchun ruxsat yo\'q' 
        : 'Kategoriyalarni yuklashda xatolik yuz berdi';
      
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
      
      // If access is denied, update the access state
      if (err.message === 'Admin topilmadi') {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchCategories();
    setSnackbar({ open: true, message: 'Kategoriya muvaffaqiyatli yaratildi', type: 'success' });
  };


  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
          <p className="font-bold">Ruxsat yo'q</p>
          <p>Sizda ushbu bo'limga kirish uchun ruxsat yo'q. Iltimos, administrator bilan bog'laning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Snackbar message={snackbar.message} type={snackbar.type} onClose={handleSnackbarClose} open={snackbar.open} />
      {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">Kategoriyalar</h2>
          <p className="text-sm text-gray-600 mt-1">Mahsulot kategoriyalari boshqaruvi</p>
        </div>
        {/* {user?.type === 'admin' && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
              <PlusIcon className="h-5 w-5" /> Yangi kategoriya
            </button>
          </div>
        )} */}
      </div>
      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{category.status === 'active' ? 'Faol' : 'Faol emas'}</span>
              </div>
              {/* Created by */}
              {category.createdBy?.name && (
                <div className="mb-2 text-xs text-gray-500">Yaratgan: {category.createdBy.name}</div>
              )}
              {/* Subcategories */}
              {Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Subkategoriyalar</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.subcategories.map((sub) => (
                      <span key={sub.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {sub.name}
                        {sub.createdBy?.name && (
                          <span className="ml-2 text-[10px] text-gray-400">({sub.createdBy.name})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => { 
                    setSelectedCategory(category); 
                    setIsViewModalOpen(true); 
                  }} 
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors duration-200"
                >
                  <EyeIcon className="h-4 w-4" /> Ko'rish
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateCategoryModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={handleCreateSuccess} token={token} />
      )}
      
      {/* View Modal */}
      {isViewModalOpen && selectedCategory && (
        <ViewCategoryModal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          category={selectedCategory} 
        />
      )}
    </div>
  );
};

export default Categories;
