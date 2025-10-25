const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Agent = require('../models/Agent');
const Seller = require('../models/Seller');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Region = require('../models/Region');
const PaymentSchedule = require('../models/PaymentSchedule');
const InstallmentPayment = require('../models/InstallmentPayment');
const InterestRate = require('../models/InterestRate');
const Notification = require('../models/Notification');
const UserNotification = require('../models/UserNotification');
const Client = require('../models/Client');
const ShopOwner = require('../models/ShopOwner');
const mongoose = require('mongoose');

// Ruxsatlar ro'yxati
const VALID_PERMISSIONS = [
    'view_dashboard',          // Dashboard
    'manage_admins',           // Adminlar
    'manage_shop_owners',      // Do'kon egalari
    'manage_stores',           // Do'konlar (frontend bilan mos kelishi uchun)
    'manage_shops',            // Do'konlar (eski ma'lumotlar bilan mos kelishi uchun)
    'manage_sellers',          // Sotuvchilar
    'manage_regions',          // Regionlar
    'manage_categories',       // Kategoriyalar
    'manage_products',         // Mahsulotlar
    'manage_orders',           // Buyurtmalar
    'manage_installments',     // Muddatli to'lovlar
    'manage_notifications',    // Xabarnomalar
    'manage_settings'          // Sozlamalar
];

