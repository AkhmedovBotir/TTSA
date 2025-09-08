const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    logoutUser
} = require('../controllers/userMobileController');

const {
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getDiscountedProducts,
    getNewProducts
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

module.exports = router; 