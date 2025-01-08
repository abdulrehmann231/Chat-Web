import React, { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { io } from 'socket.io-client';

const Chat = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('user_connected', user.id);
    });

    newSocket.on('chat_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_status_change', ({ userId, status }) => {
      setContacts(prev => 
        prev.map(contact => 
          contact.id === userId 
            ? { ...contact, status } 
            : contact
        )
      );
    });

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, [user.id]);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch contacts
        const contactsResponse = await fetch(`/api/friends/${user.id}`);
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);

        // Fetch groups
        const groupsResponse = await fetch(`/api/chatGroups/user/${user.id}`);
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  useEffect(() => {
    // Fetch messages when active chat changes
    const fetchMessages = async () => {
      if (!activeChat) return;

      try {
        const response = await fetch(`/api/messages/${activeChat.id}`);
        const data = await response.json();
        setMessages(data);

        // Join chat room
        socket?.emit('join_chat', activeChat.id);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Cleanup - leave previous chat room
    return () => {
      if (activeChat) {
        socket?.emit('leave_chat', activeChat.id);
      }
    };
  }, [activeChat, socket]);

  const handleSendMessage = async (message) => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: user.id,
          content: message.content,
          chatGroup: activeChat.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const newMessage = await response.json();
      socket?.emit('chat_message', {
        ...newMessage,
        chatGroup: activeChat.id,
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendVoiceMessage = async (audioBlob, duration) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('sender', user.id);
      formData.append('chatGroup', activeChat.id);
      formData.append('duration', duration);

      const response = await fetch('/api/messages/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send voice message');

      const newMessage = await response.json();
      socket?.emit('chat_message', {
        ...newMessage,
        chatGroup: activeChat.id,
      });
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const handleSendMedia = async (file) => {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('sender', user.id);
      formData.append('chatGroup', activeChat.id);
      formData.append('fileType', file.type.startsWith('image/') ? 'image' : 'video');

      const response = await fetch('/api/messages/media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to send media');

      const newMessage = await response.json();
      socket?.emit('chat_message', {
        ...newMessage,
        chatGroup: activeChat.id,
      });
    } catch (error) {
      console.error('Error sending media:', error);
    }
  };

  const handleStartCall = async (chat) => {
    try {
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiator: user.id,
          recipients: chat.members?.map(m => m.id) || [chat.id],
          type: 'audio',
          chatGroup: chat.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate call');

      const callData = await response.json();
      socket?.emit('call_user', {
        callId: callData.id,
        target: chat.id,
        caller: user.id,
        type: 'audio',
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleStartVideoCall = async (chat) => {
    try {
      const response = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initiator: user.id,
          recipients: chat.members?.map(m => m.id) || [chat.id],
          type: 'video',
          chatGroup: chat.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to initiate video call');

      const callData = await response.json();
      socket?.emit('call_user', {
        callId: callData.id,
        target: chat.id,
        caller: user.id,
        type: 'video',
      });
    } catch (error) {
      console.error('Error starting video call:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen-navbar flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen-navbar flex">
      <ChatSidebar
        contacts={contacts}
        groups={groups}
        activeChat={activeChat}
        onChatSelect={setActiveChat}
        onNewGroup={() => {/* Handle new group */}}
        onNewContact={() => {/* Handle new contact */}}
      />
      
      {activeChat ? (
        <div className="flex-1">
          <ChatWindow
            chat={activeChat}
            messages={messages}
            currentUser={user}
            onSendMessage={handleSendMessage}
            onSendVoiceMessage={handleSendVoiceMessage}
            onSendMedia={handleSendMedia}
            onStartCall={handleStartCall}
            onStartVideoCall={handleStartVideoCall}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Select a chat to start messaging
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Choose from your contacts or groups
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat; 