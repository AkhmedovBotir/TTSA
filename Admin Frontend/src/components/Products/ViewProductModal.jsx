import React from 'react';
import { XMarkIcon, EyeIcon, TagIcon, CurrencyDollarIcon, CubeIcon, ChartBarIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const ViewProductModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

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
      case 'inactive':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg';
      case 'archived':
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Faol emas';
      case 'archived':
        return 'Arxivlangan';
      default:
        return status || 'Noma\'lum';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-4xl mx-4 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-6 py-6 border-b border-blue-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-full">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {product.name}
                  </h3>
                  <p className="text-blue-100 text-sm">Mahsulot ma'lumotlari</p>
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
          <div className="px-6 py-8 max-h-[600px] overflow-y-auto bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 px-6 py-4 border-b border-blue-200">
                  <h4 className="font-semibold text-blue-800 flex items-center">
                    <TagIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Asosiy ma'lumotlar
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Mahsulot nomi:</span>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Narxi:</span>
                      <span className="font-bold text-xl text-green-600">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Miqdori:</span>
                      <span className="font-medium text-gray-900">{product.quantity} dona</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Holat:</span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Info Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-violet-100 px-6 py-4 border-b border-purple-200">
                  <h4 className="font-semibold text-purple-800 flex items-center">
                    <CubeIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Kategoriya ma'lumotlari
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-purple-700">Kategoriya:</span>
                      <span className="font-medium text-gray-900">{product.category?.name || 'Noma\'lum'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-purple-700">Sub-kategoriya:</span>
                      <span className="font-medium text-gray-900">{product.subcategory?.name || 'Noma\'lum'}</span>
                    </div>
                    {product.category?.status && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-purple-700">Kategoriya holati:</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          product.category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.category.status === 'active' ? 'Faol' : 'Faol emas'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Creator Info Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 px-6 py-4 border-b border-green-200">
                  <h4 className="font-semibold text-green-800 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-green-600" />
                    Yaratuvchi ma'lumotlari
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-green-700">Yaratgan:</span>
                      <span className="font-medium text-gray-900">{product.createdBy?.name || 'Noma\'lum'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-green-700">Yaratilgan sana:</span>
                      <span className="font-medium text-gray-900">
                        {product.createdAt ? formatDate(product.createdAt) : 'Noma\'lum'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info Card */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-slate-100 px-6 py-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-800 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Qo'shimcha ma'lumotlar
                  </h4>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Yangilangan:</span>
                      <span className="font-medium text-gray-900">
                        {product.updatedAt ? formatDate(product.updatedAt) : 'Noma\'lum'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Mahsulot ID:</span>
                      <span className="font-mono font-bold text-blue-600">#{product.id}</span>
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
                <span className="font-medium">Mahsulot ID: #{product.id}</span>
                <span className="mx-2">•</span>
                <span>Holat: {getStatusText(product.status)}</span>
                <span className="mx-2">•</span>
                <span>Narxi: {formatCurrency(product.price)}</span>
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

export default ViewProductModal;

