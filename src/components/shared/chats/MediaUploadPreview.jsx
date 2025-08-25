// src/components/shared/chats/MediaUploadPreview.jsx - WhatsApp-like Upload Preview

import React, { useState, useRef, useEffect } from 'react';

const MediaUploadPreview = ({ 
  isOpen, 
  files, 
  onClose, 
  onSend, 
  onRemoveFile,
  messageText,
  onMessageChange,
  isUploading = false
}) => {
  const messageInputRef = useRef(null);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  // Auto focus message input when opened
  useEffect(() => {
    if (isOpen && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'ArrowLeft' && files.length > 1) {
        setCurrentFileIndex(prev => (prev > 0 ? prev - 1 : files.length - 1));
      } else if (e.key === 'ArrowRight' && files.length > 1) {
        setCurrentFileIndex(prev => (prev < files.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, files.length, onClose]);

  const handleSend = () => {
    if (files.length > 0 && !isUploading) {
      onSend();
    }
  };

  const handleRemoveCurrentFile = () => {
    if (files.length > 0) {
      const fileToRemove = files[currentFileIndex];
      onRemoveFile(fileToRemove.id);
      
      // Adjust current index if needed
      if (currentFileIndex >= files.length - 1) {
        setCurrentFileIndex(Math.max(0, files.length - 2));
      }
      
      // Close if no files left
      if (files.length <= 1) {
        onClose();
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'picture_as_pdf';
    if (fileType.includes('word')) return 'description';
    if (fileType.includes('excel')) return 'table_chart';
    if (fileType.includes('powerpoint')) return 'slideshow';
    if (fileType.includes('zip') || fileType.includes('rar')) return 'archive';
    return 'insert_drive_file';
  };

  if (!isOpen || files.length === 0) return null;

  const currentFile = files[currentFileIndex];
  const isImage = currentFile?.file.type.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            disabled={isUploading}
          >
            <span className="material-icons">close</span>
          </button>
          <div>
            <h3 className="text-lg font-medium">
              {files.length > 1 ? `${currentFileIndex + 1} of ${files.length}` : 'Send Media'}
            </h3>
            <p className="text-sm text-gray-300">
              {currentFile?.file.name} • {formatFileSize(currentFile?.file.size)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {files.length > 1 && (
            <>
              <button
                onClick={() => setCurrentFileIndex(prev => (prev > 0 ? prev - 1 : files.length - 1))}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                disabled={isUploading}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentFileIndex(prev => (prev < files.length - 1 ? prev + 1 : 0))}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                disabled={isUploading}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </>
          )}
          
          <button
            onClick={handleRemoveCurrentFile}
            className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-full transition-colors text-red-400"
            disabled={isUploading}
          >
            <span className="material-icons">delete</span>
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl max-h-full w-full h-full flex items-center justify-center">
          {isImage ? (
            <img
              src={currentFile.preview}
              alt={currentFile.file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="bg-white rounded-lg p-8 text-center shadow-lg">
              <div className="flex flex-col items-center gap-4">
                <span 
                  className="material-icons text-6xl"
                  style={{ color: '#488BBA' }}
                >
                  {getFileIcon(currentFile.file.type)}
                </span>
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-1">
                    {currentFile.file.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(currentFile.file.size)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File Thumbnails (if multiple files) */}
      {files.length > 1 && (
        <div className="bg-black bg-opacity-50 p-4">
          <div className="flex gap-2 overflow-x-auto max-w-full">
            {files.map((fileItem, index) => (
              <button
                key={fileItem.id}
                onClick={() => setCurrentFileIndex(index)}
                className={`
                  relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${index === currentFileIndex 
                    ? 'border-blue-500 ring-2 ring-blue-300' 
                    : 'border-gray-500 hover:border-gray-300'
                  }
                `}
                disabled={isUploading}
              >
                {fileItem.file.type.startsWith('image/') ? (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="material-icons text-white text-sm">
                      {getFileIcon(fileItem.file.type)}
                    </span>
                  </div>
                )}
                
                {/* Remove button for each file */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(fileItem.id);
                    if (index === currentFileIndex && files.length > 1) {
                      setCurrentFileIndex(prev => prev > 0 ? prev - 1 : 0);
                    }
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  disabled={isUploading}
                >
                  <span className="material-icons text-white text-xs">close</span>
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input & Send */}
      <div className="bg-white border-t p-4">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              disabled={isUploading}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={isUploading || files.length === 0}
            className="px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span className="material-icons">send</span>
                <span>Send {files.length > 1 ? `${files.length} files` : ''}</span>
              </>
            )}
          </button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-500 text-center mt-2">
          Press Ctrl+Enter to send • ESC to cancel • Arrow keys to navigate
        </div>
      </div>
    </div>
  );
};

export default MediaUploadPreview;