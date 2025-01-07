const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  chatGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatGroup'
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['ringing', 'ongoing', 'ended', 'missed', 'rejected'],
    default: 'ringing'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date
    },
    leftAt: {
      type: Date
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema); 