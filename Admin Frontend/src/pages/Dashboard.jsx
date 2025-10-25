import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Snackbar from '../components/Common/Snackbar';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchStatistics();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token topilmadi');
      }

      const response = await fetch('https://api.ttsa.uz/api/admin/statistics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Avtorizatsiya muddati tugagan. Qayta kiring.');
        } else if (response.status === 403) {
          throw new Error('Sizda statistikani ko\'rish huquqi yo\'q');
        } else {
          throw new Error('Server xatoligi');
        }
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setStatistics(data.data);
      } else {
        throw new Error(data.message || 'Ma\'lumotlar olinmadi');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Dashboard ma\'lumotlarini yuklashda xatolik yuz berdi',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    // Ensure we have a valid number
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    // Ensure we have a valid number
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend = null, subtitle = null }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };

    // Ensure value is a string or number, not an object
    const safeValue = typeof value === 'object' ? JSON.stringify(value) : (value || '0');
    const safeSubtitle = typeof subtitle === 'object' ? JSON.stringify(subtitle) : (subtitle || '');

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{safeValue}</p>
            {safeSubtitle && (
              <p className="text-xs text-gray-500 mt-1">{safeSubtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center">
            {trend > 0 ? (
              <svg className="h-4 w-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">o'tgan oydan</span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dashboard ma'lumotlari topilmadi</h3>
          <p className="text-gray-500">Qaytadan urinib ko'ring</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <HomeIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <p className="text-gray-600">Xush kelibsiz, {user?.username}! Tizimning umumiy ko'rsatkichlari</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Jami Foydalanuvchilar"
          value={formatNumber(statistics.overview?.totalUsers)}
          icon={UsersIcon}
          color="blue"
          subtitle={`${statistics.users?.admins?.active || 0} admin, ${statistics.users?.sellers?.active || 0} sotuvchi`}
        />
        <StatCard
          title="Jami Do'konlar"
          value={formatNumber(statistics.overview?.totalShops)}
          icon={BuildingOfficeIcon}
          color="green"
          subtitle={`${statistics.shops?.active || 0} faol, ${statistics.shops?.inactive || 0} nofaol`}
        />
        <StatCard
          title="Jami Mahsulotlar"
          value={formatNumber(statistics.overview?.totalProducts)}
          icon={ShoppingBagIcon}
          color="purple"
          subtitle={`${statistics.products?.inStock || 0} omborda, ${statistics.products?.lowStock || 0} kam qolgan`}
        />
        <StatCard
          title="Jami Buyurtmalar"
          value={formatNumber(statistics.overview?.totalOrders)}
          icon={ClockIcon}
          color="indigo"
          subtitle={`${statistics.orders?.today || 0} bugun, ${statistics.orders?.monthly || 0} oy`}
        />
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Bugungi Daromad"
          value={formatCurrency(statistics.revenue?.today)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Oylik Daromad"
          value={formatCurrency(statistics.revenue?.monthly)}
          icon={CurrencyDollarIcon}
          color="green"
        />
        <StatCard
          title="Yillik Daromad"
          value={formatCurrency(statistics.revenue?.yearly)}
          icon={CurrencyDollarIcon}
          color="green"
        />
      </div>

      {/* Installment Financials */}
      {statistics.installmentFinancials && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Jami Qarz Summasi"
            value={formatCurrency(statistics.installmentFinancials?.total)}
            icon={CurrencyDollarIcon}
            color="blue"
            subtitle={`${statistics.installmentFinancials?.collectionRate || 0}% yig'ilgan`}
          />
          <StatCard
            title="To'langan Summa"
            value={formatCurrency(statistics.installmentFinancials?.paid)}
            icon={CurrencyDollarIcon}
            color="green"
          />
          <StatCard
            title="Qolgan Summa"
            value={formatCurrency(statistics.installmentFinancials?.pending)}
            icon={CurrencyDollarIcon}
            color="yellow"
          />
          <StatCard
            title="Yig'ilish Darajasi"
            value={`${statistics.installmentFinancials?.collectionRate || 0}%`}
            icon={ChartBarIcon}
            color="purple"
          />
        </div>
      )}

      {/* Regions Statistics */}
      {statistics.regions && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <MapPinIcon className="h-6 w-6 text-blue-600 mr-3" />
            Hududlar Statistikasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{statistics.regions?.totalRegions || 0}</p>
              <p className="text-sm text-blue-600">Viloyatlar</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{statistics.regions?.totalDistricts || 0}</p>
              <p className="text-sm text-green-600">Tumanlar</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{statistics.regions?.totalMfys || 0}</p>
              <p className="text-sm text-purple-600">MFYlar</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">{statistics.regions?.total || 0}</p>
              <p className="text-sm text-indigo-600">Jami</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <UserGroupIcon className="h-6 w-6 text-blue-600 mr-3" />
          Foydalanuvchilar Statistikasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{statistics.users?.admins?.total || 0}</p>
            <p className="text-sm text-blue-600">Adminlar</p>
            <p className="text-xs text-gray-500">{statistics.users?.admins?.active || 0} faol</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{statistics.users?.sellers?.total || 0}</p>
            <p className="text-sm text-green-600">Sotuvchilar</p>
            <p className="text-xs text-gray-500">{statistics.users?.sellers?.active || 0} faol</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{statistics.users?.agents?.total || 0}</p>
            <p className="text-sm text-purple-600">Agentlar</p>
            <p className="text-xs text-gray-500">{statistics.users?.agents?.active || 0} faol</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{statistics.users?.shopOwners?.total || 0}</p>
            <p className="text-sm text-yellow-600">Do'kon Egasi</p>
            <p className="text-xs text-gray-500">{statistics.users?.shopOwners?.active || 0} faol</p>
          </div>
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">{statistics.users?.clients?.total || 0}</p>
            <p className="text-sm text-indigo-600">Mijozlar</p>
          </div>
        </div>
      </div>

      {/* Installments Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-3" />
          Qarzlar Statistikasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{statistics.installments?.total || 0}</p>
            <p className="text-sm text-yellow-600">Jami Qarzlar</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{statistics.installments?.active || 0}</p>
            <p className="text-sm text-green-600">Faol Qarzlar</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{statistics.installments?.overdue || 0}</p>
            <p className="text-sm text-red-600">Muddati O'tgan</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{statistics.installments?.completionRate || 0}%</p>
            <p className="text-sm text-blue-600">Yakunlanish Darajasi</p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {statistics.topPerformers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Sellers */}
          {statistics.topPerformers.sellers && statistics.topPerformers.sellers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Eng Yaxshi Sotuvchilar
              </h3>
              <div className="space-y-3">
                {statistics.topPerformers.sellers.slice(0, 5).map((seller, index) => (
                  <div key={seller.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{seller.name || 'Noma\'lum'}</p>
                        <p className="text-sm text-gray-500">@{seller.username || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(seller.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{seller.totalInstallments || 0} qarz • {seller.completionRate || 0}% yakunlangan</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Shop Owners */}
          {statistics.topPerformers.shopOwners && statistics.topPerformers.shopOwners.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mr-2" />
                Eng Yaxshi Do'kon Egasi
              </h3>
              <div className="space-y-3">
                {statistics.topPerformers.shopOwners.slice(0, 5).map((owner, index) => (
                  <div key={owner.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{owner.name || 'Noma\'lum'}</p>
                        <p className="text-sm text-gray-500">@{owner.username || 'N/A'} • {owner.phone || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{owner.totalShops || 0} do'kon</p>
                      <p className="text-xs text-gray-500">{owner.totalProducts || 0} mahsulot</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activities */}
      {statistics.recentActivities && statistics.recentActivities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <ClockIcon className="h-6 w-6 text-indigo-600 mr-3" />
            So'nggi Faoliyatlar
          </h2>
          <div className="space-y-3">
            {statistics.recentActivities.slice(0, 10).map((activity, index) => (
              <div key={activity.id || index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">
                        {activity.seller?.name || 'Noma\'lum'} tomonidan {activity.customer?.fullName || 'Noma\'lum'} uchun buyurtma
                      </p>
                      <p className="text-xs text-gray-500">
                        Buyurtma: {activity.orderId || 'N/A'} • {formatCurrency(activity.totalAmount)} • {typeof activity.installmentMonths === 'object' ? activity.installmentMonths.duration || 0 : activity.installmentMonths || 0} oy
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'active' ? 'bg-green-100 text-green-800' :
                        activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.status === 'active' ? 'Faol' :
                         activity.status === 'completed' ? 'Yakunlangan' :
                         activity.status === 'pending' ? 'Kutilmoqda' :
                         activity.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
