import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditInstallmentModal = ({ isOpen, onClose, onSubmit, installment }) => {
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    totalAmount: '',
    downPayment: '',
    duration: '',
    paidMonths: '',
    status: ''
  });

  useEffect(() => {
    if (installment) {
      setFormData({
        customer: installment.customer,
        product: installment.product,
        totalAmount: installment.totalAmount,
        downPayment: installment.downPayment,
        duration: installment.duration,
        paidMonths: installment.paidMonths,
        status: installment.status
      });
    }
  }, [installment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const monthlyPayment = Math.round((formData.totalAmount - formData.downPayment) / formData.duration);
    const remainingAmount = formData.totalAmount - formData.downPayment - (monthlyPayment * formData.paidMonths);
    onSubmit({
      ...installment,
      ...formData,
      monthlyPayment,
      remainingAmount,
      nextPaymentDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    });
  };

  if (!installment) return null;

  return (
    <Dialog as="div" className="relative z-[60]" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />

      <div className="fixed inset-0 z-[60] overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
              >
                <span className="sr-only">Yopish</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                  Muddatli to'lovni tahrirlash
                </Dialog.Title>
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="customer" className="block text-sm font-medium text-gray-700">
                        Mijoz
                      </label>
                      <input
                        type="text"
                        name="customer"
                        id="customer"
                        required
                        value={formData.customer}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="product" className="block text-sm font-medium text-gray-700">
                        Maxsulot
                      </label>
                      <input
                        type="text"
                        name="product"
                        id="product"
                        required
                        value={formData.product}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                        Umumiy summa
                      </label>
                      <input
                        type="number"
                        name="totalAmount"
                        id="totalAmount"
                        required
                        min="0"
                        value={formData.totalAmount}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="downPayment" className="block text-sm font-medium text-gray-700">
                        Boshlang'ich to'lov
                      </label>
                      <input
                        type="number"
                        name="downPayment"
                        id="downPayment"
                        required
                        min="0"
                        max={formData.totalAmount}
                        value={formData.downPayment}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Muddat (oylar)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        id="duration"
                        required
                        min="1"
                        max="24"
                        value={formData.duration}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="paidMonths" className="block text-sm font-medium text-gray-700">
                        To'langan oylar
                      </label>
                      <input
                        type="number"
                        name="paidMonths"
                        id="paidMonths"
                        required
                        min="0"
                        max={formData.duration}
                        value={formData.paidMonths}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        id="status"
                        required
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="active">Faol</option>
                        <option value="completed">To'langan</option>
                        <option value="overdue">Muddati o'tgan</option>
                        <option value="cancelled">Bekor qilingan</option>
                      </select>
                    </div>

                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                      >
                        Saqlash
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        onClick={onClose}
                      >
                        Bekor qilish
                      </button>
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

export default EditInstallmentModal;
