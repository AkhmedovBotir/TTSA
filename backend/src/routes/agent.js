const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
    updateAgentStatus
} = require('../controllers/agentController');

// Agent yaratish
router.post('/create', auth, createAgent);
// Barcha agentlar
router.get('/list', getAllAgents);
// Bitta agent
router.get('/:id', auth, getAgentById);
// Yangilash
router.put('/:id', auth, updateAgent);
// O'chirish
router.delete('/:id', auth, deleteAgent);
// Statusni o'zgartirish
router.put('/:id/status', auth, updateAgentStatus);

module.exports = router; 