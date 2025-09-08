import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DeleteTariffModal = ({ isOpen, onClose, onConfirm, tariff }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm w-full rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>

          <div className="mt-3 text-center sm:mt-5">
            <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
              Tarifni o'chirish
            </Dialog.Title>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Haqiqatan ham {tariff?.name} tarifini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
              </p>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm"
              onClick={() => {
                onConfirm(tariff?.id);
                onClose();
              }}
            >
              O'chirish
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
              onClick={onClose}
            >
              Bekor qilish
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DeleteTariffModal;
