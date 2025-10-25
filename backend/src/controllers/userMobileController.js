const Client = require('../models/Client');
const SmsCode = require('../models/SmsCode');
const UserNotification = require('../models/UserNotification');
const Notification = require('../models/Notification');
const smsService = require('../services/smsService');
const Region = require('../models/Region');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Foydalanuvchi ro'yxatdan o'tkazish
const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, password, username } = req.body;

        // Majburiy maydonlarni tekshirish
        if (!firstName || !lastName || !phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Barcha majburiy maydonlar to'ldirilishi shart"
            });
        }

        // Telefon raqam formati - Uzbekiston raqamlari uchun
        if (!/^\+998[0-9]{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Parol uzunligi va kuchliligi
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }
        
        // Parol kuchliligini tekshirish
        if (password.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Parol 50 ta belgidan ko'p bo'lmasligi kerak"
            });
        }

        // Telefon raqam mavjudligini tekshirish
        const existingPhone = await Client.findOne({ phoneNumber });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
            });
        }

        // Username mavjudligini tekshirish (agar berilgan bo'lsa)
        if (username) {
            // Username formatini tekshirish
            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: "Username 3-20 ta belgi orasida bo'lishi kerak"
                });
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak"
                });
            }
            
            const existingUsername = await Client.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Bu username allaqachon band"
                });
            }
        }

        // Yangi foydalanuvchi yaratish
        const user = new Client({
            firstName,
            lastName,
            phoneNumber,
            password,
            username,
            isVerified: true // Avtomatik tasdiqlash
        });

        await user.save();

        // JWT token yaratish
        const token = jwt.sign(
            { userId: user._id, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tdi va tizimga kirildi",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: `${user.firstName} ${user.lastName}`,
                phoneNumber: user.phoneNumber,
                username: user.username,
                isVerified: user.isVerified,
                isLoggedIn: true
            },
            authStatus: {
                isAuthenticated: true,
                userType: 'user'
            }
        });

    } catch (error) {
        console.error('User registration error:', error);
        res.status(500).json({
            success: false,
            message: "Ro'yxatdan o'tishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Foydalanuvchi kirishi
const loginUser = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;

        if (!phoneNumber || !password) {
            return res.status(400).json({
                success: false,
                message: "Telefon raqam va parol kiritilishi shart"
            });
        }

        // Foydalanuvchini topish
        const user = await Client.findOne({ phoneNumber });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri telefon raqam yoki parol"
            });
        }

        // Parolni tekshirish
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Noto'g'ri telefon raqam yoki parol"
            });
        }

        // Status tekshirish - avtomatik faol
        // if (user.status !== 'active') {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Hisobingiz faol emas"
        //     });
        // }

        // JWT token yaratish
        const token = jwt.sign(
            { userId: user._id, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Oxirgi kirish vaqtini yangilash
        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Muvaffaqiyatli kirildi",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: `${user.firstName} ${user.lastName}`,
                phoneNumber: user.phoneNumber,
                username: user.username,
                isVerified: user.isVerified,
                isLoggedIn: true
            },
            authStatus: {
                isAuthenticated: true,
                userType: 'user'
            }
        });

    } catch (error) {
        console.error('User login error:', error);
        res.status(500).json({
            success: false,
            message: "Kirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Foydalanuvchi profilini olish
const getUserProfile = async (req, res) => {
    try {
        const user = await Client.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Foydalanuvchi topilmadi"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: `${user.firstName} ${user.lastName}`,
                phoneNumber: user.phoneNumber,
                username: user.username,
                image: user.image,
                isVerified: user.isVerified,
                isLoggedIn: true
            },
            authStatus: {
                isAuthenticated: true,
                userType: 'user'
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            message: "Profil ma'lumotlarini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Foydalanuvchi profilini yangilash
const updateUserProfile = async (req, res) => {
    try {
        const { firstName, lastName, username } = req.body;
        const user = await Client.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Foydalanuvchi topilmadi"
            });
        }

        // Yangilash
        if (firstName) {
            if (firstName.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak"
                });
            }
            user.firstName = firstName.trim();
        }
        
        if (lastName) {
            if (lastName.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"
                });
            }
            user.lastName = lastName.trim();
        }
        
        if (username) {
            // Username formatini tekshirish
            if (username.length < 3 || username.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: "Username 3-20 ta belgi orasida bo'lishi kerak"
                });
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: "Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi kerak"
                });
            }
            
            // Username uniqueligini tekshirish
            const existingUsername = await Client.findOne({ username, _id: { $ne: user._id } });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Bu username allaqachon band"
                });
            }
            user.username = username;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profil muvaffaqiyatli yangilandi",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: `${user.firstName} ${user.lastName}`,
                phoneNumber: user.phoneNumber,
                username: user.username,
                image: user.image,
                isVerified: user.isVerified
            }
        });

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: "Profilni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Parolni o'zgartirish
const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol kiritilishi shart"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }
        
        if (newPassword.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol 50 ta belgidan ko'p bo'lmasligi kerak"
            });
        }

        const user = await Client.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Foydalanuvchi topilmadi"
            });
        }

        // Yangi parolni o'rnatish
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Parol muvaffaqiyatli o'zgartirildi"
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: "Parolni o'zgartirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Parolni unutib qo'ygan holda tiklash
const forgotPassword = async (req, res) => {
    try {
        const { phoneNumber, newPassword } = req.body;

        if (!phoneNumber || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Telefon raqam va yangi parol kiritilishi shart"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"
            });
        }
        
        if (newPassword.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Yangi parol 50 ta belgidan ko'p bo'lmasligi kerak"
            });
        }

        const user = await Client.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Bu telefon raqam bilan ro'yxatdan o'tgan foydalanuvchi topilmadi"
            });
        }

        // Yangi parolni o'rnatish
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Parol muvaffaqiyatli tiklandi"
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: "Parolni tiklashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Foydalanuvchi chiqish
const logoutUser = async (req, res) => {
    try {
        // JWT token blacklist yoki database da saqlash mumkin
        // Hozircha oddiy response qaytarish
        res.status(200).json({
            success: true,
            message: "Muvaffaqiyatli chiqildi",
            authStatus: {
                isAuthenticated: false,
                userType: null
            }
        });
    } catch (error) {
        console.error('User logout error:', error);
        res.status(500).json({
            success: false,
            message: "Chiqishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// SMS kod yuborish
const sendSmsCode = async (req, res) => {
    try {
        const { phoneNumber, purpose = 'login' } = req.body;

        // Telefon raqam validatsiyasi
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Telefon raqam kiritilishi shart"
            });
        }

        // Telefon raqam formati tekshirish
        if (!/^\+998[0-9]{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Purpose validatsiyasi
        if (!['login', 'register', 'reset_password'].includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri maqsad. Ruxsat etilgan: login, register, reset_password"
            });
        }

        // Register uchun telefon raqam mavjudligini tekshirish
        if (purpose === 'register') {
            const existingUser = await Client.findOne({ phoneNumber });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan"
                });
            }
        }

        // Login uchun foydalanuvchi mavjudligini tekshirish
        if (purpose === 'login') {
            const existingUser = await Client.findOne({ phoneNumber });
            if (!existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Bu telefon raqam bilan ro'yxatdan o'tilmagan"
                });
            }
        }

        // Avvalgi kodlarni bekor qilish
        await SmsCode.updateMany(
            { phoneNumber, purpose, isUsed: false },
            { isUsed: true }
        );

        // Yangi kod yaratish
        const code = SmsCode.generateCode();
        const smsCode = new SmsCode({
            phoneNumber,
            code,
            purpose
        });

        await smsCode.save();

        // SMS yuborish Eskiz.uz orqali
        try {
            const smsResult = await smsService.sendSmsCode(phoneNumber, code, purpose);
            
            if (!smsResult.success) {
                // SMS yuborishda xatolik bo'lsa, kodni o'chirish
                await SmsCode.findByIdAndDelete(smsCode._id);
                
                return res.status(500).json({
                    success: false,
                    message: "SMS kod yuborishda xatolik yuz berdi",
                    error: smsResult.error
                });
            }
            
            console.log(`SMS kod yuborish jarayoni: ${phoneNumber} - ${code} (${purpose}) - ${smsResult.message}`);
            
        } catch (smsError) {
            // SMS yuborishda xatolik bo'lsa, kodni o'chirish
            await SmsCode.findByIdAndDelete(smsCode._id);
            
            console.error('SMS yuborishda xatolik:', smsError);
            return res.status(500).json({
                success: false,
                message: "SMS kod yuborishda xatolik yuz berdi",
                error: smsError.message
            });
        }
        
        // Development uchun kodni qaytarish (production da olib tashlash kerak)
        const response = {
            success: true,
            message: "SMS kod yuborish jarayoni boshlandi",
            data: {
                phoneNumber,
                purpose,
                expiresIn: 300 // 5 daqiqa
            }
        };

        // Development mode da kodni qaytarish
        if (process.env.NODE_ENV === 'development') {
            response.data.code = code;
            response.data.note = "Development mode: SMS kod ko'rsatilmoqda";
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('SMS kod yuborishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "SMS kod yuborishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// SMS kod tekshirish
const verifySmsCode = async (req, res) => {
    try {
        const { phoneNumber, code, purpose = 'login' } = req.body;

        console.log('SMS verification request:', { phoneNumber, code, purpose });

        // Majburiy maydonlarni tekshirish
        if (!phoneNumber || !code) {
            console.log('Missing required fields:', { phoneNumber: !!phoneNumber, code: !!code });
            return res.status(400).json({
                success: false,
                message: "Telefon raqam va kod kiritilishi shart"
            });
        }

        // Kod formati tekshirish
        if (!/^[0-9]{6}$/.test(code)) {
            console.log('Invalid code format:', { code, length: code?.length });
            return res.status(400).json({
                success: false,
                message: "Kod 6 ta raqamdan iborat bo'lishi kerak"
            });
        }

        // Kodni topish va tekshirish
        const smsCode = await SmsCode.findValidCode(phoneNumber, code, purpose);
        console.log('SMS code lookup result:', { found: !!smsCode, phoneNumber, code, purpose });

        if (!smsCode) {
            // Noto'g'ri kod uchun urinishlar sonini oshirish
            const failedCode = await SmsCode.findOne({
                phoneNumber,
                code,
                purpose,
                isUsed: false,
                expiresAt: { $gt: new Date() }
            });

            if (failedCode) {
                await failedCode.incrementAttempts();
            }

            return res.status(400).json({
                success: false,
                message: "Noto'g'ri kod yoki kod muddati tugagan"
            });
        }

        // Kodni ishlatilgan deb belgilash
        await smsCode.markAsUsed();

        // Response tayyorlash
        const response = {
            success: true,
            message: "SMS kod muvaffaqiyatli tasdiqlandi",
            data: {
                phoneNumber,
                purpose,
                verifiedAt: new Date()
            }
        };

        // Login uchun JWT token yaratish
        if (purpose === 'login') {
            const user = await Client.findOne({ phoneNumber });
            if (user) {
                const token = jwt.sign(
                    { 
                        userId: user._id, 
                        phoneNumber: user.phoneNumber,
                        role: 'user'
                    },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                response.data.token = token;
                response.data.user = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    username: user.username
                };
            }
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('SMS kod tekshirishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "SMS kod tekshirishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// SMS bilan ro'yxatdan o'tish
const registerWithSms = async (req, res) => {
    try {
        const { firstName, lastName, phoneNumber, username, smsCode } = req.body;

        // Majburiy maydonlarni tekshirish
        if (!firstName || !lastName || !phoneNumber || !smsCode) {
            return res.status(400).json({
                success: false,
                message: "Barcha majburiy maydonlar to'ldirilishi shart"
            });
        }

        // SMS kod tekshirish
        const validCode = await SmsCode.findValidCode(phoneNumber, smsCode, 'register');
        if (!validCode) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri SMS kod yoki kod muddati tugagan"
            });
        }

        // SMS kodni ishlatilgan deb belgilash
        await validCode.markAsUsed();

        // Foydalanuvchi yaratish
        const user = new Client({
            firstName,
            lastName,
            phoneNumber,
            username: username || phoneNumber,
            isPhoneVerified: true,
            isVerified: true
        });

        await user.save();

        // JWT token yaratish
        const token = jwt.sign(
            { 
                userId: user._id, 
                phoneNumber: user.phoneNumber,
                role: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: "Ro'yxatdan o'tish muvaffaqiyatli yakunlandi",
            data: {
                token,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    username: user.username,
                    isPhoneVerified: user.isPhoneVerified
                }
            }
        });

    } catch (error) {
        console.error('SMS bilan ro\'yxatdan o\'tishda xatolik:', error);
        res.status(500).json({
            success: false,
            message: "Ro'yxatdan o'tishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// ==================== NOTIFICATIONS ====================

// Foydalanuvchi xabarnomalarini olish
const getUserNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const userId = req.user.userId;
        const userModel = 'Client';

        const filter = { user: userId, userModel };
        if (status) {
            filter.status = status;
        }

        const notifications = await UserNotification.find(filter)
            .populate({
                path: 'notification',
                select: 'title message type priority createdAt'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await UserNotification.countDocuments(filter);
        const unreadCount = await UserNotification.countDocuments({ 
            user: userId, 
            userModel, 
            status: { $in: ['sent', 'delivered'] }
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            unreadCount
        });

    } catch (error) {
        console.error('Get user notifications error:', error);
        res.status(500).json({
            success: false,
            message: "Xabarnomalarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Xabarnoma o'qilgan deb belgilash
const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;
        const userModel = 'Client';

        console.log('Mark as read request:', { notificationId, userId, userModel });
        console.log('Request params:', req.params);
        console.log('Request user:', req.user);

        // Validate notificationId format
        if (!mongoose.Types.ObjectId.isValid(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri xabarnoma ID formati"
            });
        }

        // First check if the UserNotification exists
        const existingUserNotification = await UserNotification.findOne({
            notification: notificationId,
            user: userId,
            userModel
        });

        console.log('Existing UserNotification:', existingUserNotification);

        if (!existingUserNotification) {
            // Check if notification exists at all
            const notificationExists = await Notification.findById(notificationId);
            console.log('Notification exists:', !!notificationExists);

            // Check if user has any notifications
            const userNotifications = await UserNotification.find({ user: userId, userModel });
            console.log('User has notifications:', userNotifications.length);

            // Get user's actual notification IDs for debugging
            const userNotificationIds = userNotifications.map(un => un.notification.toString());
            console.log('User notification IDs:', userNotificationIds);

            return res.status(404).json({
                success: false,
                message: "Xabarnoma topilmadi yoki sizga tegishli emas",
                debug: {
                    notificationId,
                    userId,
                    userModel,
                    notificationExists: !!notificationExists,
                    userNotificationCount: userNotifications.length,
                    userNotificationIds: userNotificationIds
                }
            });
        }

        const userNotification = await UserNotification.markAsRead(
            notificationId, 
            userId, 
            userModel
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

// O'qilmagan xabarnomalar sonini olish
const getUnreadNotificationCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userModel = 'Client';

        const unreadCount = await UserNotification.getUnreadCount(userId, userModel);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });

    } catch (error) {
        console.error('Get unread notification count error:', error);
        res.status(500).json({
            success: false,
            message: "O'qilmagan xabarnomalar sonini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

// Hudud tanlash funksiyalari
const getRegions = async (req, res) => {
    try {
        const regions = await Region.find({ 
            type: 'region', 
            status: 'active' 
        }).select('name code').sort({ name: 1 });

        res.json({
            success: true,
            data: regions
        });

    } catch (error) {
        console.error('Get regions error:', error);
        res.status(500).json({
            success: false,
            message: "Hududlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

const getDistricts = async (req, res) => {
    try {
        const { regionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(regionId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri hudud ID"
            });
        }

        const districts = await Region.find({ 
            type: 'district', 
            parent: regionId,
            status: 'active' 
        }).select('name code').sort({ name: 1 });

        res.json({
            success: true,
            data: districts
        });

    } catch (error) {
        console.error('Get districts error:', error);
        res.status(500).json({
            success: false,
            message: "Tumanlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

const getMfys = async (req, res) => {
    try {
        const { districtId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(districtId)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri tuman ID"
            });
        }

        const mfys = await Region.find({ 
            type: 'mfy', 
            parent: districtId,
            status: 'active' 
        }).select('name code').sort({ name: 1 });

        res.json({
            success: true,
            data: mfys
        });

    } catch (error) {
        console.error('Get MFYs error:', error);
        res.status(500).json({
            success: false,
            message: "MFYlarni olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

const getUserLocation = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const user = await Client.findById(userId).populate({
            path: 'location.region',
            select: 'name code type'
        }).populate({
            path: 'location.district',
            select: 'name code type'
        }).populate({
            path: 'location.mfy',
            select: 'name code type'
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Foydalanuvchi topilmadi"
            });
        }

        res.json({
            success: true,
            data: {
                location: user.location
            }
        });

    } catch (error) {
        console.error('Get user location error:', error);
        res.status(500).json({
            success: false,
            message: "Foydalanuvchi manzilini olishda xatolik yuz berdi",
            error: error.message
        });
    }
};

const updateUserLocation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { regionId, districtId, mfyId } = req.body;

        // Validation
        if (!regionId) {
            return res.status(400).json({
                success: false,
                message: "Hudud tanlanishi shart"
            });
        }

        // Region mavjudligini tekshirish
        const region = await Region.findById(regionId);
        if (!region || region.type !== 'region') {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri hudud"
            });
        }

        let district = null;
        let mfy = null;

        // District mavjudligini tekshirish
        if (districtId) {
            district = await Region.findById(districtId);
            if (!district || district.type !== 'district' || district.parent.toString() !== regionId) {
                return res.status(400).json({
                    success: false,
                    message: "Noto'g'ri tuman"
                });
            }

            // MFY mavjudligini tekshirish
            if (mfyId) {
                mfy = await Region.findById(mfyId);
                if (!mfy || mfy.type !== 'mfy' || mfy.parent.toString() !== districtId) {
                    return res.status(400).json({
                        success: false,
                        message: "Noto'g'ri MFY"
                    });
                }
            }
        }

        // Foydalanuvchi manzilini yangilash
        const user = await Client.findByIdAndUpdate(
            userId,
            {
                location: {
                    region: regionId,
                    district: districtId || null,
                    mfy: mfyId || null
                }
            },
            { new: true }
        ).populate({
            path: 'location.region',
            select: 'name code type'
        }).populate({
            path: 'location.district',
            select: 'name code type'
        }).populate({
            path: 'location.mfy',
            select: 'name code type'
        });

        res.json({
            success: true,
            message: "Manzil muvaffaqiyatli yangilandi",
            data: {
                location: user.location
            }
        });

    } catch (error) {
        console.error('Update user location error:', error);
        res.status(500).json({
            success: false,
            message: "Manzilni yangilashda xatolik yuz berdi",
            error: error.message
        });
    }
};

// SMS Service Test Functions (Development only)
const testSmsService = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: "Telefon raqam va xabar kiritilishi shart"
            });
        }

        const result = await smsService.sendSms(phoneNumber, message);
        
        res.json({
            success: true,
            message: "SMS test natijasi",
            data: result
        });
    } catch (error) {
        console.error('SMS test error:', error);
        res.status(500).json({
            success: false,
            message: "SMS testda xatolik",
            error: error.message
        });
    }
};

const getSmsBalance = async (req, res) => {
    try {
        const result = await smsService.getBalance();
        
        res.json({
            success: true,
            message: "SMS balans ma'lumoti",
            data: result
        });
    } catch (error) {
        console.error('SMS balance error:', error);
        res.status(500).json({
            success: false,
            message: "SMS balansini olishda xatolik",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    logoutUser,
    sendSmsCode,
    verifySmsCode,
    registerWithSms,
    getUserNotifications,
    markNotificationAsRead,
    getUnreadNotificationCount,
    getRegions,
    getDistricts,
    getMfys,
    getUserLocation,
    updateUserLocation,
    testSmsService,
    getSmsBalance
}; 