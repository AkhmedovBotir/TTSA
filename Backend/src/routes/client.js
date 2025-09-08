const express = require('express');
const router = express.Router();
const { 
    login, 
    register, 
    verifySMS, 
    getProfile, 
    updateProfile, 
    updateProfileImage, 
    changePassword, 
    logout 
} = require('../controllers/clientController');
const clientAuth = require('../middleware/clientAuth');

// Public routes
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.post('/verify-sms', clientAuth, verifySMS);
router.get('/profile', clientAuth, getProfile);
router.put('/profile', clientAuth, updateProfile);
router.post('/profile/image', clientAuth, updateProfileImage);
router.put('/change-password', clientAuth, changePassword);
router.post('/logout', clientAuth, logout);

module.exports = router; 