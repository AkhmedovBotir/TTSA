const mongoose = require('mongoose');
const Seller = require('../models/Seller');
const Shop = require('../models/Shop');

// Sotuvchi qo'shish
const createSeller = async (req, res) => {
    try {
        const { fullName, username, password, phone, shopId } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchi qo'shish huquqi yo'q"
            });
        }

        // shopId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri do'kon ID formati"
            });
        }

        // Do'konni tekshirish
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Do'kon topilmadi"
            });
        }

        // Do'kon statusini tekshirish
        if (shop.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Do'kon faol emas"
            });
        }

        // Username uniqueligini tekshirish
        const existingUsername = await Seller.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: "Bu username band"
            });
        }

        // Telefon raqam uniqueligini tekshirish
        const existingPhone = await Seller.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam band"
            });
        }

        // Sotuvchi yaratish
        const seller = new Seller({
            fullName,
            username,
            password,
            phone,
            shop: shopId,
            createdBy: req.admin._id,
            createdByType: 'Admin'
        });

        await seller.save();

        // Sotuvchi ma'lumotlarini do'kon va admin bilan birga qaytarish
        const populatedSeller = await Seller.findById(seller._id)
            .populate('shop', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname',
                model: seller.createdByType
            });

        res.status(201).json({
            success: true,
            message: "Sotuvchi muvaffaqiyatli qo'shildi",
            seller: populatedSeller
        });

    } catch (error) {
        console.error('Seller creation error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi qo'shishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Sotuvchilar ro'yxatini olish
const getAllSellers = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchilar ro'yxatini ko'rish huquqi yo'q"
            });
        }

        // Query parametrlarini olish
        const { shopId, status, search } = req.query;
        const query = {};

        // Do'kon bo'yicha filtrlash
        if (shopId) {
            if (!mongoose.Types.ObjectId.isValid(shopId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri do'kon ID formati"
                });
            }
            query.shop = shopId;
        }

        // Status bo'yicha filtrlash
        if (status && ['active', 'inactive'].includes(status)) {
            query.status = status;
        }

        // Qidiruv
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Sotuvchilarni olish
        const sellers = await Seller.find(query)
            .populate('shop', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: sellers.length,
            sellers: sellers.map(seller => ({
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                shop: seller.shop,
                status: seller.status,
                createdBy: seller.createdBy,
                createdAt: seller.createdAt
            }))
        });

    } catch (error) {
        console.error('Get sellers error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchilar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Sotuvchi statusini o'zgartirish
const updateSellerStatus = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { status } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchi statusini o'zgartirish huquqi yo'q"
            });
        }

        // Status validatsiyasi
        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status. Status 'active' yoki 'inactive' bo'lishi kerak"
            });
        }

        // sellerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sotuvchi ID formati"
            });
        }

        // Sotuvchini tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Sotuvchi topilmadi"
            });
        }

        // Statusni o'zgartirish
        seller.status = status;
        await seller.save();

        // Yangilangan sotuvchi ma'lumotlarini qaytarish
        const updatedSeller = await Seller.findById(sellerId)
            .populate('shop', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname'
            });

        res.status(200).json({
            success: true,
            message: "Sotuvchi statusi muvaffaqiyatli o'zgartirildi",
            seller: {
                id: updatedSeller._id,
                fullName: updatedSeller.fullName,
                username: updatedSeller.username,
                phone: updatedSeller.phone,
                shop: updatedSeller.shop,
                status: updatedSeller.status,
                createdBy: updatedSeller.createdBy,
                createdAt: updatedSeller.createdAt
            }
        });

    } catch (error) {
        console.error('Seller status update error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Sotuvchini tahrirlash
const updateSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { fullName, username, phone, shopId } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchini tahrirlash huquqi yo'q"
            });
        }

        // sellerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sotuvchi ID formati"
            });
        }

        // Sotuvchini tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Sotuvchi topilmadi"
            });
        }

        // Do'konni tekshirish
        if (shopId) {
            if (!mongoose.Types.ObjectId.isValid(shopId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri do'kon ID formati"
                });
            }

            const shop = await Shop.findById(shopId);
            if (!shop) {
                return res.status(404).json({
                    success: false,
                    message: "Do'kon topilmadi"
                });
            }

            // Do'kon statusini tekshirish
            if (shop.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon faol emas"
                });
            }
        }

        // Telefon raqam validatsiyasi
        if (phone) {
            if (!/^\+998[0-9]{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                });
            }

            // Telefon raqam uniqueligini tekshirish
            const existingPhone = await Seller.findOne({ phone, _id: { $ne: sellerId } });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam band"
                });
            }
        }

        // Username validatsiyasi
        if (username) {
            if (username.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "Username kamida 3 ta belgidan iborat bo'lishi kerak"
                });
            }

            // Username uniqueligini tekshirish
            const existingUsername = await Seller.findOne({ username, _id: { $ne: sellerId } });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Bu username band"
                });
            }
        }

        // Ismni tekshirish
        if (fullName && fullName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Ma'lumotlarni yangilash
        if (fullName) seller.fullName = fullName;
        if (username) seller.username = username;
        if (phone) seller.phone = phone;
        if (shopId) seller.shop = shopId;

        await seller.save();

        // Yangilangan sotuvchi ma'lumotlarini qaytarish
        const updatedSeller = await Seller.findById(sellerId)
            .populate('shop', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname'
            });

        res.status(200).json({
            success: true,
            message: "Sotuvchi muvaffaqiyatli tahrirlandi",
            seller: {
                id: updatedSeller._id,
                fullName: updatedSeller.fullName,
                username: updatedSeller.username,
                phone: updatedSeller.phone,
                shop: updatedSeller.shop,
                status: updatedSeller.status,
                createdBy: updatedSeller.createdBy,
                createdAt: updatedSeller.createdAt
            }
        });

    } catch (error) {
        console.error('Seller update error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchini tahrirlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Sotuvchi parolini o'zgartirish
const updateSellerPassword = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { password } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchi parolini o'zgartirish huquqi yo'q"
            });
        }

        // Password validatsiyasi
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // sellerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sotuvchi ID formati"
            });
        }

        // Sotuvchini tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Sotuvchi topilmadi"
            });
        }

        // Parolni yangilash
        seller.password = password;
        await seller.save();

        res.status(200).json({
            success: true,
            message: "Sotuvchi paroli muvaffaqiyatli o'zgartirildi"
        });

    } catch (error) {
        console.error('Seller password update error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi parolini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Bitta sotuvchini olish
const getSellerById = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchi ma'lumotlarini ko'rish huquqi yo'q"
            });
        }

        // sellerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sotuvchi ID formati"
            });
        }

        // Sotuvchini olish
        const seller = await Seller.findById(sellerId)
            .populate('shop', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname'
            });

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Sotuvchi topilmadi"
            });
        }

        res.status(200).json({
            success: true,
            seller: {
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                shop: seller.shop,
                status: seller.status,
                createdBy: seller.createdBy,
                createdAt: seller.createdAt
            }
        });

    } catch (error) {
        console.error('Get seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi ma'lumotlarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Sotuvchini o'chirish
const deleteSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.admin || (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchini o'chirish huquqi yo'q"
            });
        }

        // sellerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri sotuvchi ID formati"
            });
        }

        // Sotuvchini tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Sotuvchi topilmadi"
            });
        }

        // Sotuvchini o'chirish
        await Seller.findByIdAndDelete(sellerId);

        res.status(200).json({
            success: true,
            message: "Sotuvchi muvaffaqiyatli o'chirildi"
        });

    } catch (error) {
        console.error('Delete seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchini o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createSeller,
    getAllSellers,
    updateSellerStatus,
    updateSeller,
    updateSellerPassword,
    getSellerById,
    deleteSeller
};
