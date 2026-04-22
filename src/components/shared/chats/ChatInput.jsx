// src/components/shared/chats/components/ChatInput.jsx - ENHANCED: No Max Char & Enter for Media

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// File Upload States
const UPLOAD_STATES = {
  READY: 'ready',
  UPLOADING: 'uploading', 
  SUCCESS: 'success',
  FAILED: 'failed'
};

// Session message persistence storage
const SESSION_MESSAGE_STORAGE = new Map();

const getSessionMessage = (sessionId) => {
  return SESSION_MESSAGE_STORAGE.get(sessionId) || '';
};

const setSessionMessage = (sessionId, message) => {
  if (sessionId) {
    if (message.trim()) {
      SESSION_MESSAGE_STORAGE.set(sessionId, message);
    } else {
      SESSION_MESSAGE_STORAGE.delete(sessionId);
    }
  }
};

const clearSessionMessage = (sessionId) => {
  if (sessionId) {
    SESSION_MESSAGE_STORAGE.delete(sessionId);
  }
};

// Enhanced File Preview Component with Enter key support
const EnhancedFilePreview = ({ fileItem, onRemove, index, onSend, hasText, canSend }) => {
  const isImage = fileItem.file.type.startsWith('image/');
  const previewUrl = fileItem.previewUrl;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return 'image';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word')) return 'description';
    if (type.includes('excel') || type.includes('sheet')) return 'table_chart';
    if (type.includes('zip') || type.includes('rar')) return 'archive';
    return 'attach_file';
  };

  // Handle Enter key for sending media
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-300"
      style={{ width: '80px', height: '80px' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Remove Button */}
      <button
        onClick={() => onRemove(fileItem.id)}
        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/80 transition-colors z-10"
        title="Remove file"
      >
        <span className="material-icons text-xs">close</span>
      </button>

      {/* Send Indicator - Show when can send */}
      {canSend && (
        <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center z-10">
          <span className="material-icons text-xs">send</span>
        </div>
      )}

      {/* File Preview */}
      <div className="relative w-full h-full">
        {isImage && previewUrl ? (
          <img 
            src={previewUrl} 
            alt={fileItem.fileName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-1">
            <span 
              className="material-icons text-xl mb-1"
              style={{ color: '#488BBA' }}
            >
              {getFileIcon(fileItem.file.type)}
            </span>
            <p className="text-xs text-gray-600 text-center truncate w-full px-1">
              {formatFileSize(fileItem.fileSize)}
            </p>
          </div>
        )}

        {/* Upload Status Overlay */}
        {fileItem.uploadState === UPLOAD_STATES.UPLOADING && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          </div>
        )}

        {fileItem.uploadState === UPLOAD_STATES.FAILED && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
            <span className="material-icons text-white text-sm">error</span>
          </div>
        )}
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
  };

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
      onClose();
    }
    e.target.value = '';
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesSelect(selectedFiles);
      onClose();
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-56 z-50">
      <input 
        ref={imageInputRef} 
        type="file" 
        accept="image/jpeg,image/png" 
        multiple 
        onChange={handleImageChange} 
        className="hidden"
      />
      <input 
        ref={fileInputRef} 
        type="file" 
        accept=".pdf,.doc,.docx" 
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
          <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP</p>
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
          <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT, ZIP</p>
        </div>
      </button>
    </div>
  );
};

