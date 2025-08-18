// src/components/shared/chats/ChatSidebar.jsx - Responsive Design

import React, { useState } from 'react';

// Individual message item - Responsive
const MessageItem = ({ 
  avatar, 
  name, 
  time, 
  preview, 
  isActive = false, 
  isTeamChat = false, 
  onClick, 
  containerWidth = 384, 
  unreadCount = 0, 
  hasUnread = false 
}) => {
  return (
    <div 
      className={`relative cursor-pointer transition-colors ${isActive ? '' : 'hover:bg-gray-50'}`}
      onClick={onClick}
      style={{ minHeight: '57px' }} // Minimum height untuk selected background
    >
      {/* Selected Background - Full width dengan overflow handling */}
      {isActive && (
        <div 
          className="absolute inset-0 bg-[#E2F2FF]"
          style={{ 
            width: `${containerWidth}px`,
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative p-2.5">
        <div className="flex gap-2.5 items-center px-1.5 py-0">
          <div className="w-[32px] h-[32px] sm:w-[37px] sm:h-[37px] rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            {isTeamChat ? (
              <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                <span className="text-white text-sm sm:text-lg">👥</span>
              </div>
            ) : avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span class="text-white text-sm sm:text-lg">👤</span>
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-sm sm:text-lg">👤</span>
              </div>
            )}
          </div>
          <div className="flex flex-col flex-1 gap-2 min-w-0">
            <div className="flex justify-between items-end gap-2">
              {/* NAME - WhatsApp behavior: Bold kalau unread */}
              <h3 className={`text-sm sm:text-base truncate ${
                hasUnread 
                  ? 'font-bold text-neutral-700' // Bold kalau unread
                  : 'font-bold text-neutral-600' // Normal kalau read
              }`}>
                {name}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* TIME - WhatsApp behavior: Green kalau unread */}
                <time className={`text-xs font-light ${
                  hasUnread 
                    ? 'font-semibold text-blue-600' // Biru kalau unread
                    : 'text-zinc-500' // Abu kalau read
                }`}>
                  {time}
                </time>
                {/* UNREAD BADGE - WhatsApp style */}
                {hasUnread && unreadCount > 0 && (
                  <div className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </div>
            {/* PREVIEW - WhatsApp behavior: Bold kalau unread */}
            <p className={`text-xs truncate ${
              hasUnread 
                ? 'font-medium text-zinc-700' // Medium kalau unread  
                : 'font-light text-zinc-500' // Light kalau read
            }`}>
              {preview}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat sidebar - Responsive
const ChatSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  loading = false,
  userDisplayData = {},
  isPsychologist = false,
  containerWidth = 384 // Flexible width
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchQuery.toLowerCase();
    return conversation.name.toLowerCase().includes(searchLower);
  });

  // Calculate total unread - WhatsApp behavior
  const totalUnreadCount = conversations.reduce((total, conv) => {
    return total + (conv.unreadCount || 0);
  }, 0);

  if (loading) {
    return (
      <div 
        className="h-full bg-white border-r-[0.25px] border-[#8B8B8B] flex items-center justify-center"
        style={{ width: `${containerWidth}px` }}
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="text-blue-500 text-sm">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full bg-white border-r-[0.25px] border-zinc-500 flex flex-col"
      style={{ 
        width: `${containerWidth}px`,
        minWidth: '280px',
        maxWidth: '100%'
      }}
    >
      {/* Header Section - Responsive */}
      <div className="flex-shrink-0 bg-white border-t-[0.25px] border-zinc-500 h-[60px] sm:h-[70px] px-4 sm:px-5 flex flex-col justify-center">
        {/* Title */}
        <h1 className="text-lg sm:text-xl font-bold text-blue-500 mb-1">
          {isPsychologist ? 'Chat Klien' : 'Pesan'}
        </h1>
        {/* Unread count */}
        {totalUnreadCount > 0 && (
          <p className="text-xs text-blue-500 font-medium">
            {totalUnreadCount} pesan belum dibaca
          </p>
        )}
      </div>
      
      {/* Search Bar Section - Responsive */}
      <div className="flex-shrink-0 px-4 sm:px-5 pt-4 pb-2">
        <div 
          className="flex gap-2 items-center px-3.5 py-px bg-white rounded-md border-solid border-[0.5px] border-zinc-500 w-full"
          style={{ height: '31px' }}
        >
          <span className="material-icons text-zinc-500 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari....."
            className="text-xs font-thin leading-5 text-zinc-500 bg-transparent border-none outline-none flex-1 w-full"
          />
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <MessageItem
              key={conversation.sessionId || conversation.id}
              name={conversation.name}
              time={conversation.time}
              preview={conversation.lastMessage}
              avatar={conversation.avatar}
              isActive={selectedConversation?.sessionId === conversation.sessionId || selectedConversation?.id === conversation.id}
              isTeamChat={conversation.isTeamChat}
              onClick={() => onConversationSelect(conversation)}
              containerWidth={containerWidth}
              unreadCount={conversation.unreadCount || 0}
              hasUnread={conversation.hasUnread || false}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
            <div className="text-gray-400 text-3xl sm:text-4xl mb-2">💬</div>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && !isPsychologist && (
              <p className="text-gray-400 text-xs mt-2">
                Book a counseling session to start chatting
              </p>
            )}
            {!searchQuery && isPsychologist && (
              <p className="text-gray-400 text-xs mt-2">
                Waiting for client sessions
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;