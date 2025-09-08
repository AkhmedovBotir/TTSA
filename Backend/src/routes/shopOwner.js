const express = require('express');
const router = express.Router();
const { 
    createShopOwner, 
    loginShopOwner, 
    getAllShopOwners,
    updateShopOwnerPermissions,
    getAvailablePermissions,
    updateShopOwner,
    getShopOwner,
    updateShopOwnerStatus,
    deleteShopOwner
} = require('../controllers/shopOwnerController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', loginShopOwner);

// Protected routes (faqat admin uchun)
router.post('/create', auth, createShopOwner);
router.get('/list', auth, getAllShopOwners);
router.put('/:id/permissions', auth, updateShopOwnerPermissions);
router.get('/permissions', getAvailablePermissions);
router.put('/:id', auth, updateShopOwner);
router.get('/:id', auth, getShopOwner);
router.put('/:id/status', auth, updateShopOwnerStatus);
router.delete('/:id', auth, deleteShopOwner);

module.exports = router;