// ENHANCED ChatInput Component
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
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const textareaRef = useRef(null);

  const focusTextarea = () => {
    if (textareaRef.current) {
      try {
        textareaRef.current.focus();
        const len = textareaRef.current.value?.length || 0;
        textareaRef.current.setSelectionRange(len, len);
      } catch {}
    }
  };

  // Load persisted message when switching conversations
  useEffect(() => {
    if (selectedConversation?.sessionId) {
      const persistedMessage = getSessionMessage(selectedConversation.sessionId);
      if (persistedMessage !== messageText) {
        onMessageChange(persistedMessage);
      }
      
      // Clear pending files when switching conversations
      setPendingFiles(prev => {
        prev.forEach(file => {
          if (file.previewUrl) {
            URL.revokeObjectURL(file.previewUrl);
          }
        });
        return [];
      });
    }
  }, [selectedConversation?.sessionId]);

  // Persist message text changes to session storage
  useEffect(() => {
    if (selectedConversation?.sessionId && messageText !== undefined) {
      setSessionMessage(selectedConversation.sessionId, messageText);
    }
  }, [messageText, selectedConversation?.sessionId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height in pixels
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [messageText]);

  // Calculate total size of all pending files
  const totalSize = useMemo(() => {
    return pendingFiles.reduce((total, file) => total + file.fileSize, 0);
  }, [pendingFiles]);

  // Validate total size (15MB max for all files combined)
  const validateTotalSize = (newFiles, existingFiles = []) => {
    const existingSize = existingFiles.reduce((total, file) => total + file.fileSize, 0);
    const newSize = newFiles.reduce((total, file) => total + file.size, 0);
    const totalSizeAfter = existingSize + newSize;
    const maxSize = 15 * 1024 * 1024; // 15MB

    if (totalSizeAfter > maxSize) {
      const totalMB = (totalSizeAfter / (1024 * 1024)).toFixed(1);
      throw new Error(`Total size would be ${totalMB}MB. Maximum allowed is 15MB.`);
    }

    return true;
  };

  // Validate individual file types (strict per backend)
  const validateFileType = (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        `Tipe file tidak didukung: ${file.type}. Hanya image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document yang diperbolehkan.`
      );
    }

    return true;
  };

  // Handle file selection
  const handleFilesSelect = useCallback(async (files) => {
    console.log('📎 Files selected:', files.length);
    
    try {
      // Validate total size first
      validateTotalSize(files, pendingFiles);
      
      let successCount = 0;
      const errors = [];
      
      for (const file of files) {
        try {
          validateFileType(file);
          
          const fileId = `file-${Date.now()}-${Math.random()}`;
          const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
          
          const fileItem = {
            id: fileId,
            file: file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type.startsWith('image/') ? 'image' : 'file',
            previewUrl: previewUrl,
            uploadState: UPLOAD_STATES.READY
          };
          
          setPendingFiles(prev => [...prev, fileItem]);
          successCount++;
          
        } catch (error) {
          console.error('File validation failed:', error);
          errors.push(error.message);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} file(s) selected`);
        
        // Focus on the first file for Enter key functionality
        setTimeout(() => {
          const filePreview = document.querySelector('[tabindex="0"]');
          if (filePreview) {
            filePreview.focus();
          }
        }, 100);
      }
      
      if (errors.length > 0) {
        toast.error('Some files rejected', {
          description: errors.slice(0, 2).join(', '),
          duration: 4000
        });
      }
      
    } catch (error) {
      console.error('Total size validation failed:', error);
      toast.error('Cannot add files', {
        description: error.message,
        duration: 4000
      });
    }
  }, [pendingFiles]);

  // Remove file
  const handleRemoveFile = useCallback((fileId) => {
    setPendingFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Enhanced send message function with session cleanup
  const handleSendMessage = useCallback(async () => {
    const hasText = !!messageText?.trim();
    const hasReadyFiles = pendingFiles.filter(f => f.uploadState === UPLOAD_STATES.READY);

    console.log('🚀 Send button clicked:', {
      hasText,
      readyFilesCount: hasReadyFiles.length,
      isSending,
      isUploadingFiles
    });

    // Basic validation
    if (!selectedConversation) {
      toast.warning('No conversation selected');
      return;
    }

    if (isSending || isUploadingFiles) {
      console.log('⏳ Already sending/uploading, skipping...');
      return;
    }

    if (isAIChat && hasReadyFiles.length > 0) {
      toast.warning('AI chat does not support file uploads');
      return;
    }

    // Check if session is active/ready for chat
    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    if (!baseCanSend && !hasReadyFiles.length) {
      toast.warning('Chat is not available - session may not be active');
      return;
    }

    if (!hasText && !hasReadyFiles.length) {
      console.log('⚠️ No content to send');
      return;
    }

    try {
      // Send text message if no files
      if (hasText && hasReadyFiles.length === 0) {
        console.log('📝 Sending text message...');
        await onSendMessage();
        
        // Clear session message storage after successful send
        clearSessionMessage(selectedConversation.sessionId);
        // Keep focus on input for faster follow-up typing
        focusTextarea();
        return;
      }

      // Upload files with proper error handling
      if (hasReadyFiles.length > 0) {
        if (!onFileUpload) {
          throw new Error('File upload function not available');
        }

        console.log('📤 Starting file upload process...');
        setIsUploadingFiles(true);

        // Mark files as uploading
        setPendingFiles(prev => 
          prev.map(item => 
            item.uploadState === UPLOAD_STATES.READY
              ? { ...item, uploadState: UPLOAD_STATES.UPLOADING }
              : item
          )
        );

        let uploadSuccessCount = 0;
        let uploadFailedCount = 0;

        // Upload each file with caption from messageText
        for (const fileItem of hasReadyFiles) {
          try {
            const caption = hasText ? messageText.trim() : '';
            console.log('📁 Uploading file:', fileItem.fileName, 'with caption:', caption);
            
            await onFileUpload(fileItem.file, fileItem.fileType, caption);
            
            // Mark as success
            setPendingFiles(prev => 
              prev.map(item => 
                item.id === fileItem.id
                  ? { ...item, uploadState: UPLOAD_STATES.SUCCESS }
                  : item
              )
            );
            
            uploadSuccessCount++;
            
            // Clean up preview URL
            if (fileItem.previewUrl) {
              URL.revokeObjectURL(fileItem.previewUrl);
            }
            
          } catch (error) {
            console.error(`Upload failed for ${fileItem.fileName}:`, error);
            
            // Mark as failed
            setPendingFiles(prev => 
              prev.map(item => 
                item.id === fileItem.id
                  ? { ...item, uploadState: UPLOAD_STATES.FAILED }
                  : item
              )
            );
            
            uploadFailedCount++;
          }
        }
        
        // Show results
        if (uploadSuccessCount > 0) {
          toast.success(`${uploadSuccessCount} file(s) sent`);
          
          // Clear message text and session storage after successful upload
          onMessageChange('');
          clearSessionMessage(selectedConversation.sessionId);
          
          // Remove successful files after delay
          setTimeout(() => {
            setPendingFiles(prev => 
              prev.filter(item => item.uploadState !== UPLOAD_STATES.SUCCESS)
            );
          }, 1000);

          // Refocus input so user can continue typing
          focusTextarea();
        }
        
        if (uploadFailedCount > 0) {
          toast.error(`${uploadFailedCount} file(s) failed`);
        }
      }

    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send', {
        description: error.message
      });
    } finally {
      setIsUploadingFiles(false);
    }
  }, [messageText, pendingFiles, onSendMessage, onFileUpload, onMessageChange, selectedConversation, isAIChat, canSendMessage, isSending, isUploadingFiles]);

  // ENHANCED: Keydown handler supporting Enter for both text and media
  const handleTextareaKeyDown = useCallback((e) => {
    const isEnter = e.key === 'Enter';
    const isShift = e.shiftKey;
    const isComposing = e.isComposing || (e.nativeEvent && e.nativeEvent.isComposing);
    
    if (isEnter && !isShift && !isComposing) {
      e.preventDefault();
      
      // Check if we have files ready to send
      const hasReadyFiles = pendingFiles.some(f => f.uploadState === UPLOAD_STATES.READY);
      const hasText = !!messageText?.trim();
      
      // Can send if has text OR has ready files (enhanced functionality)
      if (hasText || hasReadyFiles) {
        handleSendMessage();
      }
    }
  }, [handleSendMessage, pendingFiles, messageText]);

  // Time gate: auto-enable chat when scheduled time arrives
  const [timeGatePassed, setTimeGatePassed] = useState(false);
  useEffect(() => {
    if (!selectedConversation?.sessionId || selectedConversation?.isTeamChat) return;
    const sid = selectedConversation.sessionId;
    const scheduledAt = sessionStorage.getItem(`chat_scheduledAt_${sid}`);
    if (!scheduledAt) return;

    const startTime = new Date(scheduledAt);
    const now = new Date();
    if (now >= startTime) {
      setTimeGatePassed(true);
      return;
    }

    const delay = startTime.getTime() - now.getTime();
    const timer = setTimeout(() => setTimeGatePassed(true), delay);
    return () => clearTimeout(timer);
  }, [selectedConversation?.sessionId, selectedConversation?.isTeamChat]);

  // Check if chat input should be disabled
  const isChatDisabled = useMemo(() => {
    if (!selectedConversation) return true;

    // AI chat is always enabled
    if (selectedConversation.isTeamChat) return false;

    // Disable chat if only automated messages exist and session is not active
    const baseCanSend = typeof canSendMessage === 'function' ? canSendMessage() : canSendMessage;
    return !baseCanSend;
  }, [selectedConversation, canSendMessage, timeGatePassed]);

  // Get time-gated placeholder message
  const chatPlaceholder = useMemo(() => {
    if (!isChatDisabled) return "Type a message here...";
    if (!selectedConversation?.sessionId || selectedConversation?.isTeamChat) return "Chat is disabled...";
    const scheduledAt = sessionStorage.getItem(`chat_scheduledAt_${selectedConversation.sessionId}`);
    if (scheduledAt) {
      const startTime = new Date(scheduledAt);
      if (new Date() < startTime) {
        const dateStr = startTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const timeStr = startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return `Chat akan aktif pada ${dateStr}, ${timeStr} WIB`;
      }
    }
    return "Chat is disabled...";
  }, [isChatDisabled, selectedConversation, timeGatePassed]);
  const canUploadFiles = useMemo(() => {
    if (isAIChat) return false;
    if (!selectedConversation) return false;
    if (isUploadingFiles) return false;
    if (isChatDisabled) return false;
    
    return true;
  }, [isAIChat, selectedConversation, isUploadingFiles, isChatDisabled]);

  const canSend = useMemo(() => {
    const hasText = !!messageText?.trim();
    const hasReadyFiles = pendingFiles.some(f => f.uploadState === UPLOAD_STATES.READY);
    
    if (!selectedConversation) return false;
    if (isSending || isUploadingFiles) return false;
    if (isChatDisabled && !hasReadyFiles) return false;
    if (isAIChat && hasReadyFiles) return false;
    
    return hasText || hasReadyFiles;
  }, [messageText, pendingFiles, selectedConversation, isSending, isUploadingFiles, isChatDisabled, isAIChat]);

  // Character count (for display only - no limit)
  const charCount = messageText?.length || 0;

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-300 shadow-lg relative z-[100] w-full">
      {/* Enhanced Media Preview with Enter key support */}
      <AnimatePresence>
        {pendingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border-b border-gray-200 p-3"
          >
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
              {pendingFiles.map((fileItem, index) => (
                <EnhancedFilePreview
                  key={fileItem.id}
                  fileItem={fileItem}
                  onRemove={handleRemoveFile}
                  onSend={handleSendMessage}
                  hasText={!!messageText?.trim()}
                  canSend={canSend}
                  index={index}
                />
              ))}
            </div>
            
            {/* Enhanced Instructions */}
            <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
              <span className="material-icons text-sm">info</span>
              <span>Press Enter on files or text to send • Click X to remove files</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Status Indicator */}
      {isUploadingFiles && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 px-4 py-2 border-b border-blue-200 flex items-center gap-3"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm text-blue-700">Uploading files...</span>
        </motion.div>
      )}

      {/* Chat disabled warning */}
      {isChatDisabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-50 px-4 py-2 border-b border-yellow-200 flex items-center gap-3"
        >
          <span className="text-yellow-600">⚠️</span>
          <span className="text-sm text-yellow-700">
            Chat is disabled - waiting for session to become active
          </span>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="px-4 py-4 bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            {/* ENHANCED: Auto-resizing textarea with no character limit */}
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={chatPlaceholder}
              className="text-sm leading-6 text-neutral-600 bg-transparent border-none outline-none resize-none w-full min-h-[40px] max-h-[120px] placeholder-gray-400 overflow-y-auto"
              rows="1"
              disabled={isChatDisabled}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E1 transparent'
              }}
            />
            
            {/* Character counter (no limit) */}
            {charCount > 0 && (
              <div className="text-xs text-gray-400 text-right mt-1">
                {charCount.toLocaleString()} characters
              </div>
            )}
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
                    {isUploadingFiles ? 'hourglass_empty' : 'attach_file'}
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
                disabled={isChatDisabled}
              >
                <span className="material-icons text-zinc-500 text-xl">sentiment_satisfied_alt</span>
              </button>
            </div>
            
            {/* Enhanced Send button with better state handling */}
            <button 
              onClick={handleSendMessage}
              disabled={!canSend}
              className="p-2 disabled:opacity-50 hover:bg-blue-100 rounded-full transition-colors disabled:cursor-not-allowed" 
              aria-label="Send message"
              title={canSend ? 'Send message (Enter)' : 'Enter message or attach files'}
            >
              {isSending || isUploadingFiles ? (
                <div 
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: '#488BBA' }}
                ></div>
              ) : (
                <span 
                  className="material-icons text-xl transition-colors"
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
