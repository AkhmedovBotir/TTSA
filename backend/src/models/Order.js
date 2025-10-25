const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    discount: {
        type: Number,
        default: 0
    }
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [orderItemSchema],
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalOriginalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    itemCount: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'online'],
        default: 'cash'
    },
    deliveryAddress: {
        fullName: String,
        phone: String,
        address: String,
        city: String,
        postalCode: String
    },
    deliveryNotes: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        default: null
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    isAccepted: {
        type: Boolean,
        default: false
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
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Order number generation
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `ORD${year}${month}${day}${random}`;
    }
    
    this.updatedAt = new Date();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

