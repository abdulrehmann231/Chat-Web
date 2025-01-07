const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'voice', 'media'],
    required: true,
    default: 'text'
  },
  content: {
    type: String,
    required: true  // For text messages or file URLs
  },
  encryptedContent: {
    type: String,    // Store encrypted content
    required: true
  },
  iv: {
    type: String,    // Initialization vector for encryption
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duration: {
    type: Number,  // For voice messages duration in seconds
    required: function() { return this.messageType === 'voice'; }
  },
  fileType: {
    type: String,  // For media messages: 'audio', 'image', 'video'
    required: function() { return this.messageType === 'media'; }
  },
  fileSize: {
    type: Number,  // Size in bytes
    required: function() { return this.messageType === 'media' || this.messageType === 'voice'; }
  },
  chatGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema); 