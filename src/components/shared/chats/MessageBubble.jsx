// src/components/shared/chats/components/MessageBubble.jsx - FIXED: WhatsApp-style Read Indicators

import React from 'react';
import { motion } from 'framer-motion';

// FIXED: WhatsApp-style Message Status Component
const MessageStatus = ({ messageData, isOwn }) => {
  if (!isOwn) return null; // Only show for own messages
  
  const getStatusIcon = () => {
    // Loading state - spinning circle
    if (messageData.isSending || messageData.isUploading) {
      return (
        <div className="flex items-center ml-2">
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
        </div>
      );
    }
    
    // Error state - red X
    if (messageData.uploadError || messageData.sendError) {
      return (
        <div className="flex items-center ml-2" title="Failed to send">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="6" fill="#EF4444"/>
            <path d="M8 4L4 8M4 4l4 4" stroke="white" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
    
    // Success states - checkmarks
    const isRead = messageData.isRead === true;
    const isSent = messageData.isSent === true || messageData.id;
    
    if (isRead) {
      // Double checkmarks in blue (read)
      return (
        <div className="flex items-center ml-2" title="Read">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            {/* First checkmark */}
            <path 
              d="M1.5 5L4 7.5L7.5 4" 
              stroke="#4FC3F7" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            {/* Second checkmark (offset to the right) */}
            <path 
              d="M5.5 5L8 7.5L11.5 4" 
              stroke="#4FC3F7" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    } else if (isSent) {
      // Single checkmark in gray (sent but not read)
      return (
        <div className="flex items-center ml-2" title="Sent">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path 
              d="M1.5 5L4 7.5L10.5 1" 
              stroke="#9CA3AF" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }
    
    // Pending/unsent state - clock icon
    return (
      <div className="flex items-center ml-2" title="Pending">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1"/>
          <path d="M6 3v3l2 1" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </div>
    );
  };
  
  return getStatusIcon();
};

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
  attachmentSize,
  messageData
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

  // FIXED: Calculate dynamic width based on content
  const getMessageWidth = () => {
    const hasText = message && message.trim().length > 0;
    const hasAttachment = !!attachmentUrl;
    const hasOptions = showOptions && !isOwn;
    const hasActions = actions && actions.length > 0;
    
    // Base calculations for different content types
    if (hasAttachment && isImage) {
      return 'max-w-[300px] sm:max-w-[400px]'; // Larger for images
    }
    
    if (hasAttachment && !isImage) {
      return 'max-w-[280px] sm:max-w-[350px]'; // Medium for documents
    }
    
    if (hasOptions || hasActions) {
      return 'max-w-[320px] sm:max-w-[400px]'; // Wider for option buttons
    }
    
    if (hasText) {
      const textLength = message.length;
      
      // Very short messages - tight bubble
      if (textLength <= 20) {
        return 'max-w-[120px] sm:max-w-[150px]';
      }
      
      // Short messages - small bubble
      if (textLength <= 50) {
        return 'max-w-[200px] sm:max-w-[250px]';
      }
      
      // Medium messages - medium bubble  
      if (textLength <= 100) {
        return 'max-w-[280px] sm:max-w-[350px]';
      }
      
      // Long messages - large bubble
      if (textLength <= 200) {
        return 'max-w-[350px] sm:max-w-[420px]';
      }
      
      // Very long messages - max bubble
      return 'max-w-[400px] sm:max-w-[480px]';
    }
    
    // Default fallback
    return 'max-w-[250px] sm:max-w-[320px]';
  };

  const messageWidthClass = getMessageWidth();

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
          
          {/* FIXED: Dynamic width message container */}
          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} ${messageWidthClass} min-w-0`}>
            <p className={`text-xs font-light text-zinc-500 ${isOwn ? 'text-right' : ''}`}>
              {isOwn ? 'You' : (sender?.name || 'Unknown')}
            </p>
            
            {/* FIXED: Message bubble with dynamic padding and width */}
            <div className={`
              flex flex-col items-start px-4 py-3 min-h-[47px] w-fit
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
            </div>
            
            {/* FIXED: Time and Status Row - WhatsApp Style */}
            <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <time className="text-xs font-light text-zinc-500">
                {time}
              </time>
              
              {/* FIXED: Status indicators next to time like WhatsApp */}
              <MessageStatus messageData={messageData} isOwn={isOwn} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;