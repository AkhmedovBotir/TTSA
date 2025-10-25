import React from 'react';

const DeleteAdminModal = ({ admin, onClose, onConfirm }) => {
  if (!admin) return null;

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Adminni o'chirish</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-600">
          Haqiqatan ham <span className="font-medium text-gray-900">{admin.fullname}</span> adminini o'chirmoqchimisiz?
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Bu amalni ortga qaytarib bo'lmaydi.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          O'chirish
        </button>
      </div>
    </div>
  );
};

export default DeleteAdminModal;
