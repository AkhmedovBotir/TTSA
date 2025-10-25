const mongoose = require('mongoose');

const paymentScheduleSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    scheduleDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected'],
        default: 'pending'
    },
    confirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopOwner',
        default: null
    },
    confirmedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
paymentScheduleSchema.index({ seller: 1, shop: 1, scheduleDate: 1 });
paymentScheduleSchema.index({ status: 1, scheduleDate: 1 });

const PaymentSchedule = mongoose.model('PaymentSchedule', paymentScheduleSchema);

module.exports = PaymentSchedule;


