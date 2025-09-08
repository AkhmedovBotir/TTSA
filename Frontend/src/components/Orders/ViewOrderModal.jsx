import React from 'react';
import { XMarkIcon, EyeIcon, CalendarIcon, UserIcon, ShoppingBagIcon, CreditCardIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ViewOrderModal = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm:ss');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg';
      case 'pending':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg';
      case 'processing':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Bajarildi';
      case 'pending':
        return 'Kutilmoqda';
      case 'processing':
        return 'Jarayonda';
      case 'cancelled':
        return 'Bekor qilindi';
      default:
        return status || 'Noma\'lum';
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash':
        return 'Naqd pul';
      case 'card':
        return 'Plastik karta';
      case 'transfer':
        return 'Bank o\'tkazmasi';
      default:
        return method || 'Noma\'lum';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'transfer':
        return '🏦';
      default:
        return '💰';
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
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Buyurtma #{order.orderId}
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

          {/* Content */}
          <div className="px-6 py-8 max-h-[700px] overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Order Info */}
              <div className="xl:col-span-1 space-y-6">
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
                      <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Buyurtma ID:</span>
                        <span className="font-mono font-bold text-blue-600">#{order.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">To'lov usuli:</span>
                        <span className="font-medium flex items-center">
                          <span className="mr-2">{getPaymentMethodIcon(order.paymentMethod)}</span>
                          {getPaymentMethodText(order.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Jami summa:</span>
                        <span className="font-bold text-2xl text-green-600">{formatCurrency(order.totalSum)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seller Info Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-100 px-6 py-4 border-b border-green-200">
                    <h4 className="font-semibold text-green-800 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                      Sotuvchi ma'lumotlari
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Ism:</span>
                        <span className="font-medium text-gray-900">{order.seller?.name || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Telefon:</span>
                        <span className="font-medium text-gray-900">{order.seller?.phone || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Turi:</span>
                        <span className="font-medium text-gray-900">{order.seller?.type === 'seller' ? 'Sotuvchi' : order.seller?.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Owner Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-100 px-6 py-4 border-b border-purple-200">
                    <h4 className="font-semibold text-purple-800 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Do'kon egasi
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Ism:</span>
                        <span className="font-medium text-gray-900">{order.storeOwner?.name || 'Noma\'lum'}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Telefon:</span>
                        <span className="font-medium text-gray-900">{order.storeOwner?.phone || 'Noma\'lum'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Products and Dates */}
              <div className="xl:col-span-2 space-y-6">
                {/* Products Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-50 to-amber-100 px-6 py-4 border-b border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 flex items-center">
                      <ShoppingBagIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Mahsulotlar ({order.products?.length || 0} ta)
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {order.products?.map((product, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h5>
                              <div className="text-xs text-gray-500">Mahsulot #{idx + 1}</div>
                            </div>
                            <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                              #{idx + 1}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div className="bg-white p-2 rounded border">
                              <div className="text-gray-500 mb-1">Miqdori</div>
                              <div className="font-semibold text-gray-900">{parseFloat(product.quantity?.$numberDecimal || product.quantity || 0)} {product.unit}</div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <div className="text-gray-500 mb-1">Narxi</div>
                              <div className="font-semibold text-gray-900">{formatCurrency(parseFloat(product.price?.$numberDecimal || product.price || 0))}</div>
                            </div>
                            <div className="bg-white p-2 rounded border">
                              <div className="text-gray-500 mb-1">O'lchami</div>
                              <div className="font-semibold text-gray-900">{product.unitSize}</div>
                            </div>
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded text-white">
                              <div className="text-blue-100 mb-1">Jami</div>
                              <div className="font-bold">{formatCurrency(parseFloat(product.quantity?.$numberDecimal || product.quantity || 0) * parseFloat(product.price?.$numberDecimal || product.price || 0))}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Vaqt ma'lumotlari
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="bg-blue-500 text-white p-2 rounded-full">
                          <CalendarIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Yaratilgan</div>
                          <div className="font-semibold text-gray-900">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="bg-green-500 text-white p-2 rounded-full">
                          <ClockIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">Yangilangan</div>
                          <div className="font-semibold text-gray-900">{formatDate(order.updatedAt)}</div>
                        </div>
                      </div>
                      
                      {order.completedAt && (
                        <div className="flex items-center space-x-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="bg-emerald-500 text-white p-2 rounded-full">
                            <ClockIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-600">Bajarilgan</div>
                            <div className="font-semibold text-gray-900">{formatDate(order.completedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Buyurtma ID: #{order.orderId}</span>
                <span className="mx-2">•</span>
                <span>Jami: {order.products?.length || 0} ta mahsulot</span>
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

export default ViewOrderModal;
