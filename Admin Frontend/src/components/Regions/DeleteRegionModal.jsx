import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteRegionModal = ({ isOpen, onClose, onConfirm, region, isLoading = false }) => {
  if (!isOpen || !region) return null;

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Regionni o'chirish
              </Dialog.Title>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                <strong>"{region.name}"</strong> regionini o'chirishni tasdiqlaysizmi?
              </p>
              <p className="text-xs text-gray-400 mb-6">
                Bu amalni qaytarib bo'lmaydi. Region bilan bog'liq barcha ma'lumotlar o'chiriladi.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => onConfirm(region.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>O'chirilmoqda...</span>
                  </div>
                ) : (
                  'O\'chirish'
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteRegionModal;

