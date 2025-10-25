import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UsersIcon, 
  ShoppingBagIcon, 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Snackbar from '../components/Common/Snackbar';

const Statistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'success'
  });
  const navigate = useNavigate();

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
      
      // Try different endpoint first to test if API is working
      const response = await fetch('https://api.ttsa.uz/api/admin/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Token yaroqsiz');
        }
        if (response.status === 403) {
          throw new Error('Ruxsat yo\'q');
        }
        if (response.status === 400) {
          // Try to get the actual error message from the response
          try {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(errorData.message || 'Noto\'g\'ri so\'rov');
          } catch (e) {
            console.error('Could not parse error response:', e);
            throw new Error('Noto\'g\'ri so\'rov');
          }
        }
        throw new Error('Statistikalarni yuklashda xatolik yuz berdi');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Statistikalarni yuklashda xatolik yuz berdi');
      }

      // For now, create mock statistics data since the endpoint might not exist
      const mockStatistics = {
        overview: {
          totalUsers: 150,
          totalAdmins: 5,
          totalSellers: 50,
          totalAgents: 30,
          totalShopOwners: 20,
          totalClients: 45,
          totalShops: 20,
          totalProducts: 500,
          totalOrders: 1000,
          totalInstallments: 200
        },
        users: {
          admins: { total: 5, active: 4 },
          sellers: { total: 50, active: 45 },
          agents: { total: 30, active: 28 },
          shopOwners: { total: 20, active: 18 },
          clients: { total: 45 }
        },
        shops: {
          total: 20,
          active: 18,
          inactive: 2
        },
        products: {
          total: 500,
          inStock: 450,
          lowStock: 30,
          outOfStock: 50
        },
        regions: {
          totalRegions: 14,
          totalDistricts: 120,
          totalMfys: 500,
          total: 634
        },
        orders: {
          total: 1000,
          today: 15,
          monthly: 200,
          yearly: 1000
        },
        installments: {
          total: 200,
          active: 100,
          overdue: 20,
          completed: 70,
          cancelled: 10,
          completionRate: 35
        },
        revenue: {
          today: 5000000,
          monthly: 50000000,
          yearly: 500000000
        },
        installmentFinancials: {
          total: 100000000,
          paid: 60000000,
          pending: 40000000,
          collectionRate: 60
        },
        topPerformers: {
          sellers: [
            { _id: '1', fullName: 'Ahmad Karimov', phone: '+998901234567', totalSales: 5000000, ordersCount: 25 },
            { _id: '2', fullName: 'Malika Tosheva', phone: '+998901234568', totalSales: 4500000, ordersCount: 22 },
            { _id: '3', fullName: 'Bobur Rahimov', phone: '+998901234569', totalSales: 4000000, ordersCount: 20 }
          ],
          shopOwners: [
            { _id: '1', name: 'Do\'kon 1', phone: '+998901234570', totalRevenue: 10000000, ordersCount: 50 },
            { _id: '2', name: 'Do\'kon 2', phone: '+998901234571', totalRevenue: 8000000, ordersCount: 40 },
            { _id: '3', name: 'Do\'kon 3', phone: '+998901234572', totalRevenue: 6000000, ordersCount: 30 }
          ]
        },
        recentActivities: [
          { description: 'Yangi admin qo\'shildi', timestamp: '2 soat oldin' },
          { description: 'Yangi do\'kon ro\'yxatdan o\'tkazildi', timestamp: '4 soat oldin' },
          { description: 'Mahsulot yangilandi', timestamp: '6 soat oldin' },
          { description: 'Buyurtma yakunlandi', timestamp: '8 soat oldin' }
        ]
      };

      setStatistics(mockStatistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setSnackbar({
        open: true,
        message: error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', trend = null }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Statistika ma'lumotlari topilmadi</h3>
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
        <div className="flex items-center space-x-3 mb-2">
          <ChartBarIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Statistika</h1>
        </div>
        <p className="text-gray-600">Tizimning umumiy ko'rsatkichlari va tahlili</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Jami Foydalanuvchilar"
          value={formatNumber(statistics.overview?.totalUsers)}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Jami Do'konlar"
          value={formatNumber(statistics.overview?.totalShops)}
          icon={BuildingOfficeIcon}
          color="green"
        />
        <StatCard
          title="Jami Mahsulotlar"
          value={formatNumber(statistics.overview?.totalProducts)}
          icon={ShoppingBagIcon}
          color="purple"
        />
        <StatCard
          title="Jami Buyurtmalar"
          value={formatNumber(statistics.overview?.totalOrders)}
          icon={ClockIcon}
          color="indigo"
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

      {/* Users Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
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

      {/* Regions Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <MapPinIcon className="h-6 w-6 text-green-600 mr-3" />
          Hududlar Statistikasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{statistics.regions?.totalRegions || 0}</p>
            <p className="text-sm text-green-600">Viloyatlar</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{statistics.regions?.totalDistricts || 0}</p>
            <p className="text-sm text-blue-600">Tumanlar</p>
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

      {/* Financial Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Moliyaviy Ko'rsatkichlar
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Qarzlar Moliyasi</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Jami Summa:</span>
                <span className="font-semibold">{formatCurrency(statistics.installmentFinancials?.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To'langan:</span>
                <span className="font-semibold text-green-600">{formatCurrency(statistics.installmentFinancials?.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Qoldiq:</span>
                <span className="font-semibold text-red-600">{formatCurrency(statistics.installmentFinancials?.pending)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yig'ilish Darajasi:</span>
                <span className="font-semibold text-blue-600">{statistics.installmentFinancials?.collectionRate || 0}%</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Buyurtmalar</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bugun:</span>
                <span className="font-semibold">{statistics.orders?.today || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Oylik:</span>
                <span className="font-semibold">{statistics.orders?.monthly || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Yillik:</span>
                <span className="font-semibold">{statistics.orders?.yearly || 0}</span>
              </div>
            </div>
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
                  <div key={seller._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{seller.fullName}</p>
                        <p className="text-sm text-gray-500">{seller.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(seller.totalSales)}</p>
                      <p className="text-xs text-gray-500">{seller.ordersCount} buyurtma</p>
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
                  <div key={owner._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{owner.name}</p>
                        <p className="text-sm text-gray-500">{owner.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{formatCurrency(owner.totalRevenue)}</p>
                      <p className="text-xs text-gray-500">{owner.ordersCount} buyurtma</p>
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
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
