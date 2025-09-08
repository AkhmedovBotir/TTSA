const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
    orderId: { 
        type: Number, 
        required: true, 
        index: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller', 
        required: true 
    },
    storeOwner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ShopOwner', 
        required: true 
    },
    products: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Product', 
            required: true 
        },
        name: { 
            type: String, 
            required: true 
        },
        quantity: { 
            type: mongoose.Types.Decimal128, 
            required: true, 
            min: 0.01 
        },
        price: { 
            type: mongoose.Types.Decimal128, 
            required: true, 
            min: 0 
        },
        unit: { 
            type: String, 
            required: true 
        },
        unitSize: { 
            type: Number, 
            required: true 
        }
    }],
    totalSum: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    status: { 
        type: String, 
        enum: ['completed', 'cancelled'], 
        default: 'completed' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'installment'], 
        default: 'cash' 
    },
    completedAt: { 
        type: Date 
    },
    cancelledAt: { 
        type: Date 
    },
    cancelledBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller' 
    },
    cancelReason: { 
        type: String 
    }
}, { 
    timestamps: true 
});

// Pre-save hook to set completedAt for new orders
orderHistorySchema.pre('save', function(next) {
    if (this.isNew && this.status === 'completed' && !this.completedAt) {
        this.completedAt = new Date();
    }
    next();
});

module.exports = mongoose.model('OrderHistory', orderHistorySchema);
