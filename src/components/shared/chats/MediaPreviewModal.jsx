// src/components/shared/chats/components/MediaPreviewModal.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MediaPreviewModal = ({ 
  isOpen, 
  onClose, 
  mediaItems = [], 
  initialIndex = 0,
  onLoadMore = null,
  hasMoreMedia = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageErrors, setImageErrors] = useState(new Set());

  if (!isOpen || !mediaItems.length) return null;

  const currentMedia = mediaItems[currentIndex];
  const isImage = currentMedia?.attachmentType?.startsWith('image/');
  
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

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (hasMoreMedia && onLoadMore) {
      onLoadMore();
    }
  };

  const goToNext = () => {
    if (currentIndex < mediaItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    
    try {
      const mediaUrl = currentMedia.attachmentUrl;
      const mediaName = currentMedia.attachmentName;
      
      if (!mediaUrl) {
        throw new Error('No media URL available');
      }

      const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `https://${mediaUrl}`;
      
      try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = mediaName || `download_${Date.now()}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
        
      } catch (fetchError) {
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = mediaName || 'download';
        link.target = '_blank';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleView = (e) => {
    e.preventDefault();
    const mediaUrl = currentMedia.attachmentUrl;
    const fullUrl = mediaUrl?.startsWith('http') ? mediaUrl : `https://${mediaUrl}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const handleImageError = (e) => {
    const imageUrl = e.currentTarget.src;
    
    setImageErrors(prev => new Set([...prev, imageUrl]));
    
    if (!imageErrors.has(imageUrl)) {
      e.currentTarget.src = '/image-placeholder.svg';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[600px] h-[500px] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span 
                className="material-icons text-lg"
                style={{ color: '#488BBA' }}
              >
                {isImage ? 'image' : getFileIcon(currentMedia.attachmentType)}
              </span>
              <div>
                <p className="text-sm text-gray-500">
                  {formatFileSize(currentMedia.attachmentSize)}
                  {mediaItems.length > 1 && (
                    <span className="ml-2 text-blue-600">
                      {currentIndex + 1} of {mediaItems.length}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Actions */}
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download"
              >
                <span className="material-icons text-gray-600">download</span>
              </button>
              
              {!isImage && (
                <button
                  onClick={handleView}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <span className="material-icons text-gray-600">open_in_new</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Close"
              >
                <span className="material-icons text-gray-500">close</span>
              </button>
            </div>
          </div>

          {/* Content with side navigation */}
          <div className="relative flex-1 flex items-center justify-center bg-gray-100">
            {/* Left Navigation */}
            {mediaItems.length > 1 && currentIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-3 z-10 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-colors"
                title="Previous"
              >
                <span className="material-icons">chevron_left</span>
              </button>
            )}

            {/* Media Content */}
            <div className="w-full h-full flex items-center justify-center p-4">
              {isImage ? (
                <img
                  key={`${currentMedia.id}-${currentIndex}`}
                  src={currentMedia.attachmentUrl?.startsWith('http') ? 
                       currentMedia.attachmentUrl : 
                       `https://${currentMedia.attachmentUrl}`}
                  alt="Image preview"
                  className="max-w-full max-h-full object-contain"
                  onError={handleImageError}
                />
              ) : (
                <div className="text-center">
                  <span 
                    className="material-icons text-6xl mb-4 block"
                    style={{ color: '#488BBA' }}
                  >
                    {getFileIcon(currentMedia.attachmentType)}
                  </span>
                  <p className="text-gray-600 mb-4">
                    {formatFileSize(currentMedia.attachmentSize)} • {currentMedia.attachmentType}
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleView}
                      className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
                      style={{ backgroundColor: '#488BBA' }}
                    >
                      <span className="material-icons">open_in_new</span>
                      Open File
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <span className="material-icons">download</span>
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Navigation */}
            {mediaItems.length > 1 && currentIndex < mediaItems.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-3 z-10 p-2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80 transition-colors"
                title="Next"
              >
                <span className="material-icons">chevron_right</span>
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaPreviewModal;