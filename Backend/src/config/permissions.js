// Admin ruxsatlari
const ADMIN_PERMISSIONS = [
    'manage_admins',
    'manage_tariffs',
    'manage_shops',
    'manage_shop_owners',
    'manage_categories',
    'manage_products',
    'manage_orders',
    'manage_installments',
    'manage_contracts',
    'view_statistics'
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
