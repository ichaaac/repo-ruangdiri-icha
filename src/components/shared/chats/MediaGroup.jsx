// src/components/shared/chats/components/MediaGroup.jsx

import React from 'react';
import MediaDisplay from './MediaDisplay';

const MediaGroup = ({ 
  mediaItems, 
  allMediaItems = [], 
  onOpenPreview
}) => {
  const handleGroupPreview = (clickedIndex) => {
    // Find the index of clicked item in the full media array
    const clickedItem = mediaItems[clickedIndex];
    const fullIndex = allMediaItems.findIndex(item => item.id === clickedItem.id);
    onOpenPreview(fullIndex >= 0 ? fullIndex : clickedIndex);
  };

  if (mediaItems.length === 1) {
    return (
      <MediaDisplay
        attachmentUrl={mediaItems[0].attachmentUrl}
        attachmentType={mediaItems[0].attachmentType}
        attachmentName={mediaItems[0].attachmentName}
        attachmentSize={mediaItems[0].attachmentSize}
        onOpenPreview={() => handleGroupPreview(0)}
      />
    );
  }

  return (
    <div className="mt-2 w-full max-w-xs">
      <div className="grid grid-cols-2 gap-2">
        {mediaItems.slice(0, 4).map((item, index) => (
          <div key={item.id} className="relative">
            <MediaDisplay
              attachmentUrl={item.attachmentUrl}
              attachmentType={item.attachmentType}
              attachmentName={item.attachmentName}
              attachmentSize={item.attachmentSize}
              onOpenPreview={() => handleGroupPreview(index)}
              isInGroup={true}
            />
            
            {/* Show count overlay on last item if there are more */}
            {index === 3 && mediaItems.length > 4 && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center cursor-pointer"
                onClick={() => handleGroupPreview(index)}
              >
                <span className="text-white font-bold text-lg">
                  +{mediaItems.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      

    </div>
  );
};

export default MediaGroup;