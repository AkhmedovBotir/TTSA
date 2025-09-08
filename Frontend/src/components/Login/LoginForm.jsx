import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { key: 'admin', label: 'Admin uchun login' },
  { key: 'agent', label: 'Agent uchun login' },
  { key: 'shop-owner', label: 'Do\'kon egasi uchun login' }
];

const LoginForm = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('admin'); // Default to shop-owner tab
  // Admin login
  const [adminForm, setAdminForm] = useState({ username: '', password: '' });
  const [adminError, setAdminError] = useState('');
  // Shop owner login
  const [ownerForm, setOwnerForm] = useState({ username: '', phone: '', password: '' });
  const [ownerError, setOwnerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin login handler
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');
    setLoading(true);
    const success = await login(adminForm.username, adminForm.password, 'admin');
    setLoading(false);
    if (!success) {
      setAdminError("Noto'g'ri login yoki parol. Iltimos qaytadan urinib ko'ring.");
    }
  };

  // Shop owner login handler
  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setOwnerError('');
    setLoading(true);

    if (!ownerForm.username && !ownerForm.phone) {
      setOwnerError("Iltimos, foydalanuvchi nomi yoki telefon raqamini kiriting");
      setLoading(false);
      return;
    }
    if (!ownerForm.password) {
      setOwnerError("Iltimos, parolni kiriting");
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login with:', {
        username: ownerForm.username,
        phone: ownerForm.phone,
        type: 'shop-owner'
      });

      const success = await login(
        ownerForm.username || undefined, // Send undefined if empty
        ownerForm.password,
        'shop-owner',
        ownerForm.phone || undefined      // Send undefined if empty
      );

      if (!success) {
        throw new Error("Noto'g'ri foydalanuvchi nomi/telefon raqami yoki parol");
      }

      // Clear form on success
      setOwnerForm({ username: '', phone: '', password: '' });
      // Navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Login error:', error);
      setOwnerError(error.message || "Kirishda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-background">
      {/* Animated bubbles */}
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="bubble"></div>
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-8 relative z-10">
        {/* Tab navigation - Temporarily commented out */}
        {/*
        <div className="flex mb-6 border-b">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`flex-1 py-2 text-center font-medium text-sm transition-colors duration-200 border-b-2 ${activeTab === tab.key ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-gray-500 bg-transparent'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Admin sifatida kirish</h2>
        </div>
        {/* Tab content */}
        {activeTab === 'admin' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Milliy CRM</h2>
            <p className="text-sm text-gray-600 mb-8">Admin panelga kirish uchun ma'lumotlaringizni kiriting</p>
            {adminError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{adminError}</div>
            )}
            <form className="space-y-6" onSubmit={handleAdminSubmit}>
              <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700">Foydalanuvchi nomi</label>
                <div className="mt-1">
                  <input
                    id="admin-username"
                    name="username"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="admin"
                    value={adminForm.username}
                    onChange={e => setAdminForm(f => ({ ...f, username: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">Parol</label>
                <div className="mt-1">
                  <input
                    id="admin-password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••"
                    value={adminForm.password}
                    onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Kirilmoqda...' : 'Kirish'}
                </button>
              </div>
            </form>
          </div>
        )}
        {activeTab === 'agent' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent uchun login</h2>
            <p className="text-sm text-gray-600 mb-8">Agent login funksiyasi hali tayyor emas</p>
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">Tez orada!</div>
          </div>
        )}
        {activeTab === 'shop-owner' && (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Do'kon egasi login</h2>
            <p className="text-sm text-gray-600 mb-8">Do'kon egasi sifatida tizimga kiring</p>
            {ownerError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{ownerError}</div>
            )}
            <form className="space-y-6" onSubmit={handleOwnerSubmit}>
              <div>
                <label htmlFor="owner-username" className="block text-sm font-medium text-gray-700">Foydalanuvchi nomi</label>
                <div className="mt-1">
                  <input
                    id="owner-username"
                    name="username"
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="shopowner1"
                    value={ownerForm.username}
                    onChange={e => setOwnerForm(f => ({ ...f, username: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="owner-phone" className="block text-sm font-medium text-gray-700">Telefon raqam</label>
                <div className="mt-1">
                  <input
                    id="owner-phone"
                    name="phone"
                    type="text"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+998901234567"
                    value={ownerForm.phone}
                    onChange={e => setOwnerForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="owner-password" className="block text-sm font-medium text-gray-700">Parol</label>
                <div className="mt-1">
                  <input
                    id="owner-password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••"
                    value={ownerForm.password}
                    onChange={e => setOwnerForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Kirilmoqda...' : 'Kirish'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginForm;
