const ShopOwner = require('../models/ShopOwner');

// Do'kon egasi autentifikatsiyasi
const shopOwnerAuth = async (req, res, next) => {
    try {
        // Token orqali do'kon egasini topish
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token topilmadi. Iltimos, tizimga kiring.'
            });
        }

        const shopOwner = await ShopOwner.findOne({
            'tokens.token': token,
            status: 'active'
        });

        if (!shopOwner) {
            return res.status(401).json({
                success: false,
                message: 'Yaroqsiz token yoki foydalanuvchi topilmadi'
            });
        }

        req.shopOwner = shopOwner;
        next();

    } catch (error) {
        console.error('Shop owner auth error:', error);
        res.status(401).json({
            success: false,
            message: 'Autentifikatsiya xatosi',
            error: error.message
        });
    }
};

module.exports = shopOwnerAuth;
