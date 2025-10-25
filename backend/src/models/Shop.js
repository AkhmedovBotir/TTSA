const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Do'kon nomi kiritilishi shart"],
        trim: true,
        minlength: [2, "Do'kon nomi kamida 2 ta belgidan iborat bo'lishi kerak"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopOwner',
        required: [true, "Do'kon egasi kiritilishi shart"]
    },
    phone: {
        type: String,
        required: [true, "Telefon raqam kiritilishi shart"],
        match: [/^\+998[0-9]{9}$/, "Noto'g'ri telefon raqam formati"],
        unique: true
    },
    inn: {
        type: String,
        required: [true, "STIR (INN) raqami kiritilishi shart"],
        match: [/^\d{9}$/, "STIR (INN) raqami 9 ta raqamdan iborat bo'lishi kerak"],
        unique: true,
        trim: true
    },
    address: {
        type: String,
        required: [true, "Manzil kiritilishi shart"],
        trim: true,
        minlength: [10, "Manzil kamida 10 ta belgidan iborat bo'lishi kerak"]
    },
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
        ref: 'Admin',
        required: true
    }
}, {
    timestamps: true
});

// Do'kon nomi, manzili va INN ni unique qilish
shopSchema.index({ name: 1, address: 1 }, { unique: true });
shopSchema.index({ inn: 1 }, { unique: true });

const Shop = mongoose.model('Shop', shopSchema);

module.exports = Shop;