const VALID_STATUSES = ['active', 'inactive', 'blocked'];

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Admin login attempt:', { username });

        // JWT_SECRET mavjudligini tekshirish
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({
                success: false,
                message: "Server konfiguratsiyasi noto'g'ri"
            });
        }

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
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        console.error('Get all admins error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Yangi admin yaratish (faqat general admin uchun)
const createAdmin = async (req, res) => {
    try {
        const { username, password, fullname, phone, permissions = [], status = 'active' } = req.body;

        console.log('Create admin request:', { username, fullname, phone, permissions, status });

        // Request validatsiyasi
        if (!username || !password || !fullname || !phone) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart",
                received: { username: !!username, password: !!password, fullname: !!fullname, phone: !!phone }
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
        console.log('Validating permissions:', { permissions, VALID_PERMISSIONS });
        const invalidPermissions = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
        if (invalidPermissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ruxsatlar berilgan: " + invalidPermissions.join(', '),
                validPermissions: VALID_PERMISSIONS,
                invalidPermissions: invalidPermissions
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
            createdBy: req.user._id
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
        console.error('Create admin error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        if (admin.role === 'general' && req.user.role !== 'general') {
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
        console.error('Get admin by ID error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        if (admin.role === 'general' && req.user.role !== 'general') {
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
        console.error('Update admin error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
        if (req.user._id.toString() === id) {
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
        console.error('Delete admin error:', error);
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Process installment payment (mark as paid)
const processInstallmentPayment = async (req, res) => {
    try {
        const { installmentId } = req.params;
        const { amount, notes, paymentMethod = 'cash' } = req.body;

        // Check if admin has permission to manage installments
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_installments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda muddatli to'lovlarni boshqarish huquqi yo'q"
            });
        }

        // Validate installment ID
        if (!mongoose.Types.ObjectId.isValid(installmentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri muddatli to'lov ID formati"
            });
        }

        // Find the installment payment
        const installment = await InstallmentPayment.findById(installmentId)
            .populate('storeOwner', 'name username phone')
            .populate('seller', 'fullName username phone');

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Muddatli to'lov topilmadi"
            });
        }

        // Check if already completed
        if (installment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: "Bu muddatli to'lov allaqachon yakunlangan"
            });
        }

        // Check if cancelled
        if (installment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Bu muddatli to'lov bekor qilingan"
            });
        }

        // Find the specific payment to process
        const { month } = req.body;
        if (!month) {
            return res.status(400).json({
                success: false,
                message: "Qaysi oy uchun to'lov amalga oshirilayotganini belgilang"
            });
        }

        const payment = installment.payments.find(p => p.month === parseInt(month));
        if (!payment) {
            return res.status(400).json({
                success: false,
                message: "Belgilangan oy uchun to'lov topilmadi"
            });
        }

        if (payment.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: "Bu oy uchun to'lov allaqachon amalga oshirilgan"
            });
        }

        // Validate amount if provided
        if (amount && amount !== payment.amount) {
            return res.status(400).json({
                success: false,
                message: `To'lov miqdori noto'g'ri. Kutilayotgan miqdor: ${payment.amount}`
            });
        }

        // Record the payment
        payment.status = 'paid';
        payment.paidAt = new Date();
        payment.paidBy = req.user._id;
        payment.paymentMethod = paymentMethod;
        if (notes) {
            payment.notes = notes;
        }

        // Check if all payments are completed
        installment.checkOverdue();

        await installment.save();

        // Get updated installment with populated fields
        const updatedInstallment = await InstallmentPayment.findById(installmentId)
            .populate('storeOwner', 'name username phone')
            .populate('seller', 'fullName username phone')
            .populate('payments.paidBy', 'username fullname');

        res.json({
            success: true,
            message: "Muddatli to'lov muvaffaqiyatli amalga oshirildi",
            data: {
                installment: {
                    id: updatedInstallment._id,
                    orderId: updatedInstallment.orderId,
                    totalSum: updatedInstallment.totalSum,
                    status: updatedInstallment.status,
                    storeOwner: updatedInstallment.storeOwner,
                    seller: updatedInstallment.seller,
                    customer: updatedInstallment.customer,
                    installment: updatedInstallment.installment,
                    payment: {
                        month: payment.month,
                        amount: payment.amount,
                        dueDate: payment.dueDate,
                        paidAt: payment.paidAt,
                        status: payment.status,
                        paymentMethod: payment.paymentMethod,
                        notes: payment.notes,
                        paidBy: payment.paidBy
                    }
                }
            }
        });

    } catch (error) {
        console.error('Process installment payment error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovni amalga oshirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Cancel installment payment
const cancelInstallmentPayment = async (req, res) => {
    try {
        const { installmentId } = req.params;
        const { reason } = req.body;

        // Check if admin has permission to manage installments
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_installments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda muddatli to'lovlarni boshqarish huquqi yo'q"
            });
        }

        // Validate installment ID
        if (!mongoose.Types.ObjectId.isValid(installmentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri muddatli to'lov ID formati"
            });
        }

        // Find the installment payment
        const installment = await InstallmentPayment.findById(installmentId)
            .populate('storeOwner', 'name username phone')
            .populate('seller', 'fullName username phone');

        if (!installment) {
            return res.status(404).json({
                success: false,
                message: "Muddatli to'lov topilmadi"
            });
        }

        // Check if already completed
        if (installment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: "Bu muddatli to'lov allaqachon yakunlangan"
            });
        }

        // Check if already cancelled
        if (installment.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: "Bu muddatli to'lov allaqachon bekor qilingan"
            });
        }

        // Update installment payment
        installment.status = 'cancelled';
        installment.cancelledAt = new Date();
        installment.cancelledBy = req.user._id;
        if (reason) {
            installment.cancelReason = reason;
        }

        await installment.save();

        // Get updated installment with populated fields
        const updatedInstallment = await InstallmentPayment.findById(installmentId)
            .populate('storeOwner', 'name username phone')
            .populate('seller', 'fullName username phone')
            .populate('cancelledBy', 'username fullname');

        res.json({
            success: true,
            message: "Muddatli to'lov bekor qilindi",
            data: {
                installment: {
                    id: updatedInstallment._id,
                    orderId: updatedInstallment.orderId,
                    totalSum: updatedInstallment.totalSum,
                    status: updatedInstallment.status,
                    cancelledAt: updatedInstallment.cancelledAt,
                    cancelReason: updatedInstallment.cancelReason,
                    storeOwner: updatedInstallment.storeOwner,
                    seller: updatedInstallment.seller,
                    customer: updatedInstallment.customer,
                    cancelledBy: updatedInstallment.cancelledBy
                }
            }
        });

    } catch (error) {
        console.error('Cancel installment payment error:', error);
        res.status(500).json({
            success: false,
            message: "Muddatli to'lovni bekor qilishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== SELLER MANAGEMENT ====================

// Admin tomonidan seller qo'shish
const createSeller = async (req, res) => {
    try {
        const { fullName, username, password, phone } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda sotuvchi qo'shish huquqi yo'q"
            });
        }

        // Asosiy maydonlar validatsiyasi
        if (!fullName || !username || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
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
            createdBy: req.user._id,
            createdByType: 'Admin'
        });

        await seller.save();

        // Sotuvchi ma'lumotlarini qaytarish
        const populatedSeller = await Seller.findById(seller._id)
            .populate('shops', 'name')
            .populate({
                path: 'createdBy',
                select: 'username fullname'
            });

        res.status(201).json({
            success: true,
            message: "Sotuvchi muvaffaqiyatli qo'shildi",
            seller: {
                id: populatedSeller._id,
                fullName: populatedSeller.fullName,
                username: populatedSeller.username,
                phone: populatedSeller.phone,
                shop: populatedSeller.shop,
                status: populatedSeller.status,
                createdBy: populatedSeller.createdBy,
                createdAt: populatedSeller.createdAt
            }
        });

    } catch (error) {
        console.error('Admin create seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi qo'shishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan sellerlarni ko'rish
const getAllSellers = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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
            .populate('shops', 'name title address phone')
            .populate('shopOwner', 'name username phone')
            .populate('shopOwners.shopOwner', 'name username phone')
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
                shops: seller.shops,
                shopOwner: seller.shopOwner,
                shopOwners: seller.shopOwners,
                status: seller.status,
                createdBy: seller.createdBy,
                createdAt: seller.createdAt
            }))
        });

    } catch (error) {
        console.error('Admin get sellers error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchilar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan bitta sellerni ko'rish
const getSellerById = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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
            .populate('shops', 'name')
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
                shops: seller.shops,
                status: seller.status,
                createdBy: seller.createdBy,
                createdAt: seller.createdAt
            }
        });

    } catch (error) {
        console.error('Admin get seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi ma'lumotlarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan sellerni yangilash
const updateSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { fullName, username, phone } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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

        await seller.save();

        // Yangilangan sotuvchi ma'lumotlarini qaytarish
        const updatedSeller = await Seller.findById(sellerId)
            .populate('shops', 'name')
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
        console.error('Admin update seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchini tahrirlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan seller statusini o'zgartirish
const updateSellerStatus = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { status } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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
            .populate('shops', 'name')
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
        console.error('Admin update seller status error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan seller parolini o'zgartirish
const updateSellerPassword = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { password } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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
        console.error('Admin update seller password error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchi parolini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan sellerni o'chirish
const deleteSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
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
        console.error('Admin delete seller error:', error);
        res.status(500).json({
            success: false,
            message: "Sotuvchini o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== AGENT MANAGEMENT ====================

// Admin tomonidan agent qo'shish
const createAgent = async (req, res) => {
    try {
        const { fullname, phone, passport, password } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agent qo'shish huquqi yo'q"
            });
        }

        // Asosiy maydonlar validatsiyasi
        if (!fullname || !phone || !passport || !password) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        if (!/^\+998[0-9]{9}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Unikal tekshiruv
        const existingPhone = await Agent.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam allaqachon mavjud"
            });
        }
        const existingPassport = await Agent.findOne({ passport });
        if (existingPassport) {
            return res.status(400).json({
                success: false,
                message: "Bu passport seriyasi allaqachon mavjud"
            });
        }

        const agent = new Agent({ fullname, phone, passport, password });
        await agent.save();

        res.status(201).json({
            success: true,
            message: "Agent muvaffaqiyatli yaratildi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status,
                createdAt: agent.createdAt
            }
        });
    } catch (error) {
        console.error('Admin create agent error:', error);
        res.status(500).json({
            success: false,
            message: "Agent yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan agentlarni ko'rish
const getAllAgents = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agentlarni ko'rish huquqi yo'q"
            });
        }

        const agents = await Agent.find({}, '-password -__v').sort({ createdAt: -1 });
        res.json({
            success: true,
            count: agents.length,
            agents: agents.map(agent => ({
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status,
                createdAt: agent.createdAt
            }))
        });
    } catch (error) {
        console.error('Admin get agents error:', error);
        res.status(500).json({
            success: false,
            message: "Agentlar ro'yxatini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan bitta agentni ko'rish
const getAgentById = async (req, res) => {
    try {
        const { agentId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agent ma'lumotlarini ko'rish huquqi yo'q"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(agentId, '-password -__v');
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        res.json({
            success: true,
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status,
                createdAt: agent.createdAt
            }
        });
    } catch (error) {
        console.error('Admin get agent error:', error);
        res.status(500).json({
            success: false,
            message: "Agentni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan agentni yangilash
const updateAgent = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { fullname, phone, passport, password } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agentni tahrirlash huquqi yo'q"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        // Telefon va passport unikal tekshiruv (agar o'zgarsa)
        if (phone && phone !== agent.phone) {
            if (!/^\+998[0-9]{9}$/.test(phone)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
                });
            }
            const existingPhone = await Agent.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam allaqachon mavjud"
                });
            }
            agent.phone = phone;
        }
        if (passport && passport !== agent.passport) {
            const existingPassport = await Agent.findOne({ passport });
            if (existingPassport) {
                return res.status(400).json({
                    success: false,
                    message: "Bu passport seriyasi allaqachon mavjud"
                });
            }
            agent.passport = passport;
        }
        if (fullname) agent.fullname = fullname;
        if (password) agent.password = password;
        await agent.save();
        res.json({
            success: true,
            message: "Agent ma'lumotlari muvaffaqiyatli yangilandi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status
            }
        });
    } catch (error) {
        console.error('Admin update agent error:', error);
        res.status(500).json({
            success: false,
            message: "Agentni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan agent statusini o'zgartirish
const updateAgentStatus = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { status } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agent statusini o'zgartirish huquqi yo'q"
            });
        }

        const validStatuses = ['active', 'inactive', 'blocked'];
        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri status",
                validStatuses
            });
        }
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        agent.status = status;
        await agent.save();
        res.json({
            success: true,
            message: "Agent statusi muvaffaqiyatli o'zgartirildi",
            agent: {
                id: agent._id,
                fullname: agent.fullname,
                phone: agent.phone,
                passport: agent.passport,
                status: agent.status
            }
        });
    } catch (error) {
        console.error('Admin update agent status error:', error);
        res.status(500).json({
            success: false,
            message: "Agent statusini o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan agentni o'chirish
const deleteAgent = async (req, res) => {
    try {
        const { agentId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_assistants'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda agentni o'chirish huquqi yo'q"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri agent ID formati"
            });
        }
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent topilmadi"
            });
        }
        await agent.deleteOne();
        res.json({
            success: true,
            message: "Agent muvaffaqiyatli o'chirildi"
        });
    } catch (error) {
        console.error('Admin delete agent error:', error);
        res.status(500).json({
            success: false,
            message: "Agentni o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== STATISTICS ====================

// Admin uchun umumiy statistika
const getAdminStatistics = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('view_statistics'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda statistikani ko'rish huquqi yo'q"
            });
        }

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);

        // Parallel ravishda barcha statistikalarni olish
        const [
            // Users & Roles
            totalAdmins,
            activeAdmins,
            totalSellers,
            activeSellers,
            totalAgents,
            activeAgents,
            totalShopOwners,
            activeShopOwners,
            totalClients,
            
            // Products & Shops
            totalShops,
            activeShops,
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalCategories,
            
            // Regions
            totalRegions,
            totalDistricts,
            totalMfys,
            
            // Orders & Payments
            totalOrders,
            todayOrders,
            monthlyOrders,
            yearlyOrders,
            
            // Installments
            totalInstallments,
            activeInstallments,
            overdueInstallments,
            completedInstallments,
            cancelledInstallments,
            
            // Financial Stats
            todayRevenue,
            monthlyRevenue,
            yearlyRevenue,
            totalInstallmentAmount,
            paidInstallmentAmount,
            pendingInstallmentAmount
        ] = await Promise.all([
            // Users & Roles counts
            Admin.countDocuments(),
            Admin.countDocuments({ status: 'active' }),
            Seller.countDocuments(),
            Seller.countDocuments({ status: 'active' }),
            Agent.countDocuments(),
            Agent.countDocuments({ status: 'active' }),
            require('../models/ShopOwner').countDocuments(),
            require('../models/ShopOwner').countDocuments({ status: 'active' }),
            require('../models/Client').countDocuments(),
            
            // Products & Shops
            Shop.countDocuments(),
            Shop.countDocuments({ status: 'active' }),
            Product.countDocuments(),
            Product.countDocuments({ quantity: { $gt: 0, $lt: 10 } }),
            Product.countDocuments({ quantity: { $lte: 0 } }),
            require('../models/Category').countDocuments(),
            
            // Regions
            Region.countDocuments({ type: 'region' }),
            Region.countDocuments({ type: 'district' }),
            Region.countDocuments({ type: 'mfy' }),
            
            // Orders
            require('../models/Order').countDocuments(),
            require('../models/Order').countDocuments({ createdAt: { $gte: startOfDay } }),
            require('../models/Order').countDocuments({ createdAt: { $gte: startOfMonth } }),
            require('../models/Order').countDocuments({ createdAt: { $gte: startOfYear } }),
            
            // Installments
            InstallmentPayment.countDocuments(),
            InstallmentPayment.countDocuments({ status: 'active' }),
            InstallmentPayment.countDocuments({ status: 'overdue' }),
            InstallmentPayment.countDocuments({ status: 'completed' }),
            InstallmentPayment.countDocuments({ status: 'cancelled' }),
            
            // Financial aggregations
            require('../models/Order').aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfDay } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            require('../models/Order').aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            require('../models/Order').aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startOfYear } } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            InstallmentPayment.aggregate([
                { $group: { _id: null, total: { $sum: '$totalSum' } } }
            ]),
            InstallmentPayment.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalSum' } } }
            ]),
            InstallmentPayment.aggregate([
                { $match: { status: { $in: ['active', 'overdue'] } } },
                { $group: { _id: null, total: { $sum: '$totalSum' } } }
            ])
        ]);

        // Top performing sellers (by installment count)
        const topSellers = await InstallmentPayment.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: '$seller',
                    totalInstallments: { $sum: 1 },
                    totalAmount: { $sum: '$totalSum' },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            },
            { $sort: { totalInstallments: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'sellers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $unwind: '$sellerInfo' },
            {
                $project: {
                    sellerId: '$_id',
                    sellerName: '$sellerInfo.fullName',
                    username: '$sellerInfo.username',
                    totalInstallments: 1,
                    totalAmount: 1,
                    completed: 1,
                    completionRate: {
                        $multiply: [
                            { $divide: ['$completed', '$totalInstallments'] },
                            100
                        ]
                    }
                }
            }
        ]);

        // Top shop owners (by number of shops)
        const topShopOwners = await Shop.aggregate([
            { $match: { status: 'active' } },
            {
                $group: {
                    _id: '$owner',
                    totalShops: { $sum: 1 },
                    totalProducts: { $sum: '$productCount' }
                }
            },
            { $sort: { totalShops: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'shopowners',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'ownerInfo'
                }
            },
            { $unwind: '$ownerInfo' },
            {
                $project: {
                    ownerId: '$_id',
                    ownerName: '$ownerInfo.name',
                    username: '$ownerInfo.username',
                    phone: '$ownerInfo.phone',
                    totalShops: 1,
                    totalProducts: 1
                }
            }
        ]);

        // Recent activities (last 10 installments)
        const recentInstallments = await InstallmentPayment.find()
            .populate('seller', 'fullName username')
            .populate('storeOwner', 'name username')
            .populate('customer', 'fullName primaryPhone')
            .sort({ createdAt: -1 })
            .limit(10)
            .select('orderId totalSum status installment createdAt seller storeOwner customer');

        res.json({
            success: true,
            data: {
                // Overview
                overview: {
                    totalUsers: totalAdmins + totalSellers + totalAgents + totalShopOwners + totalClients,
                    totalAdmins,
                    totalSellers,
                    totalAgents,
                    totalShopOwners,
                    totalClients,
                    totalShops,
                    totalProducts,
                    totalOrders,
                    totalInstallments
                },
                
                // User Statistics
                users: {
                    admins: { total: totalAdmins, active: activeAdmins },
                    sellers: { total: totalSellers, active: activeSellers },
                    agents: { total: totalAgents, active: activeAgents },
                    shopOwners: { total: totalShopOwners, active: activeShopOwners },
                    clients: { total: totalClients }
                },
                
                // Shop & Product Statistics
                shops: {
                    total: totalShops,
                    active: activeShops,
                    inactive: totalShops - activeShops
                },
                
                products: {
                    total: totalProducts,
                    inStock: totalProducts - outOfStockProducts,
                    lowStock: lowStockProducts,
                    outOfStock: outOfStockProducts
                },
                
                categories: {
                    total: totalCategories
                },
                
                // Region Statistics
                regions: {
                    totalRegions,
                    totalDistricts,
                    totalMfys,
                    total: totalRegions + totalDistricts + totalMfys
                },
                
                // Order Statistics
                orders: {
                    total: totalOrders,
                    today: todayOrders,
                    monthly: monthlyOrders,
                    yearly: yearlyOrders
                },
                
                // Installment Statistics
                installments: {
                    total: totalInstallments,
                    active: activeInstallments,
                    overdue: overdueInstallments,
                    completed: completedInstallments,
                    cancelled: cancelledInstallments,
                    completionRate: totalInstallments > 0 
                        ? Math.round((completedInstallments / totalInstallments) * 100) 
                        : 0
                },
                
                // Financial Statistics
                revenue: {
                    today: todayRevenue[0]?.total || 0,
                    monthly: monthlyRevenue[0]?.total || 0,
                    yearly: yearlyRevenue[0]?.total || 0
                },
                
                installmentFinancials: {
                    total: totalInstallmentAmount[0]?.total || 0,
                    paid: paidInstallmentAmount[0]?.total || 0,
                    pending: pendingInstallmentAmount[0]?.total || 0,
                    collectionRate: totalInstallmentAmount[0]?.total > 0
                        ? Math.round(((paidInstallmentAmount[0]?.total || 0) / totalInstallmentAmount[0].total) * 100)
                        : 0
                },
                
                // Top Performers
                topPerformers: {
                    sellers: topSellers.map(s => ({
                        id: s.sellerId,
                        name: s.sellerName,
                        username: s.username,
                        totalInstallments: s.totalInstallments,
                        totalAmount: s.totalAmount,
                        completed: s.completed,
                        completionRate: Math.round(s.completionRate)
                    })),
                    shopOwners: topShopOwners.map(o => ({
                        id: o.ownerId,
                        name: o.ownerName,
                        username: o.username,
                        phone: o.phone,
                        totalShops: o.totalShops,
                        totalProducts: o.totalProducts || 0
                    }))
                },
                
                // Recent Activities
                recentActivities: recentInstallments.map(inst => ({
                    id: inst._id,
                    orderId: inst.orderId,
                    seller: inst.seller ? {
                        id: inst.seller._id,
                        name: inst.seller.fullName,
                        username: inst.seller.username
                    } : null,
                    shopOwner: inst.storeOwner ? {
                        id: inst.storeOwner._id,
                        name: inst.storeOwner.name,
                        username: inst.storeOwner.username
                    } : null,
                    customer: inst.customer ? {
                        fullName: inst.customer.fullName,
                        phone: inst.customer.primaryPhone
                    } : null,
                    totalAmount: inst.totalSum,
                    installmentMonths: inst.installment,
                    status: inst.status,
                    createdAt: inst.createdAt
                }))
            },
            message: "Statistika muvaffaqiyatli olindi"
        });
    } catch (error) {
        console.error('Get admin statistics error:', error);
        res.status(500).json({
            success: false,
            message: "Statistikani olishda xatolik yuz berdi",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ==================== REGION MANAGEMENT ====================

// Admin tomonidan region qo'shish
const createRegion = async (req, res) => {
    try {
        const { name, type, parent, code } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_regions'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda region qo'shish huquqi yo'q"
            });
        }

        // Asosiy maydonlar validatsiyasi
        if (!name || !type || !code) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        // Type validatsiyasi
        if (!['region', 'district', 'mfy'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type 'region', 'district' yoki 'mfy' bo'lishi kerak"
            });
        }

        // Parent validatsiyasi
        if (parent) {
            if (!mongoose.Types.ObjectId.isValid(parent)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri parent ID formati"
                });
            }
            const parentRegion = await Region.findById(parent);
            if (!parentRegion) {
                return res.status(404).json({
                    success: false,
                    message: "Parent region topilmadi"
                });
            }
        }

        // Code uniqueligini tekshirish
        const existingCode = await Region.findOne({ code });
        if (existingCode) {
            return res.status(400).json({
                success: false,
                message: "Bu kod allaqachon mavjud"
            });
        }

        const region = new Region({ name, type, parent, code });
        await region.save();

        res.status(201).json({
            success: true,
            message: "Region muvaffaqiyatli yaratildi",
            region: {
                id: region._id,
                name: region.name,
                type: region.type,
                parent: region.parent,
                code: region.code,
                status: region.status,
                createdAt: region.createdAt
            }
        });
    } catch (error) {
        console.error('Admin create region error:', error);
        res.status(500).json({
            success: false,
            message: "Region yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan regionlarni ko'rish
const getAllRegions = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_regions'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda regionlarni ko'rish huquqi yo'q"
            });
        }

        const { type, parent } = req.query;
        const query = {};

        if (type) {
            query.type = type;
        }
        if (parent) {
            query.parent = parent;
        }

        const regions = await Region.find(query)
            .populate('parent', 'name type')
            .sort({ type: 1, name: 1 });

        res.json({
            success: true,
            count: regions.length,
            regions: regions.map(region => ({
                id: region._id,
                name: region.name,
                type: region.type,
                parent: region.parent,
                code: region.code,
                status: region.status,
                createdAt: region.createdAt
            }))
        });
    } catch (error) {
        console.error('Admin get regions error:', error);
        res.status(500).json({
            success: false,
            message: "Regionlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan regionni o'chirish
const deleteRegion = async (req, res) => {
    try {
        const { regionId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_regions'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda regionni o'chirish huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(regionId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri region ID formati"
            });
        }

        // Regionni topish
        const region = await Region.findById(regionId);
        if (!region) {
            return res.status(404).json({
                success: false,
                message: "Region topilmadi"
            });
        }

        // Bu regionni parent sifatida ishlatayotgan boshqa regionlar bormi tekshirish
        const childRegions = await Region.countDocuments({ parent: regionId });
        if (childRegions > 0) {
            return res.status(400).json({
                success: false,
                message: `Bu regionni o'chirib bo'lmaydi, chunki unga bog'langan ${childRegions} ta boshqa region mavjud`
            });
        }

        // Regionni o'chirish
        await Region.findByIdAndDelete(regionId);

        res.json({
            success: true,
            message: "Region muvaffaqiyatli o'chirildi"
        });
    } catch (error) {
        console.error('Admin delete region error:', error);
        res.status(500).json({
            success: false,
            message: "Regionni o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== SELLER SHOP ASSIGNMENT ====================

// Admin tomonidan sellerga do'kon tayinlash
const assignShopToSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { shopId } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda seller boshqaruvi huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId) || !mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Seller va Shop ni tekshirish
        const seller = await Seller.findById(sellerId);
        const shop = await Shop.findById(shopId);

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
            });
        }

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Do'kon topilmadi"
            });
        }

        // Do'kon allaqachon tayinlanganmi tekshirish
        if (seller.shops.includes(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Bu do'kon allaqachon tayinlangan"
            });
        }

        // Do'konni tayinlash
        seller.shops.push(shopId);
        await seller.save();

        res.json({
            success: true,
            message: "Do'kon muvaffaqiyatli tayinlandi",
            seller: {
                id: seller._id,
                fullName: seller.fullName,
                shops: seller.shops
            }
        });
    } catch (error) {
        console.error('Admin assign shop error:', error);
        res.status(500).json({
            success: false,
            message: "Do'kon tayinlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan sellerdan do'konni olib tashlash
const removeShopFromSeller = async (req, res) => {
    try {
        const { sellerId, shopId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda seller boshqaruvi huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId) || !mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri ID formati"
            });
        }

        // Seller ni tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
            });
        }

        // Do'konni olib tashlash
        seller.shops = seller.shops.filter(shop => shop.toString() !== shopId);
        await seller.save();

        res.json({
            success: true,
            message: "Do'kon muvaffaqiyatli olib tashlandi",
            seller: {
                id: seller._id,
                fullName: seller.fullName,
                shops: seller.shops
            }
        });
    } catch (error) {
        console.error('Admin remove shop error:', error);
        res.status(500).json({
            success: false,
            message: "Do'konni olib tashlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== SELLER SERVICE AREAS ====================

// Admin tomonidan sellerga xizmat ko'rsatish hududlarini tayinlash
const assignServiceAreasToSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { serviceAreas } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_sellers'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda seller boshqaruvi huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri seller ID formati"
            });
        }

        // Seller ni tekshirish
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller topilmadi"
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
        }

        // Service areas ni tayinlash
        seller.serviceAreas = serviceAreas;
        await seller.save();

        res.json({
            success: true,
            message: "Xizmat ko'rsatish hududlari muvaffaqiyatli tayinlandi",
            seller: {
                id: seller._id,
                fullName: seller.fullName,
                serviceAreas: seller.serviceAreas
            }
        });
    } catch (error) {
        console.error('Admin assign service areas error:', error);
        res.status(500).json({
            success: false,
            message: "Xizmat ko'rsatish hududlarini tayinlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== PAYMENT SCHEDULE MANAGEMENT ====================

// Admin tomonidan to'lov grafigini ko'rish
const getPaymentSchedules = async (req, res) => {
    try {
        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_payments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda to'lov grafigini ko'rish huquqi yo'q"
            });
        }

        const { sellerId, shopId, status, page = 1, limit = 10 } = req.query;
        const query = {};

        if (sellerId) {
            query.seller = sellerId;
        }
        if (shopId) {
            query.shop = shopId;
        }
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const schedules = await PaymentSchedule.find(query)
            .populate('seller', 'fullName username phone')
            .populate('shops', 'name')
            .populate('confirmedBy', 'name username')
            .sort({ scheduleDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await PaymentSchedule.countDocuments(query);

        res.json({
            success: true,
            schedules,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Admin get payment schedules error:', error);
        res.status(500).json({
            success: false,
            message: "To'lov grafigini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan to'lov grafigini tasdiqlash
const confirmPaymentSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_payments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda to'lov grafigini tasdiqlash huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri schedule ID formati"
            });
        }

        // Schedule ni tekshirish
        const schedule = await PaymentSchedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "To'lov grafigi topilmadi"
            });
        }

        if (schedule.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Bu to'lov grafigi allaqachon tasdiqlangan yoki rad etilgan"
            });
        }

        // Tasdiqlash
        schedule.status = 'confirmed';
        schedule.confirmedBy = req.user._id;
        schedule.confirmedAt = new Date();
        await schedule.save();

        res.json({
            success: true,
            message: "To'lov grafigi muvaffaqiyatli tasdiqlandi",
            schedule: {
                id: schedule._id,
                status: schedule.status,
                confirmedBy: schedule.confirmedBy,
                confirmedAt: schedule.confirmedAt
            }
        });
    } catch (error) {
        console.error('Admin confirm payment schedule error:', error);
        res.status(500).json({
            success: false,
            message: "To'lov grafigini tasdiqlashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Admin tomonidan to'lov grafigini rad etish
const rejectPaymentSchedule = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { rejectionReason } = req.body;

        // Ruxsatlarni tekshirish
        if (!req.user || (req.user.role !== 'general' && !req.user.permissions?.includes('manage_payments'))) {
            return res.status(403).json({
                success: false,
                message: "Sizda to'lov grafigini rad etish huquqi yo'q"
            });
        }

        // ID validatsiyasi
        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri schedule ID formati"
            });
        }

        // Schedule ni tekshirish
        const schedule = await PaymentSchedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "To'lov grafigi topilmadi"
            });
        }

        if (schedule.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Bu to'lov grafigi allaqachon tasdiqlangan yoki rad etilgan"
            });
        }

        // Rad etish
        schedule.status = 'rejected';
        schedule.confirmedBy = req.user._id;
        schedule.confirmedAt = new Date();
        if (rejectionReason) {
            schedule.rejectionReason = rejectionReason;
        }
        await schedule.save();

        res.json({
            success: true,
            message: "To'lov grafigi rad etildi",
            schedule: {
                id: schedule._id,
                status: schedule.status,
                confirmedBy: schedule.confirmedBy,
                confirmedAt: schedule.confirmedAt,
                rejectionReason: schedule.rejectionReason
            }
        });
    } catch (error) {
        console.error('Admin reject payment schedule error:', error);
        res.status(500).json({
            success: false,
            message: "To'lov grafigini rad etishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== INTEREST RATE MANAGEMENT ====================

// Create or update interest rate
const createOrUpdateInterestRate = async (req, res) => {
    try {
        const { duration, interestRate } = req.body;
        const { id } = req.params; // For PUT requests
        const admin = req.user;

        // Validate required fields
        if (!duration || interestRate === undefined) {
            return res.status(400).json({
                success: false,
                message: "Muddat va foiz stavkasi kiritilishi shart"
            });
        }

        // Validate duration
        if (![2, 3, 4, 5, 6, 10, 12].includes(duration)) {
            return res.status(400).json({
                success: false,
                message: "Muddat 2, 3, 4, 5, 6, 10 yoki 12 oy bo'lishi kerak"
            });
        }

        // Validate interest rate
        if (interestRate < 0 || interestRate > 100) {
            return res.status(400).json({
                success: false,
                message: "Foiz stavkasi 0 dan 100 gacha bo'lishi kerak"
            });
        }

        // If it's a PUT request (updating by ID)
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri foiz stavkasi ID formati"
                });
            }

            const existingRate = await InterestRate.findById(id);
            if (!existingRate) {
                return res.status(404).json({
                    success: false,
                    message: "Foiz stavkasi topilmadi"
                });
            }

            // Update existing rate
            existingRate.duration = duration;
            existingRate.interestRate = interestRate;
            existingRate.updatedBy = admin._id;
            await existingRate.save();

            return res.json({
                success: true,
                message: "Foiz stavkasi muvaffaqiyatli yangilandi",
                interestRate: {
                    id: existingRate._id,
                    duration: existingRate.duration,
                    interestRate: existingRate.interestRate,
                    isActive: existingRate.isActive,
                    updatedBy: existingRate.updatedBy,
                    updatedAt: existingRate.updatedAt
                }
            });
        }

        // If it's a POST request (create or update by duration)
        let existingRate = await InterestRate.findOne({ duration });

        if (existingRate) {
            // Update existing rate
            existingRate.interestRate = interestRate;
            existingRate.updatedBy = admin._id;
            await existingRate.save();

            res.json({
                success: true,
                message: "Foiz stavkasi muvaffaqiyatli yangilandi",
                interestRate: {
                    id: existingRate._id,
                    duration: existingRate.duration,
                    interestRate: existingRate.interestRate,
                    isActive: existingRate.isActive,
                    updatedBy: existingRate.updatedBy,
                    updatedAt: existingRate.updatedAt
                }
            });
        } else {
            // Create new rate
            const newRate = new InterestRate({
                duration,
                interestRate,
                createdBy: admin._id
            });

            await newRate.save();

            res.status(201).json({
                success: true,
                message: "Foiz stavkasi muvaffaqiyatli yaratildi",
                interestRate: {
                    id: newRate._id,
                    duration: newRate.duration,
                    interestRate: newRate.interestRate,
                    isActive: newRate.isActive,
                    createdBy: newRate.createdBy,
                    createdAt: newRate.createdAt
                }
            });
        }
    } catch (error) {
        console.error('Admin create/update interest rate error:', error);
        res.status(500).json({
            success: false,
            message: "Foiz stavkasini yaratish/yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Get all interest rates
const getAllInterestRates = async (req, res) => {
    try {
        const rates = await InterestRate.find()
            .populate('createdBy', 'username fullname')
            .populate('updatedBy', 'username fullname')
            .sort({ duration: 1 });

        res.json({
            success: true,
            count: rates.length,
            interestRates: rates.map(rate => ({
                id: rate._id,
                duration: rate.duration,
                interestRate: rate.interestRate,
                isActive: rate.isActive,
                createdBy: rate.createdBy ? {
                    id: rate.createdBy._id,
                    username: rate.createdBy.username,
                    fullname: rate.createdBy.fullname
                } : null,
                updatedBy: rate.updatedBy ? {
                    id: rate.updatedBy._id,
                    username: rate.updatedBy.username,
                    fullname: rate.updatedBy.fullname
                } : null,
                createdAt: rate.createdAt,
                updatedAt: rate.updatedAt
            }))
        });
    } catch (error) {
        console.error('Admin get all interest rates error:', error);
        res.status(500).json({
            success: false,
            message: "Foiz stavkalarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Get active interest rates
const getActiveInterestRates = async (req, res) => {
    try {
        const rates = await InterestRate.getAllActiveRates();

        res.json({
            success: true,
            count: rates.length,
            interestRates: rates.map(rate => ({
                id: rate._id,
                duration: rate.duration,
                interestRate: rate.interestRate,
                isActive: rate.isActive
            }))
        });
    } catch (error) {
        console.error('Admin get active interest rates error:', error);
        res.status(500).json({
            success: false,
            message: "Faol foiz stavkalarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Update interest rate status
const updateInterestRateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const admin = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri foiz stavkasi ID formati"
            });
        }

        const rate = await InterestRate.findById(id);
        if (!rate) {
            return res.status(404).json({
                success: false,
                message: "Foiz stavkasi topilmadi"
            });
        }

        rate.isActive = isActive;
        rate.updatedBy = admin._id;
        await rate.save();

        res.json({
            success: true,
            message: `Foiz stavkasi ${isActive ? 'faollashtirildi' : 'deaktivlashtirildi'}`,
            interestRate: {
                id: rate._id,
                duration: rate.duration,
                interestRate: rate.interestRate,
                isActive: rate.isActive,
                updatedBy: rate.updatedBy,
                updatedAt: rate.updatedAt
            }
        });
    } catch (error) {
        console.error('Admin update interest rate status error:', error);
        res.status(500).json({
            success: false,
            message: "Foiz stavkasi holatini yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Delete interest rate
const deleteInterestRate = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri foiz stavkasi ID formati"
            });
        }

        const rate = await InterestRate.findById(id);
        if (!rate) {
            return res.status(404).json({
                success: false,
                message: "Foiz stavkasi topilmadi"
            });
        }

        await InterestRate.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Foiz stavkasi muvaffaqiyatli o'chirildi"
        });
    } catch (error) {
        console.error('Admin delete interest rate error:', error);
        res.status(500).json({
            success: false,
            message: "Foiz stavkasini o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Initialize default interest rates
const initializeDefaultInterestRates = async (req, res) => {
    try {
        const admin = req.user;
        
        // Default interest rates for each duration
        const defaultRates = [
            { duration: 2, interestRate: 5 },
            { duration: 3, interestRate: 8 },
            { duration: 4, interestRate: 10 },
            { duration: 5, interestRate: 12 },
            { duration: 6, interestRate: 15 },
            { duration: 10, interestRate: 20 },
            { duration: 12, interestRate: 25 }
        ];

        const createdRates = [];

        for (const rateData of defaultRates) {
            // Check if rate already exists
            let existingRate = await InterestRate.findOne({ duration: rateData.duration });
            
            if (!existingRate) {
                const newRate = new InterestRate({
                    duration: rateData.duration,
                    interestRate: rateData.interestRate,
                    createdBy: admin._id
                });
                
                await newRate.save();
                createdRates.push(newRate);
            }
        }

        res.json({
            success: true,
            message: "Standart foiz stavkalari muvaffaqiyatli yaratildi",
            created: createdRates.length,
            interestRates: createdRates.map(rate => ({
                id: rate._id,
                duration: rate.duration,
                interestRate: rate.interestRate,
                isActive: rate.isActive
            }))
        });
    } catch (error) {
        console.error('Admin initialize default interest rates error:', error);
        res.status(500).json({
            success: false,
            message: "Standart foiz stavkalarini yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== NOTIFICATION MANAGEMENT ====================

// Xabarnoma yaratish
const createNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            type = 'info',
            priority = 'medium',
            targetAudience,
            targetUsers = [],
            scheduledAt,
            isScheduled = false,
            metadata = {}
        } = req.body;

        // Validatsiya
        if (!title || !message || !targetAudience) {
            return res.status(400).json({
                success: false,
                message: "Sarlavha, xabar matni va maqsadli auditoriya kiritilishi shart"
            });
        }

        if (!['all', 'clients', 'sellers', 'agents', 'shop_owners', 'admins'].includes(targetAudience)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri maqsadli auditoriya"
            });
        }

        // Xabarnoma yaratish
        const notification = new Notification({
            title,
            message,
            type,
            priority,
            targetAudience,
            targetUsers,
            scheduledAt: isScheduled ? new Date(scheduledAt) : new Date(),
            isScheduled,
            status: isScheduled ? 'scheduled' : 'draft',
            createdBy: req.user._id,
            metadata
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: "Xabarnoma muvaffaqiyatli yaratildi",
            data: notification
        });

    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma yaratishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Barcha xabarnomalarni olish
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, targetAudience, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status;
        if (targetAudience) filter.targetAudience = targetAudience;
        if (type) filter.type = type;

        const notifications = await Notification.find(filter)
            .populate('createdBy', 'username name')
            .populate('updatedBy', 'username name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnomalarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma ID bo'yicha olish
const getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id)
            .populate('createdBy', 'username name')
            .populate('updatedBy', 'username name')
            .populate('targetUsers');

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        res.json({
            success: true,
            data: notification
        });

    } catch (error) {
        console.error('Get notification by ID error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma ma'lumotlarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma yangilash
const updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Faqat draft holatidagi xabarnomalarni yangilash mumkin
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        if (notification.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: "Faqat loyiha holatidagi xabarnomalarni yangilash mumkin"
            });
        }

        const updatedNotification = await Notification.findByIdAndUpdate(
            id,
            { ...updates, updatedBy: req.user._id },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: "Xabarnoma muvaffaqiyatli yangilandi",
            data: updatedNotification
        });

    } catch (error) {
        console.error('Update notification error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma o'chirish
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        if (notification.status === 'sent') {
            return res.status(400).json({
                success: false,
                message: "Yuborilgan xabarnomalarni o'chirish mumkin emas"
            });
        }

        await Notification.findByIdAndDelete(id);
        await UserNotification.deleteMany({ notification: id });

        res.json({
            success: true,
            message: "Xabarnoma muvaffaqiyatli o'chirildi"
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma o'chirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma yuborish
const sendNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        if (notification.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: "Faqat loyiha holatidagi xabarnomalarni yuborish mumkin"
            });
        }

        // Maqsadli foydalanuvchilarni topish va UserNotification yaratish
        let userNotifications = [];

        // Xabarnoma holatini yangilash
        notification.status = 'sending';
        await notification.save();

        // Har bir foydalanuvchi turi uchun alohida UserNotification yaratish
        const userTypes = [
            { model: Client, userModel: 'Client', audience: 'clients' },
            { model: Seller, userModel: 'Seller', audience: 'sellers' },
            { model: Agent, userModel: 'Agent', audience: 'agents' },
            { model: ShopOwner, userModel: 'ShopOwner', audience: 'shop_owners' },
            { model: Admin, userModel: 'Admin', audience: 'admins' }
        ];

        for (const userType of userTypes) {
            // Agar targetAudience 'all' yoki ushbu turdagi foydalanuvchilar bo'lsa
            if (notification.targetAudience === 'all' || notification.targetAudience === userType.audience) {
                const users = await userType.model.find({}, '_id').lean();
                
                const typeNotifications = users.map(user => ({
                    notification: notification._id,
                    user: user._id,
                    userModel: userType.userModel,
                    status: 'sent'
                }));
                
                userNotifications = userNotifications.concat(typeNotifications);
            }
        }

        // Agar maxsus foydalanuvchilar tanlangan bo'lsa
        if (notification.targetUsers && notification.targetUsers.length > 0) {
            // Maxsus foydalanuvchilar uchun UserNotification yaratish
            const specialNotifications = notification.targetUsers.map(userId => ({
                notification: notification._id,
                user: userId,
                userModel: 'Client', // Default to Client for special users
                status: 'sent'
            }));
            
            userNotifications = userNotifications.concat(specialNotifications);
        }

        await UserNotification.insertMany(userNotifications);

        // Xabarnoma holatini yakunlash
        await notification.markAsSent(userNotifications.length);

        res.json({
            success: true,
            message: "Xabarnoma muvaffaqiyatli yuborildi",
            data: {
                notificationId: notification._id,
                totalRecipients: userNotifications.length,
                sentAt: notification.sentAt
            }
        });

    } catch (error) {
        console.error('Send notification error:', error);
        
        // Xatolik bo'lsa, holatni qaytarish
        await Notification.findByIdAndUpdate(req.params.id, { status: 'failed' });
        
        res.status(500).json({
            success: false,
            message: "Xabarnoma yuborishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma rejalashtirish
const scheduleNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledAt } = req.body;

        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        if (notification.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: "Faqat loyiha holatidagi xabarnomalarni rejalashtirish mumkin"
            });
        }

        const scheduleDate = new Date(scheduledAt);
        if (scheduleDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Rejalashtirish sanasi kelajakda bo'lishi kerak"
            });
        }

        notification.scheduledAt = scheduleDate;
        notification.isScheduled = true;
        notification.status = 'scheduled';
        notification.updatedBy = req.user._id;

        await notification.save();

        res.json({
            success: true,
            message: "Xabarnoma muvaffaqiyatli rejalashtirildi",
            data: {
                notificationId: notification._id,
                scheduledAt: notification.scheduledAt
            }
        });

    } catch (error) {
        console.error('Schedule notification error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma rejalashtirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma statistikasi
const getNotificationStats = async (req, res) => {
    try {
        const stats = await Notification.getStats();
        
        const totalNotifications = await Notification.countDocuments();
        const totalRecipients = await UserNotification.countDocuments();
        const readNotifications = await UserNotification.countDocuments({ status: 'read' });
        const unreadNotifications = await UserNotification.countDocuments({ 
            status: { $in: ['sent', 'delivered'] }
        });

        res.json({
            success: true,
            data: {
                totalNotifications,
                totalRecipients,
                readNotifications,
                unreadNotifications,
                readRate: totalRecipients > 0 ? Math.round((readNotifications / totalRecipients) * 100) : 0,
                statusBreakdown: stats
            }
        });

    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: "Statistika olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Foydalanuvchi xabarnomalarini olish
const getUserNotifications = async (req, res) => {
    try {
        const { userId, userModel, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        if (!userId || !userModel) {
            return res.status(400).json({
                success: false,
                message: "Foydalanuvchi ID va model kiritilishi shart"
            });
        }

        const notifications = await UserNotification.getUserNotifications(
            userId, 
            userModel, 
            parseInt(limit), 
            skip
        );

        const total = await UserNotification.countDocuments({ 
            user: userId, 
            userModel 
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Foydalanuvchi xabarnomalarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma o'qilgan deb belgilash
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId, userId, userModel } = req.body;

        if (!notificationId || !userId || !userModel) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar kiritilishi shart"
            });
        }

        const userNotification = await UserNotification.markAsRead(
            notificationId, 
            userId, 
            userModel
        );

        if (!userNotification) {
            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi"
            });
        }

        // Notification statistikasini yangilash
        await Notification.findByIdAndUpdate(
            notificationId,
            { $inc: { readCount: 1 } }
        );

        res.json({
            success: true,
            message: "Xabarnoma o'qilgan deb belgilandi",
            data: userNotification
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnoma holatini yangilashda xatolik yuz berdi",
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
    getAdminInstallmentStats,
    processInstallmentPayment,
    cancelInstallmentPayment,
    // Seller management
    createSeller,
    getAllSellers,
    getSellerById,
    updateSeller,
    updateSellerStatus,
    updateSellerPassword,
    deleteSeller,
    // Agent management
    createAgent,
    getAllAgents,
    getAgentById,
    updateAgent,
    updateAgentStatus,
    deleteAgent,
    // Statistics
    getAdminStatistics,
    // Region management
    createRegion,
    getAllRegions,
    deleteRegion,
    // Seller shop assignment
    assignShopToSeller,
    removeShopFromSeller,
    // Seller service areas
    assignServiceAreasToSeller,
    // Payment schedule management
    getPaymentSchedules,
    confirmPaymentSchedule,
    rejectPaymentSchedule,
    // Interest rate management
    createOrUpdateInterestRate,
    getAllInterestRates,
    getActiveInterestRates,
    updateInterestRateStatus,
    deleteInterestRate,
    initializeDefaultInterestRates,
    // Notification management
    createNotification,
    getAllNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    sendNotification,
    scheduleNotification,
    getNotificationStats,
    getUserNotifications,
    markNotificationAsRead
};
