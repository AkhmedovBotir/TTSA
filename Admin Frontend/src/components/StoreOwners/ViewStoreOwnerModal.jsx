import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const permissionLabels = {
  manage_products: 'Mahsulotlarni boshqarish',
  manage_orders: 'Buyurtmalarni boshqarish',
  manage_assistants: 'Yordamchilarni boshqarish',
  manage_categories: 'Kategoriyalarni boshqarish',
  manage_installments: 'Muddatli to\'lovlarni boshqarish',
  manage_contracts: 'Shartnomalarni boshqarish',
  view_statistics: 'Statistikani ko\'rish'
};

const ViewStoreOwnerModal = ({ isOpen, onClose, owner }) => {
  if (!isOpen || !owner) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
          <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all ${isOpen ? 'animate-modalOpen' : 'animate-modalClose'}`}>
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                Do'kon egasi ma'lumotlari
              </Dialog.Title>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ism familiya</h4>
                  <p className="mt-1 text-sm text-gray-900">{owner.name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Telefon raqami</h4>
                  <p className="mt-1 text-sm text-gray-900">{owner.phone}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Username</h4>
                  <p className="mt-1 text-sm text-gray-900">{owner.username}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {owner.status === 'active' ? 'Faol' : 'Faol emas'}
                    </span>
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Yaratilgan vaqti</h4>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(owner.createdAt)}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Oxirgi kirish</h4>
                  <p className="mt-1 text-sm text-gray-900">{owner.lastLogin ? formatDate(owner.lastLogin) : 'Hali kirmagan'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Yaratgan admin</h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {owner.createdBy?.fullname} ({owner.createdBy?.username})
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Ruxsatlar</h4>
                <div className="flex flex-wrap gap-2">
                  {owner.permissions.map(permission => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {permissionLabels[permission] || permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={onClose}
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

export default ViewStoreOwnerModal;
