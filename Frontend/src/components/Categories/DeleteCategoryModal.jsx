import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DeleteCategoryModal = ({ isOpen, onClose, onSubmit, category, token: propToken }) => {
  const { token: contextToken } = useAuth();
  const token = propToken || contextToken;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await api.delete(`/category/${category.id}`, token);
      onSubmit && onSubmit();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !category) return null;

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
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                Kategoriyani o'chirish
              </Dialog.Title>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Kategoriyani o'chirishni tasdiqlang
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Haqiqatan ham {category.name} nomli kategoriyani o'chirmoqchimisiz? 
                    Bu amalni ortga qaytarib bo'lmaydi va kategoriyaga tegishli barcha mahsulotlar o'chiriladi.
                  </p>
                </div>
                {error && <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={loading}
              >
                {loading ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteCategoryModal;
