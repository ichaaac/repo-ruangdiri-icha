// src/components/shared/chats/components/MediaGroup.jsx - Clean Grid Layout

import React from 'react';
import MediaDisplay from './MediaDisplay';

const MediaGroup = ({ 
  mediaItems = [], 
  onOpenPreview
}) => {
  // FIXED: Proper error handling for undefined mediaItems
  if (!mediaItems || mediaItems.length === 0) {
    return null;
  }

  const handleGroupPreview = (clickedIndex) => {
    // FIXED: Validate index and item existence before accessing properties
    if (clickedIndex >= 0 && clickedIndex < mediaItems.length && mediaItems[clickedIndex]) {
      onOpenPreview(clickedIndex);
    }
  };

  if (mediaItems.length === 1) {
    return (
      <MediaDisplay
        attachmentUrl={mediaItems[0]?.attachmentUrl}
        attachmentType={mediaItems[0]?.attachmentType}
        attachmentName={mediaItems[0]?.attachmentName}
        attachmentSize={mediaItems[0]?.attachmentSize}
        onOpenPreview={() => handleGroupPreview(0)}
      />
    );
  }

  return (
    <div className="mt-2 w-full max-w-xs">
      <div className="grid grid-cols-2 gap-2">
        {mediaItems.slice(0, 4).map((item, index) => {
          // FIXED: Validate item exists before rendering
          if (!item || !item.attachmentUrl) {
            return null;
          }

          return (
            <div key={item.id || `media-${index}`} className="relative">
              <MediaDisplay
                attachmentUrl={item.attachmentUrl}
                attachmentType={item.attachmentType}
                attachmentName={item.attachmentName}
                attachmentSize={item.attachmentSize}
                onOpenPreview={() => handleGroupPreview(index)}
                isInGroup={true}
              />
              
              {/* REMOVED: Count overlay - cleaner WhatsApp style */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaGroup;