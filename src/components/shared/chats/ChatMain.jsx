// src/components/shared/chats/Main.jsx - FIXED: Message Status & Infinite Scroll

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatChatDateHeader } from './utils/dateUtils';
import MediaUploadPreview from './MediaUploadPreview';

// ✅ ENHANCED: Upload dropdown with better file handling
const UploadDropdown = ({ isOpen, onClose, onFilesSelect }) => {
  const dropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
    onClose();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    onClose();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles, 'image');
    }
    e.target.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles, 'file');
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button 
        onClick={handleImageSelect}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="material-icons text-gray-600 text-sm">image</span>
        Upload Images (Max 15MB)
      </button>
      <button 
        onClick={handleFileSelect}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="material-icons text-gray-600 text-sm">attach_file</span>
        Upload Documents (Max 15MB)
      </button>
    </div>
  );
};

// Generate date header for messages
const generateDateHeader = formatChatDateHeader;

// ✅ NEW: Message Status Component (WhatsApp-like read indicators)
const MessageStatus = ({ message, isOwn }) => {
  if (!isOwn) return null; // Only show for own messages
  
  const getStatusIcon = () => {
    if (message.isSending) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
      );
    }
    
    if (message.isUploading) {
      return (
        <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
      );
    }
    
    // ✅ DOUBLE CHECK: Read status
    const isRead = message.isRead === true;
    const checkColor = isRead ? '#488BBA' : '#9CA3AF'; // Blue if read, gray if unread
    
    return (
      <div className="flex items-center">
        {/* Double check marks */}
        <svg 
          width="12" 
          height="8" 
          viewBox="0 0 12 8" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative"
        >
          {/* First check */}
          <path 
            d="M1 4L3.5 6.5L7 3" 
            stroke={checkColor} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          {/* Second check (offset) */}
          <path 
            d="M4 4L6.5 6.5L10 3" 
            stroke={checkColor} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };
  
  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
    </div>
  );
};

