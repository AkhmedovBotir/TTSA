const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Login
const login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        // Clientni bazadan topish
        const client = await Client.findOne({ phoneNumber });
        
        if (!client) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri telefon raqam yoki parol"
            });
        }

        // Parolni tekshirish
        const isMatch = await client.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri telefon raqam yoki parol"
            });
        }

        // Login vaqtini yangilash
        client.lastLogin = new Date();
        await client.save();

        // Token yaratish
        const token = jwt.sign(
            { _id: client._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            message: "Muvaffaqiyatli login qilindi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Register
const register = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, password } = req.body;

        // Asosiy maydonlar validatsiyasi
        if (!firstName || !lastName || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Barcha maydonlar to'ldirilishi shart"
            });
        }

        // Telefon raqam validatsiyasi
        if (!/^\+998[0-9]{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Parol validatsiyasi
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Telefon raqam band emasligini tekshirish
        const existingClient = await Client.findOne({ phoneNumber });
        if (existingClient) {
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
            });
        }

        // Yangi client yaratish
        const client = new Client({
            firstName,
            lastName,
            phoneNumber,
            password
        });

        await client.save();

        // Token yaratish
        const token = jwt.sign(
            { _id: client._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: client,
            message: "Muvaffaqiyatli ro'yxatdan o'tildi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// SMS Verification
const verifySMS = async (req, res) => {
    try {
        const { smsCode } = req.body;
        const client = req.client;

        // SMS kod validatsiyasi
        if (!smsCode || smsCode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: "SMS kod 6 ta raqamdan iborat bo'lishi kerak"
            });
        }

        // SMS kodni tekshirish
        if (!client.verificationCode || 
            client.verificationCode.code !== smsCode || 
            client.verificationCode.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri yoki muddati o'tgan SMS kod"
            });
        }

        // Clientni tasdiqlash
        client.isVerified = true;
        client.verificationCode = undefined;
        await client.save();

        res.json({
            success: true,
            message: "Telefon raqam muvaffaqiyatli tasdiqlandi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        const client = req.client;
        res.json({
            success: true,
            user: client,
            message: "Profil ma'lumotlari muvaffaqiyatli olindi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;
        const client = req.client;

        // Validatsiya
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: "Ism va familiya kiritilishi shart"
            });
        }

        // Profilni yangilash
        client.firstName = firstName;
        client.lastName = lastName;
        await client.save();

        res.json({
            success: true,
            message: "Profil muvaffaqiyatli yangilandi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Update Profile Image
const updateProfileImage = async (req, res) => {
    try {
        const client = req.client;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Rasm yuklanmadi"
            });
        }

        // Rasmlarni saqlash uchun multer sozlamalari
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, 'uploads/clients')
            },
            filename: function (req, file, cb) {
                cb(null, `${client._id}-${Date.now()}${path.extname(file.originalname)}`)
            }
        });

        const upload = multer({ 
            storage: storage,
            limits: {
                fileSize: 5 * 1024 * 1024 // 5MB
            },
            fileFilter: function (req, file, cb) {
                const filetypes = /jpeg|jpg|png/;
                const mimetype = filetypes.test(file.mimetype);
                const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

                if (mimetype && extname) {
                    return cb(null, true);
                }
                cb(new Error('Faqat rasm fayllari yuklanishi mumkin!'));
            }
        }).single('image');

        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            // Profil rasmini yangilash
            client.image = req.file.path;
            await client.save();

            res.json({
                success: true,
                message: "Profil rasmi muvaffaqiyatli yangilandi"
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const client = req.client;

        // Validatsiya
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Joriy parol va yangi parol kiritilishi shart"
            });
        }

        // Joriy parolni tekshirish
        const isMatch = await client.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Joriy parol noto'g'ri"
            });
        }

        // Yangi parol validatsiyasi
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }

        // Parolni yangilash
        client.password = newPassword;
        await client.save();

        res.json({
            success: true,
            message: "Parol muvaffaqiyatli o'zgartirildi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        // Token'ni bekor qilish uchun blacklist ga qo'shish kerak
        // Bu yerda oddiy response qaytaramiz
        res.json({
            success: true,
            message: "Muvaffaqiyatli chiqildi"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Serverda xatolik yuz berdi"
        });
    }
};

module.exports = {
    login,
    register,
    verifySMS,
    getProfile,
    updateProfile,
    updateProfileImage,
    changePassword,
    logout
}; 