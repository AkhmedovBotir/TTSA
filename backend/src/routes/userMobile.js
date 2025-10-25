const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    logoutUser,
    sendSmsCode,
    verifySmsCode,
    registerWithSms,
    getUserNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
    getRegions,
    getDistricts,
    getMfys,
    getUserLocation,
    updateUserLocation
} = require('../controllers/userMobileController');

const {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getDiscountedProducts,
    getNewProducts,
    getTrendProducts
} = require('../controllers/userMobileProductController');

const {
    getCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart
} = require('../controllers/userMobileCartController');

const {
    createOrder,
    getUserOrders,
    getOrderById,
    cancelOrder,
    getOrderStats
} = require('../controllers/userMobileOrderController');

const userMobileAuth = require('../middleware/userMobileAuth');

// Public routes (autentifikatsiya talab qilinmaydi)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logoutUser);

// Protected routes (autentifikatsiya talab qilinadi)
router.get('/profile', userMobileAuth, getUserProfile);
router.put('/profile', userMobileAuth, updateUserProfile);
router.put('/change-password', userMobileAuth, changePassword);

// Mahsulotlar (public - autentifikatsiya talab qilinmaydi)
router.get('/products', getAllProducts);
router.get('/products/search', searchProducts);
router.get('/products/discounted', getDiscountedProducts);
router.get('/products/new', getNewProducts);
router.get('/products/trend', getTrendProducts);
router.get('/products/category/:categoryId', getProductsByCategory);
router.get('/products/:id', getProductById);

// Savatcha (autentifikatsiya talab qilinadi)
router.get('/cart', userMobileAuth, getCart);
router.post('/cart/add', userMobileAuth, addToCart);
router.put('/cart/items/:itemId/quantity', userMobileAuth, updateCartItemQuantity);
router.delete('/cart/items/:itemId', userMobileAuth, removeFromCart);
router.delete('/cart/clear', userMobileAuth, clearCart);

// Buyurtmalar (autentifikatsiya talab qilinadi)
router.post('/orders', userMobileAuth, createOrder);
router.get('/orders', userMobileAuth, getUserOrders);
router.get('/orders/:orderId', userMobileAuth, getOrderById);
router.put('/orders/:orderId/cancel', userMobileAuth, cancelOrder);
router.get('/orders/stats', userMobileAuth, getOrderStats);

// SMS Authentication Routes
router.post('/auth/send-sms', sendSmsCode);
router.post('/auth/verify-sms', verifySmsCode);
router.post('/auth/register-sms', registerWithSms);

// Notification Routes
router.get('/notifications', userMobileAuth, getUserNotifications);
router.get('/notifications/unread-count', userMobileAuth, getUnreadNotificationCount);
router.patch('/notifications/:notificationId/read', userMobileAuth, markNotificationAsRead);

// Hudud tanlash routes (public - autentifikatsiya talab qilinmaydi)
router.get('/regions', getRegions);
router.get('/regions/:regionId/districts', getDistricts);
router.get('/districts/:districtId/mfys', getMfys);

// Foydalanuvchi manzili (autentifikatsiya talab qilinadi)
router.get('/location', userMobileAuth, getUserLocation);
router.put('/location', userMobileAuth, updateUserLocation);

// SMS Service Test Routes (Development only)
const { testSmsService, getSmsBalance } = require('../controllers/userMobileController');
router.get('/test/sms-balance', getSmsBalance);
router.post('/test/sms', testSmsService);

module.exports = router; 