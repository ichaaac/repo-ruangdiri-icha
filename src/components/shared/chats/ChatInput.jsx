// src/components/shared/chats/components/ChatInput.jsx - WORKING: Client Upload to Endpoint

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// File Preview Component
const FilePreview = ({ fileItem, onRemove, onEditCaption }) => {
  const [caption, setCaption] = useState(fileItem.caption || '');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  
  const isImage = fileItem.file.type.startsWith('image/');
  const previewUrl = fileItem.previewUrl;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word')) return 'description';
    if (type.includes('excel') || type.includes('sheet')) return 'table_chart';
    return 'attach_file';
  };

  const handleCaptionSave = () => {
    onEditCaption(fileItem.id, caption);
    setIsEditingCaption(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative bg-white border-2 border-green-300 bg-green-50 rounded-lg p-3 shadow-sm"
    >
      <button
        onClick={() => onRemove(fileItem.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm font-bold"
      >
        ×
      </button>

      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt={fileItem.fileName} className="w-full h-full object-cover" />
          ) : (
            <span className="material-icons text-gray-600 text-2xl" style={{ color: '#488BBA' }}>
              {getFileIcon(fileItem.file.type)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileItem.fileName}</p>
          <p className="text-xs text-gray-500 mt-1">{formatFileSize(fileItem.fileSize)}</p>
          
          <div className="mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-icons text-green-500 text-sm">check_circle</span>
              <span className="text-green-600">Ready to send</span>
            </div>
          </div>

          {isEditingCaption ? (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCaptionSave();
                }}
              />
              <div className="flex gap-2">
                <button onClick={handleCaptionSave} className="text-xs px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                  Save
                </button>
                <button onClick={() => setIsEditingCaption(false)} className="text-xs px-3 py-1 bg-gray-300 text-gray-700 rounded-md">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between">
              <div className="flex-1">
                {fileItem.caption ? (
                  <p className="text-sm text-gray-700 italic bg-gray-50 px-2 py-1 rounded">"{fileItem.caption}"</p>
                ) : (
                  <p className="text-xs text-gray-400">No caption</p>
                )}
              </div>
              <button
                onClick={() => setIsEditingCaption(true)}
                className="ml-2 text-blue-500 hover:text-blue-700 p-1"
                title="Edit caption"
              >
                <span className="material-icons text-sm">edit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Upload Dropdown Component
const UploadDropdown = ({ isOpen, onClose, onFilesSelect }) => {
  const dropdownRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
    onClose();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    onClose();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
    }
    e.target.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50">
      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar" multiple onChange={handleFileChange} className="hidden" />
      
      <button onClick={handleImageSelect} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
        <span className="material-icons text-gray-600 text-sm">image</span>
        Upload Images (Max 15MB)
      </button>
      <button onClick={handleFileSelect} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
        <span className="material-icons text-gray-600 text-sm">attach_file</span>
        Upload Documents (Max 15MB)
      </button>
    </div>
  );
};

// MAIN ChatInput Component
const ChatInput = ({ 
  messageText, 
  onMessageChange, 
  onSendMessage, 
  canSendMessage, 
  canSendMessageWithText,
  isSending,
  isAIChat,
  onKeyPress,
  onFileUpload, // This should be the function that hits the endpoint
  selectedConversation
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  console.log('ChatInput render:', {
    pendingFilesCount: pendingFiles.length,
    hasOnFileUpload: !!onFileUpload,
    canSendMessage: typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage,
    sessionId: selectedConversation?.sessionId
  });

  // Validate file
  const validateFile = (file) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      throw new Error('File size must be less than 15MB');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported');
    }

    return true;
  };

  // Handle file selection - immediate client preview
  const handleFilesSelect = useCallback((files) => {
    console.log('ChatInput: Files selected:', files.length);
    
    for (const file of files) {
      try {
        validateFile(file);
        
        const fileId = `chatinput-${Date.now()}-${Math.random()}`;
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        
        const fileItem = {
          id: fileId,
          file: file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type.startsWith('image/') ? 'image' : 'file',
          previewUrl: previewUrl,
          status: 'ready',
          caption: ''
        };
        
        setPendingFiles(prev => [...prev, fileItem]);
        console.log('ChatInput: File added to preview:', file.name);
        
      } catch (error) {
        console.error('File validation failed:', error);
        alert(`${file.name}: ${error.message}`);
      }
    }
  }, []);

  // Remove file from preview
  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
    console.log('ChatInput: File removed:', fileId);
  }, []);

  // Edit file caption
  const handleEditCaption = useCallback((fileId, newCaption) => {
    setPendingFiles(prev => 
      prev.map(item => 
        item.id === fileId 
          ? { ...item, caption: newCaption.trim() }
          : item
      )
    );
    console.log('ChatInput: Caption updated for file:', fileId, newCaption);
  }, []);

  // MAIN SEND FUNCTION - Upload files to endpoint
  const handleSendMessage = useCallback(async () => {
    const hasText = messageText?.trim();
    const hasFiles = pendingFiles.length > 0;

    console.log('ChatInput: Send clicked:', {
      hasText,
      hasFiles,
      filesCount: pendingFiles.length,
      hasOnFileUpload: !!onFileUpload,
      sessionId: selectedConversation?.sessionId
    });

    if (!hasText && !hasFiles) {
      console.warn('ChatInput: Nothing to send');
      return;
    }

    try {
      // Send text message first if exists and no files
      if (hasText && !hasFiles) {
        console.log('ChatInput: Sending text only');
        await onSendMessage();
        return;
      }
      
      // Upload files to endpoint
      if (hasFiles) {
        console.log('ChatInput: Starting file uploads...');
        
        if (!onFileUpload) {
          throw new Error('onFileUpload function not provided');
        }

        // Upload each file to endpoint
        for (const fileItem of pendingFiles) {
          try {
            console.log(`ChatInput: Uploading ${fileItem.fileName} to endpoint...`);
            
            // Hit the endpoint with file + caption
            await onFileUpload(fileItem.file, fileItem.fileType, fileItem.caption);
            
            console.log(`ChatInput: Successfully uploaded ${fileItem.fileName}`);
          } catch (error) {
            console.error(`ChatInput: Failed to upload ${fileItem.fileName}:`, error);
            alert(`Failed to upload ${fileItem.fileName}: ${error.message}`);
            throw error;
          }
        }
        
        // Clear files after successful upload
        setPendingFiles(prev => {
          prev.forEach(item => {
            if (item.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
          });
          return [];
        });
        
        console.log('ChatInput: All files uploaded successfully');
      }

      // Send text after files (if both exist)
      if (hasText && hasFiles) {
        console.log('ChatInput: Sending text after files');
        await onSendMessage();
      }

    } catch (error) {
      console.error('ChatInput: Send failed:', error);
      alert('Failed to send. Please try again.');
    }
  }, [messageText, pendingFiles, onSendMessage, onFileUpload, selectedConversation?.sessionId]);

  const canUploadFiles = !isAIChat && (typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage);
  const canSend = (typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText) || 
                  (pendingFiles.length > 0);

  return (
    <div className="flex-shrink-0 bg-white border-solid border-y-[0.25px] border-y-zinc-500 px-4 sm:px-[19px] py-4 sm:py-[19px]">
      {/* File Previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-3 max-h-80 overflow-y-auto rounded-lg"
          >
            <div className="text-xs text-gray-600 font-medium px-2">
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to send to endpoint
            </div>
            {pendingFiles.map((fileItem) => (
              <FilePreview
                key={fileItem.id}
                fileItem={fileItem}
                onRemove={handleRemoveFile}
                onEditCaption={handleEditCaption}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex flex-col gap-2.5 min-h-[60px]">
        <div className="flex flex-col justify-between flex-1">
          <textarea
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={
              isAIChat
                ? 'Type a message here....' 
                : !(typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage)
                ? 'Chat tidak tersedia...' 
                : 'Type a message here....'
            }
            className="text-sm sm:text-base leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            rows="2"
            disabled={!canSendMessage && !isAIChat}
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2 sm:gap-4 relative">
              <div className="relative">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                  aria-label="Add attachment"
                  disabled={!canUploadFiles}
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  title={!canUploadFiles ? (isAIChat ? "File upload not supported for AI assistant" : "Cannot upload files in current session") : "Upload files to endpoint (Max 15MB)"}
                >
                  <span className="material-icons text-zinc-500 text-lg sm:text-xl">add_circle_outline</span>
                </button>
                <UploadDropdown 
                  isOpen={showUploadDropdown && canUploadFiles} 
                  onClose={() => setShowUploadDropdown(false)}
                  onFilesSelect={handleFilesSelect}
                />
              </div>
              
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                aria-label="Add emoji"
                disabled={!canSendMessage && !isAIChat}
              >
                <span className="material-icons text-zinc-500 text-lg sm:text-xl">sentiment_satisfied_alt</span>
              </button>
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={!canSend || isSending}
              className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors" 
              aria-label="Send message"
              title={!canSend ? "Cannot send message" : "Send message and upload files to endpoint"}
            >
              {isSending ? (
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#488BBA' }}
                ></div>
              ) : (
                <span 
                  className="material-icons text-lg sm:text-xl"
                  style={{ color: canSend ? '#488BBA' : '#999' }}
                >
                  send
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {pendingFiles.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Debug: {pendingFiles.length} files ready, onFileUpload: {!!onFileUpload ? 'available' : 'missing'}
        </div>
      )}
    </div>
  );
};

export default ChatInput;