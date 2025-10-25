const mongoose = require('mongoose');

const agentProductSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agent',
        required: true
    },
    assignedQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    remainingQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopOwner',
        required: true
    },
    status: {
        type: String,
        enum: ['assigned', 'returned', 'sold'],
        default: 'assigned'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    returnedAt: Date,
    soldAt: Date
}, {
    timestamps: true
});

// Prevent duplicate assignments
agentProductSchema.index({ product: 1, agent: 1 }, { unique: true });

// Update product quantity when assigning to agent
agentProductSchema.pre('save', async function(next) {
    if (this.isNew) {
        const product = await mongoose.model('Product').findById(this.product);
        if (!product) {
            throw new Error('Product not found');
        }
        
        if (product.quantity < this.assignedQuantity) {
            throw new Error('Not enough quantity in stock');
        }
        
        // Update product quantity
        product.quantity -= this.assignedQuantity;
        await product.save();
        
        // Set remaining quantity
        this.remainingQuantity = this.assignedQuantity;
    }
    next();
});

const AgentProduct = mongoose.model('AgentProduct', agentProductSchema);

module.exports = AgentProduct;
