const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const InstallmentPayment = require('../models/InstallmentPayment');
const mongoose = require('mongoose');

// Ruxsatlar ro'yxati
const VALID_PERMISSIONS = [
    'manage_admins',
    'manage_tariffs',
    'manage_shops',
    'manage_shop_owners',
    'manage_assistants',
    'manage_categories',
    'manage_products',
    'manage_orders',
    'manage_installments',
    'manage_contracts',
    'view_statistics'
];

const VALID_STATUSES = ['active', 'inactive', 'blocked'];

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Adminni bazadan topish
        const admin = await Admin.findOne({ username });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri username yoki password"
            });
        }

        // Parolni tekshirish
        const isMatch = await admin.checkPassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri username yoki password"
            });
        }

        // Admin statusini tekshirish
        if (admin.role !== 'general' && admin.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: "Sizning akkauntingiz bloklangan yoki faol emas"
            });
        }

        // Login vaqtini yangilash
        admin.lastLogin = new Date();
        await admin.save();

        // Token yaratish
        const token = jwt.sign(
            { 
                _id: admin._id, 
                username: admin.username, 
                role: admin.role,
                permissions: admin.permissions,
                status: admin.status
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            admin: {
                username: admin.username,
                fullname: admin.fullname,
                phone: admin.phone,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions
            },
            message: "Muvaffaqiyatli login qilindi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: error.stack
        });
    }
};

