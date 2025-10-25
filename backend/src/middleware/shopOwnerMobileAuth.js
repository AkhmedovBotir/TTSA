const jwt = require('jsonwebtoken');
const ShopOwner = require('../models/ShopOwner');

const shopOwnerMobileAuth = async (req, res, next) => {
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
        
        // Find shop owner
        const shopOwner = await ShopOwner.findOne({
            _id: decoded.id,
            status: 'active'
        });

        if (!shopOwner) {
            return res.status(401).json({
                success: false,
                message: 'Foydalanuvchi topilmadi yoki faol emas'
            });
        }

        // Add shop owner to request
        req.shopOwner = shopOwner;
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

module.exports = shopOwnerMobileAuth;
