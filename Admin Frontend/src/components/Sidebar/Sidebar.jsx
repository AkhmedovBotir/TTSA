import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  UsersIcon,
  UserGroupIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const SHOP_OWNER_PERMISSIONS = [
  'manage_products',      // Mahsulotlarni boshqarish
  'manage_orders',        // Buyurtmalarni boshqarish
  'manage_categories',    // Kategoriyalarni boshqarish
  'manage_installments',  // Muddatli to'lovlarni boshqarish
  'manage_contracts',     // Shartnomalarni boshqarish
  'view_statistics',      // Statistikani ko'rish
  'manage_notifications', // Xabarnomalarni boshqarish
  'manage_settings'       // Sozlamalarni boshqarish
];

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
      </svg>
    )
  },
  {
    title: 'Adminlar',
    path: '/admins',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    permission: 'manage_admins'
  },
  // {
  //   title: 'Tariflar',
  //   path: '/tariffs',
  //   icon: (
  //     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  //       <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  //     </svg>
  //   )
  // },
  {
    title: "Do'kon egalari",
    path: '/store-owners',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    permission: 'manage_shop_owners'
  },
  {
    title: "Do'konlar",
    path: '/stores',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
      </svg>
    ),
    permission: 'manage_stores'
  },
  // {
  //   title: "Agentlar",
  //   path: '/agents',
  //   icon: (
  //     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
  //       <circle cx="12" cy="7" r="4" />
  //       <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  //       <path d="M10 17l2 2 2-2" />
  //     </svg>
  //   ),
  //   permission: 'manage_agents'
  // },
  {
    title: 'Sotuvchilar',
    path: '/sellers',
    icon: <UserGroupIcon className="w-5 h-5" />,
    permission: 'manage_sellers'
  },
  {
    title: 'Regionlar',
    path: '/regions',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    permission: 'manage_regions'
  },
  {
    title: 'Kategoriyalar',
    path: '/categories',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    permission: 'manage_categories'
  },
  {
    title: 'Mahsulotlar',
    path: '/products',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    permission: 'manage_products'
  },
  {
    title: 'Buyurtmalar',
    path: '/orders',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    permission: 'manage_orders'
  },
  {
    title: "Muddatli to'lovlar",
    path: '/installments',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    permission: 'manage_installments'
  },
  {
    title: 'Xabarnomalar',
    path: '/notifications',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    permission: 'manage_notifications'
  },
  {
    title: 'Sozlamalar',
    path: '/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    permission: 'manage_settings'
  }

];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, permissions, logout } = useAuth();

  // Filter menu items based on user permissions
  let filteredMenu = menuItems;
  
  if (user?.type === 'shop-owner') {
    // Shop owner uchun maxsus ruxsatlar
    filteredMenu = menuItems.filter(item => {
      if (!item.permission) return true;
      return SHOP_OWNER_PERMISSIONS.includes(item.permission) && permissions.includes(item.permission);
    });
  } else {
    // Admin va boshqa userlar uchun permission-based filtering
    filteredMenu = menuItems.filter(item => {
      if (!item.permission) return true; // Dashboard kabi permission talab qilmaydigan sahifalar
      return permissions.includes(item.permission);
    });
  }

  return (
    <aside
      className={`relative top-0 left-0 z-20 h-screen transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-72'} 
        bg-gradient-to-br from-indigo-600 to-blue-500 text-white`}
    >
      {/* Logo section */}
      <div className="flex items-center justify-between h-16 px-4 bg-black/10">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">M</span>
            </div>
            <span className="text-lg font-semibold tracking-wider">Milliy CRM</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 4l6 6-6 6M5 4l6 6-6 6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4L5 10l6 6M19 4l-6 6 6 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex-1 overflow-y-auto px-4 py-2 sidebar-scroll">
          <div className="space-y-2">
            {filteredMenu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg'
                      : 'hover:bg-white/10'
                    }
                    ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-white/80'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={`text-sm ${isActive ? 'font-medium' : ''}`}>
                      {item.title}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User section */}
        <div className={`px-4 pt-4 pb-4 border-t border-white/10 space-y-4
          ${isCollapsed ? 'text-center' : ''}`}
        >
          {!isCollapsed && (
            <div className="px-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {user?.type === 'shop-owner'
                    ? (user?.info?.name?.charAt(0).toUpperCase() || user?.info?.fullname?.charAt(0).toUpperCase() || 'S')
                    : (user?.username?.charAt(0).toUpperCase() || 'A')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {user?.type === 'shop-owner'
                    ? (user?.info?.name || user?.info?.fullname || 'Do\'kon egasi')
                    : (user?.username || 'Admin')}
                </p>
                <p className="text-xs text-white/60">
                  {user?.type === 'shop-owner' ? "Do'kon egasi" : 'Administrator'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`w-full px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 
              rounded-xl transition-colors flex items-center gap-2
              ${isCollapsed ? 'justify-center' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span className="text-sm">Chiqish</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;