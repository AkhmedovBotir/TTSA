const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const ShopOwner = require('../models/ShopOwner');

// Do'kon yaratish
const createShop = async (req, res) => {
    try {
        console.log('Creating shop with data:', { body: req.body, user: req.user });
        
        const { name, ownerId, phone, address, inn } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shops'))) {
            console.log('User does not have permission to create shop');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon yaratish huquqi yo'q"
            });
        }

        // ownerId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri do'kon egasi ID formati. Iltimos, ro'yxatdan do'kon egasini tanlang"
            });
        }

        // Do'kon egasini tekshirish
        const owner = await ShopOwner.findById(ownerId);
        if (!owner) {
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        // Do'kon egasining statusini tekshirish
        if (owner.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Do'kon egasi faol emas"
            });
        }

        // Telefon raqam validatsiyasi
        if (!/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // INN validatsiyasi
        if (!/^\d{9}$/.test(inn)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri STIR (INN) raqami formati. Faqat 9 ta raqam kiritilishi kerak"
            });
        }

        // INN validatsiyasi
        if (!inn) {
            return res.status(400).json({
                success: false,
                message: "STIR (INN) raqami kiritilishi shart"
            });
        }

        if (!/^\d{9}$/.test(inn)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri STIR (INN) raqami formati. Faqat 9 ta raqam kiritilishi kerak"
            });
        }

        // Manzil validatsiyasi
        if (!address || address.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Manzil kamida 10 ta belgidan iborat bo'lishi kerak"
            });
        }

        // INN band emasligini tekshirish
        const existingShop = await Shop.findOne({ inn });
        if (existingShop) {
            return res.status(400).json({
                success: false,
                message: "Bu STIR (INN) raqami bilan ro'yxatdan o'tilgan"
            });
        }

        // Do'kon yaratish
        const shop = new Shop({
            name,
            owner: ownerId,
            phone,
            inn,
            address,
            createdBy: req.user._id
        });
        
        console.log('Creating shop with data:', { 
            name, 
            ownerId, 
            phone, 
            inn, 
            address, 
            createdBy: req.user._id 
        });

        await shop.save();

        // Do'kon ma'lumotlarini owner bilan birga qaytarish
        const populatedShop = await Shop.findById(shop._id)
            .populate('owner', 'name phone username')
            .populate('createdBy', 'username fullname');

        res.status(201).json({
            success: true,
            message: "Do'kon muvaffaqiyatli yaratildi",
            shop: {
                id: populatedShop._id,
                name: populatedShop.name,
                owner: populatedShop.owner,
                phone: populatedShop.phone,
                address: populatedShop.address,
                status: populatedShop.status,

                createdBy: populatedShop.createdBy,
                createdAt: populatedShop.createdAt
            }
        });

    } catch (error) {
        console.error('Shop creation error:', error);
        
        if (error.code === 11000) {
            // Duplicate key error
            if (error.keyPattern.phone) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam boshqa do'konga biriktirilgan"
                });
            }
            if (error.keyPattern.name && error.keyPattern.address) {
                return res.status(400).json({
                    success: false,
                    message: "Bu manzilda bunday nomli do'kon mavjud"
                });
            }
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join('. ')
            });
        }

        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Barcha do'konlarni olish
