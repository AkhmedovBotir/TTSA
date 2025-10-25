import React, { useState, useEffect } from 'react';
import { XMarkIcon, BanknotesIcon, CalendarIcon, UserIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const PaymentProcessModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  installment, 
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0],
    month: ''
  });

  // Reset form when modal opens/closes or installment changes
  useEffect(() => {
    if (isOpen && installment) {
      const nextPayment = installment.payments?.find(p => p.status === 'pending');
      setFormData({
        amount: nextPayment?.amount || installment.installment?.monthlyPayment || '',
        paymentMethod: 'cash',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0],
        month: nextPayment?.month || nextPayment?.monthNumber || ''
      });
    }
  }, [isOpen, installment]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Format amount input to handle decimal places properly
    if (name === 'amount') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: numericValue > 0 ? numericValue.toString() : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('To\'lov summasi kiritilishi shart!');
      return;
    }
    
    if (!formData.paymentMethod) {
      alert('To\'lov usuli tanlanishi shart!');
      return;
    }
    
    if (!formData.paymentDate) {
      alert('To\'lov sanasi kiritilishi shart!');
      return;
    }
    
    if (!formData.month) {
      alert('Qaysi oy uchun to\'lov amalga oshirilayotganini belgilang!');
      return;
    }
    
    // Convert amount to number for API
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    onConfirm(submitData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  if (!isOpen || !installment) return null;

  const nextPayment = installment.payments?.find(p => p.status === 'pending');
  const progress = installment.payments ? 
    Math.round((installment.payments.filter(p => p.status === 'paid').length / installment.payments.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl mx-4 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    To'lovni amalga oshirish
                  </h3>
                  <p className="text-sm text-gray-600">
                    Muddatli to'lov ma'lumotlarini kiriting
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-white bg-opacity-20 text-gray-400 hover:text-gray-600 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-all duration-200 p-1"
                disabled={isLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Installment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Muddatli to'lov ma'lumotlari</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Mijoz:</span>
                  <span className="font-medium">{installment.customer?.fullName || 'Noma\'lum'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCardIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Buyurtma:</span>
                  <span className="font-medium">#{installment.orderId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Davomiyligi:</span>
                  <span className="font-medium">{installment.installment?.duration} oy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <BanknotesIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Jami summa:</span>
                  <span className="font-medium">{formatCurrency(installment.totalSum)}</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {installment.payments?.filter(p => p.status === 'paid').length || 0} / {installment.payments?.length || 0} to'lov
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    To'lov summasi *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 pr-12"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                      disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">UZS</span>
                    </div>
                  </div>
                  {nextPayment && (
                    <p className="text-xs text-gray-500 mt-1">
                      Kutilayotgan summa: {formatCurrency(nextPayment.amount)}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    To'lov usuli *
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2"
                    required
                    disabled={isLoading}
                  >
                    <option value="cash">Naqd pul</option>
                    <option value="card">Karta</option>
                    <option value="transfer">Bank o'tkazmasi</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
                    Qaysi oy uchun to'lov *
                  </label>
                  <select
                    id="month"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Oy tanlang</option>
                    {installment.payments?.map((payment, index) => {
                      const monthValue = payment.month || payment.monthNumber || (index + 1);
                      const monthLabel = payment.month ? `${payment.month}-oy` : payment.monthNumber ? `${payment.monthNumber}-oy` : `${index + 1}-oy`;
                      return (
                        <option 
                          key={index} 
                          value={monthValue}
                          disabled={payment.status === 'paid'}
                        >
                          {monthLabel} 
                          {payment.status === 'paid' ? ' (To\'langan)' : payment.status === 'pending' ? ' (Kutilmoqda)' : ''}
                        </option>
                      );
                    })}
                  </select>
                  {formData.month && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.month}-oy uchun to'lov amalga oshirilmoqda
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
                    To'lov sanasi *
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2"
                    max={new Date().toISOString().split('T')[0]}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Izoh
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm px-3 py-2 resize-none"
                  placeholder="To'lov haqida qo'shimcha ma'lumot..."
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                disabled={isLoading}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="inline-flex justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Amalga oshirilmoqda...</span>
                  </div>
                ) : (
                  'To\'lovni amalga oshirish'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessModal;
