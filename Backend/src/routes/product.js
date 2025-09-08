const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Multer konfiguratsiyasi
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Faqat rasm fayllarini qabul qilish
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Faqat rasm fayllari yuklanishi mumkin!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// Mahsulot yaratish (rasm bilan)
router.post('/create', auth, upload.single('image'), createProduct);
// Barcha mahsulotlar
router.get('/list', auth, getAllProducts);
// Bitta mahsulot
router.get('/:id', auth, getProductById);
// Yangilash (rasm bilan)
router.put('/:id', auth, upload.single('image'), updateProduct);
// O'chirish
router.delete('/:id', auth, deleteProduct);

module.exports = router; 