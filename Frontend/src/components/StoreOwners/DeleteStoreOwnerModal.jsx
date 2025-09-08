import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const DeleteStoreOwnerModal = ({ isOpen, onClose, onConfirm, owner }) => {
  const handleConfirm = () => {
    onConfirm(owner.id);
    onClose();
  };

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
          <Dialog.Panel className={`w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all ${isOpen ? 'animate-modalOpen' : 'animate-modalClose'}`}>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                  Do'kon egasini o'chirish
                </Dialog.Title>
                <p className="mt-2 text-sm text-gray-500">
                  Haqiqatan ham {owner?.name} ismli do'kon egasini o'chirmoqchimisiz?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirm}
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

export default DeleteStoreOwnerModal;
