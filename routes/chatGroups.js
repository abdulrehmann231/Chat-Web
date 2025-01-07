const express = require('express');
const ChatGroup = require('../models/ChatGroup');
const User = require('../models/User');

const router = express.Router();

// Create a chat group
router.post('/create', async (req, res) => {
  const { name, members } = req.body;
  try {
    const chatGroup = new ChatGroup({ name, members });
    await chatGroup.save();
    res.status(201).json(chatGroup);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create chat group' });
  }
});

// Get all chat groups for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const chatGroups = await ChatGroup.find({ members: req.params.userId });
    res.status(200).json(chatGroups);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve chat groups' });
  }
});

// Add a friend to a chat group
router.post('/addFriend', async (req, res) => {
  const { chatGroupId, userId, friendId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'User is not a friend' });
    }

    await ChatGroup.findByIdAndUpdate(chatGroupId, { $addToSet: { members: friendId } });
    res.status(200).json({ message: 'Friend added to chat group successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add friend to chat group' });
  }
});

module.exports = router; 