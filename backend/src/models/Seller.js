const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Sotuvchi to'liq ismi kiritilishi shart"],
        trim: true,
        minlength: [2, "Sotuvchi ismi kamida 2 ta belgidan iborat bo'lishi kerak"]
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
    phone: {
        type: String,
        required: [true, "Telefon raqam kiritilishi shart"],
        match: [/^\+998[0-9]{9}$/, "Noto'g'ri telefon raqam formati"],
        unique: true
    },
    shops: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop'
    }],
    serviceAreas: [{
        region: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region',
            required: true
        },
        districts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region'
        }],
        mfys: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region'
        }]
    }],
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive'],
            message: "Status 'active' yoki 'inactive' bo'lishi kerak"
        },
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdByType: {
        type: String,
        enum: ['Admin', 'ShopOwner'],
        default: 'Admin'
    },
    shopOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopOwner',
        default: null
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopOwner',
        default: null
    },
    assignedAt: {
        type: Date,
        default: null
    },
    // Bir nechta do'kon egasiga xizmat ko'rsatish uchun
    shopOwners: [{
        shopOwner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShopOwner',
            required: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShopOwner',
            required: true
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        serviceAreas: [{
            region: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Region',
                required: true
            },
            districts: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Region'
            }],
            mfys: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Region'
            }]
        }]
    }]
}, {
    timestamps: true
});

// Parolni hashlash
sellerSchema.pre('save', async function(next) {
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
sellerSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Password maydonini JSON ga o'tkazishda olib tashlash
sellerSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
