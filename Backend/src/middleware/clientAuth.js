const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

const clientAuth = async (req, res, next) => {
    try {
        // Token mavjudligini tekshirish
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: "Token topilmadi" 
            });
        }

        // Tokenni ajratib olish va tekshirish
        const token = authHeader.replace('Bearer ', '').trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Client ma'lumotlarini bazadan olish
        const client = await Client.findById(decoded._id);
        if (!client) {
            return res.status(401).json({ 
                success: false,
                message: "Client topilmadi" 
            });
        }

        // Client ma'lumotlarini request ga qo'shish
        req.client = client;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Client auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: "Avtorizatsiyadan o'tilmagan" 
        });
    }
};

module.exports = clientAuth; 