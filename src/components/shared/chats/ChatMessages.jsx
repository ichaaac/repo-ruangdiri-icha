// src/components/shared/chats/components/ChatMessages.jsx - FIXED: Reduced Gap & Better Layout

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
  isLoadingMore
}) => {
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);

  const sessionStatus = getSessionStatus?.() || 'ready';

  // Group messages by date for WhatsApp-style date headers
  const messageGroups = groupMessagesByDate(messages);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Check if near top (for loading more messages)
    const nearTop = scrollTop < 100;
    setIsNearTop(nearTop);
    
    // Load more messages when near top
    if (nearTop && hasMoreMessages && !isLoadingMore) {
      console.log('📜 Loading more messages due to scroll');
      onLoadMore?.();
    }
  }, [hasMoreMessages, isLoadingMore, onLoadMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

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
        {/* FIXED: Improved container with better spacing */}
        <div className="flex flex-col items-center py-4 min-h-full">
          {/* Load More Button/Indicator */}
          {hasMoreMessages && (
            <div className="w-full flex justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  <span className="text-sm">Loading older messages...</span>
                </div>
              ) : isNearTop ? (
                <motion.button
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={onLoadMore}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Load older messages
                </motion.button>
              ) : null}
            </div>
          )}

          {/* FIXED: Session Status Warning with better spacing */}
          {sessionStatus !== 'ready' && sessionStatus !== 'ai_chat' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 max-w-md mb-6">
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

          {/* FIXED: Messages with optimized spacing */}
          <div className="flex flex-col gap-4 w-full max-w-full pb-4"> {/* REDUCED: from pb-32 to pb-4 */}
            {messageGroups.length > 0 ? (
              messageGroups.map((group, groupIndex) => (
                <div key={group.date || groupIndex} className="w-full">
                  {/* Date Header - WhatsApp style floating header */}
                  <div className="flex justify-center mb-3"> {/* REDUCED: from mb-4 to mb-3 */}
                    <time className="text-[11px] font-medium text-gray-400 tracking-wide">
                      {group.dateHeader}
                    </time>
                  </div>
                  {/* Messages in this date group with tighter spacing */}
                  <div className="flex flex-col gap-3"> {/* REDUCED: from gap-4 to gap-3 */}
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

            {/* FIXED: Auto-scroll anchor with minimal spacing */}
            <div 
              ref={messagesEndRef} 
              style={{ 
                height: '8px', // REDUCED: from 20px to 8px for minimal gap
                visibility: 'hidden' 
              }} 
            />
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .messages-scroll::-webkit-scrollbar {
          width: 14px;
        }
        
        .messages-scroll::-webkit-scrollbar-track {
          background: #E5E7EB;
          border-radius: 7px;
        }
        
        .messages-scroll::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 7px;
          border: 3px solid #E5E7EB;
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
