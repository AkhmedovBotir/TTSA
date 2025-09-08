import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditStoreModal = ({ isOpen, onClose, onSubmit, store, owners }) => {
  const [formData, setFormData] = useState({
    name: '',
    owner_id: '',
    phone: '',
    address: '',
    inn: '',
    status: 'active'
  });

  useEffect(() => {
    if (store) {
      console.log('Store data in EditModal:', store);
      
      // Extract owner ID safely
      let ownerId = '';
      if (store.owner) {
        // Handle both string ID and object with _id or id
        if (typeof store.owner === 'string') {
          ownerId = store.owner;
        } else if (store.owner.id) {
          ownerId = store.owner.id;
        } else if (store.owner._id) {
          ownerId = store.owner._id;
        }
      }
      
      setFormData({
        id: store.id,
        name: store.name || '',
        owner_id: ownerId,
        phone: store.phone || '',
        address: store.address || '',
        inn: store.inn || '',
        status: store.status || 'active'
      });
    }
  }, [store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateInn = (inn) => {
    // Remove any non-digit characters
    const cleanedInn = inn.replace(/\D/g, '');
    // Check if exactly 9 digits
    return /^\d{9}$/.test(cleanedInn);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate INN
    if (!validateInn(formData.inn)) {
      alert("Noto'g'ri STIR (INN) raqami formati. Faqat 9 ta raqam kiritilishi kerak");
      return;
    }
    
    onSubmit(formData);
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
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                Do'konni tahrirlash
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do'kon nomi
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    INN (STIR)
                  </label>
                  <input
                    type="text"
                    name="inn"
                    value={formData.inn}
                    onChange={handleChange}
                    placeholder="123456789"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Egasi
                  </label>
                  <select
                    name="owner_id"
                    value={formData.owner_id}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    required
                  >
                    <option value="">Tanlang</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name} ({owner.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon raqami
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-gray-50"
                    required
                    readOnly
                  />
                </div>


              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manzil
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default EditStoreModal;
