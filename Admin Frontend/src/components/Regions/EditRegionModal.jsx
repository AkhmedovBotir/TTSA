import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditRegionModal = ({ isOpen, onClose, onEdit, region, parentRegions = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'region',
    code: '',
    parent: '',
    status: 'active'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (region) {
      setFormData({
        name: region.name || '',
        type: region.type || 'region',
        code: region.code || '',
        parent: region.parent?.id || '',
        status: region.status || 'active'
      });
    }
  }, [region]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Prepare data for API
      const submitData = {
        name: formData.name,
        type: formData.type,
        code: formData.code,
        status: formData.status
      };

      // Only include parent if it's selected
      if (formData.parent) {
        submitData.parent = formData.parent;
      }

      await onEdit(region.id, submitData);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const getTypeOptions = () => {
    const options = [
      { value: 'region', label: 'Viloyat' },
      { value: 'district', label: 'Tuman' },
      { value: 'mfy', label: 'MFY' }
    ];
    return options;
  };

  const getParentOptions = () => {
    if (formData.type === 'region') {
      return []; // Regions don't have parents
    }
    
    if (formData.type === 'district') {
      return parentRegions.filter(region => region.type === 'region');
    }
    
    if (formData.type === 'mfy') {
      return parentRegions.filter(region => region.type === 'district');
    }
    
    return [];
  };

  if (!isOpen || !region) return null;

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="text-center mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                Regionni tahrirlash
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region nomi *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Masalan: Andijon viloyati"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region turi *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  required
                >
                  {getTypeOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region kodi *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm font-mono"
                  placeholder="Masalan: AND001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique kod bo'lishi kerak
                </p>
              </div>

              {getParentOptions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent region
                  </label>
                  <select
                    name="parent"
                    value={formData.parent}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  >
                    <option value="">Parent tanlang</option>
                    {getParentOptions().map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Holati *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  required
                >
                  <option value="active">Faol</option>
                  <option value="inactive">Faol emas</option>
                </select>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
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

export default EditRegionModal;

