// src/components/shared/chats/components/MessageGroup.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import MediaGroup from './MediaGroup';
import MediaPreviewModal from './MediaPreviewModal';

const MessageGroup = ({ 
  messages, 
  isOwn = false, 
  sender, 
  time, 
  showTime = true,
  allMessages = [],
  onLoadMoreMessages = null,
  hasMoreMessages = false
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Extract media items from this group
  const mediaItems = useMemo(() => {
    return messages
      .filter(msg => msg.attachmentUrl && msg.attachmentUrl.trim())
      .map(msg => ({
        id: msg.id,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
        attachmentName: msg.attachmentName,
        attachmentSize: msg.attachmentSize,
        messageId: msg.id,
        timestamp: msg.timestamp || msg.createdAt
      }));
  }, [messages]);

  // Extract all media items for navigation
  const allMediaItems = useMemo(() => {
    return allMessages
      .filter(msg => msg.attachmentUrl && msg.attachmentUrl.trim())
      .map(msg => ({
        id: msg.id,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
        attachmentName: msg.attachmentName,
        attachmentSize: msg.attachmentSize,
        messageId: msg.id,
        timestamp: msg.timestamp || msg.createdAt
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [allMessages]);

  const handleOpenPreview = useCallback((groupIndex) => {
    // Find the position of the clicked media in the full media array
    const clickedMedia = mediaItems[groupIndex];
    const fullIndex = allMediaItems.findIndex(item => item.id === clickedMedia.id);
    setPreviewIndex(fullIndex >= 0 ? fullIndex : 0);
    setIsPreviewOpen(true);
  }, [mediaItems, allMediaItems]);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
  }, []);

  // Get any text message from the group
  const textMessage = messages.find(msg => msg.text && msg.text.trim());

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
          
          <div className={`flex flex-col gap-1.5 ${isOwn ? 'items-end' : 'items-start'} max-w-xs min-w-0`}>
            <p className={`text-xs font-light text-zinc-500 ${isOwn ? 'text-right' : ''}`}>
              {isOwn ? 'You' : (sender?.name || 'Unknown')}
            </p>
            
            <div className={`
              flex flex-col items-start w-fit
              ${isOwn ? 'bg-sky-100 rounded-xl' : 'bg-white rounded-3xl'}
              p-2
            `}>
              {/* Media Group */}
              {mediaItems.length > 0 && (
                <MediaGroup 
                  mediaItems={mediaItems}
                  allMediaItems={allMediaItems}
                  onOpenPreview={handleOpenPreview}
                />
              )}

              {/* Text content if any */}
              {textMessage?.text && (
                <div className="text-sm leading-5 text-neutral-600 whitespace-pre-wrap break-words w-full mt-2 px-2 pb-1">
                  {textMessage.text}
                </div>
              )}
            </div>
            
            <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
              {showTime && (
                <time className="text-xs font-light text-zinc-500">
                  {time}
                </time>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        mediaItems={allMediaItems}
        initialIndex={previewIndex}
        onLoadMore={onLoadMoreMessages}
        hasMoreMedia={hasMoreMessages}
      />
    </motion.div>
  );
};

export default MessageGroup;