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
    loginSeller
} = require('../controllers/shopOwnerMobileController');

// Use seller-specific authentication middleware
const sellerMobileAuth = require('../middleware/sellerMobileAuth');

// Public routes (no authentication required)
router.post('/login', loginSeller);

// Protected routes
router.use(sellerMobileAuth);

// Profile route
router.get('/me', getSellerMe);

// Product routes for sellers (MUST come before parameterized routes)
router.get('/products', getSellerProducts);
router.get('/products/:productId', getSellerProductById);
router.post('/sell-product', sellProduct);

// Seller management routes
router.post('/create', createSeller);
router.get('/list', getAllSellers);
router.get('/:sellerId', getSellerById);
router.patch('/:sellerId/status', updateSellerStatus);
router.put('/:sellerId', updateSeller);
router.patch('/:sellerId/password', updateSellerPassword);
router.delete('/:sellerId', deleteSeller);

module.exports = router;
