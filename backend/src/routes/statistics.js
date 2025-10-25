const express = require('express');
const router = express.Router();
const { 
    getDashboardStatistics,
    getSellerStatistics,
    getWarehouseStatistics,
    getSalesStatistics,
    getDailyStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics
} = require('../controllers/statisticsController');
const shopOwnerMobileAuth = require('../middleware/shopOwnerMobileAuth');

// Protected routes for statistics
router.get('/dashboard', shopOwnerMobileAuth, getDashboardStatistics);
router.get('/sellers', shopOwnerMobileAuth, getSellerStatistics);
router.get('/warehouse', shopOwnerMobileAuth, getWarehouseStatistics);
router.get('/sales', shopOwnerMobileAuth, getSalesStatistics);
router.get('/daily', shopOwnerMobileAuth, getDailyStatistics);
router.get('/weekly', shopOwnerMobileAuth, getWeeklyStatistics);
router.get('/monthly', shopOwnerMobileAuth, getMonthlyStatistics);

module.exports = router;
