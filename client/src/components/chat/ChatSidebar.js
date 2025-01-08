import React, { useState } from 'react';
import { 
  SearchIcon,
  UserGroupIcon,
  UsersIcon,
  PlusIcon,
  ChatIcon
} from '@heroicons/react/outline';

const ChatSidebar = ({ 
  contacts, 
  groups, 
  activeChat, 
  onChatSelect, 
  onNewGroup, 
  onNewContact 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // chats, contacts, groups

  const filterItems = (items) => {
    return items?.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderChatItem = (item, type) => {
    const isActive = activeChat?.id === item.id;
    return (
      <div
        key={item.id}
        onClick={() => onChatSelect(item, type)}
        className={`flex items-center space-x-3 p-3 cursor-pointer rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary/10 dark:bg-primary/20' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        {item.avatar ? (
          <img src={item.avatar} alt={item.name} className="avatar" />
        ) : (
          <div className="avatar bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              {item.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium truncate">{item.name}</h3>
            {item.lastMessage && (
              <span className="text-xs text-gray-500">
                {new Date(item.lastMessage.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          {item.lastMessage && (
            <p className="text-sm text-gray-500 truncate">
              {item.lastMessage.content}
            </p>
          )}
          {item.status && (
            <span className={`badge-${item.status} inline-block mt-1`}>
              {item.status}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full sm:w-80 h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
      {/* Search bar */}
      <div className="p-4">
        <div className="relative">
          <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'chats'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ChatIcon className="h-5 w-5 mx-auto mb-1" />
          Chats
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'contacts'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <UsersIcon className="h-5 w-5 mx-auto mb-1" />
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'groups'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <UserGroupIcon className="h-5 w-5 mx-auto mb-1" />
          Groups
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {activeTab === 'chats' && (
          <>
            {filterItems([...contacts, ...groups])?.map(item => 
              renderChatItem(item, item.members ? 'group' : 'contact')
            )}
          </>
        )}
        
        {activeTab === 'contacts' && (
          <>
            <button
              onClick={onNewContact}
              className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Contact</span>
            </button>
            {filterItems(contacts)?.map(contact => renderChatItem(contact, 'contact'))}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            <button
              onClick={onNewGroup}
              className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-primary hover:bg-primary/10 rounded-lg"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create New Group</span>
            </button>
            {filterItems(groups)?.map(group => renderChatItem(group, 'group'))}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar; 