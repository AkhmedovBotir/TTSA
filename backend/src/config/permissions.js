// Admin ruxsatlari
const ADMIN_PERMISSIONS = [
    'view_dashboard',          // Dashboard
    'manage_admins',           // Adminlar
    'manage_shop_owners',      // Do'kon egalari
    'manage_stores',           // Do'konlar (frontend bilan mos kelishi uchun)
    'manage_shops',            // Do'konlar (eski ma'lumotlar bilan mos kelishi uchun)
    'manage_sellers',          // Sotuvchilar
    'manage_regions',          // Regionlar
    'manage_categories',       // Kategoriyalar
    'manage_products',         // Mahsulotlar
    'manage_orders',           // Buyurtmalar
    'manage_installments',     // Muddatli to'lovlar
    'manage_notifications',    // Xabarnomalar
    'manage_settings'          // Sozlamalar
  ];
  

// Do'kon egasi ruxsatlari
const SHOP_OWNER_PERMISSIONS = [
    'manage_products',      // Mahsulotlarni boshqarish
    'manage_orders',        // Buyurtmalarni boshqarish
    'manage_categories',    // Kategoriyalarni boshqarish
    'manage_installments',  // Muddatli to'lovlarni boshqarish
    'manage_contracts',     // Shartnomalarni boshqarish
    'view_statistics'       // Statistikani ko'rish
];

// Statik ruxsatlar (o'zgartirib bo'lmaydi)
const STATIC_PERMISSIONS = {
    can_login: true,                    // Tizimga kirish
    can_view_own_shop: true,           // O'z do'konini ko'rish
    can_edit_own_profile: true,        // O'z profilini tahrirlash
    can_view_own_statistics: true      // O'z statistikasini ko'rish
};

module.exports = {
    ADMIN_PERMISSIONS,
    SHOP_OWNER_PERMISSIONS,
    STATIC_PERMISSIONS
};
