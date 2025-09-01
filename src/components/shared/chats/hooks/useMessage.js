// src/components/shared/chats/hooks/useMessage.js - E2E ENHANCED: With Complete E2E Message Encryption

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';
import { getCurrentTime, getCurrentTimestamp } from '../utils/dateUtils';
import e2eEncryption from '../lib/encryption';

// Get current user ID
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  } catch {
    return null;
  }
};

// E2E Message Logger
const E2EMessageLogger = {
  log: (level, operation, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      crypto: 'color: #FF9800; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] E2E-MSG-${operation.toUpperCase()}:`,
      styles[level] || styles.info,
      data || ''
    );
  }
};

export const useMessages = (sessionId, ably = null) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Get messages query with E2E decryption support
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      E2EMessageLogger.log('info', 'FETCH_MESSAGES', {
        sessionId: sessionId?.slice(-8),
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        isTeamChat: sessionId === 'team-ruangdiri'
      });

      const response = await chatsApi.getMessages(sessionId, null, 20);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response.data) {
        const { data: messages, metadata } = response;
        
        if (metadata) {
          setHasMore(metadata.hasNextPage || false);
          setCursor(metadata.nextCursor || null);
        }
        
        return messages || [];
      }
      
      return response;
    },
    enabled: !!sessionId,
    staleTime: 30000,
    cacheTime: 300000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // E2E Enhanced send text message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ sessionId, content }) => {
      E2EMessageLogger.log('crypto', 'SEND_MESSAGE', {
        sessionId: sessionId?.slice(-8),
        contentLength: content?.length || 0,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        isTeamChat: sessionId === 'team-ruangdiri'
      });

      // Use chatsApi.sendMessage which handles E2E encryption internally
      return chatsApi.sendMessage(sessionId, content);
    },
    onMutate: async ({ sessionId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      
      const optimisticMessage = {
        id: optimisticId,
        text: content, // Show plaintext in UI
        time: getCurrentTime(),
        timestamp: getCurrentTimestamp(),
        isUser: true,
        sender: {
          id: currentUserId || 'current-user',
          name: 'You',
          role: 'user',
          profilePicture: null
        },
        messageType: 'text',
        isOptimistic: true,
        optimisticId,
        isRead: false,
        isSending: true,
        isEncrypted: sessionId !== 'team-ruangdiri' && !!e2eEncryption.getSessionKey(sessionId)
      };

      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      // AI response for team session (unchanged)
      if (sessionId === 'team-ruangdiri') {
        setTimeout(() => {
          const aiResponseText = chatsApi.generateAIResponse(content);
          const responseText = typeof aiResponseText === 'string' ? aiResponseText : aiResponseText.text;
          
          const aiResponse = {
            id: `ai-temp-${Date.now()}`,
            text: responseText,
            time: getCurrentTime(),
            timestamp: getCurrentTimestamp(),
            isUser: false,
            sender: {
              id: 'team-ai',
              name: 'Team RuangDiri',
              role: 'ai_assistant',
              profilePicture: null
            },
            messageType: 'ai_response',
            isAIMessage: true,
            isOptimistic: true,
            isRead: true
          };

          queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
            return [...old, aiResponse];
          });
        }, 1500);
      }

      return { previousMessages, optimisticId };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
      E2EMessageLogger.log('error', 'SEND_FAILED', err);
    },
    onSuccess: (newMessage, { sessionId }, context) => {
      E2EMessageLogger.log('success', 'SEND_SUCCESS', {
        messageId: newMessage.id,
        wasEncrypted: newMessage.isEncrypted,
        sessionId: sessionId?.slice(-8)
      });
      
      // Remove optimistic message and add real message without duplicates
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => 
          msg.optimisticId !== context?.optimisticId && !msg.isOptimistic
        );
        
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          const finalMessage = {
            ...newMessage,
            isSending: false,
            isSent: true
          };
          return [...withoutOptimistic, finalMessage];
        }
        
        return withoutOptimistic;
      });
      
      setMessageText('');
    }
  });

  // E2E Enhanced send file mutation
  const sendFileMutation = useMutation({
    mutationFn: async ({ sessionId, file, messageType, caption }) => {
      E2EMessageLogger.log('crypto', 'SEND_FILE', {
        fileName: file.name,
        fileSize: file.size,
        sessionId: sessionId?.slice(-8),
        messageType,
        hasCaption: !!caption,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        isTeamChat: sessionId === 'team-ruangdiri'
      });
      
      // Use chatsApi.sendFileMessage which handles E2E encryption internally
      return chatsApi.sendFileMessage(sessionId, file, messageType, caption || '');
    },
    onMutate: async ({ sessionId, file, messageType, caption }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticId = `temp-file-${Date.now()}-${Math.random()}`;
      
      const optimisticMessage = {
        id: optimisticId,
        text: caption || `📎 ${file.name}`,
        time: getCurrentTime(),
        timestamp: getCurrentTimestamp(),
        isUser: true,
        sender: {
          id: currentUserId || 'current-user',
          name: 'You',
          role: 'user',
          profilePicture: null
        },
        messageType: messageType,
        isOptimistic: true,
        optimisticId,
        isRead: false,
        isUploading: true,
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentType: file.type,
        attachmentUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        isEncrypted: sessionId !== 'team-ruangdiri' && !!e2eEncryption.getSessionKey(sessionId)
      };

      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      return { previousMessages, optimisticId };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
      
      E2EMessageLogger.log('error', 'FILE_SEND_FAILED', err);
      
      // Show error in optimistic message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return old.map(msg => {
          if (msg.optimisticId === context?.optimisticId && msg.isUploading) {
            return {
              ...msg,
              isUploading: false,
              uploadError: err.message || 'Upload failed',
              text: `❌ ${err.message || 'Failed to upload file'}`
            };
          }
          return msg;
        });
      });
    },
    onSuccess: (newMessage, { sessionId, file }, context) => {
      E2EMessageLogger.log('success', 'FILE_SEND_SUCCESS', {
        messageId: newMessage.id,
        fileName: file.name,
        wasEncrypted: newMessage.isEncrypted,
        sessionId: sessionId?.slice(-8)
      });
      
      // Remove optimistic message and add real message without duplicates
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => 
          msg.optimisticId !== context?.optimisticId && !msg.isOptimistic
        );
        
        // Clean up preview URL if it was created
        const optimisticMsg = old.find(msg => msg.optimisticId === context?.optimisticId);
        if (optimisticMsg?.attachmentUrl && optimisticMsg.attachmentUrl.startsWith('blob:')) {
          URL.revokeObjectURL(optimisticMsg.attachmentUrl);
        }
        
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          const finalMessage = {
            ...newMessage,
            isUploading: false,
            isSent: true
          };
          return [...withoutOptimistic, finalMessage];
        }
        
        return withoutOptimistic;
      });
    }
  });

  // Mark as read mutation  
  const markAsReadMutation = useMutation({
    mutationFn: (sessionId) => chatsApi.markAsRead(sessionId),
    onError: (error) => {
      E2EMessageLogger.log('error', 'MARK_READ_FAILED', error);
    }
  });

  // Memoize current messages to prevent re-renders
  const currentMessages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);

  // E2E Enhanced send message function
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content?.trim()) {
      E2EMessageLogger.log('warn', 'SEND_INVALID', 'Missing sessionId or content');
      return;
    }

    try {
      E2EMessageLogger.log('info', 'SEND_ATTEMPT', {
        sessionId: sessionId?.slice(-8),
        contentLength: content.trim().length,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
      });

      await sendMutation.mutateAsync({ 
        sessionId, 
        content: content.trim() 
      });
    } catch (error) {
      E2EMessageLogger.log('error', 'SEND_ERROR', error);
      throw error;
    }
  }, [sessionId, sendMutation.mutateAsync]);

  // E2E Enhanced send file function
  const sendFile = useCallback(async (file, fileType = 'file', caption = '') => {
    if (!sessionId || !file) {
      E2EMessageLogger.log('warn', 'FILE_SEND_INVALID', 'Missing sessionId or file');
      return;
    }

    if (sessionId === 'team-ruangdiri') {
      throw new Error('File upload not supported for AI assistant');
    }

    try {
      // Validate file before upload
      chatsApi.validateFile(file);
      
      // Get message type from file or use provided fileType
      const messageType = fileType || chatsApi.getFileTypeCategory(file);
      
      E2EMessageLogger.log('info', 'FILE_SEND_ATTEMPT', {
        fileName: file.name,
        messageType,
        hasCaption: !!caption,
        sessionId: sessionId?.slice(-8),
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
      });
      
      await sendFileMutation.mutateAsync({ 
        sessionId, 
        file,
        messageType,
        caption: caption?.trim() || ''
      });
      
      E2EMessageLogger.log('success', 'FILE_SEND_COMPLETE', file.name);
    } catch (error) {
      E2EMessageLogger.log('error', 'FILE_SEND_ERROR', error);
      throw error;
    }
  }, [sessionId, sendFileMutation.mutateAsync]);

  // Send current message function
  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) {
      E2EMessageLogger.log('warn', 'SEND_CURRENT_EMPTY', 'Cannot send empty message');
      return;
    }
    
    const currentMessage = messageText.trim();
    await sendMessage(currentMessage);
  }, [messageText, sendMessage]);

  // Mark as read function
  const markAsRead = useCallback(() => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    markAsReadMutation.mutate(sessionId);
  }, [sessionId, markAsReadMutation.mutate]);

  // E2E Enhanced add message function - prevent duplicates and handle encryption
  const addMessage = useCallback((message) => {
    if (!sessionId) return;

    E2EMessageLogger.log('info', 'ADD_MESSAGE', {
      messageId: message.id,
      sessionId: sessionId?.slice(-8),
      isEncrypted: message.isEncrypted,
      hasText: !!message.text
    });

    queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
      // Check for duplicates by ID and timestamp
      const exists = old.some(msg => 
        msg.id === message.id || 
        (msg.timestamp === message.timestamp && msg.text === message.text && msg.senderId === message.senderId)
      );
      
      if (exists) {
        E2EMessageLogger.log('warn', 'DUPLICATE_PREVENTED', message.id);
        return old;
      }
      
      return [...old, message];
    });
  }, [sessionId, queryClient]);

  // AI service selection handler (unchanged)
  const handleAIServiceSelection = useCallback(async (option) => {
    if (sessionId !== 'team-ruangdiri') return;

    const userMessage = {
      id: `selection-${Date.now()}`,
      text: option,
      time: getCurrentTime(),
      timestamp: getCurrentTimestamp(),
      isUser: true,
      sender: {
        id: 'current-user',
        name: 'You',
        role: 'user',
        profilePicture: null
      },
      messageType: 'service_selection',
      isRead: true
    };

    addMessage(userMessage);

    try {
      const aiResponse = await chatsApi.handleAIServiceSelection(option);
      
      setTimeout(() => {
        const responseMessage = {
          id: `ai-response-${Date.now()}`,
          text: aiResponse.message,
          time: getCurrentTime(),
          timestamp: getCurrentTimestamp(),
          isUser: false,
          sender: {
            id: 'team-ai',
            name: 'Team RuangDiri',
            role: 'ai_assistant',
            profilePicture: null
          },
          messageType: 'ai_service_response',
          isAIMessage: true,
          actions: aiResponse.actions,
          isRead: true
        };

        addMessage(responseMessage);
      }, 1000);
    } catch (error) {
      E2EMessageLogger.log('error', 'AI_SERVICE_FAILED', error);
    }
  }, [sessionId, addMessage]);

  // Enhanced canSendMessage function with E2E session check
  const canSendMessage = useCallback((session) => {
    if (!sessionId) {
      E2EMessageLogger.log('debug', 'CAN_SEND_CHECK', 'No sessionId');
      return false;
    }
    
    // AI Team RuangDiri always available (no E2E)
    if (sessionId === 'team-ruangdiri') {
      E2EMessageLogger.log('debug', 'CAN_SEND_CHECK', 'Team RuangDiri - always available');
      return true;
    }
    
    // For E2E counseling sessions
    if (session) {
      const isActiveSession = session.status === 'active' && session.isActive === true;
      const isChatEnabled = session.isChatEnabled === true;
      const isReadyStatus = session.status === 'active' || session.status === 'ready';
      
      const canSend = isActiveSession || isChatEnabled || isReadyStatus;
      
      E2EMessageLogger.log('debug', 'CAN_SEND_CHECK', {
        sessionId: session.sessionId?.slice(-8),
        status: session.status,
        isActive: session.isActive,
        isChatEnabled: session.isChatEnabled,
        isE2EEnabled: session.isE2EEnabled,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        result: canSend
      });
      
      return canSend;
    }
    
    E2EMessageLogger.log('debug', 'CAN_SEND_CHECK', 'No session data');
    return false;
  }, [sessionId]);

  // Enhanced canSendFile function with E2E support
  const canSendFile = useCallback((session) => {
    if (!sessionId) return false;
    if (sessionId === 'team-ruangdiri') return false; // AI doesn't support files
    
    const canSend = canSendMessage(session);
    
    E2EMessageLogger.log('debug', 'CAN_SEND_FILE_CHECK', {
      sessionId: sessionId?.slice(-8),
      canSend,
      hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
    });
    
    return canSend;
  }, [sessionId, canSendMessage]);

  // Enhanced canSendMessageWithText function
  const canSendMessageWithText = useCallback((session) => {
    const hasText = !!messageText?.trim();
    const canSend = canSendMessage(session);
    
    E2EMessageLogger.log('debug', 'CAN_SEND_WITH_TEXT_CHECK', {
      hasText,
      canSend,
      messageTextLength: messageText?.length || 0,
      sessionId: sessionId?.slice(-8),
      result: hasText && canSend
    });
    
    return hasText && canSend;
  }, [messageText, canSendMessage, sessionId]);

  // Enhanced getSessionStatus function with E2E context
  const getSessionStatus = useCallback((session) => {
    if (!sessionId) return 'no_session';
    if (sessionId === 'team-ruangdiri') return 'ai_chat';
    if (!session) return 'no_session';
    
    if (session.status === 'completed') return 'session_ended';
    if (session.status === 'active' && session.isActive === true) return 'ready';
    if (session.isChatEnabled === true) return 'ready'; 
    if (session.status === 'pending') return 'chat_disabled';
    if (session.status === 'ready') return 'ready';
    
    return 'chat_disabled';
  }, [sessionId]);

  // Enhanced load more messages with E2E support
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || sessionId === 'team-ruangdiri' || !hasMore || messagesQuery.isLoading) {
      E2EMessageLogger.log('debug', 'LOAD_MORE_SKIP', {
        sessionId: sessionId?.slice(-8),
        hasMore,
        isLoading: messagesQuery.isLoading
      });
      return;
    }
    
    try {
      E2EMessageLogger.log('info', 'LOAD_MORE_MESSAGES', {
        cursor,
        hasMore,
        sessionId: sessionId?.slice(-8),
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
      });
      
      const response = await chatsApi.getMessages(sessionId, cursor, 20);
      
      let olderMessages = [];
      let newCursor = null;
      let hasNextPage = false;
      
      if (Array.isArray(response)) {
        olderMessages = response;
      } else if (response.data) {
        olderMessages = response.data || [];
        const metadata = response.metadata || {};
        hasNextPage = metadata.hasNextPage || false;
        newCursor = metadata.nextCursor || null;
      }
      
      E2EMessageLogger.log('success', 'LOAD_MORE_SUCCESS', {
        count: olderMessages.length,
        hasNextPage,
        newCursor,
        sessionId: sessionId?.slice(-8)
      });
      
      if (olderMessages.length > 0) {
        queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
          const existingIds = new Set(old.map(msg => msg.id));
          const newMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
          return [...newMessages, ...old]; // Prepend older messages
        });
        
        setCursor(newCursor);
        setHasMore(hasNextPage);
      } else {
        setHasMore(false);
        setCursor(null);
      }
    } catch (error) {
      E2EMessageLogger.log('error', 'LOAD_MORE_FAILED', error);
    }
  }, [sessionId, cursor, hasMore, messagesQuery.isLoading, queryClient]);

  // Memoize return object to prevent re-renders with E2E enhancements
  return useMemo(() => ({
    messages: currentMessages,
    messageText,
    setMessageText,
    sendMessage,
    sendFile,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    canSendFile,
    canSendMessageWithText,
    getSessionStatus,
    loadMoreMessages,
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending || sendFileMutation.isPending,
    isUploadingFile: sendFileMutation.isPending,
    error: messagesQuery.error || sendMutation.error || sendFileMutation.error,
    refetch: messagesQuery.refetch,
    hasMore,
    isLoadingMore: false,
    
    // E2E specific
    getE2EMessageStatus: (messageId) => {
      const message = currentMessages.find(m => m.id === messageId);
      return {
        isEncrypted: message?.isEncrypted || false,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        sessionId: sessionId?.slice(-8)
      };
    },
    
    // Debug utilities
    debug: {
      logger: E2EMessageLogger,
      sessionId: sessionId?.slice(-8),
      hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
      e2eStatus: e2eEncryption.getStatus()
    }
  }), [
    currentMessages,
    messageText,
    sendMessage,
    sendFile,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    canSendFile,
    canSendMessageWithText,
    getSessionStatus,
    loadMoreMessages,
    messagesQuery.isLoading,
    messagesQuery.error,
    messagesQuery.refetch,
    sendMutation.isPending,
    sendMutation.error,
    sendFileMutation.isPending,
    sendFileMutation.error,
    hasMore,
    sessionId
  ]);
};