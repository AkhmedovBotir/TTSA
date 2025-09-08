import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Milliy CRM</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Xush kelibsiz, {user?.username}
              </span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Chiqish
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Boshqaruv paneli
            </h2>
            <p className="text-gray-600">
              Bu yerda asosiy ma'lumotlar va statistikalar joylashadi.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
