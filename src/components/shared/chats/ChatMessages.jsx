// src/components/shared/chats/components/ChatMessages.jsx - FIXED: Proper Scroll Management & Infinite Scroll

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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  // Refs for scroll position management
  const previousScrollHeight = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastMessageCount = useRef(0);
  const isLoadingRef = useRef(false);

  const sessionStatus = getSessionStatus?.() || 'ready';
  const messageGroups = groupMessagesByDate(messages);

  // FIXED: Enhanced scroll handler that prevents premature infinite scroll
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isLoadingRef.current) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Mark as user scrolling
    setIsUserScrolling(true);
    
    // FIXED: Only check for infinite scroll if user has actually scrolled up significantly
    // This prevents accidental triggering when conversation first loads
    const hasScrolledUp = scrollTop < (scrollHeight * 0.8); // Only if scrolled up more than 20%
    
    // Check if near top (for loading more messages) - but only if user has scrolled up
    const nearTop = scrollTop < 100 && hasScrolledUp;
    setIsNearTop(nearTop);
    
    // Check if at bottom (for auto-scroll behavior)  
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShouldAutoScroll(isAtBottom);

    // FIXED: Only trigger load more if user has genuinely scrolled up
    if (nearTop && hasMoreMessages && !isLoadingMore && onLoadMore && hasScrolledUp) {
      console.log('🔄 Triggering loadMore - user genuinely scrolled to top');
      
      // Store current scroll height before loading
      previousScrollHeight.current = scrollHeight;
      isLoadingRef.current = true;
      
      onLoadMore().finally(() => {
        isLoadingRef.current = false;
      });
    }
    
    // Set timeout to stop considering user as scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000);
    
  }, [hasMoreMessages, isLoadingMore, onLoadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  // FIXED: Maintain scroll position after loading older messages
  useEffect(() => {
    if (!isLoadingMore && previousScrollHeight.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const currentScrollHeight = container.scrollHeight;
      const heightDifference = currentScrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        // Maintain scroll position by adjusting for new content height
        container.scrollTop = container.scrollTop + heightDifference;
        console.log('📍 Scroll position maintained after loading older messages:', {
          heightDifference,
          newScrollTop: container.scrollTop
        });
      }
      
      previousScrollHeight.current = null;
    }
  }, [isLoadingMore, messages.length]);

  // FIXED: Auto-scroll only for new messages (not during infinite scroll)
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCount.current;
    
    // Only auto-scroll if:
    // 1. There are new messages
    // 2. User wants auto-scroll (is at bottom)  
    // 3. User is not manually scrolling
    // 4. Not currently loading older messages
    if (hasNewMessages && shouldAutoScroll && !isUserScrolling && !isLoadingMore && messagesEndRef.current) {
      console.log('⬇️ Auto-scrolling to new message');
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (messagesEndRef.current && shouldAutoScroll && !isUserScrolling) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    lastMessageCount.current = currentMessageCount;
  }, [messages.length, shouldAutoScroll, isUserScrolling, isLoadingMore, messagesEndRef]);

  // FIXED: Aggressive initial scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation?.sessionId && messagesEndRef.current) {
      // Reset states when conversation changes
      setIsUserScrolling(false);
      setShouldAutoScroll(true);
      lastMessageCount.current = 0;
      previousScrollHeight.current = null;
      isLoadingRef.current = false; // Reset loading state
      
      // FIXED: Multiple aggressive scroll attempts to ensure bottom positioning
      const forceScrollToBottom = () => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          // Method 1: ScrollIntoView
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          
          // Method 2: Direct scrollTop manipulation
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
          
          console.log('📍 Force scroll to bottom:', {
            conversationId: selectedConversation.sessionId.slice(-8),
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight
          });
        }
      };
      
      // Immediate scroll
      forceScrollToBottom();
      
      // Additional scroll attempts with delays to ensure it works
      const timeouts = [50, 100, 200, 300, 500];
      timeouts.forEach((delay, index) => {
        setTimeout(() => {
          forceScrollToBottom();
          
          // On final attempt, ensure we're marked as at bottom
          if (index === timeouts.length - 1) {
            setShouldAutoScroll(true);
            setIsUserScrolling(false);
          }
        }, delay);
      });
    }
  }, [selectedConversation?.sessionId]);

  // FIXED: Ensure scroll to bottom when messages first load (0 -> >0)
  useEffect(() => {
    if (messages.length > 0 && lastMessageCount.current === 0 && messagesEndRef.current && messagesContainerRef.current) {
      console.log('📍 Messages loaded for first time, aggressive scroll to bottom');
      
      // Wait a bit for DOM to update, then force scroll
      setTimeout(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          
          // Force scroll to bottom
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          container.scrollTop = container.scrollHeight;
          
          setShouldAutoScroll(true);
          setIsUserScrolling(false);
          
          console.log('📍 First load scroll completed:', {
            messagesCount: messages.length,
            scrollTop: container.scrollTop,
            scrollHeight: container.scrollHeight
          });
        }
      }, 150);
    }
  }, [messages.length]);

  // FIXED: Conservative auto-load that only triggers after proper initialization
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMoreMessages || isLoadingMore || !onLoadMore) return;
    
    // FIXED: Only auto-load if:
    // 1. We have messages already loaded
    // 2. User is not actively scrolling  
    // 3. We've been on this conversation for a bit (avoid immediate trigger)
    // 4. Container doesn't have enough content
    
    if (messages.length === 0 || isUserScrolling) return;
    
    const hasScrollbar = container.scrollHeight > container.clientHeight + 8;
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    
    // Only auto-load if we're at bottom and there's no scrollbar AND we have some messages already
    if (!hasScrollbar && isAtBottom && messages.length > 0 && !isUserScrolling) {
      console.log('🔄 Conservative auto-load triggered');
      previousScrollHeight.current = container.scrollHeight;
      isLoadingRef.current = true;
      
      onLoadMore().finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [messages.length, hasMoreMessages, isLoadingMore, onLoadMore, isUserScrolling]);

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
        {/* FIXED: Container with proper min-height to enable scrolling */}
        <div className="min-h-full flex flex-col">
          
          {/* FIXED: Load More Indicator - Only show when actually loading */}
          <AnimatePresence>
            {isLoadingMore && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex justify-center py-3 bg-zinc-100"
              >
                <div className="flex items-center gap-2 text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm">Loading older messages...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session Status Warning */}
          {sessionStatus !== 'ready' && sessionStatus !== 'ai_chat' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 my-2 max-w-md self-center">
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

          {/* FIXED: Messages container with flex-1 to push content to bottom */}
          <div className="flex-1 flex flex-col justify-end">
            {messageGroups.length > 0 ? (
              <div className="flex flex-col gap-3 px-0 py-4">
                {messageGroups.map((group, groupIndex) => (
                  <div key={group.date || groupIndex} className="w-full">
                    {/* Date Header */}
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
                              return prev && Math.abs(b - a) < 10000;
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
                ))}
              </div>
            ) : (
              // No messages state
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

            {/* FIXED: Invisible anchor for auto-scroll */}
            <div 
              ref={messagesEndRef} 
              style={{ height: '1px', flexShrink: 0 }} 
              aria-hidden="true"
            />
          </div>

          {/* Small padding at bottom */}
          <div style={{ height: '16px', flexShrink: 0 }} />
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
      `}</style>
    </div>
  );
};

export default ChatMessages;