// Barcha adminlarni olish
const getAllAdmins = async (req, res) => {
    try {
        // Faqat general admin va manage_admins huquqi borlar ko'ra oladi
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_admins'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda adminlarni ko'rish huquqi yo'q"
            });
        }

        // Adminlarni olish (password va __v maydonlarisiz)
        const admins = await Admin.find({}, '-password -__v')
            .sort({ createdAt: -1 }); // Eng yangi adminlar tepada

        res.json({
            success: true,
            admins: admins.map(admin => ({
                id: admin._id,
                username: admin.username,
                fullname: admin.fullname,
                phone: admin.phone,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin
            })),
            total: admins.length,
            message: "Adminlar ro'yxati muvaffaqiyatli olindi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Yangi admin yaratish (faqat general admin uchun)
const createAdmin = async (req, res) => {
    try {
        const { username, password, fullname, phone, permissions = [], status = 'active' } = req.body;

        // Request validatsiyasi
        if (!username || !password || !fullname || !phone) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username kamida 3 ta belgidan iborat bo'lishi kerak"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Telefon raqam validatsiyasi
        if (!/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Faqat general admin va manage_admins huquqi bor adminlar yangi admin yarata oladi
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_admins'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda yangi admin yaratish huquqi yo'q"
            });
        }

        // Username band emasligini tekshirish
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Bu username band"
            });
        }

        // Ruxsatlarni validatsiya qilish
        const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ruxsatlar berilgan: " + invalidPermissions.join(', '),
                validPermissions: VALID_PERMISSIONS
            });
        }

        // Statusni validatsiya qilish
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status berilgan",
                validStatuses: VALID_STATUSES
            });
        }

        // Yangi admin yaratish
        const newAdmin = new Admin({
            username,
            password,
            fullname,
            phone,
            role: 'admin',
            status,
            permissions,
            createdBy: req.admin.id
        });

        await newAdmin.save();

        res.status(201).json({
            success: true,
            message: "Yangi admin muvaffaqiyatli yaratildi",
            admin: {
                username: newAdmin.username,
                fullname: newAdmin.fullname,
                phone: newAdmin.phone,
                role: newAdmin.role,
                status: newAdmin.status,
                permissions: newAdmin.permissions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Bitta adminni olish
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Faqat general admin va manage_admins huquqi borlar ko'ra oladi
        // Yoki admin o'zining ma'lumotlarini ko'rmoqchi bo'lsa
        if (!req.user || (req.user.role !== 'general' && 
            !req.user.permissions?.includes('manage_admins') && 
            req.user.id !== id)) {
            return res.status(403).json({
                success: false,
                message: "Sizda bu ma'lumotlarni ko'rish huquqi yo'q"
            });
        }

        // Adminni bazadan topish (passwordsiz)
        const admin = await Admin.findById(id, '-password -__v')
            .populate('createdBy', 'username fullname'); // Admin yaratgan adminni ham olish

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin topilmadi"
            });
        }

        // General adminni faqat general admin ko'ra oladi
        if (admin.role === 'general' && req.admin.role !== 'general') {
            return res.status(403).json({
                success: false,
                message: "Sizda general admin ma'lumotlarini ko'rish huquqi yo'q"
            });
        }

        res.json({
            success: true,
            admin: {
                id: admin._id,
                username: admin.username,
                fullname: admin.fullname,
                phone: admin.phone,
                role: admin.role,
                status: admin.status,
                permissions: admin.permissions,
                createdAt: admin.createdAt,
                lastLogin: admin.lastLogin,
                createdBy: admin.createdBy
            },
            message: "Admin ma'lumotlari muvaffaqiyatli olindi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Admin ma'lumotlarini yangilash
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullname, phone, status, permissions, password } = req.body;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Adminni bazadan topish
        const admin = await Admin.findById(id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin topilmadi"
            });
        }

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_admins'))) {
            // Oddiy admin faqat o'zining ma'lumotlarini o'zgartira oladi
            if (req.user.id !== id) {
                return res.status(403).json({
                    success: false,
                    message: "Sizda bu admin ma'lumotlarini o'zgartirish huquqi yo'q"
                });
            }
            // Va faqat fullname va phone ni o'zgartira oladi
            if (status || permissions) {
                return res.status(403).json({
                    success: false,
                    message: "Siz faqat o'zingizning ism va telefon raqamingizni o'zgartira olasiz"
                });
            }
        }

        // General adminni faqat general admin o'zgartira oladi
        if (admin.role === 'general' && req.admin.role !== 'general') {
            return res.status(403).json({
                success: false,
                message: "General adminni faqat general admin o'zgartira oladi"
            });
        }

        // O'zgartirishlar uchun obyekt
        const updates = {};

        // Fullname validatsiyasi
        if (fullname !== undefined) {
            if (typeof fullname !== 'string' || fullname.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: "To'liq ism kamida 3 ta belgidan iborat bo'lishi kerak"
                });
            }
            updates.fullname = fullname;
        }

        // Phone validatsiyasi
        if (phone !== undefined) {
            if (!/^\+998[0-9]{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                });
            }
            updates.phone = phone;
        }

        // Status validatsiyasi
        if (status !== undefined) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri status",
                    validStatuses: VALID_STATUSES
                });
            }
            // General adminning statusi o'zgartirilmaydi
            if (admin.role === 'general') {
                return res.status(400).json({
                    success: false,
                    message: "General adminning statusini o'zgartirib bo'lmaydi"
                });
            }
            updates.status = status;
        }

        // Permissions validatsiyasi
        if (permissions !== undefined) {
            // General adminning ruxsatlarini o'zgartirib bo'lmaydi
            if (admin.role === 'general') {
                return res.status(400).json({
                    success: false,
                    message: "General adminning ruxsatlarini o'zgartirib bo'lmaydi"
                });
            }
            
            // Ruxsatlar to'g'ri formatda kelganmi
            if (!Array.isArray(permissions)) {
                return res.status(400).json({
                    success: false,
                    message: "Permissions array bo'lishi kerak"
                });
            }

            // Barcha ruxsatlar to'g'rimi
            const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
            if (invalidPermissions.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri ruxsatlar berilgan: " + invalidPermissions.join(', '),
                    validPermissions: VALID_PERMISSIONS
                });
            }
            updates.permissions = permissions;
        }

        // Parol o'zgartirish
        if (password !== undefined) {
            if (typeof password !== 'string' || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
                });
            }
            admin.password = password; // Model middleware orqali hashlanadi
            await admin.save();
        }

        // Qolgan o'zgarishlarni saqlash
        if (Object.keys(updates).length > 0) {
            await Admin.findByIdAndUpdate(id, updates, { new: true });
        }

        // Yangilangan ma'lumotlarni qaytarish
        const updatedAdmin = await Admin.findById(id, '-password -__v');

        res.json({
            success: true,
            message: "Admin ma'lumotlari muvaffaqiyatli yangilandi",
            admin: {
                id: updatedAdmin._id,
                username: updatedAdmin.username,
                fullname: updatedAdmin.fullname,
                phone: updatedAdmin.phone,
                role: updatedAdmin.role,
                status: updatedAdmin.status,
                permissions: updatedAdmin.permissions
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Adminni o'chirish
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Adminni bazadan topish
        const admin = await Admin.findById(id);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin topilmadi"
            });
        }

        // Faqat general admin va manage_admins huquqi borlar o'chira oladi
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_admins'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda adminlarni o'chirish huquqi yo'q"
            });
        }

        // General adminni o'chirib bo'lmaydi
        if (admin.role === 'general') {
            return res.status(403).json({
                success: false,
                message: "General adminni o'chirib bo'lmaydi"
            });
        }

        // O'zini o'zi o'chira olmaydi
        if (req.admin.id === id) {
            return res.status(403).json({
                success: false,
                message: "O'zingizni o'chira olmaysiz"
            });
        }

        // Adminni o'chirish
        await Admin.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Admin muvaffaqiyatli o'chirildi"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Get all installment payments for admin
