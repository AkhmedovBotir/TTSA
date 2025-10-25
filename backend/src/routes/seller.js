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
const auth = require('../middleware/auth');

// Protected routes (faqat admin uchun)
router.post('/create', auth, createSeller);
router.get('/list', auth, getAllSellers);
router.get('/:sellerId', auth, getSellerById);
router.patch('/:sellerId/status', auth, updateSellerStatus);
router.put('/:sellerId', auth, updateSeller);
router.patch('/:sellerId/password', auth, updateSellerPassword);
router.delete('/:sellerId', auth, deleteSeller);

module.exports = router;
