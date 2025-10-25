const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ADMIN_PERMISSIONS } = require('../config/permissions');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\+998[0-9]{9}$/.test(v);
            },
            message: props => `${props.value} - noto'g'ri telefon raqam formati. Format: +998901234567`
        }
    },
    role: {
        type: String,
        enum: ['general', 'admin'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'blocked'],
        default: 'active',
        required: function() {
            return this.role === 'admin'; // Faqat oddiy adminlar uchun status
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: function() {
            return this.role === 'admin';
        }
    },
    permissions: [{
        type: String,
        enum: ADMIN_PERMISSIONS
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Password ni hashlab saqlash
adminSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    
    // General admin uchun barcha huquqlarni berish
    if (this.role === 'general') {
        this.permissions = ADMIN_PERMISSIONS;
        this.status = undefined; // General admin uchun status o'chiriladi
    }
    
    next();
});

// Password ni tekshirish metodi
adminSchema.methods.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Admin huquqlarini tekshirish metodi
adminSchema.methods.hasPermission = function(permission) {
    return this.role === 'general' || 
           (this.status === 'active' && this.permissions.includes(permission));
};

// Admin statusini tekshirish
adminSchema.methods.isActive = function() {
    return this.role === 'general' || this.status === 'active';
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
