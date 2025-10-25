const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Xabarnoma sarlavhasi kiritilishi shart"],
        trim: true,
        maxlength: [200, "Sarlavha 200 ta belgidan ko'p bo'lmasligi kerak"]
    },
    message: {
        type: String,
        required: [true, "Xabarnoma matni kiritilishi shart"],
        trim: true,
        maxlength: [1000, "Xabar matni 1000 ta belgidan ko'p bo'lmasligi kerak"]
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'promotion'],
        default: 'info'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'clients', 'sellers', 'agents', 'shop_owners', 'admins'],
        required: [true, "Maqsadli auditoriya tanlanishi shart"]
    },
    targetUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetUserModel'
    }],
    targetUserModel: {
        type: String,
        enum: ['Client', 'Seller', 'Agent', 'ShopOwner', 'Admin']
    },
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    isScheduled: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
        default: 'draft'
    },
    sentAt: {
        type: Date
    },
    totalRecipients: {
        type: Number,
        default: 0
    },
    deliveredCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    readCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better performance
notificationSchema.index({ targetAudience: 1, status: 1 });
notificationSchema.index({ scheduledAt: 1 });
notificationSchema.index({ createdBy: 1 });
notificationSchema.index({ createdAt: -1 });

// Virtual for delivery rate
notificationSchema.virtual('deliveryRate').get(function() {
    if (this.totalRecipients === 0) return 0;
    return Math.round((this.deliveredCount / this.totalRecipients) * 100);
});

// Virtual for read rate
notificationSchema.virtual('readRate').get(function() {
    if (this.deliveredCount === 0) return 0;
    return Math.round((this.readCount / this.deliveredCount) * 100);
});

// Static method to get notifications by audience
notificationSchema.statics.getByAudience = function(audience, userId) {
    const query = { targetAudience: audience };
    
    if (audience !== 'all') {
        query.$or = [
            { targetAudience: audience },
            { targetAudience: 'all' }
        ];
    }
    
    return this.find(query)
        .populate('createdBy', 'username name')
        .sort({ createdAt: -1 });
};

// Static method to get notification statistics
notificationSchema.statics.getStats = function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRecipients: { $sum: '$totalRecipients' },
                deliveredCount: { $sum: '$deliveredCount' },
                readCount: { $sum: '$readCount' }
            }
        }
    ]);
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function(recipientsCount) {
    this.status = 'sent';
    this.sentAt = new Date();
    this.totalRecipients = recipientsCount;
    return this.save();
};

// Instance method to update delivery stats
notificationSchema.methods.updateDeliveryStats = function(delivered, failed) {
    this.deliveredCount += delivered;
    this.failedCount += failed;
    return this.save();
};

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);

