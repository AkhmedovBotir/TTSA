const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller');

const sellerMobileAuth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Avtorizatsiya tokeni kerak'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token is for a seller
        if (decoded.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: 'Sotuvchi uchun ruxsat yo\'q'
            });
        }
        
        // Find seller
        const seller = await Seller.findOne({
            _id: decoded.id,
            status: 'active'
        });

        if (!seller) {
            return res.status(401).json({
                success: false,
                message: 'Sotuvchi topilmadi yoki faol emas'
            });
        }

        // Add seller to request
        req.seller = seller;
        next();

    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Yaroqsiz token',
            error: error.message
        });
    }
};

module.exports = sellerMobileAuth;

