// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// const mongoose = require('mongoose');
// const Admin = require('../models/Admin');
// const connectDB = require('../config/database');

// // Barcha mavjud ruxsatlar
// const ALL_PERMISSIONS = [
//     'manage_admins',
//     'manage_tariffs',
//     'manage_shops',
//     'manage_shop_owners',
//     'manage_assistants',
//     'manage_categories',
//     'manage_products',
//     'manage_orders',
//     'manage_installments',
//     'manage_contracts',
//     'view_statistics'
// ];

// const createGeneralAdmin = async () => {
//     try {
//         // MongoDB ga ulanish
//         await connectDB();

//         // Avval general admin mavjudligini tekshirish
//         const existingAdmin = await Admin.findOne({ role: 'general' });
        
//         if (existingAdmin) {
//             console.log('\x1b[33m%s\x1b[0m', 'General admin allaqachon mavjud!');
//             console.log('Username:', existingAdmin.username);
//             console.log('Fullname:', existingAdmin.fullname);
//             console.log('Phone:', existingAdmin.phone);
//             console.log('Role:', existingAdmin.role);
//             console.log('Permissions:', existingAdmin.permissions.join(', '));
//             process.exit(0);
//         }

//         // Yangi general admin yaratish
//         const admin = new Admin({
//             username: 'general',
//             password: 'general123',
//             fullname: 'General Admin',
//             phone: '+998901234567',
//             role: 'general',
//             permissions: ALL_PERMISSIONS
//         });

//         await admin.save();

//         console.log('\x1b[32m%s\x1b[0m', '\nGeneral admin muvaffaqiyatli yaratildi!');
//         console.log('\nAdmin ma\'lumotlari:');
//         console.log('Username:', admin.username);
//         console.log('Password: general123');
//         console.log('Fullname:', admin.fullname);
//         console.log('Phone:', admin.phone);
//         console.log('Role:', admin.role);
//         console.log('\nRuxsatlar:');
//         admin.permissions.forEach(permission => {
//             console.log('- ' + permission);
//         });
        
//         console.log('\n\x1b[31m%s\x1b[0m', 'MUHIM: Iltimos, general admin ma\'lumotlarini o\'zgartirishni unutmang!');
//         console.log('\x1b[31m%s\x1b[0m', '- Telefon raqamni o\'zgartiring');
//         console.log('\x1b[31m%s\x1b[0m', '- To\'liq ismni o\'zgartiring');
//         console.log('\x1b[31m%s\x1b[0m', '- Parolni o\'zgartiring');
        
//         process.exit(0);
//     } catch (error) {
//         console.error('\x1b[31m%s\x1b[0m', '\nXatolik yuz berdi:');
//         console.error(error.message);
        
//         if (error.code === 'ECONNREFUSED') {
//             console.error('\nMongoDB serverga ulanib bo\'lmadi. MongoDB server ishga tushirilganligini tekshiring.');
//         } else if (error.name === 'ValidationError') {
//             console.error('\nMa\'lumotlar validatsiyasida xatolik:');
//             Object.values(error.errors).forEach(err => console.error('- ' + err.message));
//         }
        
//         process.exit(1);
//     } finally {
//         try {
//             await mongoose.disconnect();
//             console.log('\nMongoDB dan uzildi');
//         } catch (err) {
//             console.error('MongoDB dan uzilishda xatolik:', err.message);
//         }
//     }
// };

// createGeneralAdmin();

// createAdmin.js
const mongoose = require('mongoose');
const Admin = require('../models/Admin'); // yo'lni loyihangizga moslang

// .env dan olingan MONGODB_URI ni yozing yoki to'g'ridan-to'g'ri yozing
const MONGODB_URI = 'mongodb://localhost:27017/shop'; // o'zgartiring

async function createAdmin() {
    await mongoose.connect(MONGODB_URI);

    const admin = new Admin({
        username: 'admin',
        password: 'admin123', // parol avtomatik hashlanadi
        fullname: 'Admin',
        phone: '+998901234567',
        role: 'general' // yoki 'admin'
        // status, permissions, createdBy - kerak bo'lsa qo'shing
    });

    await admin.save();
    console.log('Admin yaratildi:', admin);

    await mongoose.disconnect();
}

createAdmin().catch(console.error);