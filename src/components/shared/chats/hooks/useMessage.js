// src/components/shared/chats/hooks/useMessages.js - FIXED: Infinite Scroll & Message Status

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
  const [hasMore, setHasMore] = useState(true); // ✅ NEW: Track if more messages available

  // ✅ ENHANCED: Get messages query with infinite scroll support
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async () => {
      const response = await chatsApi.getMessages(sessionId, null, 20); // Start with more messages
      
      // ✅ HANDLE: Response structure from your backend
      if (Array.isArray(response)) {
        return response;
      } else if (response.data) {
        // Handle paginated response
        const { data: messages, metadata } = response;
        
        // ✅ SET: hasMore based on backend response
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
        isRead: false, // ✅ NEW: Start as unread, will be updated by backend response
        isSending: true // ✅ NEW: Show sending state
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
      // ✅ ENHANCED: Handle backend response with proper status
      console.log('✅ Message sent successfully, backend response:', newMessage);
      
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          // ✅ UPDATE: Mark message as sent successfully
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
      // ✅ REMOVED: Don't invalidate here, let socket events handle it
      // queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      // ✅ REMOVED: Don't invalidate here, let socket events handle it
      // queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    }
  });

  // Send file mutation
  const sendFileMutation = useMutation({
    mutationFn: async ({ sessionId, file, messageType }) => {
      return chatsApi.sendFileMessage(sessionId, file, messageType);
    },
    onMutate: async ({ sessionId, file, messageType }) => {
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      const currentUserId = getCurrentUserId();
      const optimisticMessage = {
        id: `temp-file-${Date.now()}`,
        text: `Uploading ${file.name}...`,
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
        isUploading: true // ✅ NEW: Show uploading state
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
    },
    onSuccess: (newMessage, { sessionId }) => {
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
          return [...withoutOptimistic, finalMessage];
        }
        
        return withoutOptimistic;
      });
      
      // ✅ REMOVED: Don't invalidate here, let socket events handle it
      // queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      // ✅ REMOVED: Don't invalidate here, let socket events handle it
      // queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    }
  });

  // Mark as read mutation  
  const markAsReadMutation = useMutation({
    mutationFn: (sessionId) => chatsApi.markAsRead(sessionId),
    onSuccess: () => {
      // ✅ REMOVED: Don't invalidate here, let socket events handle it
      // queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
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

  // Memoize send file function
  const sendFile = useCallback(async (file, fileType = 'file') => {
    if (!sessionId || !file) {
      console.warn('Cannot send file: missing sessionId or file');
      return;
    }

    if (sessionId === 'team-ruangdiri') {
      throw new Error('File upload not supported for AI assistant');
    }

    try {
      chatsApi.validateFile(file);
      const messageType = chatsApi.getFileTypeCategory(file);
      
      await sendFileMutation.mutateAsync({ 
        sessionId, 
        file,
        messageType 
      });
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
      // Better status validation
      const isActiveSession = session.status === 'active' && session.isActive === true;
      const isChatEnabled = session.isChatEnabled === true;
      const isReadyStatus = session.status === 'active' || session.status === 'ready';
      
      const canSend = isActiveSession || isChatEnabled || isReadyStatus;
      
      console.log('🔍 Session check:', {
        sessionId: session.sessionId,
        status: session.status,
        isActive: session.isActive,
        isChatEnabled: session.isChatEnabled,
        isActiveSession,
        isChatEnabled: isChatEnabled,
        isReadyStatus,
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
    
    // Use same logic as canSendMessage for file uploads
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
    
    // Better status mapping
    if (session.status === 'completed') return 'session_ended';
    if (session.status === 'active' && session.isActive === true) return 'ready';
    if (session.isChatEnabled === true) return 'ready'; 
    if (session.status === 'pending') return 'chat_disabled';
    if (session.status === 'ready') return 'ready';
    
    return 'chat_disabled';
  }, [sessionId]);

  // ✅ ENHANCED: Load more messages with infinite scroll
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
      
      // ✅ HANDLE: Different response formats
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
        // No more messages
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
    sendFile,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    canSendFile,
    canSendMessageWithText,
    getSessionStatus,
    loadMoreMessages, // ✅ NEW: Infinite scroll function
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending || sendFileMutation.isPending,
    isUploadingFile: sendFileMutation.isPending,
    error: messagesQuery.error || sendMutation.error || sendFileMutation.error,
    refetch: messagesQuery.refetch,
    hasMore, // ✅ NEW: Has more messages flag
    isLoadingMore: false // ✅ TODO: Add loading more state if needed
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