import React, { useState, useEffect } from 'react';
import PasswordInput from '../Common/PasswordInput';
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

const EditStoreOwnerModal = ({ isOpen, onClose, onSubmit, onPermissionsSubmit, owner, availablePermissions }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    password: '',
    status: 'active'
  });

  const [permissions, setPermissions] = useState([]);
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    if (owner) {
      setFormData({
        name: owner.name || '',
        phone: owner.phone || '',
        username: owner.username || '',
        password: '',
        status: owner.status || 'active'
      });
      setPermissions(owner.permissions || []);
    }
  }, [owner]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionId) => {
    setPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const changedData = {};
    if (formData.name !== owner.name) changedData.name = formData.name;
    if (formData.phone !== owner.phone) changedData.phone = formData.phone;
    if (formData.username !== owner.username) changedData.username = formData.username;
    if (formData.password) changedData.password = formData.password;
    if (formData.status !== owner.status) changedData.status = formData.status;

    const success = await onSubmit(changedData);
    if (success) {
      onClose();
    }
  };

  const handlePermissionsSubmit = async (e) => {
    e.preventDefault();
    const success = await onPermissionsSubmit(permissions);
    if (success) {
      setShowPermissions(false);
    }
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
          <Dialog.Panel className={`w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all ${isOpen ? 'animate-modalOpen' : 'animate-modalClose'}`}>
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                {showPermissions ? 'Ruxsatlarni o\'zgartirish' : 'Do\'kon egasini tahrirlash'}
              </Dialog.Title>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {!showPermissions ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ism familiya
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yangi parol
                    </label>
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Yangi parol kiriting"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    >
                      <option value="active">Faol</option>
                      <option value="inactive">Faol emas</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Ruxsatlarni o'zgartirish
                  </button>
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
            ) : (
              <form onSubmit={handlePermissionsSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {availablePermissions.map(permission => (
                    <div key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        id={permission}
                        checked={permissions.includes(permission)}
                        onChange={() => handlePermissionChange(permission)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={permission} className="ml-2 block text-sm text-gray-900">
                        {permissionLabels[permission] || permission}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPermissions(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Orqaga
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default EditStoreOwnerModal;
