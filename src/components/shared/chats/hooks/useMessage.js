// src/components/shared/chats/hooks/useMessage.js - FIXED: With Attachments Integration

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';
import { getSessionAttachments } from '../lib/attachmentsApi'; // ADDED: Import attachments API
import { getCurrentTime, getCurrentTimestamp } from '../utils/dateUtils';
import chatEncryption from '../lib/encryption';

// Get current user ID
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  } catch {
    return null;
  }
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

// Message Logger
const MessageLogger = {
  log: (level, operation, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      crypto: 'color: #FF9800; font-weight: bold;',
      infinite: 'color: #9C27B0; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] MSG-${operation.toUpperCase()}:`,
      styles[level] || styles.info,
      data || ''
    );
  }
};

export const useMessages = (sessionId, ably = null) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  
  // FIXED: Proper infinite scroll state management
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false); // Prevent multiple simultaneous loads

  // ADDED: Attachments query for current session
  const attachmentsQuery = useQuery({
    queryKey: ['session-attachments', sessionId],
    queryFn: async () => {
      if (!sessionId || sessionId === 'team-ruangdiri') return [];
      
      MessageLogger.log('info', 'FETCH_ATTACHMENTS', {
        sessionId: sessionId?.slice(-8)
      });
      
      const attachments = await getSessionAttachments(sessionId);
      
      MessageLogger.log('success', 'ATTACHMENTS_LOADED', {
        count: attachments?.length || 0,
        sessionId: sessionId?.slice(-8)
      });
      
      return attachments || [];
    },
    enabled: !!sessionId && sessionId !== 'team-ruangdiri',
    staleTime: 30000,
    cacheTime: 300000,
    retry: 2
  });

  // FIXED: Get messages query with proper cursor handling
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      MessageLogger.log('info', 'INITIAL_FETCH', {
        sessionId: sessionId?.slice(-8),
        isTeamChat: sessionId === 'team-ruangdiri'
      });

      if (sessionId === 'team-ruangdiri') {
        return [
          {
            id: '1',
            text: "Hello, roomies!\n\nSelamat datang di Ruang Bantu.\nApakah ada yang bisa kami bantu?\nUntuk mempermudah keperluan roomies,\nkamu dapat memilih tiga opsi di bawah ini:",
            time: getCurrentTime(),
            timestamp: getCurrentTimestamp(),
            isUser: false,
            sender: {
              id: 'team-ai',
              name: 'Team RuangDiri',
              role: 'ai_assistant'
            },
            messageType: 'ai_welcome',
            showOptions: true
          }
        ];
      }

      // FIXED: Always start without cursor for initial fetch
      const response = await chatsApi.getMessages(sessionId, null, 20);
      
      if (Array.isArray(response)) {
        return response;
      } else if (response.data) {
        const { data: messages, metadata } = response;
        
        // FIXED: Set initial pagination state
        if (metadata) {
          setHasMore(metadata.hasNextPage || false);
          setCursor(metadata.nextCursor || null);
          
          MessageLogger.log('infinite', 'INITIAL_PAGINATION', {
            messagesCount: messages.length,
            hasNextPage: metadata.hasNextPage,
            nextCursor: metadata.nextCursor?.slice(-10) || 'null'
          });

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

  // FIXED: Send text message mutation with proper payload
  const sendMutation = useMutation({
    mutationFn: async ({ sessionId, content }) => {
      MessageLogger.log('crypto', 'SEND_MESSAGE', {
        sessionId: sessionId?.slice(-8),
        contentLength: content?.length || 0,
        isTeamChat: sessionId === 'team-ruangdiri'
      });

      return chatsApi.sendMessage(sessionId, content);
    },
    onSuccess: async (result, variables) => {
      try {
        const { sessionId, content } = variables || {};
        if (!sessionId || sessionId === 'team-ruangdiri' || !ably) return;

        // Refresh attachments after sending message
        queryClient.invalidateQueries(['session-attachments', sessionId]);

        // Prepare Ably broadcast payload similar to backend
        const user = getCurrentUser();
        const senderFullname = user?.fullName || user?.full_name || user?.name || 'You';
        const payload = {
          senderId: getCurrentUserId() || 'current-user',
          senderFullname,
          content: result?.sentEncrypted || content,
          messageType: result?.messageType || 'text',
          timestamp: result?.timestamp || new Date().toISOString()
        };
        await ably.sendMessageViaAbly(sessionId, payload);
      } catch (error) {
        MessageLogger.log('warn', 'ABLY_BROADCAST_FAIL', error);
      }
    },
    onMutate: async ({ sessionId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      
      const optimisticMessage = {
        id: optimisticId,
        text: content,
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
        isSending: true
      };

      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      // AI response for team session
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
      MessageLogger.log('error', 'SEND_FAILED', err);
    },
    onSuccess: (newMessage, { sessionId }, context) => {
      MessageLogger.log('success', 'SEND_SUCCESS', {
        messageId: newMessage.id,
        sessionId: sessionId?.slice(-8)
      });
      
      // Remove optimistic message and add real message
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

  // FIXED: File upload mutation with message text as caption
  const sendFileMutation = useMutation({
    mutationFn: async ({ sessionId, file, messageType, caption }) => {
      MessageLogger.log('crypto', 'SEND_FILE', {
        fileName: file.name,
        fileSize: file.size,
        sessionId: sessionId?.slice(-8),
        messageType,
        hasCaption: !!caption,
        isTeamChat: sessionId === 'team-ruangdiri'
      });
      
      return chatsApi.sendFileMessage(sessionId, file, messageType, caption || '');
    },
    onSuccess: async (result, variables) => {
      const { sessionId } = variables || {};
      
      // Refresh attachments after file upload
      if (sessionId && sessionId !== 'team-ruangdiri') {
        queryClient.invalidateQueries(['session-attachments', sessionId]);
      }
    },
    onMutate: async ({ sessionId, file, messageType, caption }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticId = `temp-file-${Date.now()}-${Math.random()}`;
      
      const optimisticMessage = {
        id: optimisticId,
        text: caption || '',
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
        attachmentUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
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
      
      MessageLogger.log('error', 'FILE_SEND_FAILED', err);
      
      // Show error in optimistic message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return old.map(msg => {
          if (msg.optimisticId === context?.optimisticId && msg.isUploading) {
            return {
              ...msg,
              isUploading: false,
              uploadError: err.message || 'Upload failed',
              text: `⚠ ${err.message || 'Failed to upload file'}`
            };
          }
          return msg;
        });
      });
    },
    onSuccess: (newMessage, { sessionId, file }, context) => {
      MessageLogger.log('success', 'FILE_SEND_SUCCESS', {
        messageId: newMessage.id,
        fileName: file.name,
        sessionId: sessionId?.slice(-8)
      });
      
      // Remove optimistic message and add real message
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
      MessageLogger.log('error', 'MARK_READ_FAILED', error);
    }
  });

  // Memoize current messages and attachments
  const currentMessages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);
  const sessionAttachments = useMemo(() => attachmentsQuery.data || [], [attachmentsQuery.data]);

  // FIXED: Load more messages with proper cursor and deduplication
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || sessionId === 'team-ruangdiri') {
      return false;
    }

    if (!hasMore || isLoadingMore || loadingRef.current || messagesQuery.isLoading) {
      MessageLogger.log('warn', 'LOAD_MORE_BLOCKED', {
        hasMore,
        isLoadingMore,
        loadingRefCurrent: loadingRef.current,
        isQueryLoading: messagesQuery.isLoading
      });
      return false;
    }

    if (!cursor) {
      MessageLogger.log('warn', 'NO_CURSOR', 'Cannot load more without cursor');
      return false;
    }

    try {
      loadingRef.current = true;
      setIsLoadingMore(true);
      
      MessageLogger.log('infinite', 'LOAD_MORE_START', {
        cursor: cursor?.slice(-10),
        hasMore,
        sessionId: sessionId?.slice(-8)
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

      MessageLogger.log('infinite', 'LOAD_MORE_RESPONSE', {
        olderMessagesCount: olderMessages.length,
        hasNextPage,
        newCursor: newCursor?.slice(-10) || 'null'
      });
      
      if (olderMessages.length > 0) {
        queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
          // FIXED: Prevent duplicate messages
          const existingIds = new Set(old.map(msg => msg.id));
          const newMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
          
          MessageLogger.log('infinite', 'PREPEND_MESSAGES', {
            existingCount: old.length,
            newCount: newMessages.length,
            duplicatesFiltered: olderMessages.length - newMessages.length
          });
          
          // FIXED: Prepend older messages to the beginning
          return [...newMessages, ...old];
        });
      }
      
      // Update pagination state
      setCursor(newCursor);
      setHasMore(hasNextPage);
      
      MessageLogger.log('infinite', 'LOAD_MORE_SUCCESS', {
        messagesAdded: olderMessages.length,
        newHasMore: hasNextPage,
        newCursor: newCursor?.slice(-10) || 'null'
      });
      
      return true;
      
    } catch (error) {
      MessageLogger.log('error', 'LOAD_MORE_FAILED', error);
      return false;
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [sessionId, cursor, hasMore, isLoadingMore, messagesQuery.isLoading, queryClient]);

  // Send message function
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content?.trim()) {
      MessageLogger.log('warn', 'SEND_INVALID', 'Missing sessionId or content');
      return;
    }

    try {
      MessageLogger.log('info', 'SEND_ATTEMPT', {
        sessionId: sessionId?.slice(-8),
        contentLength: content.trim().length
      });

      await sendMutation.mutateAsync({ 
        sessionId, 
        content: content.trim() 
      });
    } catch (error) {
      MessageLogger.log('error', 'SEND_ERROR', error);
      throw error;
    }
  }, [sessionId, sendMutation.mutateAsync]);

  // FIXED: File upload function using messageText as caption
  const sendFile = useCallback(async (file, fileType = null, caption = '') => {
    if (!sessionId || !file) {
      MessageLogger.log('warn', 'FILE_SEND_INVALID', 'Missing sessionId or file');
      return;
    }

    if (sessionId === 'team-ruangdiri') {
      throw new Error('File upload not supported for AI assistant');
    }

    try {
      // Validate file before upload
      chatsApi.validateFile(file);
      
      // Auto-detect message type if not provided
      const messageType = fileType || chatsApi.getFileTypeCategory(file);
      
      // FIXED: Use messageText as caption if not provided
      const finalCaption = caption || messageText.trim();
      
      MessageLogger.log('info', 'FILE_SEND_ATTEMPT', {
        fileName: file.name,
        messageType,
        hasCaption: !!finalCaption,
        captionFromInput: !caption && !!messageText.trim(),
        sessionId: sessionId?.slice(-8)
      });
      
      await sendFileMutation.mutateAsync({ 
        sessionId, 
        file,
        messageType,
        caption: finalCaption
      });
      
      // Clear message text after successful upload
      setMessageText('');
      
      MessageLogger.log('success', 'FILE_SEND_COMPLETE', file.name);
    } catch (error) {
      MessageLogger.log('error', 'FILE_SEND_ERROR', error);
      throw error;
    }
  }, [sessionId, messageText, sendFileMutation.mutateAsync]);

  // Send current message function
  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) {
      MessageLogger.log('warn', 'SEND_CURRENT_EMPTY', 'Cannot send empty message');
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

  // Add message function - prevent duplicates
  const addMessage = useCallback((message) => {
    if (!sessionId) return;

    MessageLogger.log('info', 'ADD_MESSAGE', {
      messageId: message.id,
      sessionId: sessionId?.slice(-8),
      hasText: !!message.text
    });

    queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
      // Check for duplicates by ID and timestamp
      const exists = old.some(msg => 
        msg.id === message.id || 
        (msg.timestamp === message.timestamp && msg.text === message.text && msg.senderId === message.senderId)
      );
      
      if (exists) {
        MessageLogger.log('warn', 'DUPLICATE_PREVENTED', message.id);
        return old;
      }
      
      // FIXED: Add new messages at the end (bottom of chat)
      return [...old, message];
    });

    // Refresh attachments if message has attachment
    if (message.attachmentUrl) {
      queryClient.invalidateQueries(['session-attachments', sessionId]);
    }
  }, [sessionId, queryClient]);

  // AI service selection handler
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
      MessageLogger.log('error', 'AI_SERVICE_FAILED', error);
    }
  }, [sessionId, addMessage]);

  // Session checks for sending capabilities
  const canSendMessage = useCallback((session) => {
    if (!sessionId) {
      return false;
    }
    
    // AI Team RuangDiri always available
    if (sessionId === 'team-ruangdiri') {
      return true;
    }
    
    // For counseling sessions
    if (session) {
      const isActiveSession = session.status === 'active' && session.isActive === true;
      const isChatEnabled = session.isChatEnabled === true;
      const isReadyStatus = session.status === 'active' || session.status === 'ready';
      
      return isActiveSession || isChatEnabled || isReadyStatus;
    }
    
    return false;
  }, [sessionId]);

  // File sending capability check
  const canSendFile = useCallback((session) => {
    if (!sessionId) return false;
    if (sessionId === 'team-ruangdiri') return false; // AI doesn't support files
    
    return canSendMessage(session);
  }, [sessionId, canSendMessage]);

  // Text message capability check
  const canSendMessageWithText = useCallback((session) => {
    const hasText = !!messageText?.trim();
    const canSend = canSendMessage(session);
    
    return hasText && canSend;
  }, [messageText, canSendMessage]);

  // Get session status
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

  // Return object with attachments
  return useMemo(() => ({
    messages: currentMessages,
    sessionAttachments, // ADDED: Session attachments for navigation
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
    isLoadingAttachments: attachmentsQuery.isLoading, // ADDED
    isSending: sendMutation.isPending || sendFileMutation.isPending,
    isUploadingFile: sendFileMutation.isPending,
    error: messagesQuery.error || sendMutation.error || sendFileMutation.error || attachmentsQuery.error,
    refetch: () => {
      messagesQuery.refetch();
      attachmentsQuery.refetch(); // ADDED: Refetch attachments too
    },
    hasMore,
    isLoadingMore
  }), [
    currentMessages,
    sessionAttachments, // ADDED
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
    attachmentsQuery.isLoading, // ADDED
    attachmentsQuery.error, // ADDED
    attachmentsQuery.refetch, // ADDED
    sendMutation.isPending,
    sendMutation.error,
    sendFileMutation.isPending,
    sendFileMutation.error,
    hasMore,
    isLoadingMore,
    sessionId
  ]);
};