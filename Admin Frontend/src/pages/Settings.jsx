import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CogIcon, 
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Snackbar from '../components/Common/Snackbar';
import api from '../services/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('interest-rates');
  const [interestRates, setInterestRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [formData, setFormData] = useState({
    duration: '',
    interestRate: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchInterestRates();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchInterestRates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await api.get('/admin/interest-rates', token);
      setInterestRates(data.interestRates || []);
    } catch (error) {
      console.error('Error fetching interest rates:', error);
      setSnackbar({
        open: true,
        message: 'Foiz stavkalarini yuklashda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/admin/interest-rates', {
        duration: parseInt(formData.duration),
        interestRate: parseFloat(formData.interestRate)
      }, token);
      
      setSnackbar({
        open: true,
        message: 'Foiz stavkasi muvaffaqiyatli yaratildi',
        type: 'success'
      });
      setShowCreateModal(false);
      setFormData({ duration: '', interestRate: '' });
      fetchInterestRates();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Foiz stavkasini yaratishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/admin/interest-rates/${editingRate.id}`, {
        duration: parseInt(formData.duration),
        interestRate: parseFloat(formData.interestRate)
      }, token);
      
      setSnackbar({
        open: true,
        message: 'Foiz stavkasi muvaffaqiyatli yangilandi',
        type: 'success'
      });
      setShowEditModal(false);
      setEditingRate(null);
      setFormData({ duration: '', interestRate: '' });
      fetchInterestRates();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Foiz stavkasini yangilashda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRate = async (rateId) => {
    if (!window.confirm('Bu foiz stavkasini o\'chirishni xohlaysizmi?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/admin/interest-rates/${rateId}`, token);
      
      setSnackbar({
        open: true,
        message: 'Foiz stavkasi muvaffaqiyatli o\'chirildi',
        type: 'success'
      });
      fetchInterestRates();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Foiz stavkasini o\'chirishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (rateId, currentStatus) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/admin/interest-rates/${rateId}/status`, {
        isActive: !currentStatus
      }, token);
      
      setSnackbar({
        open: true,
        message: `Foiz stavkasi ${!currentStatus ? 'faollashtirildi' : 'deaktivlashtirildi'}`,
        type: 'success'
      });
      fetchInterestRates();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Statusni o\'zgartirishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    if (!window.confirm('Standart foiz stavkalarini yaratishni xohlaysizmi? Bu mavjud stavkalarni o\'chirib tashlaydi.')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/admin/interest-rates/initialize-defaults', {}, token);
      
      setSnackbar({
        open: true,
        message: 'Standart foiz stavkalari muvaffaqiyatli yaratildi',
        type: 'success'
      });
      fetchInterestRates();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Standart stavkalarni yaratishda xatolik',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (rate) => {
    setEditingRate(rate);
    setFormData({
      duration: rate.duration.toString(),
      interestRate: rate.interestRate.toString()
    });
    setShowEditModal(true);
  };

  const tabs = [
    {
      id: 'interest-rates',
      name: 'Foiz stavkalari',
      icon: <CurrencyDollarIcon className="w-5 h-5" />
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        open={snackbar.open}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <CogIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Sozlamalar</h1>
        </div>
        <p className="text-gray-600">Tizim sozlamalari va konfiguratsiyasi</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Interest Rates Tab */}
      {activeTab === 'interest-rates' && (
        <div>
           {/* Actions */}
           <div className="flex justify-between items-center mb-6">
             <div className="flex space-x-3">
               <button
                 onClick={() => setShowCreateModal(true)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
               >
                 <PlusIcon className="w-4 h-4" />
                 <span>Yangi foiz stavkasi</span>
               </button>
               <button
                 onClick={handleInitializeDefaults}
                 className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
               >
                 Standart stavkalar
               </button>
             </div>
           </div>

          {/* Interest Rates Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Foiz stavkalari</h3>
              <p className="text-sm text-gray-600">Muddatli to'lovlar uchun foiz stavkalarini boshqaring</p>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Muddat (oy)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Foiz stavkasi (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yaratilgan
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {interestRates.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          Hech qanday foiz stavkasi topilmadi
                        </td>
                      </tr>
                    ) : (
                      interestRates.map((rate) => (
                        <tr key={rate.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rate.duration} oy
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {rate.interestRate}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rate.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {rate.isActive ? 'Faol' : 'Nofaol'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(rate.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(rate)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Tahrirlash"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(rate.id, rate.isActive)}
                                className={`p-1 ${
                                  rate.isActive 
                                    ? 'text-red-600 hover:text-red-900' 
                                    : 'text-green-600 hover:text-green-900'
                                }`}
                                title={rate.isActive ? 'Deaktivlashtirish' : 'Faollashtirish'}
                              >
                                {rate.isActive ? <XMarkIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteRate(rate.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="O'chirish"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yangi foiz stavkasi</h3>
            <form onSubmit={handleCreateRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Muddat (oy)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foiz stavkasi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Foiz stavkasini tahrirlash</h3>
            <form onSubmit={handleEditRate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Muddat (oy)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foiz stavkasi (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRate(null);
                    setFormData({ duration: '', interestRate: '' });
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Yangilanmoqda...' : 'Yangilash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
