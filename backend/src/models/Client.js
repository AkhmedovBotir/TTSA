const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "Ism kiritilishi shart"],
        trim: true,
        minlength: [2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"]
    },
    lastName: {
        type: String,
        required: [true, "Familiya kiritilishi shart"],
        trim: true,
        minlength: [2, "Familiya kamida 2 ta belgidan iborat bo'lishi kerak"]
    },
    phoneNumber: {
        type: String,
        required: [true, "Telefon raqam kiritilishi shart"],
        unique: true,
        match: [/^\+998[0-9]{9}$/, "Noto'g'ri telefon raqam formati"]
    },
    password: {
        type: String,
        required: false,
        minlength: [6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"]
    },
    image: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        code: String,
        expiresAt: Date
    },
    lastLogin: {
        type: Date
    },
    location: {
        region: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region'
        },
        district: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region'
        },
        mfy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Region'
        }
    }
}, {
    timestamps: true
});

// Parolni hashlash
clientSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Parolni tekshirish metodi
clientSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Password maydonini JSON ga o'tkazishda olib tashlash
clientSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.verificationCode;
    return obj;
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client; 