const express = require('express');
const router = express.Router();
const draftOrderController = require('../controllers/draftOrderController');
const auth = require('../middleware/auth');
const sellerMobileAuth = require('../middleware/sellerMobileAuth');

// Barcha route'lar uchun autentifikatsiyani tekshirish
router.use(auth);

// Vaqtinchalik buyurtmalar ro'yxati
router.get('/drafts', draftOrderController.getDraftOrders);

// Yangi vaqtinchalik buyurtma yaratish (seller uchun)
router.post('/drafts', sellerMobileAuth, draftOrderController.createDraftOrder);

// Vaqtinchalik buyurtmani yangilash
router.put('/drafts/:id', draftOrderController.updateDraftOrder);

// Vaqtinchalik buyurtmani o'chirish
router.delete('/drafts/:id', draftOrderController.deleteDraftOrder);

// Vaqtinchalik buyurtmani tasdiqlash (seller uchun)
router.post('/drafts/:id/confirm', sellerMobileAuth, draftOrderController.confirmDraftOrder);

module.exports = router;
