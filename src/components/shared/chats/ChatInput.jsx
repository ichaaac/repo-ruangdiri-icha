// src/components/shared/chats/components/ChatInput.jsx - FIXED: Visibility & Upload Flow

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// File Upload States
const UPLOAD_STATES = {
  SELECTING: 'selecting',
  CLIENT_UPLOADED: 'client_uploaded', 
  TYPING: 'typing',
  SENDING: 'sending',
  BACKEND_UPLOADING: 'backend_uploading',
  SUCCESS: 'success',
  FAILED: 'failed'
};

// File Preview Component - Shows upload state
const FilePreview = ({ fileItem, onRemove, onEditCaption, onRetry }) => {
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
    if (type.includes('zip') || type.includes('rar')) return 'archive';
    return 'attach_file';
  };

  const getStatusIcon = () => {
    switch (fileItem.uploadState) {
      case UPLOAD_STATES.CLIENT_UPLOADED:
        return <span className="material-icons text-green-500 text-sm">check_circle</span>;
      case UPLOAD_STATES.BACKEND_UPLOADING:
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>;
      case UPLOAD_STATES.SUCCESS:
        return <span className="material-icons text-green-500 text-sm">cloud_done</span>;
      case UPLOAD_STATES.FAILED:
        return <span className="material-icons text-red-500 text-sm">error</span>;
      default:
        return <span className="material-icons text-gray-500 text-sm">schedule</span>;
    }
  };

  const getStatusText = () => {
    switch (fileItem.uploadState) {
      case UPLOAD_STATES.CLIENT_UPLOADED:
        return 'Ready to send';
      case UPLOAD_STATES.BACKEND_UPLOADING:
        return 'Uploading to server...';
      case UPLOAD_STATES.SUCCESS:
        return 'Uploaded successfully';
      case UPLOAD_STATES.FAILED:
        return 'Upload failed';
      default:
        return 'Processing...';
    }
  };

  const handleCaptionSave = () => {
    onEditCaption(fileItem.id, caption);
    setIsEditingCaption(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCaptionSave();
    } else if (e.key === 'Escape') {
      setIsEditingCaption(false);
      setCaption(fileItem.caption || '');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className={`relative bg-white border-2 rounded-xl p-4 shadow-sm ${
        fileItem.uploadState === UPLOAD_STATES.FAILED ? 'border-red-200 bg-red-50' : 
        fileItem.uploadState === UPLOAD_STATES.SUCCESS ? 'border-green-200 bg-green-50' :
        'border-blue-200 bg-blue-50'
      }`}
    >
      {/* Remove Button */}
      <button
        onClick={() => onRemove(fileItem.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10"
        title="Remove file"
      >
        <span className="material-icons text-sm">close</span>
      </button>

      <div className="flex items-start gap-4">
        {/* File Preview */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center border flex-shrink-0">
          {isImage && previewUrl ? (
            <img 
              src={previewUrl} 
              alt={fileItem.fileName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span 
              className="material-icons text-3xl"
              style={{ color: '#488BBA' }}
            >
              {getFileIcon(fileItem.file.type)}
            </span>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate mb-1">
            {fileItem.fileName}
          </p>
          
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-gray-500">{formatFileSize(fileItem.fileSize)}</p>
            <span className="text-xs text-gray-400">•</span>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className={`text-xs font-medium ${
                fileItem.uploadState === UPLOAD_STATES.FAILED ? 'text-red-600' :
                fileItem.uploadState === UPLOAD_STATES.SUCCESS ? 'text-green-600' :
                'text-blue-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Retry Button for Failed Uploads */}
          {fileItem.uploadState === UPLOAD_STATES.FAILED && (
            <button
              onClick={() => onRetry(fileItem.id)}
              className="mb-2 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-md hover:bg-red-200 transition-colors border border-red-300"
            >
              Retry Upload
            </button>
          )}

          {/* Caption Input */}
          {isEditingCaption ? (
            <div className="space-y-2">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Add a caption..."
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="2"
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleCaptionSave} 
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setIsEditingCaption(false);
                    setCaption(fileItem.caption || '');
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                {fileItem.caption ? (
                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-lg italic">
                    "{fileItem.caption}"
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No caption</p>
                )}
              </div>
              {fileItem.uploadState === UPLOAD_STATES.CLIENT_UPLOADED && (
                <button
                  onClick={() => setIsEditingCaption(true)}
                  className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                  title="Edit caption"
                >
                  <span className="material-icons text-sm">edit</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Upload Dropdown Component
const UploadDropdown = ({ isOpen, onClose, onFilesSelect, disabled }) => {
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
    if (disabled) return;
    imageInputRef.current?.click();
    onClose();
  };

  const handleFileSelect = () => {
    if (disabled) return;
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
    <div ref={dropdownRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56 z-50">
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
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z" 
        multiple 
        onChange={handleFileChange} 
        className="hidden" 
      />
      
      <button 
        onClick={handleImageSelect} 
        disabled={disabled}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-icons text-green-500 text-lg">image</span>
        <div>
          <p className="font-medium text-gray-800">Photos & Images</p>
          <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP (Max 15MB)</p>
        </div>
      </button>
      
      <button 
        onClick={handleFileSelect} 
        disabled={disabled}
        className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className="material-icons text-blue-500 text-lg">attach_file</span>
        <div>
          <p className="font-medium text-gray-800">Documents</p>
          <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT, ZIP (Max 15MB)</p>
        </div>
      </button>
    </div>
  );
};

// MAIN ChatInput Component - FIXED: Upload Flow & Visibility
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
  selectedConversation,
  e2eFlowStatus
}) => {
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  console.log('💬 ChatInput render:', {
    pendingFilesCount: pendingFiles.length,
    hasOnFileUpload: !!onFileUpload,
    canSendMessage: typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage,
    sessionId: selectedConversation?.sessionId
  });

  // Enhanced file validation
  const validateFile = (file) => {
    const maxSize = 15 * 1024 * 1024; // 15MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    if (file.size > maxSize) {
      throw new Error(`${file.name}: File size must be less than 15MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`${file.name}: File type not supported`);
    }

    return true;
  };

  // STEP 1: Upload to client immediately when selected
  const handleFilesSelect = useCallback(async (files) => {
    console.log('📁 STEP 1: Files selected for CLIENT upload:', files.length);
    setIsProcessingFiles(true);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    try {
      for (const file of files) {
        try {
          validateFile(file);
          
          const fileId = `file-${Date.now()}-${Math.random()}`;
          const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
          
          const fileItem = {
            id: fileId,
            file: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'image' : 'file',
            previewUrl: previewUrl,
            uploadState: UPLOAD_STATES.CLIENT_UPLOADED, // CLIENT UPLOADED
            caption: ''
          };
          
          // Add to client immediately
          setPendingFiles(prev => [...prev, fileItem]);
          console.log('✅ STEP 1: File uploaded to CLIENT:', file.name);
          successCount++;
          
        } catch (error) {
          console.error('File validation failed:', error);
          errors.push(error.message);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file(s) uploaded to client`, {
          description: 'Files ready. Type message and click send to upload to server.'
        });
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} file(s) failed validation`, {
          description: errors.slice(0, 3).join(', '),
          duration: 5000
        });
      }
      
    } finally {
      setIsProcessingFiles(false);
    }
  }, []);

  // Remove file from client
  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
    console.log('🗑️ File removed from CLIENT:', fileId);
    toast.info('File removed');
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
    console.log('✏️ Caption updated:', fileId, newCaption);
  }, []);

  // Retry failed upload
  const handleRetryUpload = useCallback(async (fileId) => {
    const fileItem = pendingFiles.find(f => f.id === fileId);
    if (!fileItem) return;

    console.log('🔄 RETRY: Retrying upload for:', fileItem.fileName);
    
    // Reset state to uploading
    setPendingFiles(prev => 
      prev.map(item => 
        item.id === fileId 
          ? { ...item, uploadState: UPLOAD_STATES.BACKEND_UPLOADING }
          : item
      )
    );

    try {
      const messageToSend = fileItem.caption || fileItem.fileName;
      await onFileUpload(fileItem.file, fileItem.fileType, messageToSend);
      
      // Mark as success
      setPendingFiles(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, uploadState: UPLOAD_STATES.SUCCESS }
            : item
        )
      );
      
      toast.success('File uploaded successfully');
      
      // Remove after success
      setTimeout(() => {
        handleRemoveFile(fileId);
      }, 2000);
      
    } catch (error) {
      console.error('Retry upload failed:', error);
      
      // Mark as failed again
      setPendingFiles(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, uploadState: UPLOAD_STATES.FAILED }
            : item
        )
      );
      
      toast.error('Retry failed', {
        description: error.message
      });
    }
  }, [pendingFiles, onFileUpload, handleRemoveFile]);

  // Send message validation
  const getCanSendState = useCallback(() => {
    const hasText = !!messageText?.trim();
    const hasFiles = pendingFiles.length > 0;
    const hasReadyFiles = pendingFiles.some(f => f.uploadState === UPLOAD_STATES.CLIENT_UPLOADED);
    
    if (!selectedConversation) {
      return { canSend: false, reason: 'No conversation selected' };
    }
    
    if (isSending || isProcessingFiles) {
      return { canSend: false, reason: 'Currently processing...' };
    }

    if (isAIChat) {
      if (hasFiles) {
        return { canSend: false, reason: 'AI chat does not support file uploads' };
      }
      if (!hasText) {
        return { canSend: false, reason: 'Please enter a message' };
      }
      return { canSend: true, reason: 'Ready to send to AI' };
    }

    const currentE2EStatus = e2eFlowStatus?.[selectedConversation.sessionId]?.status;
    if (currentE2EStatus === 'setting_up') {
      return { canSend: false, reason: 'Setting up secure chat...' };
    }
    
    if (currentE2EStatus === 'failed') {
      return { canSend: false, reason: 'Secure chat setup failed' };
    }

    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    if (!baseCanSend) {
      return { canSend: false, reason: 'Chat is not available' };
    }

    if (!hasText && !hasReadyFiles) {
      return { canSend: false, reason: '' }; // Don't show this message
    }

    return { canSend: true, reason: 'Ready to send' };
  }, [messageText, pendingFiles, selectedConversation, isSending, isProcessingFiles, isAIChat, e2eFlowStatus, canSendMessage]);

  // STEP 2: Handle typing and STEP 3: Send message with backend upload
  const handleSendMessage = useCallback(async () => {
    const sendState = getCanSendState();
    
    if (!sendState.canSend) {
      console.warn('❌ Cannot send:', sendState.reason);
      if (sendState.reason) {
        toast.warning(sendState.reason);
      }
      return;
    }

    const hasText = messageText?.trim();
    const hasReadyFiles = pendingFiles.filter(f => f.uploadState === UPLOAD_STATES.CLIENT_UPLOADED);

    console.log('🚀 STEP 2 & 3: Sending message with files:', {
      hasText: !!hasText,
      readyFilesCount: hasReadyFiles.length
    });

    try {
      // STEP 2: Mark files as typing (optional visual feedback)
      if (hasReadyFiles.length > 0) {
        setPendingFiles(prev => 
          prev.map(item => 
            item.uploadState === UPLOAD_STATES.CLIENT_UPLOADED
              ? { ...item, uploadState: UPLOAD_STATES.TYPING }
              : item
          )
        );
      }

      // STEP 3: Upload files to backend
      if (hasReadyFiles.length > 0) {
        console.log('📤 STEP 3: Uploading files to backend...');
        
        if (!onFileUpload) {
          throw new Error('File upload function not available');
        }

        // Mark as backend uploading
        setPendingFiles(prev => 
          prev.map(item => 
            item.uploadState === UPLOAD_STATES.TYPING
              ? { ...item, uploadState: UPLOAD_STATES.BACKEND_UPLOADING }
              : item
          )
        );

        let uploadSuccessCount = 0;
        const failedUploads = [];

        // Upload each ready file
        for (const fileItem of hasReadyFiles) {
          try {
            console.log(`📤 BACKEND: Uploading ${fileItem.fileName}...`);
            
            const messageToSend = fileItem.caption || fileItem.fileName;
            await onFileUpload(fileItem.file, fileItem.fileType, messageToSend);
            
            // Mark as success
            setPendingFiles(prev => 
              prev.map(item => 
                item.id === fileItem.id
                  ? { ...item, uploadState: UPLOAD_STATES.SUCCESS }
                  : item
              )
            );
            
            uploadSuccessCount++;
            console.log(`✅ BACKEND: Upload successful ${fileItem.fileName}`);
            
          } catch (error) {
            console.error(`❌ BACKEND: Upload failed for ${fileItem.fileName}:`, error);
            
            // Mark as failed
            setPendingFiles(prev => 
              prev.map(item => 
                item.id === fileItem.id
                  ? { ...item, uploadState: UPLOAD_STATES.FAILED }
                  : item
              )
            );
            
            failedUploads.push({ file: fileItem, error: error.message });
          }
        }
        
        // Handle results
        if (uploadSuccessCount > 0) {
          toast.success('Files uploaded successfully', {
            description: `${uploadSuccessCount} file(s) sent to server`
          });
          
          // Remove successful files after delay
          setTimeout(() => {
            setPendingFiles(prev => 
              prev.filter(item => item.uploadState !== UPLOAD_STATES.SUCCESS)
            );
          }, 3000);
        }
        
        if (failedUploads.length > 0) {
          toast.error(`${failedUploads.length} file(s) failed to upload`, {
            description: 'Click retry button on failed files',
            duration: 10000
          });
        }
      }
      
      // Send text message if any
      if (hasText && !hasReadyFiles.length) {
        console.log('💬 Sending text-only message');
        await onSendMessage();
      }

    } catch (error) {
      console.error('❌ Send failed:', error);
      toast.error('Failed to send', {
        description: error.message
      });
    }
  }, [messageText, pendingFiles, onSendMessage, onFileUpload, getCanSendState]);

  // Upload availability check
  const canUploadFiles = useMemo(() => {
    if (isAIChat) return false;
    if (!selectedConversation) return false;
    if (isProcessingFiles) return false;
    
    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    const currentE2EStatus = e2eFlowStatus?.[selectedConversation.sessionId]?.status;
    
    return baseCanSend && currentE2EStatus !== 'setting_up';
  }, [isAIChat, selectedConversation, isProcessingFiles, canSendMessage, e2eFlowStatus]);

  const sendState = getCanSendState();

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-300 shadow-lg relative z-[100] w-full">
      {/* File Previews */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 bg-gray-50 p-4 space-y-3 max-h-80 overflow-y-auto"
          >
            <div className="text-xs text-gray-600 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} attached
            </div>
            {pendingFiles.map((fileItem) => (
              <FilePreview
                key={fileItem.id}
                fileItem={fileItem}
                onRemove={handleRemoveFile}
                onEditCaption={handleEditCaption}
                onRetry={handleRetryUpload}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Files Indicator */}
      {isProcessingFiles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-b border-gray-200 bg-blue-50 px-4 py-3 flex items-center gap-2 text-sm text-blue-600"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Processing files...
        </motion.div>
      )}

      {/* E2E Status Indicator */}
      {selectedConversation && !selectedConversation.isTeamChat && (
        <AnimatePresence>
          {e2eFlowStatus?.[selectedConversation.sessionId]?.status === 'setting_up' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-b border-orange-200 bg-orange-50 px-4 py-3 flex items-center gap-3 text-sm text-orange-600"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
              <div className="flex-1">
                <p className="font-medium">Setting up secure chat...</p>
                <p className="text-xs text-orange-500 mt-1">
                  {e2eFlowStatus[selectedConversation.sessionId]?.step || 'initializing'} 
                  {e2eFlowStatus[selectedConversation.sessionId]?.progress && 
                    ` (${e2eFlowStatus[selectedConversation.sessionId].progress}%)`
                  }
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Input Area - FIXED POSITIONING */}
      <div className="px-4 py-4 bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <textarea
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder={
                isAIChat
                  ? 'Type a message to AI assistant...' 
                  : pendingFiles.length > 0
                  ? 'Add a message (optional) and click send...'
                  : 'Type a message here....'
              }
              className="text-sm leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none w-full min-h-[40px] placeholder-gray-400"
              rows="2"
              disabled={!sendState.canSend && sendState.reason && sendState.reason !== ''}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-3 relative">
              <div className="relative">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label="Add attachment"
                  disabled={!canUploadFiles}
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  title={
                    !canUploadFiles 
                      ? (isAIChat ? "File upload not supported for AI assistant" : "File upload not available") 
                      : "Select files to upload"
                  }
                >
                  <span className="material-icons text-zinc-500 text-xl">
                    {isProcessingFiles ? 'hourglass_empty' : 'attach_file'}
                  </span>
                </button>
                <UploadDropdown 
                  isOpen={showUploadDropdown && canUploadFiles} 
                  onClose={() => setShowUploadDropdown(false)}
                  onFilesSelect={handleFilesSelect}
                  disabled={!canUploadFiles}
                />
              </div>
              
              <button 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50" 
                aria-label="Add emoji"
                disabled={!sendState.canSend}
              >
                <span className="material-icons text-zinc-500 text-xl">sentiment_satisfied_alt</span>
              </button>
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={!sendState.canSend}
              className="p-2 disabled:opacity-50 hover:bg-blue-100 rounded-full transition-colors disabled:cursor-not-allowed" 
              aria-label="Send message"
              title={sendState.canSend ? 'Send message' : sendState.reason}
            >
              {isSending || isProcessingFiles ? (
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#488BBA' }}
                ></div>
              ) : (
                <span 
                  className="material-icons text-xl transition-colors"
                  style={{ color: sendState.canSend ? '#488BBA' : '#999' }}
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