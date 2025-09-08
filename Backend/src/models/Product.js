const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        default: function() { return this.price; },
        min: 0
    },
    image: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    unit: {
        type: String,
        default: 'dona',
        trim: true
    },
    unitSize: {
        type: Number,
        default: 1,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'createdByModel',
        required: true
    },
    createdByModel: {
        type: String,
        enum: ['Admin', 'ShopOwner'],
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 