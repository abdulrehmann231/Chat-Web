const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { MongoClient, GridFSBucket } = require('mongodb');
const multer = require('multer');
const { Readable } = require('stream');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const chatGroupRoutes = require('./routes/chatGroups');
const friendRoutes = require('./routes/friends');
const callRoutes = require('./routes/calls');

// Use routes
app.use('/auth', authRoutes);
app.use('/messages', messageRoutes);
app.use('/chatGroups', chatGroupRoutes);
app.use('/friends', friendRoutes);
app.use('/calls', callRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Basic route
app.get('/', (req, res) => {
  res.send('Server is running');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Track online users and their activity timers
const onlineUsers = new Map();
const userActivityTimers = new Map();
const AWAY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const OFFLINE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

// Function to update user presence
const updateUserPresence = async (userId, status) => {
  try {
    await User.findByIdAndUpdate(userId, {
      'presence.status': status,
      'presence.lastActive': status === 'offline' ? Date.now() : undefined,
      'presence.lastSeen': Date.now()
    });
    io.emit('user_status_change', { userId, status });
  } catch (error) {
    console.error('Failed to update user presence:', error);
  }
};

// Function to handle user inactivity
const handleUserInactivity = async (userId) => {
  const timer = setTimeout(async () => {
    // Set user as away after AWAY_TIMEOUT
    await updateUserPresence(userId, 'away');

    // Set user as offline after OFFLINE_TIMEOUT
    setTimeout(async () => {
      const isStillAway = (await User.findById(userId)).presence.status === 'away';
      if (isStillAway) {
        await updateUserPresence(userId, 'offline');
        userActivityTimers.delete(userId);
      }
    }, OFFLINE_TIMEOUT - AWAY_TIMEOUT);
  }, AWAY_TIMEOUT);

  userActivityTimers.set(userId, timer);
};

// Function to reset user activity timer
const resetUserActivityTimer = (userId) => {
  // Clear existing timer
  const existingTimer = userActivityTimers.get(userId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Start new timer
  handleUserInactivity(userId);
};

io.on('connection', (socket) => {
  console.log('A user connected');

  // User joins with their ID
  socket.on('user_connected', async (userId) => {
    onlineUsers.set(userId, socket.id);
    await updateUserPresence(userId, 'online');
    handleUserInactivity(userId);
  });

  // Handle user activity
  socket.on('user_activity', async (userId) => {
    const user = await User.findById(userId);
    if (user && user.presence.status !== 'online') {
      await updateUserPresence(userId, 'online');
    }
    resetUserActivityTimer(userId);
  });

  socket.on('disconnect', async () => {
    // Find and remove disconnected user
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        await updateUserPresence(userId, 'offline');
        
        // Clear activity timer
        const existingTimer = userActivityTimers.get(userId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          userActivityTimers.delete(userId);
        }
        break;
      }
    }
    console.log('User disconnected');
  });

  // Handle chat message
  socket.on('chat_message', (msg) => {
    // Reset activity timer for sender
    if (msg.sender) {
      resetUserActivityTimer(msg.sender);
    }
    // Emit to specific room (chat group)
    io.to(msg.chatGroup).emit('chat_message', msg);
  });

  // Join chat group room
  socket.on('join_chat', (chatGroupId) => {
    socket.join(chatGroupId);
  });

  // Leave chat group room
  socket.on('leave_chat', (chatGroupId) => {
    socket.leave(chatGroupId);
  });

  // Handle typing status
  socket.on('typing_start', (data) => {
    resetUserActivityTimer(data.user);
    socket.to(data.chatGroup).emit('typing_start', { user: data.user });
  });

  socket.on('typing_end', (data) => {
    resetUserActivityTimer(data.user);
    socket.to(data.chatGroup).emit('typing_end', { user: data.user });
  });

  // WebRTC signaling
  socket.on('call_user', (data) => {
    resetUserActivityTimer(data.caller);
    const targetSocketId = onlineUsers.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming_call', {
        callId: data.callId,
        caller: data.caller,
        type: data.type
      });
    }
  });

  socket.on('call_accepted', (data) => {
    resetUserActivityTimer(data.acceptor);
    const callerSocketId = onlineUsers.get(data.caller);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', {
        callId: data.callId,
        acceptor: data.acceptor
      });
    }
  });

  socket.on('call_rejected', (data) => {
    resetUserActivityTimer(data.rejector);
    const callerSocketId = onlineUsers.get(data.caller);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_rejected', {
        callId: data.callId,
        rejector: data.rejector
      });
    }
  });

  socket.on('call_ended', (data) => {
    // Notify all participants
    data.participants.forEach(participantId => {
      resetUserActivityTimer(participantId);
      const participantSocketId = onlineUsers.get(participantId);
      if (participantSocketId) {
        io.to(participantSocketId).emit('call_ended', { callId: data.callId });
      }
    });
  });

  // WebRTC peer-to-peer signaling
  socket.on('offer', (data) => {
    resetUserActivityTimer(data.caller);
    const targetSocketId = onlineUsers.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('offer', {
        offer: data.offer,
        caller: data.caller
      });
    }
  });

  socket.on('answer', (data) => {
    resetUserActivityTimer(data.answerer);
    const targetSocketId = onlineUsers.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('answer', {
        answer: data.answer,
        answerer: data.answerer
      });
    }
  });

  socket.on('ice_candidate', (data) => {
    resetUserActivityTimer(data.sender);
    const targetSocketId = onlineUsers.get(data.target);
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', {
        candidate: data.candidate,
        sender: data.sender
      });
    }
  });
});

// GridFS setup for file storage
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect().then(() => {
  console.log('GridFS connected');
  const db = client.db(process.env.DB_NAME);
  const bucket = new GridFSBucket(db, { bucketName: 'mediaFiles' });

  // File upload endpoint already handled in messages route
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 