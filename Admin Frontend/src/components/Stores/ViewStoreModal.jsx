import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewStoreModal = ({ isOpen, onClose, store }) => {
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
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="absolute right-0 top-0 pr-4 pt-4 block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center mb-6">
              <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                Do'kon ma'lumotlari
              </Dialog.Title>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Do'kon asosiy ma'lumotlari */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4">Asosiy ma'lumotlar</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Do'kon nomi</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefon</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.phone}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Manzil</h4>
                    <p className="mt-1 text-sm text-gray-900">{store.address || 'Mavjud emas'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">INN (STIR)</h4>
                    <p className="mt-1 text-sm text-gray-900">{store.inn || 'Mavjud emas'}</p>
                  </div>
                </div>
              </div>

              {/* Do'kon egasi ma'lumotlari */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4">Do'kon egasi</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ism</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.owner?.name || 'Noma\'lum'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefon</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.owner?.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Username</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.owner?.username ? `@${store.owner.username}` : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4">Status</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Holati</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        store?.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {store?.status === 'active' ? 'Faol' : 'Faol emas'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Yaratilgan ma'lumotlar */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 className="font-medium text-gray-900 mb-4">Yaratilgan</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Admin</p>
                    <p className="mt-1 text-sm text-gray-900">{store?.createdBy?.fullname || 'Noma\'lum'}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{store?.createdBy?.username ? `@${store.createdBy.username}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Sana</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {store?.createdAt ? new Date(store.createdAt).toLocaleString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewStoreModal;
