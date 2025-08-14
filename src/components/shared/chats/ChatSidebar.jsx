// src/components/shared/chats/ChatSidebar.jsx - Presisi Layout dengan Border & Selected State

import React, { useState } from 'react';

// Individual message item dengan selected background
const MessageItem = ({ avatar, name, time, preview, isActive = false, isTeamChat = false, onClick }) => {
  return (
    <div 
      className={`relative cursor-pointer transition-colors ${isActive ? '' : 'hover:bg-gray-50'}`}
      onClick={onClick}
      style={{ height: '57px' }} // Fixed height untuk selected background
    >
      {/* Selected Background - Full width dari sidebar ke chatmain */}
      {isActive && (
        <div 
          className="absolute inset-0 bg-[#E2F2FF]"
          style={{ width: '384px' }} // Full width background w-96
        />
      )}
      
      {/* Content */}
      <div className="relative p-2.5">
        <div className="flex gap-2.5 items-center px-1.5 py-0">
          <div className="w-[37px] h-[37px] rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
            {isTeamChat ? (
              <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
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
                      <span class="text-white text-lg">👤</span>
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
            )}
          </div>
          <div className="flex flex-col flex-1 gap-2 min-w-0">
            <div className="flex justify-between items-end">
              <h3 className="text-base font-bold text-neutral-600 max-sm:text-sm truncate">
                {name}
              </h3>
              <time className="text-xs font-light text-zinc-500 flex-shrink-0">
                {time}
              </time>
            </div>
            <p className="text-xs font-light text-zinc-500 max-sm:text-xs truncate">
              {preview}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat sidebar dengan header border dan positioning presisi
const ChatSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  loading = false,
  userDisplayData = {},
  isPsychologist = false,
  containerWidth = 384 // w-96 = 384px
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
        className="h-full bg-white border-r-[0.25px] border-[#8B8B8B]flex items-center justify-center"
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
      style={{ width: `${containerWidth}px` }}
    >
      {/* Header Section dengan border seperti ChatMain */}
      <div className="flex-shrink-0 bg-white border-t-[0.25px] border-zinc-500 h-[70px] px-5 flex flex-col justify-center">
        {/* Title - Sejajar dengan foto profil ChatMain */}
        <h1 className="text-xl font-bold text-blue-500 mb-1">
          {isPsychologist ? 'Chat Klien' : 'Pesan'}
        </h1>
      </div>
      
      {/* Search Bar Section */}
      <div className="flex-shrink-0 px-5 pt-4 pb-2">
        <div 
          className="flex gap-2 items-center px-3.5 py-px bg-white rounded-md border-solid border-[0.5px] border-zinc-500"
          style={{ width: '308px', height: '31px' }}
        >
          <span className="material-icons text-zinc-500 text-sm">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari....."
            className="text-xs font-thin leading-5 text-zinc-500 bg-transparent border-none outline-none flex-1"
          />
        </div>
      </div>

      {/* Conversations List - Scrollable dengan scrollbar visible */}
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
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">💬</div>
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