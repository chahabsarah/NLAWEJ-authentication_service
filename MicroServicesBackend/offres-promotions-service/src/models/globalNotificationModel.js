const mongoose = require('mongoose');

const globalNotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'artisan', 'habitant']
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

globalNotificationSchema.index({ targetRoles: 1, createdAt: -1 });
globalNotificationSchema.index({ readBy: 1 });

module.exports = mongoose.model('GlobalNotification', globalNotificationSchema);