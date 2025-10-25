const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

const userMobileAuth = async (req, res, next) => {
    try {
        // Token mavjudligini tekshirish
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Avtorizatsiya tokeni topilmadi'
            });
        }

        // Tokenni ajratib olish va tekshirish
        const token = authHeader.replace('Bearer ', '').trim();
        
        let user = null;

        try {
            // JWT_SECRET mavjudligini tekshirish
            if (!process.env.JWT_SECRET) {
                console.error('JWT_SECRET environment variable is not set!');
                return res.status(500).json({
                    success: false,
                    message: 'Server konfiguratsiya xatosi'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // User ID ni olish
            const userId = decoded.userId || decoded.id || decoded._id;
            
            if (!userId) {
                console.error('No user ID found in token');
                throw new Error('Invalid token: No user ID found');
            }

            // Faqat user role ni tekshirish
            if (decoded.role !== 'user') {
                return res.status(401).json({
                    success: false,
                    message: 'Noto\'g\'ri foydalanuvchi turi'
                });
            }

            // Userni bazadan topish
            user = await Client.findById(userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Foydalanuvchi topilmadi'
                });
            }

            // User faollik holatini tekshirish
            if (!user.isVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Sizning akkauntingiz hali tasdiqlanmagan'
                });
            }

            // Foydalanuvchi ma'lumotlarini request ga qo'shish
            req.user = user.toObject();
            req.user.userId = user._id; // userId ni qo'shish
            req.user.role = 'user';
            req.token = token;
            
            next();
        } catch (error) {
            console.error('Token tekshirishda xatolik:', error);
            return res.status(401).json({
                success: false,
                message: 'Yaroqsiz token'
            });
        }
    } catch (error) {
        console.error('User mobile auth middleware xatosi:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

module.exports = userMobileAuth; 