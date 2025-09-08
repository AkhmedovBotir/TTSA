import React from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const DeleteAgentModal = ({ isOpen, onClose, agent, onSuccess, token }) => {
  const handleDelete = async () => {
    try {
              const response = await fetch(`http://localhost:3000/api/agent/${agent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Agentni o'chirishda xatolik yuz berdi");
      }
      onSuccess();
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  if (!isOpen || !agent) return null;

  return (
    <Dialog as="div" className="relative z-50" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                Agentni o'chirish
              </Dialog.Title>
              <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Agentni o'chirishni tasdiqlang
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Haqiqatan ham {agent.fullname} agentini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
                  </p>
                </div>
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
              >
                O'chirish
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default DeleteAgentModal; 