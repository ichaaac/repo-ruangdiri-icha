// src/components/shared/chats/components/ChatMessages.jsx - FIXED: Proper Infinite Scroll & No Auto-Scroll

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupMessagesByDate } from './utils/dateUtils';
import MessageBubble from './MessageBubble';

const ChatMessages = ({ 
  messages = [], 
  selectedConversation, 
  getSessionStatus, 
  onAIServiceSelection,
  messagesEndRef,
  onLoadMore,
  hasMoreMessages,
  isLoadingMore,
  currentUserId
}) => {
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false); // Track if user is at bottom
  const scrollDebounceRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  const sessionStatus = getSessionStatus?.() || 'ready';

  // Group messages by date for WhatsApp-style date headers
  const messageGroups = groupMessagesByDate(messages);

  // FIXED: Throttled scroll handler to prevent excessive API calls
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Check if near top (for loading more messages) - only trigger when very close to top
    const nearTop = scrollTop < 50;
    setIsNearTop(nearTop);
    
    // Check if user is at bottom (for auto-scroll behavior)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShouldAutoScroll(isAtBottom);
    
    // FIXED: Only load more when actually at the top and has more messages
    if (nearTop && hasMoreMessages && !isLoadingMore && onLoadMore) {
      console.log('🔄 Triggering loadMore - user scrolled to top');
      onLoadMore();
    }
  }, [hasMoreMessages, isLoadingMore, onLoadMore]);

  // FIXED: Debounced scroll handler to prevent spam
  const debouncedHandleScroll = useCallback(() => {
    if (scrollDebounceRef.current) {
      clearTimeout(scrollDebounceRef.current);
    }
    scrollDebounceRef.current = setTimeout(handleScroll, 100); // 100ms debounce
  }, [handleScroll]);

  // Attach scroll listener with debouncing
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', debouncedHandleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', debouncedHandleScroll);
        if (scrollDebounceRef.current) {
          clearTimeout(scrollDebounceRef.current);
        }
      };
    }
  }, [debouncedHandleScroll]);

  // FIXED: Only auto-scroll when new messages arrive AND user is at bottom
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCountRef.current;
    
    if (hasNewMessages && shouldAutoScroll && messagesEndRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    
    lastMessageCountRef.current = currentMessageCount;
  }, [messages.length, shouldAutoScroll, messagesEndRef]);

  // FIXED: Initial scroll to bottom only once when conversation first loads
  useEffect(() => {
    if (selectedConversation && messages.length > 0 && messagesEndRef.current) {
      // Scroll to bottom without animation on first load
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
          setShouldAutoScroll(true); // Mark user as being at bottom initially
        }
      }, 100);
    }
  }, [selectedConversation?.sessionId]); // Only trigger when conversation changes

  return (
    <div className="flex-1 relative bg-zinc-100 overflow-hidden">
      <div 
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-y-auto messages-scroll"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: '#6B7280 #E5E7EB'
        }}
      >
        {/* FIXED: Container with proper spacing and no bottom padding */}
        <div className="flex flex-col items-center py-4 min-h-full">
          
          {/* FIXED: Load More Indicator - Only show when actually loading */}
          {isLoadingMore && (
            <div className="w-full flex justify-center py-3">
              <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">Loading older messages...</span>
              </div>
            </div>
          )}

          {/* FIXED: Load More Button - Only show when has more and not loading */}
          {hasMoreMessages && !isLoadingMore && isNearTop && onLoadMore && (
            <div className="w-full flex justify-center py-3">
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={onLoadMore}
                className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Load older messages
              </motion.button>
            </div>
          )}

          {/* Session Status Warning */}
          {sessionStatus !== 'ready' && sessionStatus !== 'ai_chat' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 max-w-md mb-4">
              <div className="flex items-center gap-2 text-center">
                <span className="text-yellow-600">⚠️</span>
                <div className="text-sm text-yellow-800">
                  {sessionStatus === 'chat_disabled' && 'Chat will be enabled when session starts'}
                  {sessionStatus === 'session_ended' && 'Chat session has ended'}
                  {sessionStatus === 'no_session' && 'No session selected'}
                </div>
              </div>
            </div>
          )}

          {/* FIXED: Messages with proper spacing */}
          <div className="flex flex-col gap-3 w-full max-w-full">
            {messageGroups.length > 0 ? (
              messageGroups.map((group, groupIndex) => (
                <div key={group.date || groupIndex} className="w-full">
                  {/* Date Header - WhatsApp style floating header */}
                  <div className="flex justify-center mb-3">
                    <time className="text-[11px] font-medium text-gray-400 tracking-wide bg-white px-3 py-1 rounded-full shadow-sm">
                      {group.dateHeader}
                    </time>
                  </div>
                  
                  {/* Messages in this date group */}
                  <div className="flex flex-col gap-2">
                    <AnimatePresence>
                      {group.messages.map((message, idx) => {
                        const prev = idx > 0 ? group.messages[idx - 1] : null;
                        const sameSender = prev && prev.senderId === message.senderId;
                        const within10s = (() => {
                          try {
                            const a = new Date(prev?.timestamp).getTime();
                            const b = new Date(message.timestamp).getTime();
                            return prev && Math.abs(b - a) < 10000; // 10 seconds
                          } catch {
                            return false;
                          }
                        })();
                        const showTime = !(sameSender && within10s);
                        
                        return (
                          <MessageBubble
                            key={message.id}
                            message={message.text}
                            isOwn={message.isUser}
                            sender={message.sender}
                            time={message.time}
                            showTime={showTime}
                            showOptions={message.showOptions}
                            actions={message.actions}
                            onOptionClick={onAIServiceSelection}
                            attachmentUrl={message.attachmentUrl}
                            attachmentType={message.attachmentType}
                            attachmentName={message.attachmentName}
                            attachmentSize={message.attachmentSize}
                            messageData={message}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            ) : (
              // No messages yet - show welcome state
              <div className="flex flex-col items-center justify-center text-center p-8 text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-sm">
                  {selectedConversation?.isTeamChat 
                    ? 'Start a conversation with our AI assistant'
                    : 'Send your first message to start the conversation'
                  }
                </p>
              </div>
            )}

            {/* FIXED: Invisible anchor for auto-scroll - minimal height */}
            <div 
              ref={messagesEndRef} 
              style={{ 
                height: '1px', // Minimal height
                visibility: 'hidden' 
              }} 
            />
          </div>

          {/* FIXED: Small bottom padding for better visual spacing */}
          <div style={{ height: '20px' }} />
        </div>
      </div>
      
      {/* Scrollbar Styles */}
      <style jsx>{`
        .messages-scroll::-webkit-scrollbar {
          width: 12px;
        }
        
        .messages-scroll::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 6px;
        }
        
        .messages-scroll::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 6px;
          border: 2px solid #E5E7EB;
        }
        
        .messages-scroll::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
        
        .messages-scroll::-webkit-scrollbar-thumb:active {
          background: #374151;
        }

        /* Smooth scrolling behavior */
        .messages-scroll {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default ChatMessages;