const getAdminInstallmentPayments = async (req, res) => {
    try {
        // Check if admin has permission to view installments
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_installments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda muddatli to'lovlarni ko'rish huquqi yo'q"
            });
        }

        const { status, page = 1, limit = 10, shop, seller } = req.query;

        const filter = {};
        if (status && ['active', 'completed', 'overdue', 'cancelled'].includes(status)) {
            filter.status = status;
        }
        if (shop) {
            filter.storeOwner = shop;
        }
        if (seller) {
            filter.seller = seller;
        }

        const skip = (page - 1) * limit;

        const installments = await InstallmentPayment.find(filter)
            .populate('customer', 'fullName primaryPhone')
            .populate('products.productId', 'name')
            .populate('seller', 'username fullname')
            .populate('storeOwner', 'username fullname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await InstallmentPayment.countDocuments(filter);

        res.json({
            success: true,
            installments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get admin installments error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovlarni olishda xatolik",
            error: error.message
        });
    }
};

// Get installment statistics for admin
const getAdminInstallmentStats = async (req, res) => {
    try {
        // Check if admin has permission to view statistics
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('view_statistics'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda statistikani ko'rish huquqi yo'q"
            });
        }

        const { shop, seller } = req.query;

        const matchStage = {};
        if (shop) {
            matchStage.storeOwner = mongoose.Types.ObjectId(shop);
        }
        if (seller) {
            matchStage.seller = mongoose.Types.ObjectId(seller);
        }

        const stats = await InstallmentPayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalSum' }
                }
            }
        ]);

        const totalInstallments = await InstallmentPayment.countDocuments(matchStage);
        const activeInstallments = await InstallmentPayment.countDocuments({ 
            ...matchStage, 
            status: 'active' 
        });
        const overdueInstallments = await InstallmentPayment.countDocuments({ 
            ...matchStage, 
            status: 'overdue' 
        });
        const completedInstallments = await InstallmentPayment.countDocuments({ 
            ...matchStage, 
            status: 'completed' 
        });
        const cancelledInstallments = await InstallmentPayment.countDocuments({ 
            ...matchStage, 
            status: 'cancelled' 
        });

        // Calculate total amounts by status
        const totalAmounts = await InstallmentPayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalActive: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, '$totalSum', 0] } },
                    totalOverdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$totalSum', 0] } },
                    totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalSum', 0] } },
                    totalCancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, '$totalSum', 0] } }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                total: totalInstallments,
                active: activeInstallments,
                overdue: overdueInstallments,
                completed: completedInstallments,
                cancelled: cancelledInstallments,
                breakdown: stats,
                amounts: totalAmounts[0] || {
                    totalActive: 0,
                    totalOverdue: 0,
                    totalCompleted: 0,
                    totalCancelled: 0
                }
            }
        });

    } catch (error) {
        console.error('Get admin installment stats error:', error);
        res.status(500).json({
            success: false,
            message: "Statistikani olishda xatolik",
            error: error.message
        });
    }
};

module.exports = {
    login,
    createAdmin,
    getAllAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    getAdminInstallmentPayments,
    getAdminInstallmentStats
};
