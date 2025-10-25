const express = require('express');
const router = express.Router();
const { 
    createShopOwner, 
    loginShopOwner, 
    getAllShopOwners,
    updateShopOwnerPermissions,
    getAvailablePermissions,
    updateShopOwner,
    getShopOwner,
    updateShopOwnerStatus,
    deleteShopOwner,
    // Seller management
    getAvailableSellers,
    assignSeller,
    getMySellers,
    setSellerServiceAreas,
    removeSeller,
    // Region management
    getRegionsForShopOwner
} = require('../controllers/shopOwnerController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', loginShopOwner);

// Protected routes (faqat admin uchun)
router.post('/create', auth, createShopOwner);
router.get('/list', auth, getAllShopOwners);
router.get('/permissions', getAvailablePermissions);

// ==================== REGION MANAGEMENT ROUTES ====================
// Do'kon egasi tomonidan regionlarni ko'rish
router.get('/regions', auth, getRegionsForShopOwner); // Regionlarni ko'rish

// ==================== STATISTICS ROUTES ====================
// Do'kon egasi uchun statistika
const { 
    getDashboardStatistics, 
    getSellerStatistics,
    getWarehouseStatistics,
    getSalesStatistics,
    getDailyStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics
} = require('../controllers/statisticsController');

router.get('/statistics/dashboard', auth, getDashboardStatistics); // Umumiy statistika
router.get('/statistics/sellers', auth, getSellerStatistics); // Sellerlar statistikasi
router.get('/statistics/warehouse', auth, getWarehouseStatistics); // Ombor statistikasi
router.get('/statistics/sales', auth, getSalesStatistics); // Sotuvlar statistikasi
router.get('/statistics/daily', auth, getDailyStatistics); // Kunlik statistika
router.get('/statistics/weekly', auth, getWeeklyStatistics); // Haftalik statistika
router.get('/statistics/monthly', auth, getMonthlyStatistics); // Oylik statistika

// ==================== SELLER MANAGEMENT ROUTES ====================
// Do'kon egasi tomonidan sellerlarni boshqarish
router.get('/sellers/available', auth, getAvailableSellers); // Mavjud sellerlarni ko'rish
router.post('/sellers/:sellerId/assign', auth, assignSeller); // Sellerni tanlash
router.get('/sellers/my', auth, getMySellers); // Mening sellerlarim
router.put('/sellers/:sellerId/service-areas', auth, setSellerServiceAreas); // Xizmat hududlarini belgilash
router.delete('/sellers/:sellerId/remove', auth, removeSeller); // Sellerni olib tashlash

// ==================== SHOP OWNER MANAGEMENT ROUTES ====================
// Do'kon egasini boshqarish (ID bilan route'lar oxirida)
router.put('/:id/permissions', auth, updateShopOwnerPermissions);
router.put('/:id', auth, updateShopOwner);
router.get('/:id', auth, getShopOwner);
router.put('/:id/status', auth, updateShopOwnerStatus);
router.delete('/:id', auth, deleteShopOwner);

module.exports = router;
