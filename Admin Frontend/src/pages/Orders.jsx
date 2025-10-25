import React, { useState, useEffect } from 'react';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import CreateOrderModal from '../components/Orders/CreateOrderModal';
import ViewOrderModal from '../components/Orders/ViewOrderModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchOrders = async (page = 1, status = 'all', startDate = '', endDate = '') => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.');
      }

      // Set date range based on filter
      let queryStartDate = '';
      let queryEndDate = format(new Date(), 'yyyy-MM-dd');
      
      if (dateRange === 'today') {
        queryStartDate = queryEndDate;
      } else if (dateRange === 'week') {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        queryStartDate = format(date, 'yyyy-MM-dd');
      } else if (dateRange === 'month') {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        queryStartDate = format(date, 'yyyy-MM-dd');
      } else if (dateRange === 'year') {
        const date = new Date();
        date.setFullYear(date.getFullYear() - 1);
        queryStartDate = format(date, 'yyyy-MM-dd');
      }

      const statusQuery = status === 'all' ? '' : `&status=${status}`;
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      
      const endpoint = `/admin/orders/history?page=${page}&limit=20${statusQuery}&startDate=${queryStartDate}&endDate=${queryEndDate}${searchQuery}`;
      
      try {
        const data = await api.get(endpoint, token);
        setOrders(data.data);
        setPagination(data.pagination);
        setError(null);
      } catch (error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          localStorage.removeItem('token');
          throw new Error('Sessiya muddati tugadi. Iltimos, qaytadan kiring.');
        }
        throw error;
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      if (err.message.includes('kiring') || err.message.includes('Sessiya')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, statusFilter === 'all' ? '' : statusFilter);
  }, [currentPage, statusFilter, dateRange, searchTerm]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders(1, statusFilter === 'all' ? '' : statusFilter);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const handleCreateOrder = async (orderData) => {
    try {
      setLoading(true);
      // Implement create order logic here
      await fetchOrders(currentPage, statusFilter === 'all' ? '' : statusFilter);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Buyurtmalar tarixi</h1>
          <p className="mt-2 text-sm text-gray-700">
            Barcha bajarilgan buyurtmalar ro'yxati. Buyurtmalarni filtrlash va qidirish imkoniyati mavjud.
          </p>
        </div>
        {/* <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            disabled={loading}
          >
            <PlusIcon className={`inline-block w-5 h-5 mr-2 ${loading ? 'opacity-50' : ''}`} />
            {loading ? 'Yuklanmoqda...' : 'Yangi buyurtma'}
          </button>
        </div> */}
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="mt-8">
        <div className="sm:flex sm:gap-x-4 mb-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Qidiruv
            </label>
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Buyurtma ID yoki mahsulot nomi bo'yicha qidirish..."
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-40">
            <label htmlFor="status" className="sr-only">
              Status bo'yicha filtrlash
            </label>
            <select
              id="status"
              name="status"
              value={statusFilter}
              onChange={handleStatusFilter}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="all">Barcha statuslar</option>
              <option value="pending">Kutilmoqda</option>
              <option value="processing">Jarayonda</option>
              <option value="completed">Bajarildi</option>
              <option value="cancelled">Bekor qilindi</option>
            </select>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-40">
            <label htmlFor="sort" className="sr-only">
              Saralash
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={dateRange}
              onChange={handleDateRangeChange}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="all">Barcha vaqt</option>
              <option value="today">Bugun</option>
              <option value="week">Shu hafta</option>
              <option value="month">Shu oy</option>
              <option value="year">Shu yil</option>
            </select>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-40">
            <label htmlFor="dateRange" className="sr-only">
              Vaqt oralig'i
            </label>
            <select
              id="dateRange"
              name="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="all">Barcha vaqt</option>
              <option value="today">Bugun</option>
              <option value="week">Shu hafta</option>
              <option value="month">Shu oy</option>
              <option value="year">Shu yil</option>
            </select>
          </div>
        </div>

        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sotuvchi
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Maxsulotlar
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Jami summa
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Holati
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sana
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Ko'rish</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Ma'lumotlar yuklanmoqda...</span>
                        </div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                        Hech qanday buyurtma topilmadi
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                          {order.orderId || 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {order.seller?.name || 'Noma\'lum'}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {order.products && Array.isArray(order.products) ? order.products.map((product, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{product.name}</span>
                                <span className="text-gray-900">
                                  {parseFloat(product.quantity?.$numberDecimal || product.quantity || 0)} {product.unit} × {formatCurrency(parseFloat(product.price?.$numberDecimal || product.price || 0))}
                                </span>
                              </div>
                            )) : (
                              <span className="text-gray-400">Mahsulotlar yo'q</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(order.totalSum || 0)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'completed' ? 'Bajarildi' :
                             order.status === 'pending' ? 'Kutilmoqda' :
                             order.status === 'processing' ? 'Jarayonda' : 
                             order.status === 'cancelled' ? 'Bekor qilindi' :
                             order.status || 'Noma\'lum'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(order.completedAt || order.updatedAt || order.createdAt)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowViewModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                            disabled={loading}
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>Ko'rish</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
              disabled={pagination.page <= 1 || loading}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Oldingi
            </button>
            <div className="flex items-center px-4 py-2 text-sm text-gray-700">
              {pagination.page} / {pagination.pages || 1}
            </div>
            <button
              onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.pages))}
              disabled={pagination.page >= pagination.pages || loading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Jami <span className="font-medium">{pagination.total}</span> ta buyurtma,{' '}
                <span className="font-medium">
                  {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
                </span>{' '}
                dan{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                gacha ko'rsatilmoqda
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
                  disabled={pagination.page === 1 || loading}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Oldingi</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pagination.page === pageNum
                          ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.pages))}
                  disabled={pagination.page === pagination.pages || loading}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Keyingi</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateOrder}
      />

      <ViewOrderModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;
