const Agent = require('../models/Agent');
const mongoose = require('mongoose');

// Agent yaratish
const createAgent = async (req, res) => {
    try {
        const { fullname, phone, passport, password } = req.body;

        if (!fullname || !phone || !passport || !password) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        if (!/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Unikal tekshiruv
        const existingPhone = await Agent.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam allaqachon mavjud"
            });
        }
        const existingPassport = await Agent.findOne({ passport });
        if (existingPassport) {
            return res.status(400).json({
                success: false,
                message: "Bu passport seriyasi allaqachon mavjud"
            });
        }

        const agent = new Agent({ fullname, phone, passport, password });
        await agent.save();

        res.status(201).json({
            success: true,
            message: "Agent muvaffaqiyatli yaratildi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agent yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Barcha agentlar
const getAllAgents = async (req, res) => {
    try {
        const agents = await Agent.find({}, '-password -__v').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: agents.length,
            agents: agents.map(agent => ({
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agentlar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Bitta agent
const getAgentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(id, '-password -__v');
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        res.json({
            success: true,
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agentni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Agent yangilash
const updateAgent = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, phone, passport, password } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        // Telefon va passport unikal tekshiruv (agar o'zgarsa)
        if (phone && phone !== agent.phone) {
            if (!/^\+998[0-9]{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                });
            }
            const existingPhone = await Agent.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam allaqachon mavjud"
                });
            }
            agent.phone = phone;
        }
        if (passport && passport !== agent.passport) {
            const existingPassport = await Agent.findOne({ passport });
            if (existingPassport) {
                return res.status(400).json({
                    success: false,
                    message: "Bu passport seriyasi allaqachon mavjud"
                });
            }
            agent.passport = passport;
        }
        if (fullname) agent.fullname = fullname;
        if (password) agent.password = password;
        await agent.save();
        res.json({
            success: true,
            message: "Agent ma'lumotlari muvaffaqiyatli yangilandi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agentni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Agentni o'chirish
const deleteAgent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        await agent.deleteOne();
        res.json({
            success: true,
            message: "Agent muvaffaqiyatli o'chirildi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agentni o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Agent statusini o'zgartirish
const updateAgentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['active', 'inactive', 'blocked'];
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status",
                validStatuses
            });
        }
        const agent = await Agent.findById(id);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        agent.status = status;
        await agent.save();
        res.json({
            success: true,
            message: "Agent statusi muvaffaqiyatli o'zgartirildi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Agent statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    deleteAgent,
    updateAgentStatus
}; 