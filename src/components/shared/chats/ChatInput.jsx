// src/components/shared/chats/components/ChatInput.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Upload Status Component
const UploadStatus = ({ status, progress, onRetry, fileName }) => {
  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'uploading' && (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent"></div>
          <span className="text-blue-600">Uploading {fileName}... {progress}%</span>
        </>
      )}
      {status === 'uploaded' && (
        <>
          <span className="material-icons text-green-500 text-sm">check_circle</span>
          <span className="text-green-600">Ready to send</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span className="material-icons text-red-500 text-sm">error</span>
          <span className="text-red-600">Upload failed</span>
          <button 
            onClick={onRetry}
            className="text-blue-600 underline ml-1"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
};

// File Preview Component
const FilePreview = ({ file, onRemove, uploadStatus, onRetry }) => {
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

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
    if (type.includes('excel')) return 'table_chart';
    if (type.includes('powerpoint')) return 'slideshow';
    return 'attach_file';
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
      >
        <span className="material-icons text-xs">close</span>
      </button>

      <div className="flex items-center gap-3">
        {/* Preview/Icon */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {isImage && previewUrl ? (
            <img 
              src={previewUrl} 
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span 
              className="material-icons text-gray-600"
              style={{ color: '#488BBA' }}
            >
              {getFileIcon(file.type)}
            </span>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
          
          {/* Upload Status */}
          <UploadStatus 
            status={uploadStatus.status}
            progress={uploadStatus.progress}
            onRetry={() => onRetry(file)}
            fileName={file.name}
          />
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

// Main ChatInput Component
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
  const [fileUploadStatus, setFileUploadStatus] = useState({}); // Track upload status for each file

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

  // Client-side upload to temp storage (simulate WhatsApp behavior)
  const uploadFileToTemp = async (file) => {
    const fileId = `${Date.now()}-${file.name}`;
    
    // Set uploading status
    setFileUploadStatus(prev => ({
      ...prev,
      [fileId]: { status: 'uploading', progress: 0 }
    }));

    try {
      // Simulate upload progress (in real app, you'd upload to temp storage)
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFileUploadStatus(prev => ({
          ...prev,
          [fileId]: { status: 'uploading', progress }
        }));
      }

      // Mark as uploaded
      setFileUploadStatus(prev => ({
        ...prev,
        [fileId]: { status: 'uploaded', progress: 100 }
      }));

      return fileId;
    } catch (error) {
      // Mark as error
      setFileUploadStatus(prev => ({
        ...prev,
        [fileId]: { status: 'error', progress: 0 }
      }));
      throw error;
    }
  };

  // Handle file selection with immediate client-side upload
  const handleFilesSelect = useCallback(async (files, fileType) => {
    const validFiles = [];
    
    for (const file of files) {
      try {
        validateFile(file);
        
        const fileWithId = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          fileType,
          tempId: null
        };
        
        validFiles.push(fileWithId);
        
        // Start upload immediately (WhatsApp style)
        uploadFileToTemp(file).then((tempId) => {
          setPendingFiles(prev => 
            prev.map(f => 
              f.id === fileWithId.id 
                ? { ...f, tempId } 
                : f
            )
          );
        }).catch(error => {
          console.error('Upload failed:', error);
        });
        
      } catch (error) {
        alert(`${file.name}: ${error.message}`);
      }
    }
    
    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
    }
  }, []);

  // Remove file from pending list
  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.file.type.startsWith('image/')) {
        // Clean up object URL if it exists
        const previewUrl = URL.createObjectURL(fileToRemove.file);
        URL.revokeObjectURL(previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
    
    // Clean up upload status
    setFileUploadStatus(prev => {
      const newStatus = { ...prev };
      Object.keys(newStatus).forEach(key => {
        if (key.includes(fileId)) {
          delete newStatus[key];
        }
      });
      return newStatus;
    });
  }, []);

  // Retry file upload
  const handleRetryUpload = useCallback(async (file) => {
    try {
      await uploadFileToTemp(file);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }, []);

  // Send message with attachments
  const handleSendMessage = useCallback(async () => {
    const hasText = messageText?.trim();
    const hasFiles = pendingFiles.length > 0;
    const allFilesUploaded = pendingFiles.every(f => {
      const status = Object.values(fileUploadStatus).find(s => s.status === 'uploaded');
      return status;
    });

    // If we have files, make sure they're all uploaded first
    if (hasFiles && !allFilesUploaded) {
      alert('Please wait for all files to finish uploading');
      return;
    }

    // Send text message first if exists
    if (hasText) {
      await onSendMessage();
    }

    // Send files one by one using your existing onFileUpload method
    if (hasFiles && allFilesUploaded) {
      try {
        for (const fileItem of pendingFiles) {
          await onFileUpload(fileItem.file, fileItem.fileType);
        }
        
        // Clear pending files after successful upload
        setPendingFiles([]);
        setFileUploadStatus({});
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Some files failed to upload. Please try again.');
      }
    }
  }, [messageText, pendingFiles, fileUploadStatus, onSendMessage, onFileUpload]);

  const canUploadFiles = !isAIChat && (typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage);
  const canSend = (typeof canSendMessageWithText === 'function' ? canSendMessageWithText() : canSendMessageWithText) || (pendingFiles.length > 0 && Object.values(fileUploadStatus).some(s => s.status === 'uploaded'));

  return (
    <div className="flex-shrink-0 bg-white border-solid border-y-[0.25px] border-y-zinc-500 px-4 sm:px-[19px] py-4 sm:py-[19px]">
      {/* File Previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-2 max-h-40 overflow-y-auto"
          >
            {pendingFiles.map((fileItem) => (
              <FilePreview
                key={fileItem.id}
                file={fileItem.file}
                uploadStatus={fileUploadStatus[`${Date.now()}-${fileItem.file.name}`] || { status: 'pending' }}
                onRemove={() => handleRemoveFile(fileItem.id)}
                onRetry={handleRetryUpload}
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