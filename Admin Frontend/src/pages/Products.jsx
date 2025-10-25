import React, { useState, useEffect } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import CreateProductModal from '../components/Products/CreateProductModal';
import ViewProductModal from '../components/Products/ViewProductModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: '', subcategory: '', status: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const itemsPerPage = 5;
  const { token } = useAuth();

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let url = '/product/list?';
      if (filters.status) url += `status=${filters.status}&`;
      if (filters.category) url += `category=${filters.category}&`;
      if (filters.subcategory) url += `subcategory=${filters.subcategory}&`;
      const data = await api.get(url, token);
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await api.get('/category/list', token);
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch subcategories for selected category
  const fetchSubcategories = async (parentId) => {
    if (!parentId) { setSubcategories([]); return; }
    try {
      const data = await api.get(`/category/subcategory/list?parentId=${parentId}`, token);
      setSubcategories(data.subcategories || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchCategories(); }, [token]);
  useEffect(() => { fetchProducts(); }, [filters, token]);
  useEffect(() => { fetchSubcategories(filters.category); }, [filters.category]);

  // Search and filter
  const filteredProducts = products.filter(product => {
    const searchMatch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subcategory.name.toLowerCase().includes(searchTerm.toLowerCase());
    return searchMatch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // CRUD handlers
  const handleCreateProduct = async (formData) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/product/create', formData, token);
      fetchProducts();
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  // Status change
  const handleStatusChange = async (product, newStatus) => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/product/${product.id}`, { status: newStatus }, token);
      fetchProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Category/subcategory select helpers for modals
  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));
  const subcategoryOptions = subcategories.map(sub => ({ value: sub.id, label: sub.name }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Maxsulotlar
          </h2>
          <p className="mt-2 text-sm text-gray-700">
            Barcha maxsulotlarni boshqarish va yangi maxsulotlar qo'shish
          </p>
        </div>
        {/* <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Yangi qo'shish
          </button>
        </div> */}
      </div>

      {/* Search and Filters */}
      <div className="mt-8 mb-6 flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-3 pr-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
            placeholder="Nomi, kategoriya yoki sub-kategoriya bo'yicha qidirish..."
          />
        </div>
        {/* Category Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.category}
            onChange={e => setFilters(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
            className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {/* Subcategory Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.subcategory}
            onChange={e => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
            className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
          >
            <option value="">Barcha sub-kategoriyalar</option>
            {subcategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
          >
            <option value="">Barcha statuslar</option>
            <option value="active">Faol</option>
            <option value="inactive">Faol emas</option>
            <option value="archived">Arxivlangan</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Narxi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategoriya</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-kategoriya</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Soni</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ko'rish</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  {product.createdBy?.name && (
                    <div className="text-xs text-gray-500">Yaratgan: {product.createdBy.name}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.price.toLocaleString()} so'm</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.category?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.subcategory?.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{product.quantity} dona</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={product.status}
                    onChange={e => handleStatusChange(product, e.target.value)}
                    className={`px-2 py-1 rounded-md border font-semibold focus:outline-none transition-colors duration-200
                      ${product.status === 'active' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                        : product.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}
                    `}
                  >
                    <option value="active">Faol</option>
                    <option value="inactive">Faol emas</option>
                    <option value="archived">Arxivlangan</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowViewModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='w-full'>
              <td colSpan="7" className="w-full px-2 py-4">
                <div className="flex items-center w-full justify-between">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Jami <span className="font-medium">{filteredProducts.length}</span> ta maxsulot,{' '}
                      <span className="font-medium">{startIndex + 1}</span> dan{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredProducts.length)}</span> gacha ko'rsatilmoqda
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(index + 1)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Modals */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProduct}
        categories={categories}
        subcategories={subcategories}
        fetchSubcategories={fetchSubcategories}
      />

      <ViewProductModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default Products;
