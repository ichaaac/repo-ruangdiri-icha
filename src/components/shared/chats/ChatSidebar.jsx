// src/components/shared/chats/ChatSidebar.jsx - Independent Scroll Design

import React, { useState } from 'react';

// Individual message item - Simple design
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
      style={{ minHeight: '57px' }}
    >
      {/* Selected Background */}
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
                <span className="text-white text-sm sm:text-lg">💥</span>
              </div>
            ) : avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/empty-profile.svg';
                }}
              />
            ) : (
              <img
                src="/empty-profile.svg"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="flex flex-col flex-1 gap-2 min-w-0">
            <div className="flex justify-between items-end gap-2">
              {/* NAME - Bold kalau unread */}
              <h3 className={`text-sm sm:text-base truncate ${
                hasUnread 
                  ? 'font-bold text-neutral-700'
                  : 'font-bold text-neutral-600'
              }`}>
                {name}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* TIME - Blue kalau unread */}
                <time className={`text-xs font-light ${
                  hasUnread 
                    ? 'font-semibold'
                    : 'text-zinc-500'
                }`}
                style={{ 
                  color: hasUnread ? '#488BBA' : undefined 
                }}>
                  {time}
                </time>
                
                {/* UNREAD BADGE */}
                {hasUnread && unreadCount > 0 && (
                  <div 
                    className="text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                    style={{ backgroundColor: '#488BBA' }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
            </div>
            
            {/* PREVIEW - Bold kalau unread */}
            <p className={`text-xs truncate ${
              hasUnread 
                ? 'font-medium text-zinc-700'
                : 'font-light text-zinc-500'
            }`}>
              {preview}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat sidebar - Independent scroll container
const ChatSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  loading = false,
  userDisplayData = {},
  isPsychologist = false,
  containerWidth = 384
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchQuery.toLowerCase();
    return conversation.name.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div 
        className="h-full bg-white border-r-[0.25px] border-[#8B8B8B] flex items-center justify-center"
        style={{ width: `${containerWidth}px` }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: '#488BBA' }}
          ></div>
          <span className="text-sm" style={{ color: '#488BBA' }}>Loading sessions...</span>
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
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 bg-white border-t-[0.25px] border-zinc-500 h-[60px] sm:h-[70px] px-4 sm:px-5 flex flex-col justify-center">
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#488BBA' }}>
          {isPsychologist ? 'Chat Klien' : 'Pesan'}
        </h1>
      </div>
      
      {/* Search Bar Section - Fixed */}
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

      {/* Conversations List - Independent Scrollable Area */}
      <div className="flex-1 relative">
        <div 
          className="absolute inset-0 overflow-y-auto sidebar-scroll"
          style={{
            scrollbarWidth: 'auto',
            scrollbarColor: '#9CA3AF #F3F4F6'
          }}
        >
          {filteredConversations.length > 0 ? (
            <div className="pb-2">
              {filteredConversations.map((conversation) => (
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center h-full">
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

      {/* Sidebar Scrollbar Styles */}
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 12px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 6px;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #9CA3AF;
          border-radius: 6px;
          border: 2px solid #F3F4F6;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
        
        .sidebar-scroll::-webkit-scrollbar-thumb:active {
          background: #4B5563;
        }
      `}</style>
    </div>
  );
};

export default ChatSidebar;