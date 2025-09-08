const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentMobileController');
const auth = require('../middleware/auth');

// Public routes (no auth required)
router.post('/login', agentController.login);

// Apply auth middleware to all routes below this line
router.use(auth);

// Categories
router.get('/categories', agentController.getCategories);

// Subcategories
router.get('/categories/:categoryId/subcategories', agentController.getSubcategories);

// Products by subcategory
router.get('/subcategories/:subcategoryId/products', agentController.getProducts);

router.get('/products', agentController.getAllProducts)

// Product details
router.get('/products/:id', agentController.getProductById);

// Agent product management
router.get('/my-products', agentController.getMyProducts);
router.post('/sell-product', agentController.sellProduct);
router.get('/sales-statistics', agentController.getSalesStatistics);

module.exports = router;
