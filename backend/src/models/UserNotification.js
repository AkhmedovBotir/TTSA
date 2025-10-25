const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
    notification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userModel: {
        type: String,
        enum: ['Client', 'Seller', 'Agent', 'ShopOwner', 'Admin'],
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    deliveredAt: {
        type: Date
    },
    readAt: {
        type: Date
    },
    failedAt: {
        type: Date
    },
    failureReason: {
        type: String
    },
    deviceInfo: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better performance
userNotificationSchema.index({ notification: 1 });
userNotificationSchema.index({ user: 1, userModel: 1 });
userNotificationSchema.index({ status: 1 });
userNotificationSchema.index({ createdAt: -1 });

// Compound index for user notifications
userNotificationSchema.index({ user: 1, userModel: 1, createdAt: -1 });

// Static method to mark as delivered
userNotificationSchema.statics.markAsDelivered = function(notificationId, userId, userModel, deviceInfo = {}) {
    return this.findOneAndUpdate(
        { notification: notificationId, user: userId, userModel },
        { 
            status: 'delivered',
            deliveredAt: new Date(),
            deviceInfo
        },
        { new: true }
    );
};

// Static method to mark as read
userNotificationSchema.statics.markAsRead = function(notificationId, userId, userModel) {
    return this.findOneAndUpdate(
        { notification: notificationId, user: userId, userModel },
        { 
            status: 'read',
            readAt: new Date()
        },
        { new: true }
    );
};

// Static method to mark as failed
userNotificationSchema.statics.markAsFailed = function(notificationId, userId, userModel, reason) {
    return this.findOneAndUpdate(
        { notification: notificationId, user: userId, userModel },
        { 
            status: 'failed',
            failedAt: new Date(),
            failureReason: reason
        },
        { new: true }
    );
};

// Static method to get user notifications
userNotificationSchema.statics.getUserNotifications = function(userId, userModel, limit = 20, skip = 0) {
    return this.find({ user: userId, userModel })
        .populate({
            path: 'notification',
            select: 'title message type priority createdAt'
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Static method to get unread count
userNotificationSchema.statics.getUnreadCount = function(userId, userModel) {
    return this.countDocuments({ 
        user: userId, 
        userModel, 
        status: { $in: ['sent', 'delivered'] }
    });
};

module.exports = mongoose.model('UserNotification', userNotificationSchema);

