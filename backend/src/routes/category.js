const express = require('express');
const router = express.Router();
const { 
    createCategory, 
    createSubcategory,
    updateCategory, 
    updateSubcategory,
    updateCategoryStatus, 
    deleteCategory,
    deleteSubcategory,
    getAllCategories,
    getAllSubcategories 
} = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const shopOwnerAuth = require('../middleware/shopOwnerAuth');

// Middleware to check if user is either admin or shop owner
const adminOrShopOwner = async (req, res, next) => {
    // First run auth middleware
    await new Promise((resolve) => {
        auth(req, res, () => resolve());
    });

    // If user is admin, allow access
    if (req.admin) {
        return next();
    }

    // If not admin, try shop owner auth
    try {
        await new Promise((resolve, reject) => {
            shopOwnerAuth(req, res, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        return next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Sizda ushbu bo'limga kirish uchun ruxsat yo'q. Iltimos, administrator bilan bog'laning."
        });
    }
};

// Category routes
router.post('/create', adminOrShopOwner, createCategory);
router.put('/:id', adminOrShopOwner, updateCategory);
router.put('/:id/status', adminOrShopOwner, updateCategoryStatus);
router.delete('/:id', adminOrShopOwner, deleteCategory);
router.get('/list', getAllCategories);

// Subcategory routes
router.post('/subcategory/create', adminOrShopOwner, createSubcategory);
router.put('/subcategory/:id', adminOrShopOwner, updateSubcategory);
router.put('/subcategory/:id/status', adminOrShopOwner, updateCategoryStatus);
router.delete('/subcategory/:id', adminOrShopOwner, deleteSubcategory);
router.get('/subcategory/list', getAllSubcategories);

module.exports = router; 