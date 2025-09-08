// src/components/shared/chats/components/ChatInput.jsx - FINAL FIXED: CLIENT UPLOAD FIRST

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// File Preview Component - Enhanced WhatsApp-like Design
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
    if (type.includes('zip') || type.includes('rar')) return 'archive';
    return 'attach_file';
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
      className="relative bg-white border-2 border-blue-200 bg-blue-50 rounded-xl p-4 shadow-sm"
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
              <span className="material-icons text-green-500 text-sm">check_circle</span>
              <span className="text-xs text-green-600 font-medium">Ready to send</span>
            </div>
          </div>

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
              <button
                onClick={() => setIsEditingCaption(true)}
                className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
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

// Upload Dropdown Component - Enhanced
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

// MAIN ChatInput Component - FINAL FIXED: CLIENT UPLOAD FIRST
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

  console.log('ChatInput render:', {
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

  // FIXED: Handle file selection - IMMEDIATE CLIENT-SIDE PREVIEW
  const handleFilesSelect = useCallback(async (files) => {
    console.log('✅ FIXED: Files selected for CLIENT preview:', files.length);
    setIsProcessingFiles(true);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    try {
      for (const file of files) {
        try {
          validateFile(file);
          
          const fileId = `client-preview-${Date.now()}-${Math.random()}`;
          const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
          
          const fileItem = {
            id: fileId,
            file: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'image' : 'file',
            previewUrl: previewUrl,
            status: 'client-ready', // NOT uploaded to backend yet
            caption: ''
          };
          
          // IMMEDIATE CLIENT-SIDE PREVIEW
          setPendingFiles(prev => [...prev, fileItem]);
          console.log('✅ FIXED: File added to CLIENT preview:', file.name);
          successCount++;
          
        } catch (error) {
          console.error('File validation failed:', error);
          errors.push(error.message);
          errorCount++;
        }
      }

      // Show summary toast
      if (successCount > 0) {
        toast.success(`${successCount} file(s) added to preview`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} file(s) failed validation`, {
          description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
          duration: 5000
        });
      }
      
    } finally {
      setIsProcessingFiles(false);
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
    console.log('ChatInput: File removed from CLIENT preview:', fileId);
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
    console.log('ChatInput: Caption updated for CLIENT file:', fileId, newCaption);
  }, []);

  // FIXED: Send message validation - Allow files OR text
  const getCanSendState = useCallback(() => {
    const hasText = !!messageText?.trim();
    const hasFiles = pendingFiles.length > 0;
    
    // Basic checks
    if (!selectedConversation) {
      return { canSend: false, reason: 'No conversation selected' };
    }
    
    if (isSending || isProcessingFiles) {
      return { canSend: false, reason: 'Currently sending...' };
    }

    // AI Chat checks
    if (isAIChat) {
      if (hasFiles) {
        return { canSend: false, reason: 'AI chat does not support file uploads' };
      }
      if (!hasText) {
        return { canSend: false, reason: 'Please enter a message' };
      }
      return { canSend: true, reason: 'Ready to send to AI' };
    }

    // E2E Session checks
    const currentE2EStatus = e2eFlowStatus?.[selectedConversation.sessionId]?.status;
    if (currentE2EStatus === 'setting_up') {
      return { canSend: false, reason: 'Setting up secure chat...' };
    }
    
    if (currentE2EStatus === 'failed') {
      return { canSend: false, reason: 'Secure chat setup failed' };
    }

    // Regular session checks
    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    if (!baseCanSend) {
      return { canSend: false, reason: 'Chat is not available' };
    }

    // FIXED: Allow EITHER text OR files (or both)
    if (!hasText && !hasFiles) {
      return { canSend: false, reason: 'Please enter a message or select files' };
    }

    return { canSend: true, reason: 'Ready to send' };
  }, [messageText, pendingFiles, selectedConversation, isSending, isProcessingFiles, isAIChat, e2eFlowStatus, canSendMessage]);

  // FIXED: Client upload first, then backend when send button clicked
  const handleSendMessage = useCallback(async () => {
    const sendState = getCanSendState();
    
    if (!sendState.canSend) {
      console.warn('ChatInput: Cannot send:', sendState.reason);
      toast.warning(sendState.reason);
      return;
    }

    const hasText = messageText?.trim();
    const hasFiles = pendingFiles.length > 0;

    console.log('✅ FIXED: Send button clicked - NOW uploading to backend:', {
      hasText: !!hasText,
      hasFiles,
      filesCount: pendingFiles.length,
      sessionId: selectedConversation?.sessionId
    });

    try {
      // FIXED: NOW upload files to backend when send button is clicked
      if (hasFiles) {
        console.log('✅ FIXED: NOW uploading CLIENT files to backend...');
        
        if (!onFileUpload) {
          throw new Error('File upload function not available');
        }

        // Show uploading toast
        const uploadToast = toast.loading('Uploading files to server...', {
          description: `Uploading ${pendingFiles.length} file(s) to backend`
        });

        let uploadSuccessCount = 0;
        const failedUploads = [];

        // Process each file with retry logic
        for (const fileItem of pendingFiles) {
          let retryCount = 0;
          const maxRetries = 3;
          let uploadSuccess = false;

          while (retryCount < maxRetries && !uploadSuccess) {
            try {
              console.log(`✅ FIXED: Backend upload attempt ${retryCount + 1} - ${fileItem.fileName}...`);
              
              // Update toast with current file progress
              toast.loading(`Uploading ${fileItem.fileName}... (${retryCount + 1}/${maxRetries})`, {
                id: uploadToast,
                description: `File ${uploadSuccessCount + 1} of ${pendingFiles.length}`
              });
              
              // NOW upload to backend with caption
              const messageToSend = fileItem.caption || fileItem.fileName;
              
              await onFileUpload(fileItem.file, fileItem.fileType, messageToSend);
              
              uploadSuccessCount++;
              uploadSuccess = true;
              console.log(`✅ FIXED: Backend upload SUCCESS ${fileItem.fileName} on attempt ${retryCount + 1}`);
              
            } catch (error) {
              retryCount++;
              console.error(`❌ Backend upload attempt ${retryCount} failed for ${fileItem.fileName}:`, error);
              
              if (retryCount < maxRetries) {
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
              } else {
                // Max retries reached
                failedUploads.push({
                  file: fileItem,
                  error: error.message
                });
              }
            }
          }
        }
        
        // Handle results
        if (uploadSuccessCount > 0) {
          // Clear successful uploads from CLIENT preview
          setPendingFiles(prev => {
            const remaining = prev.filter(item => 
              failedUploads.some(failed => failed.file.id === item.id)
            );
            
            // Clean up preview URLs for successful uploads
            prev.forEach(item => {
              if (!remaining.includes(item) && item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
              }
            });
            
            return remaining;
          });
          
          toast.success('Files uploaded successfully', {
            id: uploadToast,
            description: `${uploadSuccessCount} file(s) sent to backend`
          });
        }
        
        // Handle failed uploads
        if (failedUploads.length > 0) {
          const retryAllFailed = async () => {
            console.log('ChatInput: Retrying all failed uploads...');
            await handleSendMessage(); // Recursive retry
          };
          
          toast.error(`${failedUploads.length} file(s) failed to upload`, {
            id: failedUploads.length === pendingFiles.length ? uploadToast : undefined,
            description: failedUploads.map(f => f.file.fileName).join(', '),
            duration: 10000,
            action: {
              label: 'Retry All',
              onClick: retryAllFailed
            }
          });
          
          // Don't proceed if all uploads failed
          if (uploadSuccessCount === 0) {
            return;
          }
        }
        
        console.log('✅ FIXED: Backend upload process completed');
        
      } else if (hasText) {
        // Send text-only message using regular message endpoint
        console.log('ChatInput: Sending text-only message');
        await onSendMessage();
      }

    } catch (error) {
      console.error('ChatInput: Send failed:', error);
      toast.error('Failed to send', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => handleSendMessage()
        }
      });
    }
  }, [messageText, pendingFiles, onSendMessage, onFileUpload, selectedConversation?.sessionId, getCanSendState]);

  // Enhanced upload availability check
  const canUploadFiles = useMemo(() => {
    if (isAIChat) return false; // AI doesn't support files
    if (!selectedConversation) return false;
    if (isProcessingFiles) return false;
    
    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    const currentE2EStatus = e2eFlowStatus?.[selectedConversation.sessionId]?.status;
    
    return baseCanSend && currentE2EStatus !== 'setting_up';
  }, [isAIChat, selectedConversation, isProcessingFiles, canSendMessage, e2eFlowStatus]);

  const sendState = getCanSendState();

  return (
    <div className="flex-shrink-0 bg-white border-solid border-y-[0.25px] border-y-zinc-500 px-4 sm:px-[19px] py-4 sm:py-[19px]">
      {/* FIXED: File Previews - CLIENT-SIDE PREVIEW */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 space-y-3 max-h-80 overflow-y-auto rounded-lg p-2 bg-gray-50"
          >
            <div className="text-xs text-gray-600 font-medium px-2">
              ✅ {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to upload (CLIENT preview)
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

      {/* Processing Files Indicator */}
      {isProcessingFiles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Processing files for client preview...
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
              className="mb-4 flex items-center gap-3 text-sm text-orange-600 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200"
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
          
          {e2eFlowStatus?.[selectedConversation.sessionId]?.status === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200"
            >
              <span className="material-icons text-red-500">error</span>
              <div className="flex-1">
                <p className="font-medium">Secure chat setup failed</p>
                <p className="text-xs text-red-500 mt-1">
                  {e2eFlowStatus[selectedConversation.sessionId]?.error || 'Unknown error'}
                </p>
              </div>
            </motion.div>
          )}
          
          {e2eFlowStatus?.[selectedConversation.sessionId]?.status === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 flex items-center gap-3 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg border border-green-200"
            >
              <span className="material-icons text-green-500">lock</span>
              <div className="flex-1">
                <p className="font-medium">Secure chat is ready</p>
                <p className="text-xs text-green-500 mt-1">
                  Your messages are end-to-end encrypted
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Input Area */}
      <div className="flex flex-col gap-2.5 min-h-[60px]">
        <div className="flex flex-col justify-between flex-1">
          <textarea
            value={messageText}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={
              isAIChat
                ? 'Type a message to AI assistant...' 
                : pendingFiles.length > 0
                ? 'Add a message (optional) or click send to upload files...'
                : 'Type a message here....'
            }
            className="text-sm sm:text-base leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none flex-1 w-full disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]"
            rows="2"
            disabled={!sendState.canSend && sendState.reason !== 'Please enter a message or select files'}
          />
          
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2 sm:gap-4 relative">
              <div className="relative">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  aria-label="Add attachment"
                  disabled={!canUploadFiles}
                  onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                  title={
                    !canUploadFiles 
                      ? (isAIChat ? "File upload not supported for AI assistant" : "File upload not available") 
                      : "Select files for preview (Max 15MB each)"
                  }
                >
                  <span className="material-icons text-zinc-500 text-lg sm:text-xl">
                    {isProcessingFiles ? 'hourglass_empty' : 'add_circle_outline'}
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                aria-label="Add emoji"
                disabled={!sendState.canSend && sendState.reason !== 'Please enter a message or select files'}
              >
                <span className="material-icons text-zinc-500 text-lg sm:text-xl">sentiment_satisfied_alt</span>
              </button>
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={!sendState.canSend}
              className="p-2 disabled:opacity-50 hover:bg-gray-100 rounded-full transition-colors disabled:cursor-not-allowed" 
              aria-label="Send message"
              title={sendState.canSend ? 'Send message and upload files to backend' : sendState.reason}
            >
              {isSending || isProcessingFiles ? (
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#488BBA' }}
                ></div>
              ) : (
                <span 
                  className="material-icons text-lg sm:text-xl transition-colors"
                  style={{ color: sendState.canSend ? '#488BBA' : '#999' }}
                >
                  send
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Send Status Help Text */}
      {!sendState.canSend && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {sendState.reason}
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && pendingFiles.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded">
          ✅ FIXED Debug: {pendingFiles.length} files in CLIENT preview, canSend: {sendState.canSend ? 'yes' : 'no'} ({sendState.reason})
        </div>
      )}
    </div>
  );
};

export default ChatInput;