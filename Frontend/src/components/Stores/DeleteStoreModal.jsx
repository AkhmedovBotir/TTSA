import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteStoreModal = ({ isOpen, onClose, onConfirm, store }) => {
  if (!isOpen) return null;

  return (
    <Dialog
      as="div"
      className="relative z-50"
      onClose={onClose}
      open={isOpen}
    >
      <div className="fixed inset-0 bg-black bg-opacity-25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>

            <Dialog.Title as="h3" className="text-lg font-medium text-center text-gray-900 mb-4">
              Do'konni o'chirish
            </Dialog.Title>

            <p className="text-sm text-gray-500 text-center mb-6">
              Haqiqatan ham {store?.name} do'konini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm(store);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                O'chirish
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteStoreModal;
