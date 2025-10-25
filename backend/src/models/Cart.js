const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    },
    totalOriginalPrice: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    itemCount: {
        type: Number,
        default: 0
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update totals when items change
cartSchema.pre('save', function(next) {
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.totalOriginalPrice = this.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    this.totalDiscount = this.totalOriginalPrice - this.totalPrice;
    this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.updatedAt = new Date();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;












