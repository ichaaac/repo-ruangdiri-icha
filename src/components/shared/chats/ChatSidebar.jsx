// src/components/shared/chats/components/ChatSidebar.jsx - Exact Figma Design

import React, { useState } from 'react';

const ChatSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchQuery.toLowerCase();
    return conversation.name.toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="bg-white border-r border-t border-[0.25px] border-text w-[355px] flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-V1"></div>
          <span className="text-primary-V1 text-sm">Loading sessions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-r border-t border-[0.25px] border-text w-[355px] flex flex-col">
      {/* Header Section */}
      <div className="pt-[23px] pb-[23px] pr-[19px] pl-[19px] flex flex-col gap-[15px]">
        {/* Title */}
        <div className="flex flex-col gap-[15px]">
          <h2 className="text-primary-V1 text-[28px] font-bold font-['PublicSans-Bold',_sans-serif]">
            Pesan
          </h2>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-md border-solid border-text border-[0.5px] pt-px pr-3.5 pb-px pl-3.5 flex gap-[7px] items-center h-[31px] w-[308px]">
          <svg className="w-[18px] h-[18px] text-text" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari....."
            className="text-text text-xs font-thin leading-[21px] bg-transparent border-none outline-none flex-1"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.sessionId}
              className={`p-2.5 cursor-pointer transition-colors ${
                selectedConversation?.sessionId === conversation.sessionId 
                  ? 'bg-[#E2F2FF]' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="pr-[5px] pl-[5px] flex gap-2.5 items-center">
                {/* Avatar */}
                <div className="w-[37px] h-[37px] rounded-full overflow-hidden flex-shrink-0">
                  {conversation.isTeamChat ? (
                    <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                      <span className="text-white text-lg">👥</span>
                    </div>
                  ) : (
                    <img
                      src="/empty-profile.svg"
                      alt={conversation.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-300 flex items-center justify-center"><span class="text-gray-500 text-lg">👤</span></div>';
                      }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col gap-[7px] w-[261px] min-w-0">
                  {/* Header */}
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-text-new text-base font-bold font-['PublicSans-Bold',_sans-serif] truncate">
                        {conversation.name}
                      </h3>
                      {!conversation.isTeamChat && (
                        <span className={`text-xs ${
                          conversation.isOnline ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          {conversation.isOnline ? 'Online' : 'Offline'}
                        </span>
                      )}
                    </div>
                    <time className="text-text text-xs font-light text-center ml-2 flex-shrink-0">
                      {conversation.time}
                    </time>
                  </div>

                  {/* Last Message */}
                  <p className="text-text text-xs font-light truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-gray-400 text-4xl mb-2">💬</div>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;