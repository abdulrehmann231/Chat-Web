import React, { useState, useRef, useEffect } from 'react';
import { 
  PaperAirplaneIcon,
  MicrophoneIcon,
  PhotographIcon,
  VideoCameraIcon,
  PhoneIcon,
  DotsVerticalIcon,
} from '@heroicons/react/solid';
import { XIcon } from '@heroicons/react/outline';

const ChatWindow = ({ 
  chat, 
  messages, 
  onSendMessage, 
  onSendVoiceMessage,
  onSendMedia,
  onStartCall,
  onStartVideoCall,
  currentUser 
}) => {
  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const mediaInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim()) {
      onSendMessage({
        content: messageText,
        type: 'text'
      });
      setMessageText('');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await onSendVoiceMessage(audioBlob, recordingTime);
        audioChunksRef.current = [];
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await onSendMedia(file);
      e.target.value = null; // Reset input
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMessage = (message) => {
    const isOwnMessage = message.sender.id === currentUser.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex items-end space-x-2 max-w-[70%]`}>
          {!isOwnMessage && (
            <img src={message.sender.avatar} alt="" className="avatar w-8 h-8" />
          )}
          
          <div className={isOwnMessage ? 'message-sent' : 'message-received'}>
            {message.type === 'text' && (
              <p>{message.content}</p>
            )}
            
            {message.type === 'voice' && (
              <audio controls className="max-w-full">
                <source src={message.content} type="audio/wav" />
              </audio>
            )}
            
            {message.type === 'media' && (
              message.fileType === 'image' ? (
                <img 
                  src={message.content} 
                  alt="Shared image" 
                  className="max-w-full rounded-lg"
                />
              ) : message.fileType === 'video' ? (
                <video 
                  controls 
                  className="max-w-full rounded-lg"
                >
                  <source src={message.content} type={message.mimeType} />
                </video>
              ) : (
                <div className="flex items-center space-x-2">
                  <PhotographIcon className="h-5 w-5" />
                  <span>{message.fileName}</span>
                </div>
              )
            )}
            
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {chat.avatar ? (
            <img src={chat.avatar} alt={chat.name} className="avatar" />
          ) : (
            <div className="avatar bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                {chat.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{chat.name}</h2>
            {chat.members && (
              <p className="text-sm text-gray-500">
                {chat.members.length} members
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onStartCall(chat)}
            className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onStartVideoCall(chat)}
            className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <DotsVerticalIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <input
            type="file"
            ref={mediaInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*"
          />
          
          <button
            type="button"
            onClick={() => mediaInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <PhotographIcon className="h-6 w-6" />
          </button>

          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 rounded-full ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {isRecording ? (
              <div className="flex items-center space-x-2">
                <XIcon className="h-6 w-6" />
                <span>{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <MicrophoneIcon className="h-6 w-6" />
            )}
          </button>

          <div className="flex-1">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="input"
              disabled={isRecording}
            />
          </div>

          <button
            type="submit"
            disabled={!messageText.trim() && !isRecording}
            className="p-2 text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-6 w-6 transform rotate-90" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow; 