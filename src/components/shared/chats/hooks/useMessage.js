// src/components/shared/chats/hooks/useMessages.js - FIXED: WhatsApp-like File Upload System

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';
import { getCurrentTime, getCurrentTimestamp } from '../utils/dateUtils';

// Get current user ID
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  } catch {
    return null;
  }
};

export const useMessages = (sessionId, ably = null) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Get messages query with infinite scroll support
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
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

  // Send text message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ sessionId, content }) => {
      // Try broadcasting via Ably first
      if (ably && sessionId !== 'team-ruangdiri') {
        const currentUserId = getCurrentUserId();
        const messageData = {
          sessionId,
          message: content,
          messageType: 'text',
          senderId: currentUserId,
          timestamp: new Date().toISOString()
        };
        
        try {
          const sentViaAbly = await ably.sendMessageViaAbly(sessionId, messageData);
          if (sentViaAbly) {
            console.log('📤 Message broadcasted via Ably');
          }
        } catch (error) {
          console.warn('⚠️ Ably broadcast failed, API will handle:', error);
        }
      }
      
      return chatsApi.sendMessage(sessionId, content);
    },
    onMutate: async ({ sessionId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
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

      return { previousMessages };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
      console.error('Failed to send message:', err);
    },
    onSuccess: (newMessage, { sessionId }) => {
      console.log('✅ Message sent successfully, backend response:', newMessage);
      
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
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

  // FIXED: Send file mutation with WhatsApp-like behavior
  const sendFileMutation = useMutation({
    mutationFn: async ({ sessionId, file, messageType, caption }) => {
      console.log('📤 Starting file upload...', {
        fileName: file.name,
        fileSize: file.size,
        sessionId,
        messageType,
        hasCaption: !!caption
      });
      
      return chatsApi.sendFileMessage(sessionId, file, messageType, caption || '');
    },
    onMutate: async ({ sessionId, file, messageType, caption }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticMessage = {
        id: `temp-file-${Date.now()}`,
        text: caption || `Uploading ${file.name}...`,
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
        isRead: false,
        isUploading: true,
        // Add file preview data for immediate display
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentType: file.type,
        // Create preview URL for images
        attachmentUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };

      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      return { previousMessages };
    },
    onError: (err, { sessionId }, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
      console.error('Failed to send file:', err);
      
      // Show error in optimistic message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return old.map(msg => {
          if (msg.isOptimistic && msg.isUploading) {
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
    onSuccess: (newMessage, { sessionId, file }) => {
      console.log('✅ File sent successfully, backend response:', newMessage);
      
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          const finalMessage = {
            ...newMessage,
            isUploading: false,
            isSent: true
          };
          
          // Clean up preview URL if it was created
          const optimisticMsg = old.find(msg => msg.isOptimistic && msg.isUploading);
          if (optimisticMsg?.attachmentUrl && optimisticMsg.attachmentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(optimisticMsg.attachmentUrl);
          }
          
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
      console.error('Failed to mark as read:', error);
    }
  });

  // Memoize current messages to prevent re-renders
  const currentMessages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);

  // Memoize send message function
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content?.trim()) {
      console.warn('Cannot send message: missing sessionId or content');
      return;
    }

    try {
      await sendMutation.mutateAsync({ 
        sessionId, 
        content: content.trim() 
      });
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  }, [sessionId, sendMutation.mutateAsync]);

  // FIXED: Send file function with caption support
  const sendFile = useCallback(async (file, fileType = 'file', caption = '') => {
    if (!sessionId || !file) {
      console.warn('Cannot send file: missing sessionId or file');
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
      
      console.log('📤 Sending file...', {
        fileName: file.name,
        messageType,
        hasCaption: !!caption
      });
      
      await sendFileMutation.mutateAsync({ 
        sessionId, 
        file,
        messageType,
        caption: caption?.trim() || ''
      });
      
      console.log('✅ File sent successfully');
    } catch (error) {
      console.error('Send file failed:', error);
      throw error;
    }
  }, [sessionId, sendFileMutation.mutateAsync]);

  // Memoize send current message function
  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) {
      console.warn('Cannot send empty message');
      return;
    }
    
    const currentMessage = messageText.trim();
    await sendMessage(currentMessage);
  }, [messageText, sendMessage]);

  // Memoize mark as read function
  const markAsRead = useCallback(() => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    markAsReadMutation.mutate(sessionId);
  }, [sessionId, markAsReadMutation.mutate]);

  // Memoize add message function
  const addMessage = useCallback((message) => {
    if (!sessionId) return;

    queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
      const exists = old.some(msg => msg.id === message.id);
      if (exists) return old;
      return [...old, message];
    });
  }, [sessionId, queryClient]);

  // Memoize AI service selection handler
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
      console.error('Failed to get AI response:', error);
    }
  }, [sessionId, addMessage]);

  // Memoize canSendMessage function
  const canSendMessage = useCallback((session) => {
    if (!sessionId) {
      console.log('❌ No sessionId');
      return false;
    }
    
    // AI Team RuangDiri always available
    if (sessionId === 'team-ruangdiri') {
      console.log('✅ Team RuangDiri - always available');
      return true;
    }
    
    // For counseling sessions
    if (session) {
      const isActiveSession = session.status === 'active' && session.isActive === true;
      const isChatEnabled = session.isChatEnabled === true;
      const isReadyStatus = session.status === 'active' || session.status === 'ready';
      
      const canSend = isActiveSession || isChatEnabled || isReadyStatus;
      
      console.log('🔍 Session check:', {
        sessionId: session.sessionId,
        status: session.status,
        isActive: session.isActive,
        isChatEnabled: session.isChatEnabled,
        result: canSend
      });
      
      return canSend;
    }
    
    console.log('❌ No session data');
    return false;
  }, [sessionId]);

  // Memoize canSendFile function
  const canSendFile = useCallback((session) => {
    if (!sessionId) return false;
    if (sessionId === 'team-ruangdiri') return false; // AI doesn't support files
    
    return canSendMessage(session);
  }, [sessionId, canSendMessage]);

  // Memoize canSendMessageWithText function
  const canSendMessageWithText = useCallback((session) => {
    const hasText = !!messageText?.trim();
    const canSend = canSendMessage(session);
    
    console.log('🔍 canSendMessageWithText:', {
      hasText,
      canSend,
      messageTextLength: messageText?.length || 0,
      result: hasText && canSend
    });
    
    return hasText && canSend;
  }, [messageText, canSendMessage]);

  // Memoize getSessionStatus function
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

  // Load more messages with infinite scroll
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || sessionId === 'team-ruangdiri' || !hasMore || messagesQuery.isLoading) {
      console.log('Cannot load more:', { sessionId, hasMore, isLoading: messagesQuery.isLoading });
      return;
    }
    
    try {
      console.log('📜 Loading more messages...', { cursor, hasMore });
      
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
      
      console.log('📜 Loaded older messages:', {
        count: olderMessages.length,
        hasNextPage,
        newCursor
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
      console.error('Failed to load more messages:', error);
    }
  }, [sessionId, cursor, hasMore, messagesQuery.isLoading, queryClient]);

  // Memoize return object to prevent re-renders
  return useMemo(() => ({
    messages: currentMessages,
    messageText,
    setMessageText,
    sendMessage,
    sendFile, // FIXED: Supports caption now
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
    isLoadingMore: false
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
    hasMore
  ]);
};