import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, MapPinIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ViewRegionModal = ({ isOpen, onClose, region }) => {
  if (!isOpen || !region) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'inactive':
        return 'Faol emas';
      default:
        return status || 'Noma\'lum';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'region':
        return 'Viloyat';
      case 'district':
        return 'Tuman';
      case 'mfy':
        return 'MFY';
      default:
        return type || 'Noma\'lum';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'region':
        return 'bg-blue-100 text-blue-800';
      case 'district':
        return 'bg-purple-100 text-purple-800';
      case 'mfy':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <MapPinIcon className="h-6 w-6 text-blue-600" />
              </div>
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Region ma'lumotlari
              </Dialog.Title>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Asosiy ma'lumotlar</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Nomi</p>
                      <p className="text-sm font-medium text-gray-900">{region.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <TagIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Turi</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(region.type)}`}>
                        {getTypeText(region.type)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <TagIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Kodi</p>
                      <p className="text-sm font-medium text-gray-900 font-mono">{region.code}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Holati</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(region.status)}`}>
                        {getStatusText(region.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              {region.parent && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Parent region</h4>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Parent nomi</p>
                      <p className="text-sm font-medium text-gray-900">{region.parent.name}</p>
                      <p className="text-xs text-gray-500">{getTypeText(region.parent.type)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Creation Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Yaratilish ma'lumotlari</h4>
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Yaratilgan sana</p>
                    <p className="text-sm font-medium text-gray-900">{region.createdAt}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Yopish
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewRegionModal;

