const express = require('express');
const Message = require('../models/Message');
const ChatGroup = require('../models/ChatGroup');
const multer = require('multer');
const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize GridFS bucket
const bucket = new GridFSBucket(mongoose.connection.db, {
  bucketName: 'mediaFiles'
});

// Send a text message
router.post('/send', async (req, res) => {
  const { sender, content, chatGroup } = req.body;
  try {
    // Encrypt the message content
    const { encryptedContent, iv } = encrypt(content);

    const message = new Message({
      sender,
      content: '[Encrypted Message]', // Public content placeholder
      encryptedContent,
      iv,
      chatGroup,
      messageType: 'text'
    });
    await message.save();

    await ChatGroup.findByIdAndUpdate(chatGroup, {
      $push: { messages: message._id }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = userId;
    message.content = 'This message was deleted';
    await message.save();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Upload and send voice message
router.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    const { sender, chatGroup, duration } = req.body;
    
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(`voice_${Date.now()}.wav`);
    const fileId = uploadStream.id;

    readableStream.pipe(uploadStream);

    // Encrypt the file ID
    const { encryptedContent, iv } = encrypt(fileId.toString());

    const message = new Message({
      sender,
      chatGroup,
      messageType: 'voice',
      content: '[Encrypted Voice Message]',
      encryptedContent,
      iv,
      duration: parseFloat(duration),
      fileSize: req.file.size
    });

    await message.save();
    await ChatGroup.findByIdAndUpdate(chatGroup, {
      $push: { messages: message._id }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send voice message' });
  }
});

// Upload and send media (images, videos)
router.post('/media', upload.single('media'), async (req, res) => {
  try {
    const { sender, chatGroup, fileType } = req.body;
    
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    const uploadStream = bucket.openUploadStream(`media_${Date.now()}_${req.file.originalname}`);
    const fileId = uploadStream.id;

    readableStream.pipe(uploadStream);

    // Encrypt the file ID
    const { encryptedContent, iv } = encrypt(fileId.toString());

    const message = new Message({
      sender,
      chatGroup,
      messageType: 'media',
      content: '[Encrypted Media]',
      encryptedContent,
      iv,
      fileType,
      fileSize: req.file.size
    });

    await message.save();
    await ChatGroup.findByIdAndUpdate(chatGroup, {
      $push: { messages: message._id }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send media message' });
  }
});

// Get media file
router.get('/media/:fileId', async (req, res) => {
  try {
    const message = await Message.findById(req.params.fileId);
    if (!message || message.isDeleted) {
      return res.status(404).json({ message: 'Media not found' });
    }

    // Decrypt the file ID
    const fileId = decrypt(message.encryptedContent, message.iv);
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve media file' });
  }
});

// Mark message as read
router.post('/read', async (req, res) => {
  const { messageId, userId } = req.body;
  try {
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: {
        readBy: {
          user: userId,
          readAt: new Date()
        }
      }
    });
    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// Get messages for a chat group
router.get('/:chatGroupId', async (req, res) => {
  try {
    const messages = await Message.find({ 
      chatGroup: req.params.chatGroupId,
      isDeleted: { $ne: true } // Don't return deleted messages
    })
    .populate('sender', 'username')
    .populate('readBy.user', 'username');

    // Decrypt messages
    const decryptedMessages = messages.map(message => {
      const msg = message.toObject();
      if (!msg.isDeleted) {
        try {
          msg.content = decrypt(msg.encryptedContent, msg.iv);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          msg.content = '[Failed to decrypt message]';
        }
      }
      // Remove encrypted data from response
      delete msg.encryptedContent;
      delete msg.iv;
      return msg;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve messages' });
  }
});

module.exports = router; 