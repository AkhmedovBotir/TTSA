const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

        // Telefon raqam formati
        if (!/^\+998[0-9]{9}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: "Noto'g'ri telefon raqam formati. Format: +998901234567"
            });
        }

        // Parol uzunligi
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
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
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (username) {
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

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    logoutUser
}; 