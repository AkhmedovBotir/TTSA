const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Faqat rasm fayllari qabul qilinadi'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
const { 
    loginShopOwner,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
    getCategoryById,
    getAllCategories,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    getAllSubcategories,
    getRegions,
    getDistricts,
    getMfys,
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getSubcategoryById,
    assignProductToAgent,
    getAgentProducts,
    returnProductFromAgent,
    createSeller,
    getAllSellers,
    getAvailableSellers,
    assignSeller,
    setSellerServiceAreas,
    removeSeller,
    getOrders,
    getOrderById,
        // Seller functions
        getSellerById,
        updateSellerStatus,
        updateSeller,
        updateSellerPassword,
        deleteSeller,
        getSellerProfileForShopOwner,
    getMe,
} = require('../controllers/shopOwnerMobileController');

// Statistics functions
const {
    getDashboardStatistics,
    getSellerStatistics,
    getWarehouseStatistics,
    getSalesStatistics,
    getDailyStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics
} = require('../controllers/statisticsController');
const shopOwnerMobileAuth = require('../middleware/shopOwnerMobileAuth');


// Public routes
router.post('/login', loginShopOwner);

// Region routes (public - autentifikatsiya talab qilinmaydi)
router.get('/regions', getRegions);
router.get('/regions/:regionId/districts', getDistricts);
router.get('/districts/:districtId/mfys', getMfys);

// Protected routes
router.use(shopOwnerMobileAuth);

// Profile route
router.get('/me', getMe);

// Orders routes
router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrderById);

// Category routes - matching the structure from category.js
router.post('/category/create', createCategory);
router.get('/category/list', getAllCategories);
router.get('/category/:id', getCategoryById);
router.put('/category/:id', updateCategory);
router.put('/category/:id/status', updateCategoryStatus);
router.delete('/category/:id', deleteCategory);

// Subcategory routes - matching the structure from category.js
router.post('/category/subcategory/create', createSubcategory);
router.put('/category/subcategory/:id', updateSubcategory);
router.put('/category/subcategory/:id/status', updateCategoryStatus);
router.delete('/category/subcategory/:id', deleteSubcategory);
router.get('/category/subcategory/list', getAllSubcategories);
router.get('/category/subcategory/:id', getSubcategoryById);

// Product routes
router.post('/product/create', upload.single('image'), createProduct);
router.get('/product/list', getAllProducts);
router.get('/product/:id', getProductById);
router.put('/product/:id', upload.single('image'), updateProduct);
router.delete('/product/:id', deleteProduct);

// Agent product management
router.post('/agents/assign-product', (req, res, next) => {
    // Map shopOwner to user for compatibility
    req.user = { id: req.shopOwner._id };
    next();
}, assignProductToAgent);

router.get('/agents/products', (req, res, next) => {
    req.user = { id: req.shopOwner._id };
    next();
}, getAgentProducts);

router.post('/agents/return-product', (req, res, next) => {
    req.user = { id: req.shopOwner._id };
    next();
}, returnProductFromAgent);

router.post('/seller/create', createSeller);
router.get('/seller/list', getAllSellers);
router.get('/sellers/my', getAllSellers);
router.get('/sellers/available', getAvailableSellers);
router.post('/sellers/:sellerId/assign', assignSeller);
router.put('/sellers/:sellerId/service-areas', setSellerServiceAreas);
router.delete('/sellers/:sellerId/remove', removeSeller);
router.get('/seller/:sellerId', getSellerById);
router.get('/seller/:sellerId/profile', getSellerProfileForShopOwner);
router.patch('/seller/:sellerId/status', updateSellerStatus);
router.put('/seller/:sellerId', updateSeller);
router.patch('/seller/:sellerId/password', updateSellerPassword);
router.delete('/seller/:sellerId', deleteSeller);

// Statistics routes
router.get('/statistics/dashboard', getDashboardStatistics);
router.get('/statistics/sellers', getSellerStatistics);
router.get('/statistics/warehouse', getWarehouseStatistics);
router.get('/statistics/sales', getSalesStatistics);
router.get('/statistics/daily', getDailyStatistics);
router.get('/statistics/weekly', getWeeklyStatistics);
router.get('/statistics/monthly', getMonthlyStatistics);

// Notification routes (Do'kon Egasi)
const { getShopOwnerNotifications, markShopOwnerNotificationAsRead, getShopOwnerUnreadNotificationCount } = require('../controllers/shopOwnerMobileController');
router.get('/notifications', getShopOwnerNotifications);
router.get('/notifications/unread-count', getShopOwnerUnreadNotificationCount);
router.patch('/notifications/:notificationId/read', markShopOwnerNotificationAsRead);

module.exports = router;
