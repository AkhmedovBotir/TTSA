import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

const CreateStoreModal = ({ isOpen, onClose, onSubmit, owners }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerId: '',
    phone: '',
    address: '',
    inn: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        ownerId: '',
        phone: '',
        address: '',
        inn: ''
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to:`, value); // Input o'zgarishlarini ko'rish
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate INN
    if (!validateInn(formData.inn)) {
      setError("Noto'g'ri STIR (INN) raqami formati. Faqat 9 ta raqam kiritilishi kerak");
      setLoading(false);
      return;
    }

    // Telefon raqamni formatlash
    const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;

    try {
      // API ga yuborish uchun ma'lumotlarni tayyorlash
      const storeData = {
        name: formData.name.trim(),
        ownerId: formData.ownerId,
        phone: phoneNumber,
        address: formData.address.trim(),
        inn: formData.inn.trim()
      };

      console.log('Form data before submit:', {
        original: formData,
        formatted: storeData
      });

      const success = await onSubmit(storeData);
      if (success) {
        setFormData({
          name: '',
          ownerId: '',
          phone: '',
          address: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
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
                Yangi do'kon qo'shish
              </Dialog.Title>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do'kon nomi
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Do'kon egasi
                  </label>
                  <select
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
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
                    placeholder="+998901234567"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  />
                </div>



                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manzil
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
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
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Yuklanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateStoreModal;
