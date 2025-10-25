const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ShopOwner = require('../models/ShopOwner');
const Seller = require('../models/Seller');
const Region = require('../models/Region');
const mongoose = require('mongoose');
const { SHOP_OWNER_PERMISSIONS, STATIC_PERMISSIONS } = require('../config/permissions');

// Do'kon egasi yaratish
const createShopOwner = async (req, res) => {
    try {
        console.log('createShopOwner called with body:', req.body);
        console.log('Authenticated user:', req.user);

        // Faqat general admin va manage_shop_owners huquqi borlar yarata oladi
        if (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners')) {
            console.log('User does not have permission to create shop owner');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasini yaratish huquqi yo'q"
            });
        }

        const { name, phone, username, password, permissions = [], status = 'active' } = req.body;
        console.log('Received data:', { name, phone, username, permissions, status });

        // Asosiy maydonlar validatsiyasi
        if (!name || !phone || !username || !password) {
            console.log('Missing required fields:', { name, phone, username, password: password ? '***' : 'missing' });
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        // Username validatsiyasi
        if (username.length < 3) {
            console.log('Username too short:', username);
            return res.status(400).json({
                success: false,
                message: "Username kamida 3 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Parol validatsiyasi
        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Telefon raqam validatsiyasi
        if (!/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Status validatsiyasi
        if (!['active', 'inactive', 'blocked'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status"
            });
        }

        // Username band emasligini tekshirish
        console.log('Checking if username exists:', username);
        const existingUser = await ShopOwner.findOne({ username });
        if (existingUser) {
            console.log('Username already exists:', username);
            return res.status(400).json({
                success: false,
                message: "Bu username allaqachon band qilingan"
            });
        }

        // Telefon raqam band emasligini tekshirish
        const existingPhone = await ShopOwner.findOne({ phone });
        if (existingPhone) {
            console.log('Phone number already exists:', phone);
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam band"
            });
        }

        // Ruxsatlarni validatsiya qilish
        const shopOwner = new ShopOwner();
        const invalidPermissions = shopOwner.validatePermissions(permissions);
        if (invalidPermissions.length > 0) {
            console.log('Invalid permissions:', invalidPermissions);
            return res.status(400).json({
                success: false,
                message: `Noto'g'ri ruxsatlar: ${invalidPermissions.join(', ')}`,
                invalidPermissions
            });
        }

        // Do'kon egasini yaratish
        console.log('Creating new shop owner...');
        try {
            const newShopOwner = new ShopOwner({
                name,
                phone,
                username,
                password,
                permissions,
                status,
                createdBy: req.user._id
            });

            console.log('Saving shop owner to database...');
            const savedShopOwner = await newShopOwner.save();
            console.log('Shop owner created successfully:', savedShopOwner._id);
            
            // Javob qaytarish
            res.status(201).json({
                success: true,
                message: "Do'kon egasi muvaffaqiyatli yaratildi",
                shopOwner: {
                    _id: savedShopOwner._id,
                    name: savedShopOwner.name,
                    username: savedShopOwner.username,
                    phone: savedShopOwner.phone,
                    status: savedShopOwner.status,
                    permissions: savedShopOwner.permissions,
                    createdAt: savedShopOwner.createdAt
                }
            });
            return;
            
        } catch (saveError) {
            console.error('Error saving shop owner:', saveError);
            if (saveError.code === 11000) { // Duplicate key error
                return res.status(400).json({
                    success: false,
                    message: "Bu username yoki telefon raqam allaqachon ro'yxatdan o'tgan",
                    error: saveError.message
                });
            }
            throw saveError; // Re-throw to be caught by the outer try-catch
        }

    } catch (error) {
        console.error('Error in createShopOwner:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Do'kon egasi login
const loginShopOwner = async (req, res) => {
    try {
        const { username, phone, password } = req.body;
        if ((!username && !phone) || !password) {
            return res.status(400).json({
                success: false,
                message: "Username yoki telefon va parol kiritilishi shart"
            });
        }
        // Username yoki phone orqali topish
        const query = username ? { username } : { phone };
        const owner = await ShopOwner.findOne(query);
        if (!owner) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri username/telefon yoki parol"
            });
        }
        // Parolni tekshirish
        const isMatch = await owner.checkPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri username/telefon yoki parol"
            });
        }
        // Status tekshiruvi
        if (owner.status && owner.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: "Sizning akkauntingiz faol emas yoki bloklangan"
            });
        }
        // Token yaratish (barcha kerakli ma'lumotlar bilan)
        const token = jwt.sign(
            {
                id: owner._id,
                username: owner.username,
                phone: owner.phone,
                name: owner.name,
                status: owner.status,
                permissions: owner.permissions,
                role: 'shop-owner'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            success: true,
            token,
           
            message: "Muvaffaqiyatli login qilindi"
        });
    } catch (error) {
        console.error('Error in createShopOwner:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Barcha do'kon egalarini olish
const getAllShopOwners = async (req, res) => {
    try {
        // Check if user is authenticated
        if (req.user) {
            // If authenticated, check permissions
            if (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners')) {
                return res.status(403).json({
                    success: false,
                    message: "Sizda do'kon egalarini ko'rish huquqi yo'q"
                });
            }
            // For authenticated users with permission, return all fields except password
            var projection = { password: 0, __v: 0 };
        } else {
            // For non-authenticated users, return only basic fields
            var projection = { _id: 1, name: 1, phone: 1, status: 1 };
        }

        const shopOwners = await ShopOwner.find({}, projection)
            .populate('createdBy', 'username fullname')
            .sort({ createdAt: -1 });

        // Format response based on authentication status
        const response = {
            success: true,
            data: shopOwners.map(owner => {
                const ownerData = owner.toObject();
                
                // For non-authenticated users, only return allowed fields
                if (!req.user) {
                    return {
                        id: ownerData._id,
                        name: ownerData.name,
                        phone: ownerData.phone,
                        status: ownerData.status
                    };
                }
                
                // For authenticated users, return all allowed fields
                return {
                    id: ownerData._id,
                    name: ownerData.name,
                    phone: ownerData.phone,
                    username: ownerData.username,
                    permissions: ownerData.permissions,
                    status: ownerData.status,
                    createdBy: ownerData.createdBy,
                    createdAt: ownerData.createdAt,
                    lastLogin: ownerData.lastLogin
                };
            }),
            total: shopOwners.length,
            message: "Do'kon egalari ro'yxati muvaffaqiyatli olindi"
        };

        res.json(response);

    } catch (error) {
        console.error('Error in getAllShopOwners:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Do'kon egasi ruxsatlarini o'zgartirish
const updateShopOwnerPermissions = async (req, res) => {
    try {
        console.log('Updating shop owner permissions:', { params: req.params, body: req.body, user: req.user });
        
        const { id } = req.params;
        const { permissions } = req.body;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid shop owner ID format:', id);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners'))) {
            console.log('User does not have permission to update shop owner permissions');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasi ruxsatlarini o'zgartirish huquqi yo'q"
            });
        }

        // Permissions array tekshirish
        if (!Array.isArray(permissions)) {
            console.log('Invalid permissions format:', permissions);
            return res.status(400).json({
                success: false,
                message: "Ruxsatlar ro'yxati array ko'rinishida bo'lishi kerak"
            });
        }

        // Do'kon egasini topish
        console.log('Finding shop owner with ID:', id);
        const shopOwner = await ShopOwner.findById(id);
        if (!shopOwner) {
            console.log('Shop owner not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        // Ruxsatlarni validatsiya qilish
        console.log('Validating permissions:', permissions);
        const invalidPermissions = shopOwner.validatePermissions(permissions);
        if (invalidPermissions.length > 0) {
            console.log('Invalid permissions detected:', invalidPermissions);
            return res.status(400).json({
                success: false,
                message: `Noto'g'ri ruxsatlar: ${invalidPermissions.join(', ')}`,
                validPermissions: SHOP_OWNER_PERMISSIONS
            });
        }

        // Ruxsatlarni o'zgartirish
        console.log('Updating permissions for shop owner:', shopOwner._id);
        shopOwner.permissions = permissions;
        shopOwner.updatedAt = new Date();
        await shopOwner.save();
        
        console.log('Successfully updated permissions for shop owner:', shopOwner._id);

        res.json({
            success: true,
            message: "Do'kon egasi ruxsatlari muvaffaqiyatli o'zgartirildi",
            permissions: shopOwner.permissions,
            updatedAt: shopOwner.updatedAt
        });

    } catch (error) {
        console.error('Error in updateShopOwnerPermissions:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Mavjud ruxsatlar ro'yxatini olish
const getAvailablePermissions = async (req, res) => {
    try {
        res.json({
            success: true,
            permissions: SHOP_OWNER_PERMISSIONS,
            staticPermissions: STATIC_PERMISSIONS,
            message: "Mavjud ruxsatlar ro'yxati"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Do'kon egasini o'zgartirish
const updateShopOwner = async (req, res) => {
    try {
        console.log('Updating shop owner with data:', { params: req.params, body: req.body, user: req.user });
        
        const { id } = req.params;
        const { name, phone, username, password, status } = req.body;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid shop owner ID format:', id);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners'))) {
            console.log('User does not have permission to update shop owner');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasini o'zgartirish huquqi yo'q"
            });
        }

        // Do'kon egasini topish
        console.log('Finding shop owner with ID:', id);
        const shopOwner = await ShopOwner.findById(id);
        if (!shopOwner) {
            console.log('Shop owner not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        // Telefon raqam validatsiyasi
        if (phone && !/^\+998[0-9]{9}$/.test(phone)) {
            console.log('Invalid phone number format:', phone);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Username validatsiyasi
        if (username && username.length < 3) {
            console.log('Username too short:', username);
            return res.status(400).json({
                success: false,
                message: "Username kamida 3 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Parol validatsiyasi
        if (password && password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Status validatsiyasi
        if (status && !['active', 'inactive', 'blocked'].includes(status)) {
            console.log('Invalid status:', status);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status. Faqat 'active', 'inactive' yoki 'blocked' bo'lishi mumkin"
            });
        }

        // Username band emasligini tekshirish
        if (username && username !== shopOwner.username) {
            console.log('Checking if username is available:', username);
            const existingOwner = await ShopOwner.findOne({ username });
            if (existingOwner) {
                console.log('Username already exists:', username);
                return res.status(400).json({
                    success: false,
                    message: "Bu username band"
                });
            }
        }

        // Telefon raqam band emasligini tekshirish
        if (phone && phone !== shopOwner.phone) {
            console.log('Checking if phone is available:', phone);
            const existingPhone = await ShopOwner.findOne({ phone });
            if (existingPhone) {
                console.log('Phone number already exists:', phone);
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam band"
                });
            }
        }

        console.log('Updating shop owner with ID:', id);
        
        // Ma'lumotlarni yangilash
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (username) updateData.username = username;
        if (password) updateData.password = password;
        if (status) updateData.status = status;
        updateData.updatedAt = new Date();

        // Passwordni hashlash kerak bo'lsa
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        // Yangilash
        const updatedOwner = await ShopOwner.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -__v');

        console.log('Successfully updated shop owner:', updatedOwner._id);

        res.json({
            success: true,
            message: "Do'kon egasi muvaffaqiyatli o'zgartirildi",
            shopOwner: {
                id: updatedOwner._id,
                name: updatedOwner.name,
                phone: updatedOwner.phone,
                username: updatedOwner.username,
                permissions: updatedOwner.permissions,
                status: updatedOwner.status,
                updatedAt: updatedOwner.updatedAt
            }
        });

    } catch (error) {
        console.error('Error in updateShopOwner:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Bitta do'kon egasini olish
const getShopOwner = async (req, res) => {
    try {
        console.log('Fetching shop owner with ID:', req.params.id);
        const { id } = req.params;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid shop owner ID format:', id);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners'))) {
            console.log('User does not have permission to view shop owner');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasini ko'rish huquqi yo'q"
            });
        }

        // Do'kon egasini topish
        console.log('Searching for shop owner with ID:', id);
        const shopOwner = await ShopOwner.findById(id, '-password -__v')
            .populate('createdBy', 'username fullname')
            .lean();

        if (!shopOwner) {
            console.log('Shop owner not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        console.log('Found shop owner:', shopOwner._id);
        
        // Format the response
        const response = {
            success: true,
            shopOwner: {
                id: shopOwner._id,
                name: shopOwner.name,
                phone: shopOwner.phone,
                username: shopOwner.username,
                permissions: shopOwner.permissions || [],
                status: shopOwner.status,
                createdBy: shopOwner.createdBy,
                createdAt: shopOwner.createdAt,
                updatedAt: shopOwner.updatedAt,
                lastLogin: shopOwner.lastLogin
            },
            message: "Do'kon egasi ma'lumotlari muvaffaqiyatli olindi"
        };

        res.json(response);

    } catch (error) {
        console.error('Error in getShopOwner:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Do'kon egasi statusini o'zgartirish
const updateShopOwnerStatus = async (req, res) => {
    try {
        console.log('Updating shop owner status with data:', { params: req.params, body: req.body, user: req.user });
        
        const { id } = req.params;
        const { status } = req.body;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid ID format:', id);
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_shop_owners'))) {
            console.log('User does not have permission to update shop owner status');
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasi statusini o'zgartirish huquqi yo'q"
            });
        }

        // Status validatsiyasi
        if (!status || !['active', 'inactive', 'blocked'].includes(status)) {
            console.log('Invalid status provided:', status);
            return res.status(400).json({
                success: false,
                message: "Status 'active', 'inactive' yoki 'blocked' bo'lishi kerak"
            });
        }

        // Do'kon egasini topish
        const shopOwner = await ShopOwner.findById(id);
        if (!shopOwner) {
            console.log('Shop owner not found with ID:', id);
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        // Statusni o'zgartirish
        shopOwner.status = status;
        await shopOwner.save();
        
        console.log('Shop owner status updated successfully:', { 
            shopOwnerId: shopOwner._id, 
            newStatus: status 
        });

        res.json({
            success: true,
            message: `Do'kon egasi statusi muvaffaqiyatli ${
                status === 'active' ? "faollashtirildi" : 
                status === 'inactive' ? "nofaollashtirildi" : "bloklandi"
            }`,
            shopOwner: {
                id: shopOwner._id,
                name: shopOwner.name,
                phone: shopOwner.phone,
                username: shopOwner.username,
                permissions: shopOwner.permissions,
                status: shopOwner.status,
                updatedAt: shopOwner.updatedAt
            }
        });

    } catch (error) {
        console.error('Error in updateShopOwnerStatus:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Do'kon egasini o'chirish
const deleteShopOwner = async (req, res) => {
    try {
        const { id } = req.params;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Ruxsatlarni tekshirish
        if (req.admin.role !== 'general' && !req.admin.permissions.includes('manage_shop_owners')) {
            return res.status(403).json({
                success: false,
                message: "Sizda do'kon egasini o'chirish huquqi yo'q"
            });
        }

        // Do'kon egasini topish
        const shopOwner = await ShopOwner.findById(id);
        if (!shopOwner) {
            return res.status(404).json({
                success: false,
                message: "Do'kon egasi topilmadi"
            });
        }

        // Do'kon egasini o'chirish
        await ShopOwner.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Do'kon egasi muvaffaqiyatli o'chirildi",
            deletedShopOwner: {
                id: shopOwner._id,
                name: shopOwner.name,
                phone: shopOwner.phone,
                username: shopOwner.username
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// ==================== SELLER MANAGEMENT ====================

// Do'kon egasi tomonidan mavjud sellerlarni ko'rish
const getAvailableSellers = async (req, res) => {
    try {
        // Faqat tizimga kirgan do'kon egalari ko'ra oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda sellerlarni ko'rish huquqi yo'q"
            });
        }

        // Faqat admin tomonidan yaratilgan va hali tayinlanmagan sellerlarni olish
        const sellers = await Seller.find({
            createdByType: 'Admin',
            shopOwner: null,
            status: 'active'
        })
        .select('fullName username phone createdAt')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: sellers.length,
            sellers: sellers.map(seller => ({
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                createdAt: seller.createdAt
            }))
        });
    } catch (error) {
        console.error('Get available sellers error:', error);
        res.status(500).json({
            success: false,
            message: "Sellerlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi tomonidan sellerni tanlash (yangi usul - bir nechta do'kon egasiga)
const assignSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Faqat tizimga kirgan do'kon egalari tayinlay oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda sellerni tayinlash huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri seller ID formati"
            });
        }

        // Sellerni tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
            });
        }

        const currentUserId = req.user.id || req.user._id;

        // Seller allaqachon bu do'kon egasiga tayinlanganmi tekshirish
        const alreadyAssigned = seller.shopOwners && 
            seller.shopOwners.some(so => so.shopOwner.toString() === currentUserId.toString());

        if (alreadyAssigned) {
            return res.status(400).json({
                success: false,
                message: "Bu seller allaqachon sizga tayinlangan"
            });
        }

        // Yangi shopOwners array'ini yaratish yoki mavjud array'ga qo'shish
        if (!seller.shopOwners) {
            seller.shopOwners = [];
        }

        // Yangi tayinlash qo'shish
        seller.shopOwners.push({
            shopOwner: currentUserId,
            assignedBy: currentUserId,
            assignedAt: new Date(),
            serviceAreas: []
        });

        // Eski usulni ham saqlash (backward compatibility)
        if (!seller.shopOwner) {
            seller.shopOwner = currentUserId;
            seller.assignedBy = currentUserId;
            seller.assignedAt = new Date();
        }

        await seller.save();

        res.json({
            success: true,
            message: "Seller muvaffaqiyatli tayinlandi",
            seller: {
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                shopOwner: seller.shopOwner,
                assignedAt: seller.assignedAt,
                totalShopOwners: seller.shopOwners.length
            }
        });
    } catch (error) {
        console.error('Assign seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sellerni tayinlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi tomonidan tayinlangan sellerlarni ko'rish
const getMySellers = async (req, res) => {
    try {
        // Faqat tizimga kirgan do'kon egalari ko'ra oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda sellerlarni ko'rish huquqi yo'q"
            });
        }

        const currentUserId = req.user.id || req.user._id;
        console.log('Debug - req.user:', req.user);
        console.log('Debug - req.user.id:', req.user.id);
        console.log('Debug - req.user._id:', req.user._id);
        
        // Yangi usul: shopOwners array'ida qidirish
        const sellers = await Seller.find({
            $or: [
                { shopOwner: currentUserId }, // Eski usul
                { 'shopOwners.shopOwner': currentUserId } // Yangi usul
            ]
        })
        .populate('serviceAreas.region', 'name')
        .populate('serviceAreas.districts', 'name')
        .populate('serviceAreas.mfys', 'name')
        .populate('shopOwners.shopOwner', 'name username phone')
        .populate('shopOwners.serviceAreas.region', 'name')
        .populate('shopOwners.serviceAreas.districts', 'name')
        .populate('shopOwners.serviceAreas.mfys', 'name')
        .sort({ assignedAt: -1 });

        // Debug ma'lumotlari
        console.log('Debug - currentUserId:', currentUserId);
        console.log('Debug - sellers count:', sellers.length);
        
        const processedSellers = sellers.map(seller => {
            console.log('Debug - seller._id:', seller._id);
            console.log('Debug - seller.shopOwners:', seller.shopOwners);
            console.log('Debug - seller.serviceAreas:', seller.serviceAreas);
            
            // Bu do'kon egasiga tegishli service areas'ni topish
            const currentShopOwnerData = seller.shopOwners?.find(so => {
                const shopOwnerId = so.shopOwner._id || so.shopOwner;
                console.log('Debug - comparing shopOwnerId:', shopOwnerId.toString(), 'with currentUserId:', currentUserId.toString());
                return shopOwnerId.toString() === currentUserId.toString();
            });
            
            console.log('Debug - currentShopOwnerData:', currentShopOwnerData);
            
            const finalServiceAreas = currentShopOwnerData?.serviceAreas || seller.serviceAreas || [];
            console.log('Debug - finalServiceAreas:', finalServiceAreas);
            
            return {
                id: seller._id,
                fullName: seller.fullName,
                username: seller.username,
                phone: seller.phone,
                serviceAreas: finalServiceAreas,
                assignedAt: currentShopOwnerData?.assignedAt || seller.assignedAt,
                status: seller.status,
                totalShopOwners: seller.shopOwners?.length || 0
            };
        });

        res.json({
            success: true,
            count: sellers.length,
            sellers: processedSellers
        });
    } catch (error) {
        console.error('Get my sellers error:', error);
        res.status(500).json({
            success: false,
            message: "Sellerlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi tomonidan sellerga xizmat hududlarini belgilash
const setSellerServiceAreas = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { serviceAreas } = req.body;

        // Faqat tizimga kirgan do'kon egalari belgilay oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda xizmat hududlarini belgilash huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri seller ID formati"
            });
        }

        // Sellerni tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
            });
        }

        // Seller bu do'kon egasiga tegishlimi tekshirish (eski usul)
        const currentUserId = req.user.id || req.user._id;
        
        // Yangi usul: shopOwners array'ida tekshirish
        const isAssignedToThisShopOwner = seller.shopOwners && 
            seller.shopOwners.some(so => so.shopOwner.toString() === currentUserId.toString());
        
        // Eski usul: shopOwner field'ida tekshirish
        const isAssignedToOldWay = seller.shopOwner && 
            seller.shopOwner.toString() === currentUserId.toString();
        
        if (!isAssignedToThisShopOwner && !isAssignedToOldWay) {
            return res.status(403).json({
                success: false,
                message: "Bu seller sizga tegishli emas"
            });
        }

        // Service areas validatsiyasi
        if (!Array.isArray(serviceAreas)) {
            return res.status(400).json({
                success: false,
                message: "Service areas array bo'lishi kerak"
            });
        }

        // Region ID larni tekshirish
        for (const area of serviceAreas) {
            if (!mongoose.Types.ObjectId.isValid(area.region)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri region ID formati"
                });
            }

            const region = await Region.findById(area.region);
            if (!region || region.type !== 'region') {
                return res.status(400).json({
                    success: false,
                    message: "Region topilmadi yoki noto'g'ri type"
                });
            }

            // Districts tekshirish
            if (area.districts && Array.isArray(area.districts)) {
                for (const districtId of area.districts) {
                    if (!mongoose.Types.ObjectId.isValid(districtId)) {
                        return res.status(400).json({
                            success: false,
                            message: "Noto'g'ri district ID formati"
                        });
                    }
                    const district = await Region.findById(districtId);
                    if (!district || district.type !== 'district' || district.parent.toString() !== area.region) {
                        return res.status(400).json({
                            success: false,
                            message: "District topilmadi yoki noto'g'ri parent"
                        });
                    }
                }
            }

            // MFYs tekshirish
            if (area.mfys && Array.isArray(area.mfys)) {
                for (const mfyId of area.mfys) {
                    if (!mongoose.Types.ObjectId.isValid(mfyId)) {
                        return res.status(400).json({
                            success: false,
                            message: "Noto'g'ri MFY ID formati"
                        });
                    }
                    const mfy = await Region.findById(mfyId);
                    if (!mfy || mfy.type !== 'mfy') {
                        return res.status(400).json({
                            success: false,
                            message: "MFY topilmadi yoki noto'g'ri type"
                        });
                    }
                }
            }
        }

        // Service areas ni belgilash (mavjud hududlarga qo'shish)
        if (isAssignedToThisShopOwner) {
            // Yangi usul: shopOwners array'ida yangilash
            const shopOwnerIndex = seller.shopOwners.findIndex(so => 
                so.shopOwner.toString() === currentUserId.toString()
            );
            if (shopOwnerIndex !== -1) {
                // Mavjud service areas'ga yangi hududlarni qo'shish
                const existingServiceAreas = seller.shopOwners[shopOwnerIndex].serviceAreas || [];
                
                // Yangi hududlarni qo'shish (duplicate'larni oldini olish)
                for (const newArea of serviceAreas) {
                    const existingArea = existingServiceAreas.find(existing => 
                        existing.region.toString() === newArea.region.toString()
                    );
                    
                    if (existingArea) {
                        // Mavjud region uchun districts va mfys'larni qo'shish
                        if (newArea.districts) {
                            newArea.districts.forEach(districtId => {
                                if (!existingArea.districts.some(d => d.toString() === districtId.toString())) {
                                    existingArea.districts.push(districtId);
                                }
                            });
                        }
                        if (newArea.mfys) {
                            newArea.mfys.forEach(mfyId => {
                                if (!existingArea.mfys.some(m => m.toString() === mfyId.toString())) {
                                    existingArea.mfys.push(mfyId);
                                }
                            });
                        }
                    } else {
                        // Yangi region qo'shish
                        existingServiceAreas.push(newArea);
                    }
                }
                
                seller.shopOwners[shopOwnerIndex].serviceAreas = existingServiceAreas;
            }
        } else {
            // Eski usul: serviceAreas field'ida saqlash
            const existingServiceAreas = seller.serviceAreas || [];
            
            // Mavjud service areas'ga yangi hududlarni qo'shish
            for (const newArea of serviceAreas) {
                const existingArea = existingServiceAreas.find(existing => 
                    existing.region.toString() === newArea.region.toString()
                );
                
                if (existingArea) {
                    // Mavjud region uchun districts va mfys'larni qo'shish
                    if (newArea.districts) {
                        newArea.districts.forEach(districtId => {
                            if (!existingArea.districts.some(d => d.toString() === districtId.toString())) {
                                existingArea.districts.push(districtId);
                            }
                        });
                    }
                    if (newArea.mfys) {
                        newArea.mfys.forEach(mfyId => {
                            if (!existingArea.mfys.some(m => m.toString() === mfyId.toString())) {
                                existingArea.mfys.push(mfyId);
                            }
                        });
                    }
                } else {
                    // Yangi region qo'shish
                    existingServiceAreas.push(newArea);
                }
            }
            
            seller.serviceAreas = existingServiceAreas;
        }
        await seller.save();

        // Yangilangan sellerni qaytarish
        const updatedSeller = await Seller.findById(sellerId)
            .populate('serviceAreas.region', 'name')
            .populate('serviceAreas.districts', 'name')
            .populate('serviceAreas.mfys', 'name');

        res.json({
            success: true,
            message: "Xizmat hududlari muvaffaqiyatli belgilandi",
            seller: {
                id: updatedSeller._id,
                fullName: updatedSeller.fullName,
                username: updatedSeller.username,
                phone: updatedSeller.phone,
                serviceAreas: updatedSeller.serviceAreas
            }
        });
    } catch (error) {
        console.error('Set seller service areas error:', error);
        res.status(500).json({
            success: false,
            message: "Xizmat hududlarini belgilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Do'kon egasi tomonidan sellerni olib tashlash
const removeSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Faqat tizimga kirgan do'kon egalari olib tashlay oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda sellerni olib tashlash huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri seller ID formati"
            });
        }

        // Sellerni tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
            });
        }

        const currentUserId = req.user.id || req.user._id;

        // Seller bu do'kon egasiga tegishlimi tekshirish (yangi usul)
        const isAssignedToThisShopOwner = seller.shopOwners && 
            seller.shopOwners.some(so => so.shopOwner.toString() === currentUserId.toString());
        
        // Eski usul tekshirish
        const isAssignedToOldWay = seller.shopOwner && 
            seller.shopOwner.toString() === currentUserId.toString();

        if (!isAssignedToThisShopOwner && !isAssignedToOldWay) {
            return res.status(403).json({
                success: false,
                message: "Bu seller sizga tegishli emas"
            });
        }

        // Yangi usul: shopOwners array'idan olib tashlash
        if (isAssignedToThisShopOwner) {
            seller.shopOwners = seller.shopOwners.filter(so => 
                so.shopOwner.toString() !== currentUserId.toString()
            );
        }

        // Eski usul: shopOwner field'larini null qilish
        if (isAssignedToOldWay) {
            seller.shopOwner = null;
            seller.assignedBy = null;
            seller.assignedAt = null;
            seller.serviceAreas = [];
        }

        await seller.save();

        res.json({
            success: true,
            message: "Seller muvaffaqiyatli olib tashlandi"
        });
    } catch (error) {
        console.error('Remove seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sellerni olib tashlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== REGION MANAGEMENT ====================

// Do'kon egasi tomonidan regionlarni ko'rish
const getRegionsForShopOwner = async (req, res) => {
    try {
        // Faqat tizimga kirgan do'kon egalari ko'ra oladi
        if (!req.user || req.user.role !== 'shop-owner') {
            return res.status(403).json({
                success: false,
                message: "Sizda regionlarni ko'rish huquqi yo'q"
            });
        }

        const { type, parent, search, status, page = 1, limit = 20 } = req.query;

        // Query yaratish
        let query = {};

        // Type filter
        if (type) {
            query.type = type;
        }

        // Parent filter
        if (parent && parent !== 'undefined' && parent !== 'null' && parent.trim() !== '') {
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri parent ID formati"
                });
            }
            query.parent = parent;
        }

        // Search filter
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Regionlarni olish
        const regions = await Region.find(query)
            .select('name type parent code status createdAt')
            .sort({ name: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Jami sonni olish
        const total = await Region.countDocuments(query);

        res.json({
            success: true,
            count: regions.length,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            items: regions.map(region => ({
                _id: region._id,
                name: region.name,
                type: region.type,
                parent: region.parent,
                code: region.code,
                status: region.status,
                createdAt: region.createdAt
            }))
        });
    } catch (error) {
        console.error('Get regions for shop owner error:', error);
        res.status(500).json({
            success: false,
            message: "Regionlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

module.exports = {
    createShopOwner,
    loginShopOwner,
    getAllShopOwners,
    updateShopOwnerPermissions,
    getAvailablePermissions,
    updateShopOwner,
    getShopOwner,
    updateShopOwnerStatus,
    deleteShopOwner,
    // Seller management
    getAvailableSellers,
    assignSeller,
    getMySellers,
    setSellerServiceAreas,
    removeSeller,
    // Region management
    getRegionsForShopOwner
};
