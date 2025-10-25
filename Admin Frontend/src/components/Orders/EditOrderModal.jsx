import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const EditOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
  const [formData, setFormData] = useState({
    customer: '',
    products: [{ name: '', quantity: 1, price: 0 }],
    status: 'pending'
  });

  useEffect(() => {
    if (order) {
      setFormData({
        customer: order.customer,
        products: order.products,
        status: order.status
      });
    }
  }, [order]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = {
      ...newProducts[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { name: '', quantity: 1, price: 0 }]
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalAmount = formData.products.reduce((sum, product) => {
      return sum + (product.quantity * product.price);
    }, 0);
    onSubmit({
      ...order,
      ...formData,
      totalAmount
    });
  };

  if (!order) return null;

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
                  Buyurtmani tahrirlash
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maxsulotlar
                      </label>
                      {formData.products.map((product, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Maxsulot nomi"
                              required
                              value={product.name}
                              onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="w-24">
                            <input
                              type="number"
                              placeholder="Soni"
                              required
                              min="1"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value))}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <div className="w-32">
                            <input
                              type="number"
                              placeholder="Narxi"
                              required
                              min="0"
                              value={product.price}
                              onChange={(e) => handleProductChange(index, 'price', parseInt(e.target.value))}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <MinusIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addProduct}
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                      >
                        <PlusIcon className="h-5 w-5 mr-1" />
                        Maxsulot qo'shish
                      </button>
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
                        <option value="pending">Kutilmoqda</option>
                        <option value="processing">Jarayonda</option>
                        <option value="completed">Bajarildi</option>
                        <option value="cancelled">Bekor qilindi</option>
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

export default EditOrderModal;
