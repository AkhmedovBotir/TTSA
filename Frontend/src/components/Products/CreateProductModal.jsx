import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CreateProductModal = ({ isOpen, onClose, onSubmit, categories, subcategories, fetchSubcategories }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({ name: '', price: '', category: '', subcategory: '', quantity: '', status: 'active' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', price: '', category: '', subcategory: '', quantity: '', status: 'active' });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'category') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
      fetchSubcategories(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({
        name: formData.name,
        price: Number(formData.price),
        category: formData.category,
        subcategory: formData.subcategory,
        quantity: Number(formData.quantity),
        status: formData.status
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog as="div" className="relative z-[60]" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={onClose}>
                <span className="sr-only">Yopish</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">Yangi maxsulot qo'shish</Dialog.Title>
                <div className="mt-4">
                  {error && <div className="mb-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nomi</label>
                      <input type="text" name="name" id="name" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700">Narxi (so'm)</label>
                      <input type="number" name="price" id="price" required value={formData.price} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategoriya</label>
                      <select name="category" id="category" required value={formData.category} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                        <option value="">Tanlang</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">Sub-kategoriya</label>
                      <select name="subcategory" id="subcategory" required value={formData.subcategory} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                        <option value="">Tanlang</option>
                        {subcategories.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Soni</label>
                      <input type="number" name="quantity" id="quantity" required value={formData.quantity} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                      <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm">
                        <option value="active">Faol</option>
                        <option value="inactive">Faol emas</option>
                        <option value="archived">Arxivlangan</option>
                      </select>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button type="submit" className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto" disabled={loading}>{loading ? "Qo'shilmoqda..." : "Qo'shish"}</button>
                      <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" onClick={onClose}>Bekor qilish</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateProductModal;
