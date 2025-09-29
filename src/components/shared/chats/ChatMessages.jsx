// src/components/shared/chats/components/ChatMessages.jsx - With Read Receipts & Attachments

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupMessagesByDate } from './utils/dateUtils';
import { groupMessagesByTime, isMediaGroup } from './utils/mediaUtils';
import MessageBubble from './MessageBubble';
import MessageGroup from './MessageGroup';

const ChatMessages = ({ 
  messages = [], 
  selectedConversation, 
  getSessionStatus, 
  onAIServiceSelection,
  messagesEndRef,
  onLoadMore,
  hasMoreMessages,
  isLoadingMore,
  currentUserId,
  sessionAttachments = [], // ADDED: Session attachments for media navigation
  recipientPresence = 'unknown', // ADDED: Recipient presence for read receipts
  typingUsers = {}
}) => {
  const messagesContainerRef = useRef(null);
  const [isNearTop, setIsNearTop] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  
  const previousScrollHeight = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastMessageCount = useRef(0);
  const isLoadingRef = useRef(false);

  const sessionStatus = getSessionStatus?.() || 'ready';
  
  // Typing users (for WA-like bubble indicator)
  const typingList = Object.values(typingUsers || {}).filter(u => u && u.isTyping);
  const isTypingSomeone = typingList.length > 0;

  // Smooth-scroll to bottom when typing bubble appears and user is at bottom
  useEffect(() => {
    if (!isTypingSomeone) return;
    if (!messagesContainerRef.current || !messagesEndRef.current) return;
    if (!shouldAutoScroll || isUserScrolling || isLoadingMore) return;
    try {
      // Let the bubble mount, then scroll smoothly
      requestAnimationFrame(() => {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    } catch {}
  }, [isTypingSomeone, shouldAutoScroll, isUserScrolling, isLoadingMore, messagesEndRef]);
  
  // Group messages by date first
  const messageGroups = groupMessagesByDate(messages);

  // Enhanced scroll handler
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isLoadingRef.current) return;

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    setIsUserScrolling(true);
    
    const hasScrolledUp = scrollTop < (scrollHeight * 0.8);
    const nearTop = scrollTop < 100 && hasScrolledUp;
    setIsNearTop(nearTop);
    
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
    setShouldAutoScroll(isAtBottom);
    setShowScrollDown(!isAtBottom || nearTop);

    if (nearTop && hasMoreMessages && !isLoadingMore && onLoadMore && hasScrolledUp) {
      previousScrollHeight.current = scrollHeight;
      isLoadingRef.current = true;
      
      onLoadMore().finally(() => {
        isLoadingRef.current = false;
      });
    }
    
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

  const handleScrollToBottom = useCallback(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
        setShouldAutoScroll(true);
        setIsUserScrolling(false);
        setShowScrollDown(false);
      } catch {}
    }
  }, [messagesEndRef]);

  // Maintain scroll position after loading older messages
  useEffect(() => {
    if (!isLoadingMore && previousScrollHeight.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const currentScrollHeight = container.scrollHeight;
      const heightDifference = currentScrollHeight - previousScrollHeight.current;
      
      if (heightDifference > 0) {
        container.scrollTop = container.scrollTop + heightDifference;
      }
      
      previousScrollHeight.current = null;
    }
  }, [isLoadingMore, messages.length]);

  // Auto-scroll for new messages
  useEffect(() => {
    const currentMessageCount = messages.length;
    const hasNewMessages = currentMessageCount > lastMessageCount.current;
    
    if (hasNewMessages && shouldAutoScroll && !isUserScrolling && !isLoadingMore && messagesEndRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current && shouldAutoScroll && !isUserScrolling) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    
    lastMessageCount.current = currentMessageCount;
  }, [messages.length, shouldAutoScroll, isUserScrolling, isLoadingMore, messagesEndRef]);

  // Aggressive initial scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation?.sessionId && messagesEndRef.current) {
      setIsUserScrolling(false);
      setShouldAutoScroll(true);
      lastMessageCount.current = 0;
      previousScrollHeight.current = null;
      isLoadingRef.current = false;
      
      const forceScrollToBottom = () => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight;
        }
      };
      
      forceScrollToBottom();
      
      const timeouts = [50, 100, 200, 300, 500];
      timeouts.forEach((delay, index) => {
        setTimeout(() => {
          forceScrollToBottom();
          if (index === timeouts.length - 1) {
            setShouldAutoScroll(true);
            setIsUserScrolling(false);
          }
        }, delay);
      });
    }
  }, [selectedConversation?.sessionId]);

  // Ensure scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && lastMessageCount.current === 0 && messagesEndRef.current && messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
          container.scrollTop = container.scrollHeight;
          setShouldAutoScroll(true);
          setIsUserScrolling(false);
        }
      }, 150);
    }
  }, [messages.length]);

  // Conservative auto-load
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMoreMessages || isLoadingMore || !onLoadMore) return;
    
    if (messages.length === 0 || isUserScrolling) return;
    
    const hasScrollbar = container.scrollHeight > container.clientHeight + 8;
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    
    if (!hasScrollbar && isAtBottom && messages.length > 0 && !isUserScrolling) {
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
          scrollbarColor: '#6B7280 #E5E7EB',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="min-h-full flex flex-col">
          
          {/* Load More Indicator */}
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

          {/* Messages container */}
          <div className="flex-1 flex flex-col justify-end">
            {messageGroups.length > 0 ? (
              <div className="flex flex-col gap-3 px-0 py-4">
                {messageGroups.map((dateGroup, groupIndex) => (
                  <div key={dateGroup.date || groupIndex} className="w-full">
                    {/* Date Header */}
                    <div className="flex justify-center mb-3">
                      <time className="text-[11px] font-medium text-gray-400 tracking-wide bg-white px-3 py-1 rounded-full shadow-sm">
                        {dateGroup.dateHeader}
                      </time>
                    </div>
                    
                    {/* FIXED: Process messages for bulk upload grouping with attachments */}
                    <div className="flex flex-col gap-2">
                      <AnimatePresence>
                        {(() => {
                          // Group messages by time proximity for bulk uploads
                          const timeGroups = groupMessagesByTime(dateGroup.messages);
                          
                          return timeGroups.map((timeGroup, timeGroupIndex) => {
                            // Check if this is a media group (multiple media items from same sender)
                            const isMediaGrouped = isMediaGroup(timeGroup);
                            
                            if (isMediaGrouped) {
                              // Render as MessageGroup for bulk media
                              const firstMessage = timeGroup[0];
                              return (
                                <MessageGroup
                                  key={`group-${dateGroup.date}-${timeGroupIndex}`}
                                  messages={timeGroup}
                                  isOwn={firstMessage.isUser}
                                  sender={firstMessage.sender}
                                  time={firstMessage.time}
                                  showTime={true}
                                  allMessages={messages}
                                  sessionAttachments={sessionAttachments} // ADDED: Pass session attachments
                                  onLoadMoreMessages={onLoadMore}
                                  hasMoreMessages={hasMoreMessages}
                                />
                              );
                            } else {
                              // Render individual messages
                              return timeGroup.map((message, idx) => {
                                const prev = idx > 0 ? timeGroup[idx - 1] : null;
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
                                    allMessages={messages}
                                    sessionAttachments={sessionAttachments} // ADDED: Pass session attachments
                                    onLoadMoreMessages={onLoadMore}
                                    hasMoreMessages={hasMoreMessages}
                                    recipientPresence={recipientPresence} // ADDED: Pass recipient presence
                                  />
                                );
                              });
                            }
                          });
                        })()}
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

            {/* Typing indicator bubble (WhatsApp-like) */}
            <AnimatePresence>
              {isTypingSomeone && !selectedConversation?.isTeamChat && (
                <motion.div
                  key="typing-bubble"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="w-full px-4 sm:px-5"
                >
                  <div className="flex flex-col gap-2.5 items-start">
                    <div className="flex gap-2 items-start">
                      {/* Avatar */}
                      <div className="w-[27px] h-[54px] flex items-center flex-shrink-0">
                        <div className="w-[27px] h-[27px] rounded-full overflow-hidden">
                          {selectedConversation?.avatar ? (
                            <img
                              src={selectedConversation.avatar}
                              alt={selectedConversation?.name || 'Profile'}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = '/empty-profile.svg'; }}
                            />
                          ) : (
                            <img
                              src="/empty-profile.svg"
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>

                      {/* Bubble */}
                      <div className="bg-white rounded-3xl px-4 py-3 min-h-[38px] shadow-sm border border-gray-100">
                        <div className="flex items-end gap-1">
                          <motion.span
                            className="w-1 h-1 bg-[#488BBA] rounded-full inline-block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            className="w-1 h-1 bg-[#488BBA] rounded-full inline-block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                          />
                          <motion.span
                            className="w-1 h-1 bg-[#488BBA] rounded-full inline-block"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Invisible anchor for auto-scroll */}
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

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollDown && messages.length > 0 && (
          <motion.button
            key="scroll-down"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={handleScrollToBottom}
            className="absolute bottom-4 right-4 z-20 bg-[#488BBA] text-white rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 p-3"
            title="Scroll to latest"
            aria-label="Scroll to latest"
          >
            <span className="material-icons">arrow_downward</span>
          </motion.button>
        )}
      </AnimatePresence>

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