const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.find()
            .populate('owner', 'name phone username')
            .populate('createdBy', 'username fullname')
            .sort('-createdAt');

        res.json({
            success: true,
            count: shops.length,
            shops: shops.map(shop => ({
                id: shop._id,
                name: shop.name,
                owner: shop.owner,
                phone: shop.phone,
                address: shop.address,
                status: shop.status,
                createdBy: shop.createdBy,
                createdAt: shop.createdAt
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Do'konni o'chirish
const deleteShop = async (req, res) => {
    try {
        console.log('Deleting shop:', { shopId: req.params.shopId, user: req.user });
        const { shopId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shops'))) {
            console.log('User does not have permission to delete shop');
            return res.status(403).json({
                success: false,
                message: "Sizda do'konni o'chirish huquqi yo'q"
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

        // Do'konni o'chirish
        await Shop.findByIdAndDelete(shopId);

        res.status(200).json({
            success: true,
            message: "Do'kon muvaffaqiyatli o'chirildi"
        });

    } catch (error) {
        console.error('Shop deletion error:', error);
        res.status(500).json({
            success: false,
            message: "Do'konni o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon statusini o'zgartirish
const updateShopStatus = async (req, res) => {
    try {
        console.log('Updating shop status:', { shopId: req.params.shopId, status: req.body.status, user: req.user });
        const { shopId } = req.params;
        const { status } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shops'))) {
            console.log('User does not have permission to update shop status');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon statusini o'zgartirish huquqi yo'q"
            });
        }

        // shopId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri do'kon ID formati"
            });
        }

        // Status validatsiyasi
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status 'active' yoki 'inactive' bo'lishi kerak"
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

        // Statusni yangilash
        shop.status = status;
        await shop.save();

        res.status(200).json({
            success: true,
            message: "Do'kon statusi muvaffaqiyatli o'zgartirildi",
            shop: {
                id: shop._id,
                name: shop.name,
                status: shop.status
            }
        });

    } catch (error) {
        console.error('Shop status update error:', error);
        res.status(500).json({
            success: false,
            message: "Do'kon statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Bitta do'konni olish
const getShopById = async (req, res) => {
    try {
        console.log('Fetching shop by id:', { shopId: req.params.shopId, user: req.user });
        const { shopId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('view_shops'))) {
            console.log('User does not have permission to view shop');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon ma'lumotlarini ko'rish huquqi yo'q"
            });
        }

        // shopId validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri do'kon ID formati"
            });
        }

        // Do'konni topish va owner/createdBy ma'lumotlarini populate qilish
        const shop = await Shop.findById(shopId)
            .populate('owner', 'name phone username')
            .populate('createdBy', 'username fullname');

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Do'kon topilmadi"
            });
        }

        res.status(200).json({
            success: true,
            shop: {
                id: shop._id,
                name: shop.name,
                owner: shop.owner,
                phone: shop.phone,
                inn: shop.inn,
                address: shop.address,
                status: shop.status,
                createdBy: shop.createdBy,
                createdAt: shop.createdAt
            }
        });
    } catch (error) {
        console.error('Get shop error:', error);
        res.status(500).json({
            success: false,
            message: "Do'kon ma'lumotlarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'konni o'zgartirish
const updateShop = async (req, res) => {
    try {
        console.log('Updating shop:', { shopId: req.params.shopId, body: req.body, user: req.user });
        const { shopId } = req.params;
        const { name, ownerId, phone, address, inn, status } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shops'))) {
            console.log('User does not have permission to update shop');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon ma'lumotlarini o'zgartirish huquqi yo'q"
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

        // ownerId validatsiyasi
        if (ownerId) {
            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri do'kon egasi ID formati"
                });
            }

            // Do'kon egasini tekshirish
            const owner = await ShopOwner.findById(ownerId);
            if (!owner) {
                return res.status(404).json({
                    success: false,
                    message: "Do'kon egasi topilmadi"
                });
            }

            // Do'kon egasining statusini tekshirish
            if (owner.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: "Do'kon egasi faol emas"
                });
            }
        }

        // Telefon raqam validatsiyasi
        if (phone && !/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // INN validatsiyasi
        if (inn !== undefined) {
            if (!inn) {
                return res.status(400).json({
                    success: false,
                    message: "STIR (INN) raqami bo'sh bo'lishi mumkin emas"
                });
            }
            
            if (!/^\d{9}$/.test(inn)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri STIR (INN) raqami formati. Faqat 9 ta raqam kiritilishi kerak"
                });
            }

            // INN band emasligini tekshirish (faqat yangi INN kiritilgan bo'lsa)
            if (inn !== shop.inn) {
                const existingShop = await Shop.findOne({ inn });
                if (existingShop) {
                    return res.status(400).json({
                        success: false,
                        message: "Bu STIR (INN) raqami bilan boshqa do'kon ro'yxatdan o'tgan"
                    });
                }
            }
        }

        // Manzil validatsiyasi
        if (address && address.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Manzil kamida 10 ta belgidan iborat bo'lishi kerak"
            });
        }

        

        // Do'konni yangilash
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (ownerId !== undefined) updateData.owner = ownerId;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (inn !== undefined) updateData.inn = inn;
        if (status !== undefined) updateData.status = status;
        updateData.updatedAt = new Date();

        // Faqat o'zgartirilgan maydonlarni yangilash
        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            { $set: updateData },
            { new: true, runValidators: true }
        )
        .populate('owner', 'name phone username')
        .populate('createdBy', 'username fullname');

        if (!updatedShop) {
            return res.status(404).json({
                success: false,
                message: "Do'kon yangilashda xatolik yuz berdi"
            });
        }

        res.status(200).json({
            success: true,
            message: "Do'kon muvaffaqiyatli yangilandi",
            shop: {
                id: updatedShop._id,
                name: updatedShop.name,
                owner: updatedShop.owner,
                phone: updatedShop.phone,
                address: updatedShop.address,
                status: updatedShop.status,
                createdBy: updatedShop.createdBy,
                createdAt: updatedShop.createdAt
            }
        });

    } catch (error) {
        console.error('Shop update error:', error);
        res.status(500).json({
            success: false,
            message: "Do'konni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createShop,
    getAllShops,
    deleteShop,
    updateShopStatus,
    getShopById,
    updateShop
};