// ✅ ENHANCED: Message bubble with read status
const MessageBubble = ({ 
  message, 
  isOwn = false, 
  sender, 
  time, 
  showOptions, 
  onOptionClick, 
  actions,
  attachmentUrl,
  attachmentType,
  attachmentName,
  attachmentSize
}) => {
  const handleAttachmentClick = () => {
    if (attachmentUrl) {
      window.open(attachmentUrl, '_blank');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = attachmentType?.startsWith('image/');
  const isDocument = attachmentType?.includes('pdf') || attachmentType?.includes('word') || attachmentType?.includes('text');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full px-4 sm:px-5"
    >
      <div className={`flex flex-col gap-2.5 ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`flex gap-2 items-start w-full ${isOwn ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
          {!isOwn && (
            <div className="w-[27px] h-[54px] flex items-center flex-shrink-0">
              <div className="w-[27px] h-[27px] rounded-full overflow-hidden">
                {sender?.role === 'ai_assistant' ? (
                  <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                ) : sender?.profilePicture ? (
                  <img
                    src={sender.profilePicture}
                    alt={sender.name}
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
          </div>
          )}
          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[454px] min-w-0`}>
            <p className={`text-xs font-light text-zinc-500 ${isOwn ? 'text-right' : ''}`}>
              {isOwn ? 'You' : (sender?.name || 'Unknown')}
            </p>
            <div className={`
              flex flex-col items-start px-4 py-3 min-h-[47px] w-full
              ${isOwn
                ? 'bg-sky-100 rounded-xl'
                : 'bg-white rounded-3xl'
              }
            `}>
              {message && (
                <p className="text-sm leading-5 text-neutral-600 whitespace-pre-wrap break-words w-full">
                  {message}
                </p>
              )}

              {isImage && attachmentUrl && (
                <div className="mt-2 w-full">
                  <img
                    src={attachmentUrl}
                    alt={attachmentName || 'Uploaded image'}
                    className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleAttachmentClick}
                  />
                  {attachmentName && (
                    <p className="text-xs text-gray-500 mt-1">{attachmentName}</p>
                  )}
                </div>
              )}

              {!isImage && attachmentUrl && (
                <div 
                  className="mt-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full"
                  onClick={handleAttachmentClick}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-icons text-gray-600">
                      {isDocument ? 'description' : 'attach_file'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {attachmentName || 'Uploaded file'}
                      </p>
                      {attachmentSize && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachmentSize)}
                        </p>
                      )}
                    </div>
                    <span className="material-icons text-gray-400 text-sm">download</span>
                  </div>
                </div>
              )}

              {showOptions && !isOwn && (
                <div className="mt-3 w-full border-t border-gray-200 pt-3">
                  <div className="space-y-1">
                    {[
                      { icon: 'accessibility', text: 'Ruang Cerita' },
                      { icon: 'calendar_today', text: 'Booking Sesi Konseling' },
                      { icon: 'help', text: 'FAQ (Frequently Asked Questions)' }
                    ].map((option, index) => (
                      <button
                        key={index}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded border-b border-gray-200 last:border-b-0 transition-colors"
                        style={{ color: '#488BBA' }}
                        onClick={() => onOptionClick && onOptionClick(option.text)}
                      >
                        <span className="material-icons text-sm">{option.icon}</span>
                        <span className="text-xs">{option.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actions && actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className="px-3 py-1 text-xs rounded-full hover:opacity-80 transition-colors"
                      style={{ 
                        backgroundColor: '#488BBA20', 
                        color: '#488BBA'
                      }}
                      onClick={() => onOptionClick && onOptionClick(action)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
              
              {/* ✅ NEW: Message Status for own messages */}
              <MessageStatus message={message} isOwn={isOwn} />
            </div>
            
            <div className="flex items-center gap-2">
              <time className="text-xs font-light text-zinc-500">
                {time}
              </time>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ✅ FIXED: Chat header with proper typing indicator display
const ChatHeader = ({ 
  selectedConversation, 
  onToggleSidebar, 
  connectionStatus, 
  isPsychologist, 
  onEndSession, 
  isEndingSession,
  typingStatus
}) => {
  return (
    <div className="flex-shrink-0 flex justify-between items-center px-4 sm:px-[30px] bg-white border-solid border-y-[0.25px] border-y-zinc-500 h-[70px]">
      <div className="flex gap-3 sm:gap-5 items-center min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
          aria-label="Open sidebar"
        >
          <span className="material-icons">menu</span>
        </button>
        
        <div className="w-[35px] h-[35px] sm:w-[45px] sm:h-[45px] rounded-full overflow-hidden flex-shrink-0">
          {selectedConversation?.isTeamChat ? (
            <div className="w-full h-full bg-[#1E5A89] flex items-center justify-center">
              <span className="text-white text-lg sm:text-xl">🤖</span>
            </div>
          ) : selectedConversation?.avatar ? (
            <img
              src={selectedConversation.avatar}
              alt={selectedConversation.name}
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
        
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold truncate" style={{ color: '#488BBA' }}>
            {selectedConversation?.name || 'Unknown'}
          </h2>
          
          {/* ✅ ENHANCED: Typing indicator with framer-motion */}
          {selectedConversation?.isTeamChat ? (
            <p className="text-xs font-light" style={{ color: '#488BBA' }}>
              🤖 AI Assistant - Always Available
            </p>
          ) : typingStatus ? (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                />
                <motion.div 
                  className="w-1 h-1 bg-[#488BBA] rounded-full"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
              </div>
              <span className="text-xs font-light text-[#488BBA]">
                {typingStatus}
              </span>
            </motion.div>
          ) : (
            // Regular connection status when no one is typing
            <div className="flex items-center gap-2">
              <p className={`text-xs font-light ${
                connectionStatus === 'connected' ? 'text-green-500' : 'text-gray-500'
              }`}>
                {connectionStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
              </p>
              
              {selectedConversation?.status && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className={`text-xs font-medium ${
                    selectedConversation.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {selectedConversation.status === 'active' ? 'Active Session' : selectedConversation.status}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-start items-center gap-1 sm:gap-[5px] flex-shrink-0">
        {/* END SESSION BUTTON - ONLY FOR PSYCHOLOGIST */}
        {isPsychologist && !selectedConversation?.isTeamChat && selectedConversation?.isActive && (
          <button 
            className="px-2 sm:px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1 sm:mr-2" 
            title="End Session"
            onClick={() => onEndSession && onEndSession(selectedConversation.sessionId)}
            disabled={isEndingSession}
          >
            {isEndingSession ? (
              <div className="flex items-center gap-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                <span className="hidden sm:inline">Ending...</span>
              </div>
            ) : (
              <>
                <span className="hidden sm:inline">End Session</span>
                <span className="sm:hidden material-icons text-sm">stop</span>
              </>
            )}
          </button>
        )}

        {/* Psychologist Controls */}
        {isPsychologist && !selectedConversation?.isTeamChat && (
          <div className="flex items-center gap-1 sm:gap-2 mr-2 sm:mr-4">
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors" 
              title="Session Notes"
            >
              <span className="material-icons text-gray-600 text-lg sm:text-xl">note_add</span>
            </button>
          </div>
        )}
        
        {/* Close button */}
        <button className="cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.4 14L0 12.6L5.6 7L0 1.4L1.4 0L7 5.6L12.6 0L14 1.4L8.4 7L14 12.6L12.6 14L7 8.4L1.4 14Z" fill="#8B8B8B"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

// ✅ ENHANCED: Chat messages with infinite scroll
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

  const getDateHeader = () => {
    if (messages.length > 0) {
      return generateDateHeader(messages[0]?.timestamp);
    }
    return 'Hari ini';
  };

  // ✅ ENHANCED: Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || !hasMoreMessages || isLoadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const scrollFromBottom = scrollHeight - scrollTop - clientHeight;
    
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
    <div className="flex-1 relative bg-zinc-100">
      <div 
        ref={messagesContainerRef}
        className="absolute inset-0 overflow-y-auto messages-scroll"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: '#6B7280 #E5E7EB'
        }}
      >
        <div className="flex flex-col gap-2.5 items-center py-4 min-h-full">
          {/* ✅ NEW: Load More Button/Indicator */}
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

          <time className="mb-4 text-xs font-light leading-5 text-center text-zinc-500">
            {getDateHeader()}
          </time>

          {sessionStatus !== 'ready' && sessionStatus !== 'ai_chat' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mx-4 max-w-md">
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

          {/* Messages Container */}
          <div className="flex flex-col gap-4 w-full max-w-full pb-4">
            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message.text}
                  isOwn={message.isUser}
                  sender={message.sender}
                  time={message.time}
                  showOptions={message.showOptions}
                  actions={message.actions}
                  onOptionClick={onAIServiceSelection}
                  attachmentUrl={message.attachmentUrl}
                  attachmentType={message.attachmentType}
                  attachmentName={message.attachmentName}
                  attachmentSize={message.attachmentSize}
                />
              ))}
            </AnimatePresence>

            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} style={{ height: '1px', visibility: 'hidden' }} />
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

// ✅ ENHANCED: Chat input with media upload preview
const ChatInput = ({ 
  messageText, 
  onMessageChange, 
  onSendMessage, 
  canSendMessage, 
  canSendMessageWithText,
  isSending,
  isAIChat,
  onKeyPress,
  onFileUpload,
  selectedConversation
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [mediaPreviewText, setMediaPreviewText] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Handle file selection with preview
  const handleFilesSelect = (files, fileType) => {
    const validFiles = [];
    
    files.forEach(file => {
      try {
        import('./lib/chatsApi').then(({ chatsApi }) => {
          chatsApi.validateFile(file);
        });
        
        // Create preview URL for images
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        
        validFiles.push({
          id: Date.now() + Math.random(),
          file,
          preview,
          fileType
        });
      } catch (error) {
        alert(`${file.name}: ${error.message}`);
      }
    });
    
    if (validFiles.length > 0) {
      setPendingFiles(validFiles);
      setShowMediaPreview(true);
      setMediaPreviewText(messageText);
    }
  };

  // Remove file from preview
  const handleRemoveFile = (fileId) => {
    setPendingFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      
      // Clean up object URLs
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      return updated;
    });
  };

  // Send media files
  const handleSendMedia = async () => {
    if (pendingFiles.length === 0 || isUploadingMedia) return;
    
    try {
      setIsUploadingMedia(true);
      
      // Upload files one by one
      for (const fileItem of pendingFiles) {
        await onFileUpload(fileItem.file, fileItem.fileType);
      }
      
      // Send caption message if exists
      if (mediaPreviewText.trim()) {
        onMessageChange(mediaPreviewText);
        setTimeout(() => {
          onSendMessage();
        }, 100);
      }
      
      // Cleanup
      handleCloseMediaPreview();
      
    } catch (error) {
      console.error('Media upload error:', error);
      alert(error.message || 'Failed to upload media');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Close media preview
  const handleCloseMediaPreview = () => {
    // Clean up object URLs
    pendingFiles.forEach(fileItem => {
      if (fileItem.preview) {
        URL.revokeObjectURL(fileItem.preview);
      }
    });
    
    setPendingFiles([]);
    setShowMediaPreview(false);
    setMediaPreviewText('');
  };

  const canUploadFiles = !isAIChat && (typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage);
  const canSendWithText = typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText;

  return (
    <>
      {/* Media Upload Preview */}
      <MediaUploadPreview
        isOpen={showMediaPreview}
        files={pendingFiles}
        onClose={handleCloseMediaPreview}
        onSend={handleSendMedia}
        onRemoveFile={handleRemoveFile}
        messageText={mediaPreviewText}
        onMessageChange={setMediaPreviewText}
        isUploading={isUploadingMedia}
      />

      {/* Chat Input */}
      <div className="flex-shrink-0 flex flex-col gap-2.5 bg-white border-solid border-y-[0.25px] border-y-zinc-500 min-h-[100px] sm:h-[127px] px-4 sm:px-[19px] py-4 sm:py-[19px]">
        <div className="flex flex-col justify-between flex-1">
          <textarea
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={
              isAIChat
                ? 'Type a message here....' 
                : !(typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage)
                ? 'Chat tidak tersedia...' 
                : 'Type a message here....'
            }
            className="text-sm sm:text-base leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            rows="2"
            disabled={(!canSendMessage && !isAIChat) || isUploadingMedia}
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2 sm:gap-4 relative">
              <div className="relative">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                  aria-label="Add attachment"
                  disabled={!canUploadFiles || isUploadingMedia}
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  title={!canUploadFiles ? (isAIChat ? "File upload not supported for AI assistant" : "Cannot upload files in current session") : "Upload files (Max 15MB)"}
                >
                  <span className="material-icons text-zinc-500 text-lg sm:text-xl">add_circle_outline</span>
                </button>
                <UploadDropdown 
                  isOpen={showUploadDropdown && !isUploadingMedia && canUploadFiles} 
                  onClose={() => setShowUploadDropdown(false)}
                  onFilesSelect={handleFilesSelect}
                />
              </div>
              
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                aria-label="Add emoji"
                disabled={(!(typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage) && !isAIChat) || isUploadingMedia}
              >
                <span className="material-icons text-zinc-500 text-lg sm:text-xl">sentiment_satisfied_alt</span>
              </button>
            </div>
            
            <button 
              onClick={onSendMessage}
              disabled={!canSendWithText || isSending || isUploadingMedia}
              className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors" 
              aria-label="Send message"
              title={!canSendWithText ? "Cannot send message" : "Send message"}
            >
              {isSending || isUploadingMedia ? (
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#488BBA' }}
                ></div>
              ) : (
                <span 
                  className="material-icons text-lg sm:text-xl"
                  style={{ color: canSendWithText ? '#488BBA' : '#999' }}
                >
                  send
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ✅ UPDATED: Main chat component with infinite scroll and message status
const ChatMain = ({
  selectedConversation,
  messages = [],
  messageText,
  onMessageChange,
  onSendMessage,
  onAIServiceSelection,
  canSendMessage,
  canSendMessageWithText,
  isSending = false,
  connectionStatus = 'disconnected',
  getSessionStatus,
  onBookingClick,
  onToggleSidebar,
  onEndSession,
  userType,
  isPsychologist = false,
  isEndingSession = false,
  onFileUpload,
  typingStatus,
  // ✅ NEW: Infinite scroll props
  onLoadMoreMessages,
  hasMoreMessages,
  isLoadingMoreMessages
}) => {
  const messagesEndRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const canSendWithText = typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText;
      if (canSendWithText) {
        onSendMessage();
      }
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!selectedConversation) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-100 w-full overflow-hidden">
        <div className="text-center max-w-md p-4 sm:p-8 mx-4">
          <div className="text-4xl sm:text-6xl mb-4">💬</div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
            {isPsychologist ? 'Selamat datang, Dokter' : 'Selamat datang di RuangDiri Chat'}
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {isPsychologist 
              ? 'Pilih klien dari sidebar untuk memulai sesi konseling.'
              : 'Pilih percakapan dari sidebar untuk memulai chat dengan konselor atau tim kami.'
            }
          </p>
          
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-green-500">🔐</span>
              <span className="font-medium text-gray-800 text-sm sm:text-base">End-to-end encrypted</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
              Pesan Anda dilindungi dengan enkripsi end-to-end.
            </p>
            
            {onBookingClick && !isPsychologist && (
              <button 
                onClick={onBookingClick}
                className="w-full text-white py-2 px-4 rounded-lg hover:opacity-90 transition-colors text-sm sm:text-base"
                style={{ backgroundColor: '#488BBA' }}
              >
                Booking Sesi Chat
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAIChat = selectedConversation?.isTeamChat || (getSessionStatus && getSessionStatus() === 'ai_chat');

  return (
    <div className="h-full flex flex-col overflow-hidden w-full">
      {/* Header with typing status */}
      <ChatHeader 
        selectedConversation={selectedConversation}
        onToggleSidebar={onToggleSidebar}
        connectionStatus={connectionStatus}
        isPsychologist={isPsychologist}
        onEndSession={onEndSession}
        isEndingSession={isEndingSession}
        typingStatus={typingStatus}
      />

      {/* ✅ ENHANCED: Messages Area with infinite scroll */}
      <ChatMessages 
        messages={messages}
        selectedConversation={selectedConversation}
        getSessionStatus={getSessionStatus}
        onAIServiceSelection={onAIServiceSelection}
        messagesEndRef={messagesEndRef}
        onLoadMore={onLoadMoreMessages}
        hasMoreMessages={hasMoreMessages}
        isLoadingMore={isLoadingMoreMessages}
      />

      {/* Enhanced Input Area with media upload */}
      <ChatInput 
        messageText={messageText}
        onMessageChange={onMessageChange}
        onSendMessage={onSendMessage}
        canSendMessage={canSendMessage}
        canSendMessageWithText={canSendMessageWithText}
        isSending={isSending}
        isAIChat={isAIChat}
        onKeyPress={handleKeyPress}
        onFileUpload={onFileUpload}
        selectedConversation={selectedConversation}
      />
    </div>
  );
};

export default ChatMain;