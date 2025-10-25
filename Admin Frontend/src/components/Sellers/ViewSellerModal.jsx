import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ViewSellerModal = ({ isOpen, onClose, seller }) => {
  if (!seller) return null;

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
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Sotuvchi ma'lumotlari
              </Dialog.Title>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Sotuvchi ismi</p>
                <p className="mt-1">{seller.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Username</p>
                <p className="mt-1">{seller.username}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Telefon raqami</p>
                <p className="mt-1">{seller.phone}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Bog'langan do'konlar</h4>
                {seller.shopOwners && seller.shopOwners.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {seller.shopOwners.map((shopOwner, index) => (
                      <div key={shopOwner.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{shopOwner.name}</p>
                            <p className="text-sm text-gray-600">{shopOwner.phone}</p>
                            <p className="text-xs text-gray-500">@{shopOwner.username}</p>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(shopOwner.assignedAt).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        {shopOwner.serviceAreas && shopOwner.serviceAreas.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-500">Xizmat ko'rsatish hududlari:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {shopOwner.serviceAreas.map((area, areaIndex) => (
                                <span key={areaIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {area.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Hech qanday do'kon bilan bog'lanmagan</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  seller.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {seller.status === 'active' ? 'Faol' : 'Nofaol'}
                </span>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Yopish
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default ViewSellerModal;
