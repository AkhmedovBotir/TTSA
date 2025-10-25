import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  NoSymbolIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ViewInstallmentModal from '../components/Installments/ViewInstallmentModal';
import ConfirmModal from '../components/Common/ConfirmModal';
import PaymentProcessModal from '../components/Common/PaymentProcessModal';

const InstallmentPayments = () => {
  const [installments, setInstallments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shopFilter, setShopFilter] = useState('all');
  const [sellerFilter, setSellerFilter] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [cancellingPayment, setCancellingPayment] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: null,
    isLoading: false
  });
  const [paymentProcessModal, setPaymentProcessModal] = useState({
    isOpen: false,
    installment: null
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchInstallments = async (page = 1, status = 'all', shop = 'all', seller = 'all', search = '') => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.');
      }

      let endpoint = `/admin/installment-payments?page=${page}&limit=20`;
      
      if (status !== 'all') endpoint += `&status=${status}`;
      if (shop !== 'all') endpoint += `&shop=${shop}`;
      if (seller !== 'all') endpoint += `&seller=${seller}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;

      const data = await api.get(endpoint, token);
      setInstallments(data.installments);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError(err.message);
      if (err.message.includes('kiring') || err.message.includes('Sessiya')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!token) return;

      let endpoint = '/admin/installment-payments/stats';
      const params = [];
      
      if (shopFilter !== 'all') params.push(`shop=${shopFilter}`);
      if (sellerFilter !== 'all') params.push(`seller=${sellerFilter}`);
      
      if (params.length > 0) {
        endpoint += `?${params.join('&')}`;
      }

      const data = await api.get(endpoint, token);
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchInstallments(currentPage, statusFilter, shopFilter, sellerFilter, searchTerm);
  }, [currentPage, statusFilter, shopFilter, sellerFilter]);

  useEffect(() => {
    fetchStats();
  }, [shopFilter, sellerFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchInstallments(1, statusFilter, shopFilter, sellerFilter, searchTerm);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleShopFilter = (e) => {
    setShopFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSellerFilter = (e) => {
    setSellerFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'overdue':
        return 'Muddati o\'tgan';
      case 'completed':
        return 'Bajarildi';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status || 'Noma\'lum';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'To\'langan';
      case 'pending':
        return 'Kutilmoqda';
      case 'overdue':
        return 'Muddati o\'tgan';
      default:
        return status || 'Noma\'lum';
    }
  };

  const calculateProgress = (payments) => {
    if (!payments || payments.length === 0) return 0;
    const paidCount = payments.filter(p => p.status === 'paid').length;
    return Math.round((paidCount / payments.length) * 100);
  };

  const getNextPayment = (payments) => {
    if (!payments || payments.length === 0) return null;
    return payments.find(p => p.status === 'pending') || payments[0];
  };

  // Process installment payment
  const handleProcessPayment = async (installmentId, paymentData) => {
    try {
      setProcessingPayment(installmentId);
      
      const data = await api.patch(`/admin/installment-payments/${installmentId}/process`, paymentData, token);
      
      // Refresh data after successful processing
      await fetchInstallments(currentPage, statusFilter, shopFilter, sellerFilter, searchTerm);
      await fetchStats();
      
      // Show success message
      setError(null);
      setConfirmModal({
        isOpen: true,
        title: 'Muvaffaqiyat!',
        message: 'Muddatli to\'lov muvaffaqiyatli amalga oshirildi!',
        type: 'success',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'To\'lovni amalga oshirishda xatolik yuz berdi');
      setConfirmModal({
        isOpen: true,
        title: 'Xatolik!',
        message: err.message || 'To\'lovni amalga oshirishda xatolik yuz berdi',
        type: 'danger',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  // Cancel installment payment
  const handleCancelPayment = async (installmentId, reason = '') => {
    try {
      setCancellingPayment(installmentId);
      setConfirmModal(prev => ({ ...prev, isLoading: true }));
      
      const data = await api.patch(`/admin/installment-payments/${installmentId}/cancel`, { reason }, token);
      
      // Refresh data after successful cancellation
      await fetchInstallments(currentPage, statusFilter, shopFilter, sellerFilter, searchTerm);
      await fetchStats();
      
      // Show success message
      setError(null);
      setConfirmModal({
        isOpen: true,
        title: 'Muvaffaqiyat!',
        message: 'Muddatli to\'lov bekor qilindi!',
        type: 'success',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });
    } catch (err) {
      console.error('Error cancelling payment:', err);
      setError(err.message || 'To\'lovni bekor qilishda xatolik yuz berdi');
      setConfirmModal({
        isOpen: true,
        title: 'Xatolik!',
        message: err.message || 'To\'lovni bekor qilishda xatolik yuz berdi',
        type: 'danger',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        isLoading: false
      });
    } finally {
      setCancellingPayment(null);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Muddatli to'lovlar</h1>
              <p className="mt-2 text-gray-600">Barcha muddatli to'lovlar va ularning holati</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <CreditCardIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Jami</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Faol</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats.amounts?.totalActive || 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Muddati o'tgan</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats.amounts?.totalOverdue || 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bajarilgan</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                  <p className="text-sm text-gray-500">{formatCurrency(stats.amounts?.totalCompleted || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label htmlFor="search" className="sr-only">Qidiruv</label>
              <form onSubmit={handleSearch} className="flex w-full">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-l-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Mijoz ismi yoki telefon raqami..."
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
            
            <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select
                id="status"
                name="status"
                value={statusFilter}
                onChange={handleStatusFilter}
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                disabled={loading}
              >
                <option value="all">Barcha holatlar</option>
                <option value="active">Faol</option>
                <option value="overdue">Muddati o'tgan</option>
                <option value="completed">Bajarildi</option>
                <option value="cancelled">Bekor qilindi</option>
              </select>
            </div>

            <div>
              <label htmlFor="shop" className="sr-only">Do'kon</label>
              <select
                id="shop"
                name="shop"
                value={shopFilter}
                onChange={handleShopFilter}
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                disabled={loading}
              >
                <option value="all">Barcha do'konlar</option>
                {/* Add shop options here */}
              </select>
            </div>

            <div>
              <label htmlFor="seller" className="sr-only">Sotuvchi</label>
              <select
                id="seller"
                name="seller"
                value={sellerFilter}
                onChange={handleSellerFilter}
                className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
                disabled={loading}
              >
                <option value="all">Barcha sotuvchilar</option>
                {/* Add seller options here */}
              </select>
            </div>
          </div>
        </div>

        {/* Installments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Muddatli to'lovlar ro'yxati</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mijoz
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mahsulotlar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To'lov ma'lumotlari
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holati
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyingi to'lov
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Amallar</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span>Ma'lumotlar yuklanmoqda...</span>
                      </div>
                    </td>
                  </tr>
                ) : installments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                      Hech qanday muddatli to'lov topilmadi
                    </td>
                  </tr>
                ) : (
                  installments.map((installment) => {
                    const progress = calculateProgress(installment.payments);
                    const nextPayment = getNextPayment(installment.payments);
                    
                    return (
                      <tr key={installment._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {installment.customer?.image ? (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={installment.customer.image} 
                                  alt={installment.customer.fullName}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UserIcon className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {installment.customer?.fullName || 'Noma\'lum'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {installment.customer?.primaryPhone || 'Telefon yo\'q'}
                              </div>
                              <div className="text-xs text-gray-400">
                                {installment.customer?.passportSeries || 'Passport yo\'q'}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">Buyurtma #{installment.orderId}</div>
                            <div className="text-gray-500 mt-1">
                              {installment.products?.map((product, idx) => (
                                <div key={idx} className="flex items-center space-x-2">
                                  <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                                  <span>{product.name}</span>
                                  <span className="text-gray-400">×</span>
                                  <span>{parseFloat(product.quantity?.$numberDecimal || product.quantity || 0)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm font-semibold text-blue-600 mt-2">
                              {formatCurrency(installment.totalSum)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="h-4 w-4 text-gray-400" />
                              <span>Davomiyligi: {installment.installment?.duration} oy</span>
                            </div>
                            <div className="text-gray-500 mt-1">
                              Oylik: {formatCurrency(installment.installment?.monthlyPayment || 0)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(installment.installment?.startDate)} - {formatDate(installment.installment?.endDate)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(installment.status)}`}>
                            {getStatusText(installment.status)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          {nextPayment ? (
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center space-x-2">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                <span>{nextPayment.month}-oy</span>
                              </div>
                              <div className="text-gray-500">
                                {formatCurrency(nextPayment.amount)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(nextPayment.dueDate)}
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPaymentStatusColor(nextPayment.status)}`}>
                                {getPaymentStatusText(nextPayment.status)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">Ma'lumot yo'q</span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{progress}%</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {installment.payments?.filter(p => p.status === 'paid').length || 0} / {installment.payments?.length || 0} to'lov
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Ko'rish tugmasi */}
                            <button
                              onClick={() => {
                                setSelectedInstallment(installment);
                                setShowViewModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
                              disabled={loading}
                            >
                              <EyeIcon className="h-3 w-3" />
                              <span>Ko'rish</span>
                            </button>

                            {/* To'lovni amalga oshirish tugmasi - faqat pending holatida */}
                            {installment.status === 'active' && getNextPayment(installment.payments)?.status === 'pending' && (
                              <button
                                onClick={() => {
                                  setPaymentProcessModal({
                                    isOpen: true,
                                    installment: installment
                                  });
                                }}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
                                disabled={loading || processingPayment === installment._id}
                              >
                                {processingPayment === installment._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                ) : (
                                  <BanknotesIcon className="h-3 w-3" />
                                )}
                                <span>To'lash</span>
                              </button>
                            )}

                            {/* To'lovni bekor qilish tugmasi - faqat active yoki pending holatida */}
                            {(installment.status === 'active' || installment.status === 'pending') && (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'To\'lovni bekor qilish',
                                    message: 'To\'lovni bekor qilishni tasdiqlaysizmi? Bu amalni qaytarib bo\'lmaydi.',
                                    type: 'danger',
                                    onConfirm: () => {
                                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                      handleCancelPayment(installment._id, 'Admin tomonidan bekor qilindi');
                                    },
                                    isLoading: false
                                  });
                                }}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
                                disabled={loading || cancellingPayment === installment._id}
                              >
                                {cancellingPayment === installment._id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                ) : (
                                  <NoSymbolIcon className="h-3 w-3" />
                                )}
                                <span>Bekor</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span>
                  {pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}
                </span>
                <span>dan</span>
                <span>{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span>
                <span>gacha, jami {pagination.totalItems} ta</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1 || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Oldingi
                </button>
                
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages || loading}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Keyingi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Installment Modal */}
        <ViewInstallmentModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          installment={selectedInstallment}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          isLoading={confirmModal.isLoading}
        />

        {/* Payment Process Modal */}
        <PaymentProcessModal
          isOpen={paymentProcessModal.isOpen}
          onClose={() => setPaymentProcessModal({ isOpen: false, installment: null })}
          onConfirm={(paymentData) => {
            setPaymentProcessModal({ isOpen: false, installment: null });
            handleProcessPayment(paymentProcessModal.installment._id, paymentData);
          }}
          installment={paymentProcessModal.installment}
          isLoading={processingPayment === paymentProcessModal.installment?._id}
        />
      </div>
    </div>
  );
};

export default InstallmentPayments;
