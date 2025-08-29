// src/components/shared/chats/components/ChatInput.jsx - FIXED: Client-side Upload with Preview

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// FIXED: Upload Status Component with better states
const UploadStatus = ({ status, progress, onRetry, fileName, error }) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'uploading' && (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
          <span className="text-blue-600">Preparing {fileName}... {progress}%</span>
        </>
      )}
      {status === 'ready' && (
        <>
          <span className="material-icons text-green-500 text-sm">check_circle</span>
          <span className="text-green-600">Ready to send</span>
        </>
      )}
      {status === 'sending' && (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border border-orange-400 border-t-transparent"></div>
          <span className="text-orange-600">Sending to server...</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span className="material-icons text-red-500 text-sm">error</span>
          <span className="text-red-600">Error: {error || 'Upload failed'}</span>
          <button 
            onClick={onRetry}
            className="text-blue-600 underline ml-1 hover:text-blue-800"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
};

// FIXED: File Preview Component with better preview handling
const FilePreview = ({ fileItem, onRemove, onRetry, onEditCaption }) => {
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
    if (type.includes('powerpoint') || type.includes('presentation')) return 'slideshow';
    return 'attach_file';
  };

  const handleCaptionSave = () => {
    onEditCaption(fileItem.id, caption);
    setIsEditingCaption(false);
  };

  const handleCaptionCancel = () => {
    setCaption(fileItem.caption || '');
    setIsEditingCaption(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative bg-white border rounded-lg p-3 shadow-sm ${
        fileItem.status === 'error' ? 'border-red-300 bg-red-50' : 
        fileItem.status === 'ready' ? 'border-green-300 bg-green-50' :
        'border-gray-200'
      }`}
    >
      {/* Remove button */}
      <button
        onClick={() => onRemove(fileItem.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
        title="Remove file"
      >
        <span className="material-icons text-xs">close</span>
      </button>

      <div className="flex items-start gap-3">
        {/* Preview/Icon */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {isImage && previewUrl ? (
            <img 
              src={previewUrl} 
              alt={fileItem.file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span 
              className="material-icons text-gray-600"
              style={{ color: '#488BBA' }}
            >
              {getFileIcon(fileItem.file.type)}
            </span>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {fileItem.file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(fileItem.file.size)}
          </p>
          
          {/* Upload Status */}
          <UploadStatus 
            status={fileItem.status}
            progress={fileItem.progress}
            onRetry={() => onRetry(fileItem)}
            fileName={fileItem.file.name}
            error={fileItem.error}
          />

          {/* Caption Input */}
          {isEditingCaption ? (
            <div className="mt-2 space-y-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCaptionSave();
                  if (e.key === 'Escape') handleCaptionCancel();
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCaptionSave}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCaptionCancel}
                  className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              {fileItem.caption ? (
                <p className="text-xs text-gray-600 italic">"{fileItem.caption}"</p>
              ) : (
                <p className="text-xs text-gray-400">No caption</p>
              )}
              <button
                onClick={() => setIsEditingCaption(true)}
                className="text-xs text-blue-500 hover:text-blue-700"
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

// Upload Dropdown Component (unchanged)
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
      onFilesSelect(selectedFiles, 'image');
    }
    e.target.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles, 'file');
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-48 z-50"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button 
        onClick={handleImageSelect}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="material-icons text-gray-600 text-sm">image</span>
        Upload Images (Max 15MB)
      </button>
      <button 
        onClick={handleFileSelect}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="material-icons text-gray-600 text-sm">attach_file</span>
        Upload Documents (Max 15MB)
      </button>
    </div>
  );
};

// FIXED: Main ChatInput Component with proper client-side upload
const ChatInput = ({ 
  messageText, 
  onMessageChange, 
  onSendMessage, 
  canSendMessage, 
  canSendMessageWithText,
  isSending,
  isAIChat,
  onKeyPress,
  onFileUpload,
  selectedConversation
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // FIXED: Client-side file processing with preview generation
  const processFileForClient = useCallback(async (file) => {
    const fileId = `${Date.now()}-${Math.random()}-${file.name}`;
    
    // Create preview URL for images
    let previewUrl = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    // Simulate client processing (in real app, you might compress, resize, etc.)
    const fileItem = {
      id: fileId,
      file: file,
      fileType: file.type.startsWith('image/') ? 'image' : 'file',
      previewUrl: previewUrl,
      status: 'uploading',
      progress: 0,
      caption: '',
      error: null,
      timestamp: Date.now()
    };

    return fileItem;
  }, []);

  // FIXED: Simulate client-side processing progress
  const simulateProcessing = useCallback(async (fileItem) => {
    setPendingFiles(prev => 
      prev.map(item => 
        item.id === fileItem.id 
          ? { ...item, status: 'uploading', progress: 0 }
          : item
      )
    );

    // Simulate processing progress
    for (let progress = 0; progress <= 100; progress += 25) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setPendingFiles(prev => 
        prev.map(item => 
          item.id === fileItem.id 
            ? { ...item, progress }
            : item
        )
      );
    }

    // Mark as ready
    setPendingFiles(prev => 
      prev.map(item => 
        item.id === fileItem.id 
          ? { ...item, status: 'ready', progress: 100 }
          : item
      )
    );

    console.log('✅ File processed on client:', fileItem.file.name);
  }, []);

  // Validate file function
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

  // FIXED: Handle file selection with client-side processing
  const handleFilesSelect = useCallback(async (files, fileType) => {
    console.log('📁 Processing files on client...', files.length);
    
    for (const file of files) {
      try {
        // Validate file
        validateFile(file);
        
        // Process file on client-side
        const fileItem = await processFileForClient(file);
        
        // Add to pending files
        setPendingFiles(prev => [...prev, fileItem]);
        
        // Start client-side processing
        simulateProcessing(fileItem).catch(error => {
          console.error('Client processing failed:', error);
          setPendingFiles(prev => 
            prev.map(item => 
              item.id === fileItem.id 
                ? { ...item, status: 'error', error: error.message }
                : item
            )
          );
        });
        
      } catch (error) {
        console.error('File validation failed:', file.name, error.message);
        alert(`${file.name}: ${error.message}`);
      }
    }
  }, [processFileForClient, simulateProcessing]);

  // Remove file from pending list
  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      
      // Clean up preview URL if exists
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      
      return prev.filter(f => f.id !== fileId);
    });
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
  }, []);

  // Retry file processing
  const handleRetryFile = useCallback(async (fileItem) => {
    console.log('🔄 Retrying file processing:', fileItem.file.name);
    await simulateProcessing(fileItem);
  }, [simulateProcessing]);

  // FIXED: Send message with attachments using correct endpoint
  const handleSendMessage = useCallback(async () => {
    const hasText = messageText?.trim();
    const hasFiles = pendingFiles.length > 0;
    const allFilesReady = pendingFiles.every(f => f.status === 'ready');

    console.log('📤 Send attempt:', {
      hasText,
      hasFiles,
      allFilesReady,
      filesCount: pendingFiles.length
    });

    // Check if we can send
    if (!hasText && !hasFiles) {
      console.warn('Nothing to send');
      return;
    }

    // If we have files, make sure they're all ready
    if (hasFiles && !allFilesReady) {
      alert('Please wait for all files to finish processing');
      return;
    }

    try {
      // Send text message first if exists (without files)
      if (hasText && !hasFiles) {
        await onSendMessage();
      }
      
      // Send files using correct upload endpoint
      if (hasFiles && allFilesReady) {
        console.log('📤 Sending files via /chat/messages/upload...');
        
        // Mark files as sending
        setPendingFiles(prev => 
          prev.map(item => ({ ...item, status: 'sending' }))
        );
        
        // Send each file individually to /chat/messages/upload
        for (const fileItem of pendingFiles) {
          try {
            console.log(`📤 Uploading: ${fileItem.file.name} with caption: "${fileItem.caption}"`);
            
            // Use onFileUpload which should call chatsApi.sendFileMessage -> /chat/messages/upload
            await onFileUpload(fileItem.file, fileItem.fileType, fileItem.caption);
            
            console.log(`✅ File uploaded successfully: ${fileItem.file.name}`);
          } catch (error) {
            console.error(`❌ File upload failed: ${fileItem.file.name}`, error);
            // Mark specific file as error
            setPendingFiles(prev => 
              prev.map(item => 
                item.id === fileItem.id 
                  ? { ...item, status: 'error', error: error.message }
                  : item
              )
            );
            throw error; // Stop further uploads
          }
        }
        
        // Clear pending files after successful upload
        setPendingFiles(prev => {
          // Clean up preview URLs
          prev.forEach(item => {
            if (item.previewUrl) {
              URL.revokeObjectURL(item.previewUrl);
            }
          });
          return [];
        });
        
        console.log('✅ All files sent successfully');
      }

      // Send text with files (if both exist)
      if (hasText && hasFiles && allFilesReady) {
        await onSendMessage(); // Send the text message
      }

    } catch (error) {
      console.error('❌ Send failed:', error);
      alert('Failed to send. Please try again.');
    }
  }, [messageText, pendingFiles, onSendMessage, onFileUpload]);

  const canUploadFiles = !isAIChat && (typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage);
  const canSend = (typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText) || 
                  (pendingFiles.length > 0 && pendingFiles.every(f => f.status === 'ready'));

  return (
    <div className="flex-shrink-0 bg-white border-solid border-y-[0.25px] border-y-zinc-500 px-4 sm:px-[19px] py-4 sm:py-[19px]">
      {/* File Previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2 max-h-60 overflow-y-auto"
          >
            {pendingFiles.map((fileItem) => (
              <FilePreview
                key={fileItem.id}
                fileItem={fileItem}
                onRemove={handleRemoveFile}
                onRetry={handleRetryFile}
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
                  title={!canUploadFiles ? (isAIChat ? "File upload not supported for AI assistant" : "Cannot upload files in current session") : "Upload files (Max 15MB)"}
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
              title={!canSend ? "Cannot send message" : "Send message"}
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
    </div>
  );
};

export default ChatInput;