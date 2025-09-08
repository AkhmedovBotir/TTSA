const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Seller = require('../models/Seller');
const Agent = require('../models/Agent');

const auth = async (req, res, next) => {
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
        let userType = null;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', JSON.stringify(decoded, null, 2));
            
            // Admin, Seller yoki Agent ekanligini tekshirish
            console.log('Decoded token data:', JSON.stringify(decoded, null, 2));
            
            // Get the ID from the token (it could be in 'id' or '_id' field)
            const userId = decoded.id || decoded._id;
            
            if (!userId) {
                console.error('No user ID found in token');
                throw new Error('Invalid token: No user ID found');
            }

            if (decoded.role === 'admin' || decoded.role === 'general') {
                user = await Admin.findById(userId);
                userType = decoded.role;
            } else if (decoded.role === 'seller') {
                user = await Seller.findById(userId);
                userType = 'seller';
            } else if (decoded.role === 'agent') {
                console.log('Looking for agent with ID:', userId);
                user = await Agent.findById(userId);
                console.log('Found agent:', user ? 'Yes' : 'No');
                userType = 'agent';
            }

            if (!user) {
                console.log('User not found in database for token:', { 
                    role: decoded.role, 
                    _id: decoded._id, 
                    id: decoded.id,
                    username: decoded.username
                });
                return res.status(401).json({
                    success: false,
                    message: 'Foydalanuvchi topilmadi',
                    debug: process.env.NODE_ENV === 'development' ? {
                        decodedToken: decoded
                    } : undefined
                });
            }

            // Adminlar uchun faollik holatini tekshirish
            if ((userType === 'admin' || userType === 'general') && user.status !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: 'Sizning akkauntingiz bloklangan yoki faol emas'
                });
            }

            // Foydalanuvchi ma'lumotlarini request ga qo'shish
            req.user = user.toObject();
            req.user.role = userType;
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
        console.error('Auth middleware xatosi:', error);
        return res.status(500).json({
            success: false,
            message: 'Server xatosi. Iltimos, keyinroq urinib ko\'ring.'
        });
    }
};

module.exports = auth;
