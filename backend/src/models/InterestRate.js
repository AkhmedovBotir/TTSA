const mongoose = require('mongoose');

const interestRateSchema = new mongoose.Schema({
    duration: {
        type: Number,
        required: true,
        unique: true,
        enum: [2, 3, 4, 5, 6, 10, 12],
        message: "Muddatli to'lov muddati 2, 3, 4, 5, 6, 10 yoki 12 oy bo'lishi mumkin"
    },
    interestRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        message: "Foiz stavkasi 0 dan 100 gacha bo'lishi kerak"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Index for efficient queries
interestRateSchema.index({ duration: 1, isActive: 1 });

// Static method to get active interest rate for a duration
interestRateSchema.statics.getActiveRate = function(duration) {
    return this.findOne({ duration, isActive: true });
};

// Static method to get all active rates
interestRateSchema.statics.getAllActiveRates = function() {
    return this.find({ isActive: true }).sort({ duration: 1 });
};

module.exports = mongoose.model('InterestRate', interestRateSchema);

