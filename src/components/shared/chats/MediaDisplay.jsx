// src/components/shared/chats/components/MediaDisplay.jsx

import React, { useState } from 'react';

const MediaDisplay = ({ 
  attachmentUrl, 
  attachmentType, 
  attachmentName, 
  attachmentSize,
  onOpenPreview,
  isInGroup = false 
}) => {
  const [hasError, setHasError] = useState(false);
  
  if (!attachmentUrl) return null;

  const isImage = attachmentType?.startsWith('image/');

  // Normalize URL with error handling
  const normalizeUrl = (url) => {
    if (!url) return '/image-placeholder.svg';
    const trimmed = url.trim();
    
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('//')) return `${window.location.protocol}${trimmed}`;
    if (trimmed.startsWith('/')) return `${window.location.origin}${trimmed}`;
    return `https://${trimmed}`;
  };

  const fullUrl = normalizeUrl(attachmentUrl);

  // FIXED: Image error handler that prevents infinite loops
  const handleImageError = (e) => {
    if (!hasError) {
      setHasError(true);
      e.currentTarget.src = '/image-placeholder.svg';
    }
  };

  const handleQuickDownload = async (e) => {
    e.stopPropagation();
    
    try {
      if (!fullUrl || fullUrl === '/image-placeholder.svg') {
        throw new Error('No valid media URL available');
      }
      
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachmentName || `download_${Date.now()}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
    } catch (error) {
      console.error('Quick download failed:', error);
      if (fullUrl !== '/image-placeholder.svg') {
        window.open(fullUrl, '_blank');
      }
    }
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
    <div className={`${isInGroup ? 'w-full' : 'mt-2 w-full max-w-xs'}`}>
      {isImage ? (
        <div className="relative group cursor-pointer" onClick={onOpenPreview}>
          <img
            src={hasError ? '/image-placeholder.svg' : fullUrl}
            alt={attachmentName || 'Image'}
            className={`w-full ${isInGroup ? 'h-32' : 'h-48'} rounded-lg object-cover transition-opacity hover:opacity-90`}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Overlay Controls */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <div className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100">
                <span className="material-icons text-gray-700 text-lg">zoom_in</span>
              </div>
              <button
                onClick={handleQuickDownload}
                className="bg-green-600 rounded-full p-2 shadow-lg hover:bg-green-700 transition-colors"
                title="Download"
              >
                <span className="material-icons text-white text-lg">download</span>
              </button>
            </div>
          </div>
          

        </div>
      ) : (
        <div
          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full cursor-pointer group"
          onClick={onOpenPreview}
        >
          <div className="flex items-center gap-3">
            <span 
              className="material-icons text-2xl"
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
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleQuickDownload}
                className="p-1 hover:bg-green-100 rounded transition-colors"
                title="Download"
              >
                <span className="material-icons text-green-600 text-sm">download</span>
              </button>
              <span className="material-icons text-gray-400 text-sm">
                visibility
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;