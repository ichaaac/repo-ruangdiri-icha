// src/components/shared/chats/components/MessageBubble.jsx - Simple Working Version

import React from 'react';
import { motion } from 'framer-motion';

// Simple Media Display Component
const MediaDisplay = ({ attachmentUrl, attachmentType, attachmentName, attachmentSize }) => {
  if (!attachmentUrl) return null;

  const isImage = attachmentType?.startsWith('image/');
  
  const handleMediaClick = () => {
    window.open(attachmentUrl, '_blank');
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'picture_as_pdf';
    if (type?.includes('word')) return 'description';
    if (type?.includes('excel') || type?.includes('sheet')) return 'table_chart';
    if (type?.includes('zip') || type?.includes('rar')) return 'archive';
    return 'attach_file';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `${mb} MB`;
  };

  return (
    <div className="mt-2 w-full max-w-xs">
      {isImage ? (
        <img
          src={attachmentUrl}
          alt={attachmentName || 'Image'}
          className="w-full h-48 rounded-lg cursor-pointer hover:opacity-80 transition-opacity object-cover"
          onClick={handleMediaClick}
        />
      ) : (
        <div 
          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full"
          onClick={handleMediaClick}
        >
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-600">
              {getFileIcon(attachmentType)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {attachmentName || 'Document'}
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
    </div>
  );
};

// Message Status Component
const MessageStatus = ({ messageData, isOwn }) => {
  if (!isOwn) return null;
  
  const getStatusIcon = () => {
    if (messageData?.isSending || messageData?.isUploading) {
      return (
        <div className="flex items-center ml-2">
          <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
        </div>
      );
    }
    
    if (messageData?.uploadError || messageData?.sendError) {
      return (
        <div className="flex items-center ml-2" title="Failed to send">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="6" fill="#EF4444"/>
            <path d="M8 4L4 8M4 4l4 4" stroke="white" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
    
    const isRead = messageData?.isRead === true;
    const isSent = messageData?.isSent === true || messageData?.id;
    
    if (isRead) {
      return (
        <div className="flex items-center ml-2" title="Read">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1.5 5L4 7.5L7.5 4" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 5L8 7.5L11.5 4" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else if (isSent) {
      return (
        <div className="flex items-center ml-2" title="Sent">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1.5 5L4 7.5L10.5 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
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
  const hasMedia = !!(attachmentUrl && attachmentUrl.trim());
  const hasText = message && message.trim().length > 0;

  // Calculate dynamic width based on content
  const getMessageWidth = () => {
    if (hasMedia) {
      return 'max-w-xs';
    }
    
    if (showOptions && !isOwn) {
      return 'max-w-[320px] sm:max-w-[400px]';
    }
    
    if (actions && actions.length > 0) {
      return 'max-w-[320px] sm:max-w-[400px]';
    }
    
    if (hasText) {
      const textLength = message.length;
      
      if (textLength <= 20) return 'max-w-[120px] sm:max-w-[150px]';
      if (textLength <= 50) return 'max-w-[200px] sm:max-w-[250px]';
      if (textLength <= 100) return 'max-w-[280px] sm:max-w-[350px]';
      if (textLength <= 200) return 'max-w-[350px] sm:max-w-[420px]';
      return 'max-w-[400px] sm:max-w-[480px]';
    }
    
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
          
          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} ${messageWidthClass} min-w-0`}>
            <p className={`text-xs font-light text-zinc-500 ${isOwn ? 'text-right' : ''}`}>
              {isOwn ? 'You' : (sender?.name || 'Unknown')}
            </p>
            
            <div className={`
              flex flex-col items-start w-fit
              ${isOwn
                ? 'bg-sky-100 rounded-xl'
                : 'bg-white rounded-3xl'
              }
              ${hasMedia ? 'p-2' : 'px-4 py-3 min-h-[47px]'}
            `}>
              {/* Media Display */}
              {hasMedia && (
                <MediaDisplay 
                  attachmentUrl={attachmentUrl}
                  attachmentType={attachmentType}
                  attachmentName={attachmentName}
                  attachmentSize={attachmentSize}
                />
              )}

              {/* Text message */}
              {hasText && (
                <p className={`text-sm leading-5 text-neutral-600 whitespace-pre-wrap break-words w-full ${hasMedia ? 'mt-2 px-2 pb-1' : ''}`}>
                  {message}
                </p>
              )}

              {/* Service options */}
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

              {/* Action buttons */}
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
            
            {/* Time and Status Row */}
            <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              <time className="text-xs font-light text-zinc-500">
                {time}
              </time>
              
              <MessageStatus messageData={messageData} isOwn={isOwn} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;