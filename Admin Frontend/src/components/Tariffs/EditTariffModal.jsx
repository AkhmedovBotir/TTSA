import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const availableFeatures = [
  { id: 'users_5', label: '5 ta foydalanuvchi' },
  { id: 'users_20', label: '20 ta foydalanuvchi' },
  { id: 'users_unlimited', label: 'Cheksiz foydalanuvchilar' },
  { id: 'clients_unlimited', label: 'Cheksiz mijozlar' },
  { id: 'employees_unlimited', label: 'Cheksiz xodimlar' },
  { id: 'crm_basic', label: 'Asosiy CRM funksiyalari' },
  { id: 'crm_advanced', label: 'Barcha CRM funksiyalari' },
  { id: 'support_24_7', label: '24/7 qo\'llab-quvvatlash' },
  { id: 'personal_manager', label: '24/7 shaxsiy menedjer' },
  { id: 'api_integration', label: 'API integratsiya' },
];

const EditTariffModal = ({ isOpen, onClose, onSubmit, tariff }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: '30',
    features: [],
    isPopular: false,
    status: 'active'
  });

  useEffect(() => {
    if (tariff) {
      // Convert feature labels to IDs when loading tariff data
      const featureIds = tariff.features
        .map(label => availableFeatures.find(f => f.label === label)?.id)
        .filter(Boolean);
      
      setFormData({
        ...tariff,
        features: featureIds
      });
    }
  }, [tariff]);

  const handleFeatureChange = (featureId) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(id => id !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert feature IDs back to labels before submitting
    const featureLabels = formData.features.map(
      featureId => availableFeatures.find(f => f.id === featureId)?.label
    ).filter(Boolean);
    onSubmit({ ...formData, features: featureLabels });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl w-full rounded-xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Tarifni tahrirlash
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tarif nomi
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Narxi (so'm)
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Muddat (kun)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="block w-full px-3 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors duration-200"
                >
                  <option value="30">30 kun</option>
                  <option value="90">90 kun</option>
                  <option value="180">180 kun</option>
                  <option value="365">365 kun</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imkoniyatlar
              </label>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  {availableFeatures.map((feature) => (
                    <label key={feature.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.id)}
                        onChange={() => handleFeatureChange(feature.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-200"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Ommabop tarif sifatida belgilash
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Saqlash
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default EditTariffModal;
