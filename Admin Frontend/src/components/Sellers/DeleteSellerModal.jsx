import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteSellerModal = ({ isOpen, onClose, onConfirm, seller }) => {
  const handleDelete = () => {
    onConfirm(seller.id);
  };

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
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            </div>

            <div className="text-center mb-6">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Sotuvchini o'chirish
              </Dialog.Title>
              <p className="mt-2 text-sm text-gray-500">
                Siz rostdan ham {seller?.name} ismli sotuvchini o'chirmoqchimisiz?
                Bu amalni ortga qaytarib bo'lmaydi.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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

export default DeleteSellerModal;
