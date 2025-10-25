import React, { useState } from 'react';
import { XMarkIcon, EyeIcon, CalendarIcon, UserIcon, ShoppingBagIcon, CreditCardIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ViewInstallmentModal = ({ isOpen, onClose, installment }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (!isOpen || !installment) return null;

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'overdue':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
      case 'completed':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      case 'cancelled':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'overdue':
        return 'Muddati o\'tgan';
      case 'completed':
        return 'To\'langan';
      case 'cancelled':
        return 'Bekor qilingan';
      default:
        return status || 'Noma\'lum';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const progress = calculateProgress(installment.payments);
  const nextPayment = getNextPayment(installment.payments);

  const tabs = [
    {
      id: 'overview',
      name: 'Umumiy ma\'lumot',
      icon: EyeIcon,
      description: 'Asosiy ma\'lumotlar va holat'
    },
    {
      id: 'customer',
      name: 'Mijoz ma\'lumotlari',
      icon: UserIcon,
      description: 'Mijoz haqida batafsil'
    },
    {
      id: 'products',
      name: 'Mahsulotlar',
      icon: ShoppingBagIcon,
      description: 'Buyurtma qilingan mahsulotlar'
    },
    {
      id: 'payments',
      name: 'To\'lovlar',
      icon: CreditCardIcon,
      description: 'To\'lov jadvali va progress'
    },
    {
      id: 'timeline',
      name: 'Vaqt chizig\'i',
      icon: CalendarIcon,
      description: 'Barcha vaqt ma\'lumotlari'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-800 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Buyurtma holati
                </h4>
              </div>
              <div className="p-6">
                <div className="text-center mb-4">
                  <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${getStatusColor(installment.status)}`}>
                    {getStatusText(installment.status)}
                  </span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Buyurtma ID:</span>
                    <span className="font-mono font-bold text-blue-600">#{installment.orderId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Jami summa:</span>
                    <span className="font-bold text-xl text-green-600">{formatCurrency(installment.totalSum)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Sotuvchi:</span>
                    <span className="font-medium text-gray-900">{installment.seller?.username || 'Noma\'lum'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Do'kon egasi:</span>
                    <span className="font-medium text-gray-900">{installment.storeOwner?.username || 'Noma\'lum'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Installment Info Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-violet-100 px-6 py-4 border-b border-purple-200">
                <h4 className="font-semibold text-purple-800 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
                  Muddatli to'lov ma'lumotlari
                </h4>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-purple-700">Davomiyligi:</span>
                    <span className="font-medium text-gray-900">{installment.installment?.duration} oy</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-purple-700">Oylik to'lov:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(installment.installment?.monthlyPayment || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-purple-700">Boshlanish:</span>
                    <span className="font-medium text-gray-900">
                      {installment.installment?.startDate ? formatDate(installment.installment.startDate) : 'Noma\'lum'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-purple-700">Tugash:</span>
                    <span className="font-medium text-gray-900">
                      {installment.installment?.endDate ? formatDate(installment.installment.endDate) : 'Noma\'lum'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'customer':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-6 py-4 border-b border-blue-200">
              <h4 className="font-semibold text-blue-800 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                Mijoz ma'lumotlari
              </h4>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h5 className="text-2xl font-bold text-gray-900 mb-4">
                  {installment.customer?.fullName || 'Noma\'lum'}
                </h5>
                <p className="text-lg text-gray-600">Mijoz</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-700 mb-3">Aloqa ma'lumotlari</h6>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Asosiy telefon:</span>
                        <span className="font-medium text-gray-900">{installment.customer?.primaryPhone || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Ikkinchi telefon:</span>
                        <span className="font-medium text-gray-900">{installment.customer?.secondaryPhone || 'Noma\'lum'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-700 mb-3">Shaxsiy ma'lumotlar</h6>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600">Passport seriyasi:</span>
                        <span className="font-medium text-gray-900">{installment.customer?.passportSeries || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Tug'ilgan sana:</span>
                        <span className="font-medium text-gray-900">
                          {installment.customer?.birthDate ? formatDate(installment.customer.birthDate) : 'Noma\'lum'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rasm ma'lumoti - oddiy ma'lumot sifatida */}
              {installment.customer?.image && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-700 mb-3">Mijoz rasmi</h6>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white p-2 rounded-lg border border-gray-200">
                        <img 
                          className="h-32 w-32 object-cover rounded-lg" 
                          src={installment.customer.image} 
                          alt="Mijoz rasmi"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Rasm haqida:</span> Mijozning shaxsiy rasmi
                        </div>
                        <div className="text-xs text-gray-500">
                          Rasm o'lchami: 128x128 px
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-100 px-6 py-4 border-b border-yellow-200">
              <h4 className="font-semibold text-yellow-800 flex items-center">
                <ShoppingBagIcon className="h-5 w-5 mr-2 text-yellow-600" />
                Mahsulotlar ({installment.products?.length || 0} ta)
              </h4>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {installment.products?.map((product, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h5>
                        <div className="text-sm text-gray-500">Mahsulot #{idx + 1}</div>
                      </div>
                      <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-gray-500 mb-2 text-xs uppercase tracking-wide">Miqdori</div>
                        <div className="font-semibold text-gray-900 text-lg">{parseFloat(product.quantity?.$numberDecimal || product.quantity || 0)} {product.unit}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-gray-500 mb-2 text-xs uppercase tracking-wide">Narxi</div>
                        <div className="font-semibold text-gray-900 text-lg">{formatCurrency(parseFloat(product.price?.$numberDecimal || product.price || 0))}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="text-gray-500 mb-2 text-xs uppercase tracking-wide">O'lchami</div>
                        <div className="font-semibold text-gray-900 text-lg">{product.unitSize}</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg text-white">
                        <div className="text-blue-100 mb-2 text-xs uppercase tracking-wide">Jami</div>
                        <div className="font-bold text-xl">{formatCurrency(parseFloat(product.quantity?.$numberDecimal || product.quantity || 0) * parseFloat(product.price?.$numberDecimal || product.price || 0))}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-100 px-6 py-4 border-b border-emerald-200">
              <h4 className="font-semibold text-emerald-800 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-emerald-600" />
                To'lov holati va progress
              </h4>
            </div>
            <div className="p-6">
              {/* Overall Status */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-medium text-gray-700">Umumiy holat:</span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getStatusColor(installment.status)}`}>
                    {getStatusText(installment.status)}
                  </span>
                </div>
                <div className="flex items-center mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 mr-6">
                    <div 
                      className="bg-emerald-600 h-4 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{progress}%</span>
                </div>
                <div className="text-lg text-gray-600 text-center">
                  {installment.payments?.filter(p => p.status === 'paid').length || 0} / {installment.payments?.length || 0} to'lov bajarildi
                </div>
              </div>

              {/* Next Payment Info */}
              {nextPayment && (
                <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h5 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                    <ClockIcon className="h-6 w-6 mr-3" />
                    Keyingi to'lov
                  </h5>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-blue-700 mb-2 font-medium">Oyi</div>
                      <div className="text-xl font-bold text-gray-900">{nextPayment.month}-oy</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-blue-700 mb-2 font-medium">Summa</div>
                      <div className="text-xl font-bold text-gray-900">{formatCurrency(nextPayment.amount)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-blue-700 mb-2 font-medium">Muddati</div>
                      <div className="text-xl font-bold text-gray-900">{formatDate(nextPayment.dueDate)}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="text-blue-700 mb-2 font-medium">Holati</div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(nextPayment.status)}`}>
                        {getPaymentStatusText(nextPayment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Timeline */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-6 text-lg">To'lovlar jadvali</h5>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {installment.payments?.map((payment, idx) => (
                    <div key={payment._id} className={`flex items-center justify-between p-4 rounded-xl border ${
                      payment.status === 'paid' ? 'bg-green-50 border-green-200' :
                      payment.status === 'overdue' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${
                          payment.status === 'paid' ? 'bg-green-500 text-white' :
                          payment.status === 'overdue' ? 'bg-red-500 text-white' :
                          'bg-gray-400 text-white'
                        }`}>
                          {payment.status === 'paid' ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : payment.status === 'overdue' ? (
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          ) : (
                            <ClockIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{payment.month}-oy</div>
                          <div className="text-sm text-gray-500">{formatDate(payment.dueDate)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">{formatCurrency(payment.amount)}</div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(payment.status)}`}>
                          {getPaymentStatusText(payment.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                Vaqt ma'lumotlari
              </h4>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="bg-blue-500 text-white p-4 rounded-full">
                    <CalendarIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-700 mb-2">Yaratilgan</div>
                    <div className="text-2xl font-bold text-gray-900">{formatDate(installment.createdAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 p-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="bg-green-500 text-white p-4 rounded-full">
                    <ClockIcon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-700 mb-2">Yangilangan</div>
                    <div className="text-2xl font-bold text-gray-900">{formatDate(installment.updatedAt)}</div>
                  </div>
                </div>
                
                {installment.installment?.startDate && (
                  <div className="flex items-center space-x-6 p-6 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="bg-purple-500 text-white p-4 rounded-full">
                      <CalendarIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-medium text-gray-700 mb-2">Muddatli to'lov boshlanishi</div>
                      <div className="text-2xl font-bold text-gray-900">{formatDate(installment.installment.startDate)}</div>
                    </div>
                  </div>
                )}

                {installment.installment?.endDate && (
                  <div className="flex items-center space-x-6 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
                    <div className="bg-indigo-500 text-white p-4 rounded-full">
                      <CalendarIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-medium text-gray-700 mb-2">Muddatli to'lov tugashi</div>
                      <div className="text-2xl font-bold text-gray-900">{formatDate(installment.installment.endDate)}</div>
                    </div>
                  </div>
                )}

                {nextPayment && (
                  <div className="flex items-center space-x-6 p-6 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="bg-amber-500 text-white p-4 rounded-full">
                      <ClockIcon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-medium text-gray-700 mb-2">Keyingi to'lov sanasi</div>
                      <div className="text-2xl font-bold text-gray-900">{formatDate(nextPayment.dueDate)}</div>
                      <div className="text-sm text-amber-700 mt-1">{nextPayment.month}-oy to'lovi</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-7xl mx-4 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-6 border-b border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <CreditCardIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Muddatli to'lov #{installment.orderId}
                  </h3>
                  <p className="text-blue-100 text-sm">Batafsil ma'lumotlar</p>
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

          {/* Tabs Navigation */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5" />
                        <span>{tab.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 font-normal">
                        {tab.description}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 max-h-[700px] overflow-y-auto bg-gray-50">
            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Buyurtma ID: #{installment.orderId}</span>
                <span className="mx-2">•</span>
                <span>Progress: {progress}%</span>
                <span className="mx-2">•</span>
                <span>Holat: {getStatusText(installment.status)}</span>
                <span className="mx-2">•</span>
                <span>Tab: {tabs.find(t => t.id === activeTab)?.name}</span>
              </div>
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

export default ViewInstallmentModal;
