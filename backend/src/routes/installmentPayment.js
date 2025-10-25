const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    createInstallmentOrder,
    getSellerInstallments,
    getInstallmentById,
    recordPayment,
    cancelInstallment,
    getInstallmentStats
} = require('../controllers/installmentPaymentController');

// Use seller authentication middleware
const sellerMobileAuth = require('../middleware/sellerMobileAuth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only images
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

// All routes require authentication
router.use(sellerMobileAuth);

// Create new installment order with image upload
router.post('/create', upload.single('image'), createInstallmentOrder);

// Get seller's installment payments
router.get('/list', getSellerInstallments);

// Get installment by ID
router.get('/:installmentId', getInstallmentById);

// Record a payment
router.post('/:installmentId/payment', recordPayment);

// Cancel installment
router.patch('/:installmentId/cancel', cancelInstallment);

// Get installment statistics
router.get('/stats/overview', getInstallmentStats);

module.exports = router;
