const express = require('express');
const router = express.Router();
const orderHistoryController = require('../controllers/orderHistoryController');
const auth = require('../middleware/auth');

// Barcha route'lar uchun autentifikatsiyani tekshirish
router.use(auth);

// Buyurtmalar tarixini olish
router.get('/', orderHistoryController.getOrderHistory);

// To'g'ridan-to'g'ri buyurtma yaratish
router.post('/direct-order', orderHistoryController.createDirectOrder);

// Buyurtmani bekor qilish
router.patch('/:id/cancel', orderHistoryController.cancelOrder);

module.exports = router;
