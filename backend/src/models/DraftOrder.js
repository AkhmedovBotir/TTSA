const mongoose = require('mongoose');

const draftOrderSchema = new mongoose.Schema({
    orderId: { 
        type: Number, 
        unique: true 
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Seller', 
        required: true 
    },
    storeOwner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shop', // Changed to reference Shop model
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
            required: true,
            default: 1
        }
    }],
    status: { 
        type: String, 
        enum: ['draft', 'completed'], 
        default: 'draft' 
    },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'installment'], 
        default: 'cash' 
    },
    totalSum: { 
        type: mongoose.Types.Decimal128, 
        required: true, 
        min: 0 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Pre-save hook to generate orderId
draftOrderSchema.pre('save', async function(next) {
    if (this.isNew) {
        const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'orderId': -1 } });
        this.orderId = lastOrder ? lastOrder.orderId + 1 : 1001;
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('DraftOrder', draftOrderSchema);
