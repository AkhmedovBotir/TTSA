const mongoose = require('mongoose');

const smsCodeSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        match: [/^\+998[0-9]{9}$/, "Telefon raqam noto'g'ri formatda. Format: +998901234567"]
    },
    code: {
        type: String,
        required: true,
        length: 6
    },
    purpose: {
        type: String,
        enum: ['login', 'register', 'reset_password'],
        required: true
    },
    attempts: {
        type: Number,
        default: 0,
        max: 5
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 daqiqa
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
smsCodeSchema.index({ phoneNumber: 1, purpose: 1 });
smsCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired codes

// Static method to generate random 6-digit code
smsCodeSchema.statics.generateCode = function() {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to find valid code
smsCodeSchema.statics.findValidCode = function(phoneNumber, code, purpose) {
    return this.findOne({
        phoneNumber,
        code,
        purpose,
        isUsed: false,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 }
    });
};

// Instance method to mark as used
smsCodeSchema.methods.markAsUsed = function() {
    this.isUsed = true;
    return this.save();
};

// Instance method to increment attempts
smsCodeSchema.methods.incrementAttempts = function() {
    this.attempts += 1;
    return this.save();
};

module.exports = mongoose.model('SmsCode', smsCodeSchema);

