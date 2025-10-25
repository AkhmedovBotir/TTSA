import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CreateCategoryModal = ({ isOpen, onClose, onSuccess, token: propToken }) => {
  const { token: contextToken } = useAuth();
  const token = propToken || contextToken;
  const [formData, setFormData] = useState({ name: '', subcategories: [] });
  const [newSubcategory, setNewSubcategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      setFormData(prev => ({
        ...prev,
        subcategories: [
          ...prev.subcategories,
          { id: Date.now(), name: newSubcategory.trim() }
        ]
      }));
      setNewSubcategory('');
    }
  };

  const handleRemoveSubcategory = (subcategoryId) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter(sub => sub.id !== subcategoryId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Kategoriya yaratish
      const data = await api.post('/category/create', { name: formData.name }, token);
      // 2. Subkategoriyalarni yaratish (agar bor bo'lsa)
      const parentId = data.category.id;
      for (const sub of formData.subcategories) {
        await api.post('/category/subcategory/create', { name: sub.name, parentId }, token);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Yangi kategoriya qo'shish</Dialog.Title>
              <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {error && <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sub-kategoriyalar</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={newSubcategory} onChange={e => setNewSubcategory(e.target.value)} className="block flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" placeholder="Yangi sub-kategoriya nomi" />
                    <button type="button" onClick={handleAddSubcategory} className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><PlusIcon className="h-4 w-4" /></button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    {formData.subcategories.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">Sub-kategoriyalar qo'shilmagan</p>
                    ) : (
                      <ul className="space-y-1">
                        {formData.subcategories.map(subcategory => (
                          <li key={subcategory.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-md text-sm">
                            <span>{subcategory.name}</span>
                            <button type="button" onClick={() => handleRemoveSubcategory(subcategory.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-4 w-4" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Bekor qilish</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={loading}>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateCategoryModal;
