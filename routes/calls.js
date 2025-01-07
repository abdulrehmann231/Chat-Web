const express = require('express');
const Call = require('../models/Call');
const User = require('../models/User');

const router = express.Router();

// Initiate a call
router.post('/initiate', async (req, res) => {
  const { initiator, recipients, type, chatGroup } = req.body;
  try {
    const call = new Call({
      initiator,
      recipients,
      type,
      chatGroup,
      participants: [{
        user: initiator,
        joinedAt: new Date()
      }]
    });
    await call.save();
    res.status(201).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Failed to initiate call' });
  }
});

// Accept a call
router.post('/accept', async (req, res) => {
  const { callId, userId } = req.body;
  try {
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    if (call.status === 'ended') {
      return res.status(400).json({ message: 'Call has already ended' });
    }

    // Update call status and add participant
    call.status = 'ongoing';
    if (!call.startTime) {
      call.startTime = new Date();
    }
    call.participants.push({
      user: userId,
      joinedAt: new Date()
    });
    await call.save();

    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept call' });
  }
});

// Reject a call
router.post('/reject', async (req, res) => {
  const { callId, userId } = req.body;
  try {
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    call.status = 'rejected';
    await call.save();
    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject call' });
  }
});

// End a call
router.post('/end', async (req, res) => {
  const { callId } = req.body;
  try {
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    call.status = 'ended';
    call.endTime = new Date();
    
    // Set leftAt for all active participants
    call.participants.forEach(participant => {
      if (!participant.leftAt) {
        participant.leftAt = new Date();
      }
    });

    await call.save();
    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Failed to end call' });
  }
});

// Leave a call (for group calls)
router.post('/leave', async (req, res) => {
  const { callId, userId } = req.body;
  try {
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Find the participant and set their leftAt time
    const participant = call.participants.find(p => p.user.toString() === userId);
    if (participant) {
      participant.leftAt = new Date();
    }

    // If all participants have left, end the call
    const activeParticipants = call.participants.filter(p => !p.leftAt);
    if (activeParticipants.length === 0) {
      call.status = 'ended';
      call.endTime = new Date();
    }

    await call.save();
    res.status(200).json(call);
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave call' });
  }
});

// Get call history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const calls = await Call.find({
      $or: [
        { initiator: req.params.userId },
        { recipients: req.params.userId }
      ]
    })
    .populate('initiator', 'username')
    .populate('recipients', 'username')
    .populate('participants.user', 'username')
    .sort({ createdAt: -1 });

    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve call history' });
  }
});

// Get active call for a user
router.get('/active/:userId', async (req, res) => {
  try {
    const activeCall = await Call.findOne({
      $or: [
        { initiator: req.params.userId },
        { recipients: req.params.userId }
      ],
      status: { $in: ['ringing', 'ongoing'] }
    })
    .populate('initiator', 'username')
    .populate('recipients', 'username')
    .populate('participants.user', 'username');

    res.status(200).json(activeCall);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve active call' });
  }
});

module.exports = router; 