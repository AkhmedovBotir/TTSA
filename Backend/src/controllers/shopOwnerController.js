const jwt = require('jsonwebtoken');
const ShopOwner = require('../models/ShopOwner');
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

module.exports = {
    createShopOwner,
    loginShopOwner,
    getAllShopOwners,
    updateShopOwnerPermissions,
    getAvailablePermissions,
    updateShopOwner,
    getShopOwner,
    updateShopOwnerStatus,
    deleteShopOwner
};
