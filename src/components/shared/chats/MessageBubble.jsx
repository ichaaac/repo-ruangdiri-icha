// src/components/shared/chats/components/MessageBubble.jsx - SIMPLE Modal Design

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SIMPLE Media Preview Modal Component - Light & Clean
const SimpleMediaPreviewModal = ({ isOpen, onClose, mediaUrl, mediaType, mediaName, mediaSize }) => {
  if (!isOpen) return null;

  const isImage = mediaType?.startsWith('image/');
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = (bytes / 1024 / 1024).toFixed(1);
    return `${mb} MB`;
  };

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return 'picture_as_pdf';
    if (type?.includes('word')) return 'description';
    if (type?.includes('excel') || type?.includes('sheet')) return 'table_chart';
    if (type?.includes('zip') || type?.includes('rar')) return 'archive';
    return 'attach_file';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* SIMPLE Modal Content - Smaller & Cleaner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl max-h-[80vh] w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Simple Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span 
                className="material-icons"
                style={{ color: '#488BBA' }}
              >
                {isImage ? 'image' : getFileIcon(mediaType)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-800 truncate text-sm">
                  {mediaName || 'Media File'}
                </h3>
                {mediaSize && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(mediaSize)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <a
                href={mediaUrl}
                download={mediaName}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <span className="material-icons text-gray-500 text-sm">download</span>
              </a>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <span className="material-icons text-gray-500 text-sm">close</span>
              </button>
            </div>
          </div>

          {/* Simple Content */}
          <div className="p-4">
            {isImage ? (
              <div className="flex justify-center">
                <img
                  src={mediaUrl}
                  alt={mediaName || 'Image preview'}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                  onError={(e) => {
                    // Prevent infinite onError loop if placeholder is missing
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/image-placeholder.svg';
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <span 
                  className="material-icons text-5xl mb-3 block"
                  style={{ color: '#488BBA' }}
                >
                  {getFileIcon(mediaType)}
                </span>
                <h4 className="font-medium text-gray-800 mb-1">{mediaName}</h4>
                <p className="text-sm text-gray-500 mb-4">
                  {formatFileSize(mediaSize)}
                </p>
                <div className="flex gap-2 justify-center">
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#488BBA' }}
                  >
                    Open
                  </a>
                  <a
                    href={mediaUrl}
                    download={mediaName}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced Media Display Component
const MediaDisplay = ({ attachmentUrl, attachmentType, attachmentName, attachmentSize }) => {
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  
  if (!attachmentUrl) return null;

  const isImage = attachmentType?.startsWith('image/');

  const normalizeUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('//')) return `${window.location.protocol}${trimmed}`;
    return `https://${trimmed.replace(/^\/+/, '')}`;
  };

  const fullUrl = normalizeUrl(attachmentUrl);

  const handleOpenPreview = (e) => {
    e?.preventDefault?.();
    setPreviewOpen(true);
  };

  const handleClosePreview = () => setPreviewOpen(false);

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
    <>
      <div className="mt-2 w-full max-w-xs">
        {isImage ? (
          <div className="relative group cursor-pointer" onClick={handleOpenPreview}>
            <img
              src={fullUrl}
              alt={attachmentName || 'Image'}
              className="w-full h-48 rounded-lg object-cover transition-opacity hover:opacity-90"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/image-placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                <span className="material-icons text-gray-700 text-sm">zoom_in</span>
              </div>
            </div>
            {attachmentName && (
              <div className="mt-1 text-[11px] text-gray-600 break-all" title={attachmentName}>
                {attachmentName}
              </div>
            )}
          </div>
        ) : (
          <div
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full cursor-pointer"
            onClick={handleOpenPreview}
          >
            <div className="flex items-center gap-2">
              <span 
                className="material-icons"
                style={{ color: '#488BBA' }}
              >
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
              <span className="material-icons text-gray-400 text-sm">
                visibility
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Simple Media Preview Modal */}
      <SimpleMediaPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        mediaUrl={fullUrl}
        mediaType={attachmentType}
        mediaName={attachmentName}
        mediaSize={attachmentSize}
      />
    </>
  );
};

// Enhanced Message Status Component
const MessageStatus = ({ messageData, isOwn }) => {
  if (!isOwn) return null;
  
  const getStatusIcon = () => {
    if (messageData?.isSending || messageData?.isUploading) {
      return (
        <div className="flex items-center ml-2" title="Sending...">
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
    const isOptimistic = messageData?.isOptimistic === true;
    
    if (isOptimistic) {
      return (
        <div className="flex items-center ml-2" title="Sending...">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1"/>
            <path d="M6 3v3l2 1" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
    
    if (isRead) {
      return (
        <div className="flex items-center ml-2" title="Read">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M1.5 5L4 7.5L7.5 4" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.5 5L8 7.5L11.5 4" stroke="#4FC3F7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } 
    
    if (isSent) {
      return (
        <div className="flex items-center ml-2" title="Delivered">
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

// Enhanced Message Text with See More functionality
const MessageText = ({ message, hasMedia, isOwn }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const MAX_LENGTH = 550;
  
  if (!message || !message.trim()) return null;
  
  const shouldTruncate = message.length > MAX_LENGTH;
  const displayText = shouldTruncate && !isExpanded 
    ? message.slice(0, MAX_LENGTH) + '...' 
    : message;

  return (
    <div className={`text-sm leading-5 text-neutral-600 whitespace-pre-wrap break-words w-full ${hasMedia ? 'mt-2 px-2 pb-1' : ''}`}>
      {displayText}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`block mt-1 text-xs font-medium hover:underline transition-colors ${
            isOwn ? 'text-blue-700' : 'text-blue-600'
          }`}
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};

const MessageBubble = ({ 
  message, 
  isOwn = false, 
  sender, 
  time, 
  showTime = true,
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
              {hasMedia && (
                <MediaDisplay 
                  attachmentUrl={attachmentUrl}
                  attachmentType={attachmentType}
                  attachmentName={attachmentName}
                  attachmentSize={attachmentSize}
                />
              )}

              {hasText && (
                <MessageText 
                  message={message}
                  hasMedia={hasMedia}
                  isOwn={isOwn}
                />
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
            
            <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              {showTime && (
                <time className="text-xs font-light text-zinc-500">
                  {time}
                </time>
              )}
              
              <MessageStatus messageData={messageData} isOwn={isOwn} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
