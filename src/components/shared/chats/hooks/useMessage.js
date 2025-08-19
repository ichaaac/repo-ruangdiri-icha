// src/components/shared/chats/hooks/useMessages.js - Updated with File Upload Support

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';
import { getCurrentTime, getCurrentTimestamp } from '../utils/dateUtils';

// Get current user ID from useAuth context
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  } catch {
    return null;
  }
};

// ✅ NEW: Accept ably instance for real-time messaging
export const useMessages = (sessionId, ably = null) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [cursor, setCursor] = useState(null);

  // ✅ Updated: Get messages with cursor pagination
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatsApi.getMessages(sessionId, cursor, 10),
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

  // ✅ UPDATED: Send text message mutation with Ably support
  const sendMutation = useMutation({
    mutationFn: async ({ sessionId, content }) => {
      // ✅ Try sending via Ably first for real-time delivery
      if (ably && sessionId !== 'team-ruangdiri') {
        const currentUserId = getCurrentUserId();
        const messageData = {
          sessionId,
          message: content,
          messageType: 'text',
          senderId: currentUserId,
          timestamp: new Date().toISOString()
        };
        
        // Try Ably first
        const sentViaAbly = await ably.sendMessageViaAbly(sessionId, messageData);
        if (sentViaAbly) {
          console.log('📤 Message sent via Ably');
        }
      }
      
      // Always send via API for persistence 
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
        isRead: true
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
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          return [...withoutOptimistic, newMessage];
        }
        
        return withoutOptimistic;
      });
      
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    }
  });

  // ✅ UPDATED: Send file message mutation with Ably support
  const sendFileMutation = useMutation({
    mutationFn: async ({ sessionId, file, messageType }) => {
      // ✅ For files, we only use API since Ably doesn't handle file uploads
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
        isRead: true,
        isUploading: true
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
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          return [...withoutOptimistic, newMessage];
        }
        
        return withoutOptimistic;
      });
      
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    }
  });

  // Mark as read mutation  
  const markAsReadMutation = useMutation({
    mutationFn: (sessionId) => chatsApi.markAsRead(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to mark as read:', error);
    }
  });

  // Send text message function
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
  }, [sessionId, sendMutation]);

  // ✅ NEW: Send file function
  const sendFile = useCallback(async (file, fileType = 'file') => {
    if (!sessionId || !file) {
      console.warn('Cannot send file: missing sessionId or file');
      return;
    }

    if (sessionId === 'team-ruangdiri') {
      throw new Error('File upload not supported for AI assistant');
    }

    try {
      // Validate file first
      chatsApi.validateFile(file);
      
      // Determine message type based on file
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
  }, [sessionId, sendFileMutation]);

  // Send current message
  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) {
      console.warn('Cannot send empty message');
      return;
    }
    
    const currentMessage = messageText.trim();
    await sendMessage(currentMessage);
  }, [messageText, sendMessage]);

  // Mark as read
  const markAsRead = useCallback(() => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    
    markAsReadMutation.mutate(sessionId);
  }, [sessionId, markAsReadMutation]);

  // Add real-time message
  const addMessage = useCallback((message) => {
    if (!sessionId) return;

    queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
      const exists = old.some(msg => msg.id === message.id);
      if (exists) return old;
      
      return [...old, message];
    });
  }, [sessionId, queryClient]);

  // Handle AI service selection
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

  // ✅ Updated: Check if can send message based on session status
  const canSendMessage = useCallback((session) => {
    if (!sessionId || !messageText.trim()) return false;
    
    // AI Team RuangDiri always available
    if (sessionId === 'team-ruangdiri') return true;
    
    // For counseling sessions - check status properly
    if (session) {
      if (session.status === 'completed') return false;
      if (session.status === 'active' && session.isActive) return true;
      return false;
    }
    
    return false;
  }, [sessionId, messageText]);

  // ✅ Check if can send file
  const canSendFile = useCallback((session) => {
    if (!sessionId) return false;
    
    // AI Team RuangDiri doesn't support files
    if (sessionId === 'team-ruangdiri') return false;
    
    // For counseling sessions - check status properly
    if (session) {
      if (session.status === 'completed') return false;
      if (session.status === 'active' && session.isActive) return true;
      return false;
    }
    
    return false;
  }, [sessionId]);

  // ✅ Updated: Get session status based on backend response
  const getSessionStatus = useCallback((session) => {
    if (!sessionId) return 'no_session';
    if (sessionId === 'team-ruangdiri') return 'ai_chat';
    if (!session) return 'no_session';
    
    if (session.status === 'completed') return 'session_ended';
    if (session.status === 'pending' && !session.isActive) return 'chat_disabled';
    if (session.status === 'active' && session.isActive) return 'ready';
    if (session.status === 'active' && !session.isActive) return 'chat_disabled';
    
    return 'chat_disabled';
  }, [sessionId]);

  // ✅ Load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    
    try {
      const currentMessages = messagesQuery.data || [];
      if (currentMessages.length === 0) return;
      
      const firstMessage = currentMessages[0];
      const newCursor = firstMessage.timestamp;
      
      const olderMessages = await chatsApi.getMessages(sessionId, newCursor, 10);
      
      if (olderMessages.length > 0) {
        queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
          const existingIds = new Set(old.map(msg => msg.id));
          const newMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
          return [...newMessages, ...old];
        });
        
        setCursor(newCursor);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    }
  }, [sessionId, messagesQuery.data, queryClient]);

  // Memoized messages
  const messages = useMemo(() => {
    return messagesQuery.data || [];
  }, [messagesQuery.data]);

  // Return memoized object
  return useMemo(() => ({
    messages,
    messageText,
    setMessageText,
    sendMessage,
    sendFile, // ✅ NEW: File upload function
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    canSendFile, // ✅ NEW: Check if can send file
    getSessionStatus,
    loadMoreMessages,
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending || sendFileMutation.isPending, // ✅ Include file sending state
    isUploadingFile: sendFileMutation.isPending, // ✅ NEW: Specific file upload state
    error: messagesQuery.error || sendMutation.error || sendFileMutation.error,
    refetch: messagesQuery.refetch,
    hasMore: cursor !== null
  }), [
    messages,
    messageText,
    sendMessage,
    sendFile,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    canSendFile,
    getSessionStatus,
    loadMoreMessages,
    messagesQuery.isLoading,
    messagesQuery.error,
    sendMutation.isPending,
    sendMutation.error,
    sendFileMutation.isPending,
    sendFileMutation.error,
    messagesQuery.refetch,
    cursor
  ]);
};