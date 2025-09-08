const express = require('express');
const router = express.Router();
const { getDashboardStatistics } = require('../controllers/statisticsController');
const shopOwnerMobileAuth = require('../middleware/shopOwnerMobileAuth');

// Protected route for dashboard statistics
router.get('/dashboard', shopOwnerMobileAuth, getDashboardStatistics);

module.exports = router;
