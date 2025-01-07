const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Add a friend
router.post('/add', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $addToSet: { friends: userId } });
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add friend' });
  }
});

// Remove a friend
router.post('/remove', async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

// List friends
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('friends', 'username email');
    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve friends' });
  }
});

module.exports = router; 