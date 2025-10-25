const express = require('express');
const router = express.Router();
const { 
    createSeller, 
    getAllSellers, 
    updateSellerStatus, 
    updateSeller, 
    updateSellerPassword,
    getSellerById,
    deleteSeller
} = require('../controllers/sellerController');

// Import product-related functions from shopOwnerMobileController
const { 
    getSellerProducts,
    getSellerProductById,
    sellProduct,
    getSellerMe,
    getSellerColleagues,
    loginSeller,
    getSellerOrders,
    getSellerOrderById,
    acceptOrder,
    markOrderAsDelivered,
    cancelSellerOrder,
    confirmPayment,
    rejectPayment,
    getActiveInterestRates,
    // Seller notification functions
    getSellerNotifications,
    markSellerNotificationAsRead,
    getSellerUnreadNotificationCount,
    // Region functions
    getRegions,
    getDistricts,
    getMfys
} = require('../controllers/shopOwnerMobileController');

// Use seller-specific authentication middleware
const sellerMobileAuth = require('../middleware/sellerMobileAuth');

// Public routes (no authentication required)
router.post('/login', loginSeller);

// Region routes (public - autentifikatsiya talab qilinmaydi)
router.get('/regions', getRegions);
router.get('/regions/:regionId/districts', getDistricts);
router.get('/districts/:districtId/mfys', getMfys);

// Protected routes
router.use(sellerMobileAuth);

// Profile route
router.get('/me', getSellerMe);

// Seller colleagues route (hamkasblar)
router.get('/colleagues', getSellerColleagues);

// Product routes for sellers (MUST come before parameterized routes)
router.get('/products', getSellerProducts);
router.get('/products/:productId', getSellerProductById);
router.post('/sell-product', sellProduct);

// Order management routes for sellers
router.get('/orders', getSellerOrders);
router.get('/orders/:orderId', getSellerOrderById);
router.patch('/orders/:orderId/accept', acceptOrder);
router.patch('/orders/:orderId/deliver', markOrderAsDelivered);
router.patch('/orders/:orderId/cancel', cancelSellerOrder);
router.patch('/orders/:orderId/confirm-payment', confirmPayment);
router.patch('/orders/:orderId/reject-payment', rejectPayment);

// Interest rates for calculation
router.get('/interest-rates', getActiveInterestRates);

// Notification routes (Agent/Sotuvchi)
router.get('/notifications', getSellerNotifications);
router.get('/notifications/unread-count', getSellerUnreadNotificationCount);
router.patch('/notifications/:notificationId/read', markSellerNotificationAsRead);

// Seller management routes
router.post('/create', createSeller);
router.get('/list', getAllSellers);
router.get('/:sellerId', getSellerById);
router.patch('/:sellerId/status', updateSellerStatus);
router.put('/:sellerId', updateSeller);
router.patch('/:sellerId/password', updateSellerPassword);
router.delete('/:sellerId', deleteSeller);

module.exports = router;
