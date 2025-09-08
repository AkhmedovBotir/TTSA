import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CreateAgentModal = ({ isOpen, onClose, onSuccess, token }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    phone: '',
    passport: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
              const response = await fetch('http://localhost:3000/api/agent/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Agent yaratishda xatolik yuz berdi');
      }
      onSuccess(data.agent);
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                Yangi agent qo'shish
              </Dialog.Title>
              <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport</label>
                <input type="text" name="passport" value={formData.passport} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" required />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Saqlash</button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateAgentModal; 