const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

const userMobileAuth = async (req, res, next) => {
    try {
        // Token mavjudligini tekshirish
        const authHeader = req.header('Authorization');
        console.log('Auth header received:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No valid auth header found');
            return res.status(401).json({
                success: false,
                message: 'Avtorizatsiya tokeni topilmadi'
            });
        }

        // Tokenni ajratib olish va tekshirish
        const token = authHeader.replace('Bearer ', '').trim();
        console.log('Token extracted:', token.substring(0, 20) + '...');
        
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
            console.log('Decoded user token:', JSON.stringify(decoded, null, 2));
            
            // User ID ni olish
            const userId = decoded.userId || decoded.id || decoded._id;
            
            if (!userId) {
                console.error('No user ID found in token');
                throw new Error('Invalid token: No user ID found');
            }

            // Faqat user role ni tekshirish
            if (decoded.role !== 'user') {
                console.log('Invalid role in token:', decoded.role);
                return res.status(401).json({
                    success: false,
                    message: 'Noto\'g\'ri foydalanuvchi turi'
                });
            }

            // Userni bazadan topish
            user = await Client.findById(userId);
            if (!user) {
                console.log('User not found in database for token:', { 
                    role: decoded.role, 
                    _id: decoded._id, 
                    id: decoded.id,
                    phoneNumber: decoded.phoneNumber
                });
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