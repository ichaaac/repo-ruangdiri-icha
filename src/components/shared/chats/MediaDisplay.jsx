// src/components/shared/chats/components/MediaDisplay.jsx - WhatsApp Style Clean

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

  // DEBUG: Log attachmentUrl untuk troubleshooting
  console.log('📎 MediaDisplay received:', {
    attachmentUrl,
    attachmentType,
    attachmentName,
    attachmentSize,
    isImage: attachmentType?.startsWith('image/')
  });

  if (!attachmentUrl) {
    console.warn('⚠️ MediaDisplay: attachmentUrl is null/undefined');
    return null;
  }

  const isImage = attachmentType?.startsWith('image/');

  // ENHANCED: Normalize URL with better backend URL handling
  const normalizeUrl = (url) => {
    if (!url) return '/image-placeholder.svg';
    const trimmed = url.trim();

    // Full URL with protocol
    if (/^https?:\/\//i.test(trimmed)) {
      console.log('✅ Full URL detected:', trimmed);
      return trimmed;
    }

    // Protocol-relative URL
    if (trimmed.startsWith('//')) {
      const normalized = `${window.location.protocol}${trimmed}`;
      console.log('🔗 Protocol-relative URL normalized:', normalized);
      return normalized;
    }

    // Absolute path - prepend backend upload URL
    if (trimmed.startsWith('/')) {
      // Use VITE_UPLOAD_URL from environment (backend base URL for file uploads)
      const uploadUrl = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:3132';
      const normalized = `${uploadUrl}${trimmed}`;
      console.log('🔗 Absolute path normalized:', normalized);
      return normalized;
    }

    // FIXED: Handle backend paths without leading slash (e.g., 'chat-attachments/...' or 'uploads/...')
    if (trimmed.startsWith('chat-attachments/') || trimmed.startsWith('uploads/')) {
      const uploadUrl = import.meta.env.VITE_UPLOAD_URL || 'http://localhost:3132';
      const normalized = `${uploadUrl}/${trimmed}`;
      console.log('🔗 Relative backend path normalized:', normalized);
      return normalized;
    }

    // Assume HTTPS if no protocol (external URL)
    const normalized = `https://${trimmed}`;
    console.log('🔗 No protocol, assuming HTTPS:', normalized);
    return normalized;
  };

  const fullUrl = normalizeUrl(attachmentUrl);
  console.log('🖼️ Final URL for display:', fullUrl);

  // FIXED: Image error handler with detailed logging
  const handleImageError = (e) => {
    if (!hasError) {
      console.error('❌ Failed to load image:', {
        originalUrl: attachmentUrl,
        normalizedUrl: fullUrl,
        errorEvent: e,
        possibleIssues: [
          'Backend not serving static files',
          'CORS blocking the request',
          'File path incorrect on backend',
          'File not uploaded successfully'
        ]
      });
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

  return (
    <div className={`${isInGroup ? 'w-full' : 'mt-2 w-full max-w-xs'}`}>
      {isImage ? (
        <div className="relative group cursor-pointer" onClick={onOpenPreview}>
          <img
            src={hasError ? '/image-placeholder.svg' : fullUrl}
            alt="Attachment"
            className={`w-full ${isInGroup ? 'h-32' : 'h-48'} rounded-lg object-cover transition-opacity hover:opacity-90`}
            onError={handleImageError}
            loading="lazy"
          />
          
          {/* Overlay Controls - Only Download */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-sm font-medium text-gray-800">
                Document
              </p>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleQuickDownload}
                className="p-1 hover:bg-green-100 rounded transition-colors"
                title="Download"
              >
                <span className="material-icons text-green-600 text-sm">download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDisplay;