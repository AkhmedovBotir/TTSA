const express = require('express');
const router = express.Router();
const { 
    login, 
    createAdmin, 
    getAllAdmins, 
    getAdminById, 
    updateAdmin, 
    deleteAdmin,
    getAdminInstallmentPayments,
    getAdminInstallmentStats,
    processInstallmentPayment,
    cancelInstallmentPayment,
    // Seller management
    createSeller,
    getAllSellers,
    getSellerById,
    updateSeller,
    updateSellerStatus,
    updateSellerPassword,
    deleteSeller,
    // Agent management
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    updateAgentStatus,
    deleteAgent,
    // Statistics
    getAdminStatistics,
    // Region management
    createRegion,
    getAllRegions,
    deleteRegion,
    // Seller shop assignment
    assignShopToSeller,
    removeShopFromSeller,
    // Seller service areas
    assignServiceAreasToSeller,
    // Payment schedule management
    getPaymentSchedules,
    confirmPaymentSchedule,
    rejectPaymentSchedule,
    // Interest rate management
    createOrUpdateInterestRate,
    getAllInterestRates,
    getActiveInterestRates,
    updateInterestRateStatus,
    deleteInterestRate,
    initializeDefaultInterestRates,
    // Notification management
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    sendNotification,
    scheduleNotification,
    getNotificationStats,
    getUserNotifications,
    markNotificationAsRead
} = require('../controllers/adminController');
const { getAdminOrderHistory } = require('../controllers/orderHistoryController');
const auth = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Protected routes (faqat admin uchun)
router.use(auth);

// Muddatli to'lovlar bo'limi (BU YERDA BO'LISHI KERAK!)
router.get('/installment-payments', getAdminInstallmentPayments);
router.get('/installment-payments/stats', getAdminInstallmentStats);
router.patch('/installment-payments/:installmentId/process', processInstallmentPayment);
router.patch('/installment-payments/:installmentId/cancel', cancelInstallmentPayment);

// Admin boshqaruvi
router.post('/create', createAdmin);
router.get('/list', getAllAdmins);

// Buyurtmalar bo'limi
router.get('/orders/history', getAdminOrderHistory);

// Statistika
router.get('/statistics', getAdminStatistics);

// Seller boshqaruvi
router.post('/sellers/create', createSeller);
router.get('/sellers/list', getAllSellers);
router.get('/sellers/:sellerId', getSellerById);
router.put('/sellers/:sellerId', updateSeller);
router.patch('/sellers/:sellerId/status', updateSellerStatus);
router.patch('/sellers/:sellerId/password', updateSellerPassword);
router.delete('/sellers/:sellerId', deleteSeller);

// Agent boshqaruvi
router.post('/agents/create', createAgent);
router.get('/agents/list', getAllAgents);
router.get('/agents/:agentId', getAgentById);
router.put('/agents/:agentId', updateAgent);
router.patch('/agents/:agentId/status', updateAgentStatus);
router.delete('/agents/:agentId', deleteAgent);

// Region boshqaruvi
router.post('/regions/create', createRegion);
router.get('/regions/list', getAllRegions);
router.delete('/regions/:regionId', deleteRegion);

// Seller shop assignment
router.post('/sellers/:sellerId/assign-shop', assignShopToSeller);
router.delete('/sellers/:sellerId/shops/:shopId', removeShopFromSeller);

// Seller service areas
router.post('/sellers/:sellerId/service-areas', assignServiceAreasToSeller);

// Payment schedule management
router.get('/payment-schedules', getPaymentSchedules);
router.patch('/payment-schedules/:scheduleId/confirm', confirmPaymentSchedule);
router.patch('/payment-schedules/:scheduleId/reject', rejectPaymentSchedule);

// Interest rate management
router.post('/interest-rates', createOrUpdateInterestRate);
router.get('/interest-rates', getAllInterestRates);
router.get('/interest-rates/active', getActiveInterestRates);
router.put('/interest-rates/:id', createOrUpdateInterestRate);
router.patch('/interest-rates/:id/status', updateInterestRateStatus);
router.delete('/interest-rates/:id', deleteInterestRate);
router.post('/interest-rates/initialize-defaults', initializeDefaultInterestRates);

// Notification management
router.post('/notifications', createNotification);
router.get('/notifications', getAllNotifications);
router.get('/notifications/stats', getNotificationStats);
router.get('/notifications/:id', getNotificationById);
router.put('/notifications/:id', updateNotification);
router.delete('/notifications/:id', deleteNotification);
router.post('/notifications/:id/send', sendNotification);
router.post('/notifications/:id/schedule', scheduleNotification);
router.get('/notifications/user/:userId', getUserNotifications);
router.post('/notifications/mark-read', markNotificationAsRead);

// Admin boshqaruvi (ID bilan) - MUST BE AFTER SPECIFIC ROUTES
router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;
