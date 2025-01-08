const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:5000';
let token1, token2, user1, user2;

const test = async () => {
  try {
    // 1. Register two test users
    console.log('Registering test users...');
    const response1 = await axios.post(`${API_URL}/auth/register`, {
      username: 'testuser1',
      email: 'test1@test.com',
      password: 'password123'
    });
    
    const response2 = await axios.post(`${API_URL}/auth/register`, {
      username: 'testuser2',
      email: 'test2@test.com',
      password: 'password123'
    });

    token1 = response1.data.token;
    token2 = response2.data.token;
    user1 = response1.data.user;
    user2 = response2.data.user;

    console.log('Users registered successfully');

    // 2. Connect to socket server
    const socket1 = io(API_URL, {
      auth: { token: token1 }
    });

    const socket2 = io(API_URL, {
      auth: { token: token2 }
    });

    // 3. Set up socket event listeners
    socket1.on('connect', () => {
      console.log('User 1 connected to socket server');
      socket1.emit('user_connected', user1.id);
    });

    socket2.on('connect', () => {
      console.log('User 2 connected to socket server');
      socket2.emit('user_connected', user2.id);
    });

    socket1.on('chat_message', (message) => {
      console.log('User 1 received message:', message);
    });

    socket2.on('chat_message', (message) => {
      console.log('User 2 received message:', message);
    });

    // 4. Create a test group
    console.log('Creating test group...');
    const groupResponse = await axios.post(
      `${API_URL}/chatGroups/create`,
      {
        name: 'Test Group',
        members: [user1.id, user2.id]
      },
      {
        headers: { Authorization: `Bearer ${token1}` }
      }
    );

    const group = groupResponse.data;
    console.log('Test group created:', group);

    // 5. Send test messages
    console.log('Sending test messages...');
    
    // Text message
    await axios.post(
      `${API_URL}/messages/send`,
      {
        sender: user1.id,
        content: 'Hello from user 1!',
        chatGroup: group.id
      },
      {
        headers: { Authorization: `Bearer ${token1}` }
      }
    );

    // Wait for message to be received
    await new Promise(resolve => setTimeout(resolve, 1000));

    await axios.post(
      `${API_URL}/messages/send`,
      {
        sender: user2.id,
        content: 'Hello from user 2!',
        chatGroup: group.id
      },
      {
        headers: { Authorization: `Bearer ${token2}` }
      }
    );

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

test(); 