import React from 'react';

const ViewAdminModal = ({ admin, onClose }) => {
  if (!admin) return null;

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Admin ma'lumotlari</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Admin Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">To'liq ism</h3>
            <p className="text-base text-gray-900">{admin.fullname}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Foydalanuvchi nomi</h3>
            <p className="text-base text-gray-900">{admin.username}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Telefon raqam</h3>
            <p className="text-base text-gray-900">{admin.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              admin.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {admin.status === 'active' ? 'Faol' : 'Nofaol'}
            </span>
          </div>
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Ruxsatlar</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {admin.permissions?.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    {permission === 'manage_admins' && 'Adminlar'}
                    {permission === 'manage_tariffs' && 'Tariflar'}
                    {permission === 'manage_shops' && "Do'konlar"}
                    {permission === 'manage_shop_owners' && "Do'kon egalari"}
                    {permission === 'manage_assistants' && 'Yordamchilar'}
                    {permission === 'manage_categories' && 'Kategoriyalar'}
                    {permission === 'manage_products' && 'Mahsulotlar'}
                    {permission === 'manage_orders' && 'Buyurtmalar'}
                    {permission === 'manage_installments' && "Muddatli to'lovlar"}
                    {permission === 'manage_contracts' && 'Shartnomalar'}
                    {permission === 'view_statistics' && 'Statistika'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Yopish
        </button>
      </div>
    </div>
  );
};

export default ViewAdminModal;
