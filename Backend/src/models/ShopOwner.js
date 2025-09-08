const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { SHOP_OWNER_PERMISSIONS, STATIC_PERMISSIONS } = require('../config/permissions');

const shopOwnerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Ism kiritilishi shart"],
        trim: true,
        minlength: [3, "Ism kamida 3 ta belgidan iborat bo'lishi kerak"]
    },
    phone: {
        type: String,
        required: [true, "Telefon raqam kiritilishi shart"],
        unique: true,
        match: [/^\+998[0-9]{9}$/, "Noto'g'ri telefon raqam formati"]
    },
    username: {
        type: String,
        required: [true, "Username kiritilishi shart"],
        unique: true,
        trim: true,
        minlength: [3, "Username kamida 3 ta belgidan iborat bo'lishi kerak"]
    },
    password: {
        type: String,
        required: [true, "Parol kiritilishi shart"],
        minlength: [6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"]
    },
    permissions: [{
        type: String,
        enum: SHOP_OWNER_PERMISSIONS
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Parolni hashlash
shopOwnerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Parolni tekshirish metodi
shopOwnerSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Status tekshirish
shopOwnerSchema.methods.isActive = function() {
    return this.status === 'active';
};

// Ruxsatni tekshirish
shopOwnerSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes(permission);
};

// Ruxsatlarni validatsiya qilish
shopOwnerSchema.methods.validatePermissions = function(permissions) {
    if (!Array.isArray(permissions)) {
        return ["Ruxsatlar array bo'lishi kerak"];
    }
    
    const invalidPermissions = permissions.filter(
        permission => !SHOP_OWNER_PERMISSIONS.includes(permission)
    );
    
    return invalidPermissions;
};

// Statik ruxsatlarni tekshirish
shopOwnerSchema.methods.hasStaticPermission = function(permission) {
    return STATIC_PERMISSIONS[permission] || false;
};

const ShopOwner = mongoose.model('ShopOwner', shopOwnerSchema);

module.exports = ShopOwner;
