import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BellIcon, 
  PlusIcon,
  EyeIcon,
  PaperAirplaneIcon,
  ClockIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  GiftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Snackbar from '../components/Common/Snackbar';
import api from '../services/api';

// Helper functions for notification types and audiences
const getTypeIcon = (type) => {
  switch (type) {
    case 'info':
      return <InformationCircleIcon className="h-5 w-5 text-blue-600" />;
    case 'warning':
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    case 'success':
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
    case 'error':
      return <XCircleIcon className="h-5 w-5 text-red-600" />;
    case 'promotion':
      return <GiftIcon className="h-5 w-5 text-purple-600" />;
    default:
      return <BellIcon className="h-5 w-5 text-gray-600" />;
  }
};

const getTypeText = (type) => {
  switch (type) {
    case 'info':
      return 'Ma\'lumot';
    case 'warning':
      return 'Ogohlantirish';
    case 'success':
      return 'Muvaffaqiyat';
    case 'error':
      return 'Xatolik';
    case 'promotion':
      return 'Aksiya';
    default:
      return type || 'Noma\'lum';
  }
};

const getAudienceText = (audience) => {
  switch (audience) {
    case 'all':
      return 'Barcha foydalanuvchilar';
    case 'clients':
      return 'Mijozlar';
    case 'sellers':
      return 'Sotuvchilar';
    case 'agents':
      return 'Agentlar';
    case 'shop_owners':
      return 'Do\'kon egalari';
    case 'admins':
      return 'Adminlar';
    default:
      return audience || 'Noma\'lum';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'sending':
      return 'bg-blue-100 text-blue-800';
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'sent':
      return 'Yuborilgan';
    case 'sending':
      return 'Yuborilmoqda';
    case 'scheduled':
      return 'Rejalashtirilgan';
    case 'draft':
      return 'Loyiha';
    case 'failed':
      return 'Xatolik';
    default:
      return status || 'Noma\'lum';
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [sendingNotificationId, setSendingNotificationId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const fetchNotifications = async (page = 1, status = 'all', audience = 'all', type = 'all', search = '') => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('Avtorizatsiya talab qilinadi. Iltimos, tizimga kiring.');
      }

      let endpoint = `/admin/notifications?page=${page}&limit=20`;
      
      if (status !== 'all') endpoint += `&status=${status}`;
      if (audience !== 'all') endpoint += `&targetAudience=${audience}`;
      if (type !== 'all') endpoint += `&type=${type}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;

      const data = await api.get(endpoint, token);
      setNotifications(data.data || []);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
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

      const data = await api.get('/admin/notifications/stats', token);
      setStats(data.data || data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage, statusFilter, audienceFilter, typeFilter, searchTerm);
  }, [currentPage, statusFilter, audienceFilter, typeFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNotifications(1, statusFilter, audienceFilter, typeFilter, searchTerm);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAudienceFilter = (e) => {
    setAudienceFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  const handleCreateNotification = async (notificationData) => {
    try {
      setLoading(true);
      
      // Prepare notification data according to API structure
      const payload = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        priority: notificationData.priority,
        targetAudience: notificationData.targetAudience,
        scheduledAt: notificationData.scheduledAt || null
      };

      const response = await api.post('/admin/notifications', payload, token);
      
      setSnackbar({
        open: true,
        message: 'Xabarnoma muvaffaqiyatli yaratildi',
        type: 'success'
      });
      
      setShowCreateModal(false);
      fetchNotifications(currentPage, statusFilter, audienceFilter, typeFilter, searchTerm);
      fetchStats();
    } catch (err) {
      console.error('Error creating notification:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Xabarnoma yaratishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (notificationId) => {
    try {
      setLoading(true);
      setSendingNotificationId(notificationId);
      
      // Send notification to all targeted users
      const response = await api.post(`/admin/notifications/${notificationId}/send`, {}, token);
      
      setSnackbar({
        open: true,
        message: response.message || 'Xabarnoma muvaffaqiyatli yuborildi',
        type: 'success'
      });
      
      setShowSendConfirmModal(false);
      fetchNotifications(currentPage, statusFilter, audienceFilter, typeFilter, searchTerm);
      fetchStats();
    } catch (err) {
      console.error('Error sending notification:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Xabarnoma yuborishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setSendingNotificationId(null);
    }
  };

  const confirmSendNotification = (notification) => {
    setSelectedNotification(notification);
    setShowSendConfirmModal(true);
  };

  const handleScheduleNotification = async (notificationId, scheduledAt) => {
    try {
      setLoading(true);
      
      const response = await api.post(`/admin/notifications/${notificationId}/schedule`, { 
        scheduledAt: scheduledAt 
      }, token);
      
      setSnackbar({
        open: true,
        message: response.message || 'Xabarnoma muvaffaqiyatli rejalashtirildi',
        type: 'success'
      });
      
      setShowScheduleModal(false);
      fetchNotifications(currentPage, statusFilter, audienceFilter, typeFilter, searchTerm);
      fetchStats();
    } catch (err) {
      console.error('Error scheduling notification:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Xabarnoma rejalashtirishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
  };

  const openScheduleModal = (notification) => {
    setSelectedNotification(notification);
    setShowScheduleModal(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        open={snackbar.open}
      />

      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Xabarnomalar</h1>
          <p className="mt-2 text-sm text-gray-700">
            Foydalanuvchilarga xabarnomalar yuborish va boshqarish
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            disabled={loading}
          >
            <PlusIcon className={`inline-block w-5 h-5 mr-2 ${loading ? 'opacity-50' : ''}`} />
            {loading ? 'Yuklanmoqda...' : 'Yangi xabarnoma'}
          </button>
        </div>
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
                  placeholder="Xabarnoma sarlavhasi yoki matni bo'yicha qidirish..."
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
              <option value="all">Barcha holatlar</option>
              <option value="draft">Loyiha</option>
              <option value="scheduled">Rejalashtirilgan</option>
              <option value="sending">Yuborilmoqda</option>
              <option value="sent">Yuborilgan</option>
              <option value="failed">Xatolik</option>
            </select>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-40">
            <label htmlFor="audience" className="sr-only">
              Auditoriya bo'yicha filtrlash
            </label>
            <select
              id="audience"
              name="audience"
              value={audienceFilter}
              onChange={handleAudienceFilter}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="all">Barcha auditoriya</option>
              <option value="all">Barcha foydalanuvchilar</option>
              <option value="clients">Mijozlar</option>
              <option value="sellers">Sotuvchilar</option>
              <option value="agents">Agentlar</option>
              <option value="shop_owners">Do'kon egalari</option>
              <option value="admins">Adminlar</option>
            </select>
          </div>
          <div className="mt-4 sm:mt-0 sm:w-40">
            <label htmlFor="type" className="sr-only">
              Tur bo'yicha filtrlash
            </label>
            <select
              id="type"
              name="type"
              value={typeFilter}
              onChange={handleTypeFilter}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              disabled={loading}
            >
              <option value="all">Barcha turlar</option>
              <option value="info">Ma'lumot</option>
              <option value="warning">Ogohlantirish</option>
              <option value="success">Muvaffaqiyat</option>
              <option value="error">Xatolik</option>
              <option value="promotion">Aksiya</option>
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
                      Tur
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Sarlavha
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Auditoriya
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Holat
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Yaratilgan
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Amallar</span>
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
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-6 text-center text-sm text-gray-500">
                        Hech qanday xabarnoma topilmadi
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notification) => (
                      <tr key={notification._id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            {getTypeIcon(notification.type)}
                            <span className="ml-2">{getTypeText(notification.type)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate">
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-gray-500 truncate">{notification.message}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {getAudienceText(notification.targetAudience)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {getStatusText(notification.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(notification.createdAt)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openViewModal(notification)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                              disabled={loading}
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span>Ko'rish</span>
                            </button>
                            {notification.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => confirmSendNotification(notification)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                                  disabled={loading || sendingNotificationId === notification._id}
                                >
                                  <PaperAirplaneIcon className="h-4 w-4" />
                                  <span>{sendingNotificationId === notification._id ? 'Yuborilmoqda...' : 'Yuborish'}</span>
                                </button>
                                <button
                                  onClick={() => openScheduleModal(notification)}
                                  className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
                                  disabled={loading}
                                >
                                  <ClockIcon className="h-4 w-4" />
                                  <span>Rejalashtirish</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(Math.max(pagination.currentPage - 1, 1))}
              disabled={pagination.currentPage <= 1 || loading}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Oldingi
            </button>
            <div className="flex items-center px-4 py-2 text-sm text-gray-700">
              {pagination.currentPage} / {pagination.totalPages || 1}
            </div>
            <button
              onClick={() => handlePageChange(Math.min(pagination.currentPage + 1, pagination.totalPages))}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keyingi
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Jami <span className="font-medium">{pagination.totalItems}</span> ta xabarnoma,{' '}
                <span className="font-medium">
                  {pagination.totalItems > 0 ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}
                </span>{' '}
                dan{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                </span>{' '}
                gacha ko'rsatilmoqda
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <CreateNotificationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateNotification}
          isLoading={loading}
        />
      )}

      {/* View Notification Modal */}
      {showViewModal && selectedNotification && (
        <ViewNotificationModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          notification={selectedNotification}
        />
      )}

      {/* Schedule Notification Modal */}
      {showScheduleModal && selectedNotification && (
        <ScheduleNotificationModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          notification={selectedNotification}
          onSubmit={(scheduledAt) => handleScheduleNotification(selectedNotification._id, scheduledAt)}
          isLoading={loading}
        />
      )}

      {/* Send Confirmation Modal */}
      {showSendConfirmModal && selectedNotification && (
        <SendConfirmModal
          isOpen={showSendConfirmModal}
          onClose={() => setShowSendConfirmModal(false)}
          notification={selectedNotification}
          onConfirm={() => handleSendNotification(selectedNotification._id)}
          isLoading={loading}
        />
      )}
    </div>
  );
};

// Create Notification Modal Component
const CreateNotificationModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetAudience: 'all',
    targetUsers: [],
    scheduledAt: '',
    isScheduled: false,
    metadata: {}
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.title.trim()) {
      alert('Sarlavha kiritilishi shart!');
      return;
    }
    
    if (formData.title.length < 3) {
      alert('Sarlavha kamida 3 ta belgidan iborat bo\'lishi kerak!');
      return;
    }
    
    if (!formData.message.trim()) {
      alert('Xabarnoma matni kiritilishi shart!');
      return;
    }

    if (formData.message.length < 10) {
      alert('Xabarnoma matni kamida 10 ta belgidan iborat bo\'lishi kerak!');
      return;
    }

    if (formData.isScheduled && !formData.scheduledAt) {
      alert('Rejalashtirish uchun sana va vaqt kiritilishi shart!');
      return;
    }

    if (formData.isScheduled) {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      
      if (scheduledDate <= now) {
        alert('Rejalashtirish sanasi kelajakda bo\'lishi kerak!');
        return;
      }
    }

    const submitData = {
      ...formData,
      scheduledAt: formData.isScheduled ? formData.scheduledAt : null
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl mx-4 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-4 border-b border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Yangi xabarnoma
                  </h3>
                  <p className="text-blue-100 text-sm">Foydalanuvchilarga xabarnoma yuborish</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-200 p-2"
                disabled={isLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sarlavha * 
                  <span className="text-xs text-gray-500 ml-1">({formData.title.length}/100)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={100}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 ${
                    formData.title.length < 3 && formData.title.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Xabarnoma sarlavhasi"
                  required
                  disabled={isLoading}
                />
                {formData.title.length < 3 && formData.title.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tur *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                  disabled={isLoading}
                >
                  <option value="info">Ma'lumot</option>
                  <option value="warning">Ogohlantirish</option>
                  <option value="success">Muvaffaqiyat</option>
                  <option value="error">Xatolik</option>
                  <option value="promotion">Aksiya</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xabarnoma matni * 
                <span className="text-xs text-gray-500 ml-1">({formData.message.length}/1000)</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 resize-none ${
                  formData.message.length < 10 && formData.message.length > 0 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Xabarnoma matni..."
                required
                disabled={isLoading}
              />
              {formData.message.length < 10 && formData.message.length > 0 && (
                <p className="text-xs text-red-600 mt-1">Xabarnoma matni kamida 10 ta belgidan iborat bo'lishi kerak</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auditoriya *
                </label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                  disabled={isLoading}
                >
                  <option value="all">Barcha foydalanuvchilar</option>
                  <option value="clients">Mijozlar</option>
                  <option value="sellers">Sotuvchilar</option>
                  <option value="agents">Agentlar</option>
                  <option value="shop_owners">Do'kon egalari</option>
                  <option value="admins">Adminlar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritet
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  disabled={isLoading}
                >
                  <option value="low">Past</option>
                  <option value="medium">O'rta</option>
                  <option value="high">Yuqori</option>
                  <option value="urgent">Shoshilinch</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isScheduled"
                checked={formData.isScheduled}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label className="ml-2 block text-sm text-gray-900">
                Rejalashtirish
              </label>
            </div>

            {formData.isScheduled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejalashtirish sanasi va vaqti
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Preview Section */}
            {(formData.title || formData.message) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Ko'rinish
                </h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(formData.type)}
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 text-sm">
                        {formData.title || 'Sarlavha'}
                      </h5>
                      <p className="text-gray-600 text-sm mt-1">
                        {formData.message || 'Xabarnoma matni...'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {getAudienceText(formData.targetAudience)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formData.priority || 'O\'rta'} prioritet
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isLoading}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Yaratilmoqda...' : 'Yaratish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Notification Modal Component
const ViewNotificationModal = ({ isOpen, onClose, notification }) => {
  if (!isOpen || !notification) return null;

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss');
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl mx-4 border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-4 border-b border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  {getTypeIcon(notification.type)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {notification.title}
                  </h3>
                  <p className="text-blue-100 text-sm">Xabarnoma ma'lumotlari</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-all duration-200 p-2"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Asosiy ma'lumotlar</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Tur:</span>
                      <span className="font-medium flex items-center">
                        {getTypeIcon(notification.type)}
                        <span className="ml-2">{getTypeText(notification.type)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Auditoriya:</span>
                      <span className="font-medium">{getAudienceText(notification.targetAudience)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Prioritet:</span>
                      <span className="font-medium">{notification.priority || 'O\'rta'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Holat:</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {getStatusText(notification.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Vaqt ma'lumotlari</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Yaratilgan:</span>
                      <span className="font-medium">{formatDate(notification.createdAt)}</span>
                    </div>
                    {notification.scheduledAt && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Rejalashtirilgan:</span>
                        <span className="font-medium">{formatDate(notification.scheduledAt)}</span>
                      </div>
                    )}
                    {notification.sentAt && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Yuborilgan:</span>
                        <span className="font-medium">{formatDate(notification.sentAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Xabarnoma matni</h4>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{notification.message}</p>
                  </div>
                </div>

                {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Qo'shimcha ma'lumotlar</h4>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify(notification.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Notification Modal Component
const ScheduleNotificationModal = ({ isOpen, onClose, notification, onSubmit, isLoading }) => {
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
      setScheduledAt(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!scheduledAt) {
      alert('Rejalashtirish sanasi va vaqti kiritilishi shart!');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    
    if (scheduledDate <= now) {
      alert('Rejalashtirish sanasi kelajakda bo\'lishi kerak!');
      return;
    }

    onSubmit(scheduledDate.toISOString());
  };

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-md mx-4 border border-gray-200">
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-700 to-orange-800 px-6 py-4 border-b border-yellow-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Xabarnoma rejalashtirish
                  </h3>
                  <p className="text-yellow-100 text-sm">Kelajakda yuborish uchun vaqt belgilang</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-yellow-600 transition-all duration-200 p-2"
                disabled={isLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6">
            <div className="mb-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">{notification.title}</h4>
              <p className="text-sm text-gray-600">{notification.message}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejalashtirish sanasi va vaqti *
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm px-3 py-2"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Xabarnoma belgilangan vaqtda avtomatik yuboriladi
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isLoading}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Rejalashtirilmoqda...' : 'Rejalashtirish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Send Confirmation Modal Component
const SendConfirmModal = ({ isOpen, onClose, notification, onConfirm, isLoading }) => {
  if (!isOpen || !notification) return null;


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-lg mx-4 border border-gray-200">
          <div className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-800 px-6 py-4 border-b border-green-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <PaperAirplaneIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Xabarnoma yuborish
                  </h3>
                  <p className="text-green-100 text-sm">Xabarnomani yuborishni tasdiqlang</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white bg-opacity-20 text-white hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 transition-all duration-200 p-2"
                disabled={isLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start space-x-3">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm mb-2">
                      {notification.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Auditoriya: {getAudienceText(notification.targetAudience)}</span>
                      <span>Prioritet: {notification.priority || 'O\'rta'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Diqqat!
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Bu xabarnoma {getAudienceText(notification.targetAudience)} ga yuboriladi. 
                    Yuborilgandan keyin uni bekor qilish mumkin emas.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={isLoading}
              >
                Bekor qilish
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span>Yuborish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
