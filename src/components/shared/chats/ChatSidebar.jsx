// src/components/shared/chats/ChatSidebar.jsx - FIXED: Read Receipts & Search Highlighting

import React, { useEffect, useMemo, useState } from 'react';
import { formatSidebarTime } from './utils/dateUtils';
import { chatsApi } from './lib/chatsApi';
import { highlightSearchTerm, extractCleanMessageText, truncateText } from './utils/searchUtils';
import useDebounce from '@/hooks/useDebounce';
import chatEncryption from './lib/encryption';

// FIXED: Read Receipt Component
const ReadReceiptIndicator = ({ lastMessage, currentUserId }) => {
  if (!lastMessage || lastMessage.senderId !== currentUserId) {
    return null; // No receipt for received messages
  }

  const isRead = lastMessage.isRead === true;

  return (
    <div className="flex items-center ml-1" title={isRead ? "Read" : "Delivered"}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none" className="flex-shrink-0">
        {/* First checkmark */}
        <path 
          d="M1.5 5L4 7.5L7.5 4" 
          stroke={isRead ? "#4FC3F7" : "#9CA3AF"} 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* Second checkmark (overlapping) */}
        <path 
          d="M5.5 5L8 7.5L11.5 4" 
          stroke={isRead ? "#4FC3F7" : "#9CA3AF"} 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// Individual message item with improved time display and read receipts
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
  hasUnread = false,
  lastMessageData = null,
  searchQuery = '',
  currentUserId = null
}) => {
  // Use formatSidebarTime for proper time display
  const displayTime = lastMessageData?.createdAt ? 
    formatSidebarTime(lastMessageData.createdAt) : 
    time;

  // FIXED: Extract clean message preview without prefixes
  const cleanPreview = useMemo(() => {
    if (!preview) return '';
    
    if (isTeamChat) {
      return preview; // Keep AI assistant messages as-is
    }

    // Remove "You:" and "Name:" prefixes
    let cleanText = preview;
    
    // Remove pattern like "You: message" or "Andre: message"
    const prefixPattern = /^[^:]+:\s*/;
    if (prefixPattern.test(cleanText)) {
      cleanText = cleanText.replace(prefixPattern, '');
    }
    
    return cleanText.trim();
  }, [preview, isTeamChat]);

  // FIXED: Apply search highlighting to name and preview
  const highlightedName = useMemo(() => {
    return searchQuery ? highlightSearchTerm(name, searchQuery) : name;
  }, [name, searchQuery]);

  const highlightedPreview = useMemo(() => {
    return searchQuery ? highlightSearchTerm(cleanPreview, searchQuery) : cleanPreview;
  }, [cleanPreview, searchQuery]);

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
                <span className="text-white text-sm sm:text-lg">🤖</span>
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
              {/* NAME - Bold if unread, with search highlighting */}
              <h3 className={`text-sm sm:text-base truncate ${
                hasUnread 
                  ? 'font-bold text-neutral-700'
                  : 'font-bold text-neutral-600'
              }`}>
                <span 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightedName 
                  }} 
                />
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* TIME - Use proper time display */}
                <time className={`text-xs font-light ${
                  hasUnread 
                    ? 'font-semibold'
                    : 'text-zinc-500'
                }`}
                style={{ 
                  color: hasUnread ? '#488BBA' : undefined 
                }}>
                  {displayTime}
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
            
            {/* PREVIEW - Bold if unread, with search highlighting and read receipts */}
            <div className="flex items-center gap-1 min-w-0">
              <p className={`text-xs truncate flex-1 ${
                hasUnread 
                  ? 'font-medium text-zinc-700'
                  : 'font-light text-zinc-500'
              }`}>
                <span 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightedPreview 
                  }} 
                />
              </p>
              
              {/* FIXED: Read Receipt for sent messages */}
              <ReadReceiptIndicator 
                lastMessage={lastMessageData} 
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat sidebar - Independent scroll container with search and read receipts
const ChatSidebar = ({
  conversations = [],
  selectedConversation,
  onConversationSelect,
  loading = false,
  userDisplayData = {},
  isPsychologist = false,
  containerWidth = 384,
  currentUserId = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [serverResults, setServerResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // FIXED: Faster debounce for better search UX
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedHighlightSearch = useDebounce(searchQuery, 150); // Faster for highlighting
  const isDebouncing = searchQuery !== debouncedSearch;

  // Server-side search to include message content
  useEffect(() => {
    let active = true;
    const doSearch = async () => {
      if (!debouncedSearch) {
        setServerResults([]);
        setIsSearching(false);
        setSearchError('');
        return;
      }
      setIsSearching(true);
      setSearchError('');
      try {
        const results = await chatsApi.getChatHistories({ 
          limit: 20, 
          page: 1, 
          searchQuery: debouncedSearch 
        });
        if (!active) return;
        setServerResults(Array.isArray(results) ? results : []);
      } catch (e) {
        if (!active) return;
        setServerResults([]);
        setSearchError('Failed to search chats');
      } finally {
        if (active) setIsSearching(false);
      }
    };
    doSearch();
    return () => { active = false; };
  }, [debouncedSearch]);

  // FIXED: Enhanced conversation processing with clean message previews
  const processedConversations = useMemo(() => {
    const baseList = searchQuery ? serverResults : conversations;
    
    return baseList.map(conversation => {
      // Extract clean message text
      let cleanLastMessage = '';
      
      if (conversation.lastMessage) {
        // Remove "You:" and "Name:" prefixes
        cleanLastMessage = extractCleanMessageText(
          { message: conversation.lastMessage }, 
          currentUserId
        );
        
        // If message is encrypted, try to decrypt it
        if (conversation.lastMessageData?.message && 
            conversation.lastMessageData.messageType !== 'automated' &&
            chatEncryption.isEncrypted(conversation.lastMessageData.message)) {
          try {
            const decrypted = chatEncryption.decrypt(
              conversation.lastMessageData.message, 
              conversation.sessionId
            );
            cleanLastMessage = decrypted;
          } catch (error) {
            console.warn('Failed to decrypt message for preview:', error);
          }
        }
        
        // Truncate for display
        cleanLastMessage = truncateText(cleanLastMessage, 60);
      }
      
      // If no clean message, show status message
      if (!cleanLastMessage) {
        if (conversation.isTeamChat) {
          cleanLastMessage = 'AI Assistant - Always Available';
        } else if (conversation.status === 'pending') {
          cleanLastMessage = 'Waiting for session to start...';
        } else {
          cleanLastMessage = 'No messages yet';
        }
      }
      
      return {
        ...conversation,
        cleanLastMessage
      };
    });
  }, [conversations, serverResults, searchQuery, currentUserId]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return processedConversations;
    
    const searchLower = searchQuery.toLowerCase();
    
    return processedConversations.filter(conversation => {
      const nameMatch = (conversation.name || '').toLowerCase().includes(searchLower);
      const messageMatch = (conversation.cleanLastMessage || '').toLowerCase().includes(searchLower);
      return nameMatch || messageMatch;
    });
  }, [processedConversations, searchQuery]);

  if (loading || (isDebouncing && !!searchQuery) || (isSearching && !!searchQuery)) {
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
          <span className="text-sm" style={{ color: '#488BBA' }}>
            {isSearching ? 'Searching chats...' : 'Loading sessions...'}
          </span>
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
      <div className="flex-shrink-0 px-4 sm:px-5 pb-2">
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
          {/* Clear search button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <span className="material-icons text-sm">close</span>
            </button>
          )}
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
                  preview={conversation.cleanLastMessage} // FIXED: Use clean message
                  avatar={conversation.avatar}
                  isActive={selectedConversation?.sessionId === conversation.sessionId || selectedConversation?.id === conversation.id}
                  isTeamChat={conversation.isTeamChat}
                  onClick={() => onConversationSelect(conversation)}
                  containerWidth={containerWidth}
                  unreadCount={conversation.unreadCount || 0}
                  hasUnread={conversation.hasUnread || false}
                  lastMessageData={conversation.lastMessageData}
                  searchQuery={debouncedHighlightSearch} // FIXED: Use faster debounced search for highlighting
                  currentUserId={currentUserId} // FIXED: Pass current user ID for read receipts
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center h-full">
              <div className="text-gray-400 text-3xl sm:text-4xl mb-2">💬</div>
              <p className="text-gray-500 text-sm">
                {searchQuery ? (searchError || 'No conversations found') : 'No conversations yet'}
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