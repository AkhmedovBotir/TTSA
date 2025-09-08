const express = require('express');
const router = express.Router();
const { login, createAdmin, getAllAdmins, getAdminById, updateAdmin, deleteAdmin, getAdminInstallmentPayments, getAdminInstallmentStats } = require('../controllers/adminController');
const { getAdminOrderHistory } = require('../controllers/orderHistoryController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes (faqat admin uchun)
router.use(auth);

// Muddatli to'lovlar bo'limi (BU YERDA BO'LISHI KERAK!)
router.get('/installment-payments', getAdminInstallmentPayments);
router.get('/installment-payments/stats', getAdminInstallmentStats);

// Admin boshqaruvi
router.post('/create', createAdmin);
router.get('/list', getAllAdmins);
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

// Buyurtmalar bo'limi
router.get('/orders/history', getAdminOrderHistory);


// Admin boshqaruvi (ID bilan) - ENGASTDA BO'LISHI KERAK!
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;
