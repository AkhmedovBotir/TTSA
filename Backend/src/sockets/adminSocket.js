const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const mongoose = require('mongoose');

// Socket middleware - faqat autentifikatsiya qilingan adminlar ulanishi mumkin
const adminSocketAuth = (socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error('Token topilmadi'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.admin = decoded;
        next();
    } catch (error) {
        next(new Error('Noto\'g\'ri token'));
    }
};

// Admin socket eventlarini sozlash
const setupAdminSocket = (io) => {
    // Admin namespace yaratish
    const adminNamespace = io.of('/admin');
    
    // Middleware qo'shish
    adminNamespace.use(adminSocketAuth);

    // Ulanish
    adminNamespace.on('connection', async (socket) => {
        console.log('Admin ulandi:', socket.admin.username);

        // Admin xonasiga qo'shilish
        socket.join('admins');
        
        // General admin yoki manage_admins huquqi borlar maxsus xonaga qo'shiladi
        if (socket.admin.role === 'general' || socket.admin.permissions.includes('manage_admins')) {
            socket.join('admin_managers');
        }

        // Admin yaratilganda
        socket.on('admin:create', async (data) => {
            try {
                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && !socket.admin.permissions.includes('manage_admins')) {
                    socket.emit('error', { message: "Sizda adminlarni yaratish huquqi yo'q" });
                    return;
                }

                const { username, password, fullname, phone, permissions = [], status = 'active' } = data;

                // Validatsiyalar
                if (!username || !password || !fullname || !phone) {
                    socket.emit('error', { message: "Barcha maydonlar to'ldirilishi shart" });
                    return;
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
                    createdBy: socket.admin.id
                });

                await newAdmin.save();

                // Admin managerlarga xabar yuborish
                adminNamespace.to('admin_managers').emit('admin:created', {
                    id: newAdmin._id,
                    username: newAdmin.username,
                    fullname: newAdmin.fullname,
                    phone: newAdmin.phone,
                    role: newAdmin.role,
                    status: newAdmin.status,
                    permissions: newAdmin.permissions
                });

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Admin o'zgartirilganda
        socket.on('admin:update', async (data) => {
            try {
                const { id, updates } = data;

                // ID validatsiyasi
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    socket.emit('error', { message: "Noto'g'ri ID formati" });
                    return;
                }

                // Adminni topish
                const admin = await Admin.findById(id);
                if (!admin) {
                    socket.emit('error', { message: "Admin topilmadi" });
                    return;
                }

                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && 
                    !socket.admin.permissions.includes('manage_admins') && 
                    socket.admin.id !== id) {
                    socket.emit('error', { message: "Sizda bu adminni o'zgartirish huquqi yo'q" });
                    return;
                }

                // O'zgarishlarni saqlash
                const updatedAdmin = await Admin.findByIdAndUpdate(
                    id,
                    updates,
                    { new: true, select: '-password -__v' }
                );

                // Admin managerlarga xabar yuborish
                adminNamespace.to('admin_managers').emit('admin:updated', updatedAdmin);

                // Agar admin o'z ma'lumotlarini o'zgartirgan bo'lsa, unga ham yuborish
                if (socket.admin.id === id) {
                    socket.emit('admin:updated', updatedAdmin);
                }

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Admin o'chirilganda
        socket.on('admin:delete', async (data) => {
            try {
                const { id } = data;

                // ID validatsiyasi
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    socket.emit('error', { message: "Noto'g'ri ID formati" });
                    return;
                }

                // Adminni topish
                const admin = await Admin.findById(id);
                if (!admin) {
                    socket.emit('error', { message: "Admin topilmadi" });
                    return;
                }

                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && !socket.admin.permissions.includes('manage_admins')) {
                    socket.emit('error', { message: "Sizda adminlarni o'chirish huquqi yo'q" });
                    return;
                }

                // General adminni o'chirib bo'lmaydi
                if (admin.role === 'general') {
                    socket.emit('error', { message: "General adminni o'chirib bo'lmaydi" });
                    return;
                }

                // O'zini o'zi o'chira olmaydi
                if (socket.admin.id === id) {
                    socket.emit('error', { message: "O'zingizni o'chira olmaysiz" });
                    return;
                }

                // Adminni o'chirish
                await Admin.findByIdAndDelete(id);

                // Admin managerlarga xabar yuborish
                adminNamespace.to('admin_managers').emit('admin:deleted', { id });

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Admin statusini o'zgartirish
        socket.on('admin:status', async (data) => {
            try {
                const { id, status } = data;

                // ID validatsiyasi
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    socket.emit('error', { message: "Noto'g'ri ID formati" });
                    return;
                }

                // Status validatsiyasi
                if (!['active', 'inactive', 'blocked'].includes(status)) {
                    socket.emit('error', { message: "Noto'g'ri status" });
                    return;
                }

                // Adminni topish
                const admin = await Admin.findById(id);
                if (!admin) {
                    socket.emit('error', { message: "Admin topilmadi" });
                    return;
                }

                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && !socket.admin.permissions.includes('manage_admins')) {
                    socket.emit('error', { message: "Sizda admin statusini o'zgartirish huquqi yo'q" });
                    return;
                }

                // General adminni statusini o'zgartirib bo'lmaydi
                if (admin.role === 'general') {
                    socket.emit('error', { message: "General admin statusini o'zgartirib bo'lmaydi" });
                    return;
                }

                // Statusni o'zgartirish
                admin.status = status;
                await admin.save();

                // Admin managerlarga xabar yuborish
                adminNamespace.to('admin_managers').emit('admin:status_changed', { 
                    id,
                    status,
                    username: admin.username
                });

                // Status o'zgargan admin online bo'lsa, uni chiqarib yuborish
                const adminSocket = await adminNamespace.in(id).fetchSockets();
                if (status !== 'active' && adminSocket.length > 0) {
                    adminSocket[0].emit('admin:force_logout', { 
                        message: "Sizning statusingiz o'zgartirildi. Iltimos qaytadan kiring."
                    });
                    adminSocket[0].disconnect();
                }

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Admin ruxsatlarini o'zgartirish
        socket.on('admin:permissions', async (data) => {
            try {
                const { id, permissions } = data;

                // ID validatsiyasi
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    socket.emit('error', { message: "Noto'g'ri ID formati" });
                    return;
                }

                // Permissions validatsiyasi
                if (!Array.isArray(permissions)) {
                    socket.emit('error', { message: "Permissions array bo'lishi kerak" });
                    return;
                }

                // Adminni topish
                const admin = await Admin.findById(id);
                if (!admin) {
                    socket.emit('error', { message: "Admin topilmadi" });
                    return;
                }

                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && !socket.admin.permissions.includes('manage_admins')) {
                    socket.emit('error', { message: "Sizda admin ruxsatlarini o'zgartirish huquqi yo'q" });
                    return;
                }

                // General adminni ruxsatlarini o'zgartirib bo'lmaydi
                if (admin.role === 'general') {
                    socket.emit('error', { message: "General admin ruxsatlarini o'zgartirib bo'lmaydi" });
                    return;
                }

                // Ruxsatlarni o'zgartirish
                admin.permissions = permissions;
                await admin.save();

                // Admin managerlarga xabar yuborish
                adminNamespace.to('admin_managers').emit('admin:permissions_changed', {
                    id,
                    permissions,
                    username: admin.username
                });

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Adminlar ro'yxatini olish
        socket.on('admin:list', async () => {
            try {
                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && !socket.admin.permissions.includes('manage_admins')) {
                    socket.emit('error', { message: "Sizda adminlar ro'yxatini ko'rish huquqi yo'q" });
                    return;
                }

                // Adminlarni olish
                const admins = await Admin.find({}, '-password -__v')
                    .sort({ createdAt: -1 });

                socket.emit('admin:list', admins);

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Admin ma'lumotlarini olish
        socket.on('admin:get', async (data) => {
            try {
                const { id } = data;

                // ID validatsiyasi
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    socket.emit('error', { message: "Noto'g'ri ID formati" });
                    return;
                }

                // Adminni topish
                const admin = await Admin.findById(id, '-password -__v')
                    .populate('createdBy', 'username fullname');

                if (!admin) {
                    socket.emit('error', { message: "Admin topilmadi" });
                    return;
                }

                // Ruxsatlarni tekshirish
                if (socket.admin.role !== 'general' && 
                    !socket.admin.permissions.includes('manage_admins') && 
                    socket.admin.id !== id) {
                    socket.emit('error', { message: "Sizda bu ma'lumotlarni ko'rish huquqi yo'q" });
                    return;
                }

                socket.emit('admin:get', admin);

            } catch (error) {
                socket.emit('error', { message: "Xatolik yuz berdi" });
            }
        });

        // Ulanish uzilganda
        socket.on('disconnect', () => {
            console.log('Admin uzildi:', socket.admin.username);
        });
    });

    return adminNamespace;
};

module.exports = setupAdminSocket;
