const express = require('express');
const router = express.Router();
const { createShop, getAllShops, deleteShop, updateShopStatus, getShopById, updateShop } = require('../controllers/shopController');
const auth = require('../middleware/auth');

// Protected routes (faqat admin uchun)
router.post('/create', auth, createShop);
router.get('/list', auth, getAllShops);
router.delete('/:shopId', auth, deleteShop);
router.patch('/:shopId/status', auth, updateShopStatus);
router.get('/:shopId', auth, getShopById);
router.put('/:shopId', auth, updateShop);

module.exports = router;
