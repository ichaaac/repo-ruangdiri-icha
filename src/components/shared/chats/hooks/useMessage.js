// src/components/shared/chats/hooks/useMessages.js - Updated for Backend Format with dayjs

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

export const useMessages = (sessionId) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [cursor, setCursor] = useState(null);

  // ✅ Updated: Get messages with cursor pagination
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatsApi.getMessages(sessionId, cursor, 10), // Include cursor and limit
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

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: ({ sessionId, content }) => chatsApi.sendMessage(sessionId, content),
    onMutate: async ({ sessionId, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });

      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      // ✅ Updated: Optimistic user message dengan format yang tepat
      const currentUserId = getCurrentUserId();
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: content,
        time: getCurrentTime(),
        timestamp: getCurrentTimestamp(), // ✅ Use centralized utility
        isUser: true, // Always true for optimistic message
        sender: {
          id: currentUserId || 'current-user',
          name: 'You', // Always show "You" for current user messages
          role: 'user',
          profilePicture: null
        },
        messageType: 'text',
        isOptimistic: true,
        isRead: true // Assume sent messages are read
      };

      // Add optimistic message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      // AI response untuk team session
      if (sessionId === 'team-ruangdiri') {
        setTimeout(() => {
          const aiResponseText = chatsApi.generateAIResponse(content);
          const responseText = typeof aiResponseText === 'string' ? aiResponseText : aiResponseText.text;
          
          const aiResponse = {
            id: `ai-temp-${Date.now()}`,
            text: responseText,
            time: getCurrentTime(),
            timestamp: getCurrentTimestamp(), // ✅ Use centralized utility
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
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      }
      console.error('Failed to send message:', err);
    },
    onSuccess: (newMessage, { sessionId }) => {
      // ✅ Updated: Replace optimistic dengan real message dari backend
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        
        // Check if message already exists
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        
        if (!exists) {
          return [...withoutOptimistic, newMessage];
        }
        
        return withoutOptimistic;
      });
      
      // Clear input
      setMessageText('');
      
      // Invalidate sessions untuk update lastMessage di sidebar
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      // Refetch untuk consistency
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

  // Send message function
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
      // Avoid duplicates
      const exists = old.some(msg => msg.id === message.id);
      if (exists) return old;
      
      return [...old, message];
    });
  }, [sessionId, queryClient]);

  // Handle AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (sessionId !== 'team-ruangdiri') return;

    // Add user selection message
    const userMessage = {
      id: `selection-${Date.now()}`,
      text: option,
      time: getCurrentTime(),
      timestamp: getCurrentTimestamp(), // ✅ Use centralized utility
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

    // Get AI response
    try {
      const aiResponse = await chatsApi.handleAIServiceSelection(option);
      
      setTimeout(() => {
        const responseMessage = {
          id: `ai-response-${Date.now()}`,
          text: aiResponse.message,
          time: getCurrentTime(),
          timestamp: getCurrentTimestamp(), // ✅ Use centralized utility
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
    
    // AI Team RuangDiri selalu available
    if (sessionId === 'team-ruangdiri') return true;
    
    // ✅ For counseling sessions - check status properly
    if (session) {
      // Cannot send if session is completed
      if (session.status === 'completed') return false;
      
      // Can send if session is active
      if (session.status === 'active' && session.isActive) return true;
      
      // Cannot send for pending or inactive sessions
      return false;
    }
    
    return false;
  }, [sessionId, messageText]);

  // ✅ Updated: Get session status based on backend response
  const getSessionStatus = useCallback((session) => {
    if (!sessionId) return 'no_session';
    if (sessionId === 'team-ruangdiri') return 'ai_chat';
    if (!session) return 'no_session';
    
    // ✅ Check backend session status dengan proper handling
    if (session.status === 'completed') return 'session_ended';
    if (session.status === 'pending' && !session.isActive) return 'chat_disabled';
    if (session.status === 'active' && session.isActive) return 'ready';
    if (session.status === 'active' && !session.isActive) return 'chat_disabled';
    
    return 'chat_disabled'; // Default to disabled for safety
  }, [sessionId]);

  // ✅ Load more messages function (untuk infinite scroll nanti)
  const loadMoreMessages = useCallback(async () => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    
    try {
      const currentMessages = messagesQuery.data || [];
      if (currentMessages.length === 0) return;
      
      // Get first message as cursor
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
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    getSessionStatus,
    loadMoreMessages, // ✅ Added for future infinite scroll
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    error: messagesQuery.error || sendMutation.error,
    refetch: messagesQuery.refetch,
    hasMore: cursor !== null // ✅ Indicator for more messages
  }), [
    messages,
    messageText,
    sendMessage,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    handleAIServiceSelection,
    canSendMessage,
    getSessionStatus,
    loadMoreMessages,
    messagesQuery.isLoading,
    messagesQuery.error,
    sendMutation.isPending,
    sendMutation.error,
    messagesQuery.refetch,
    cursor
  ]);
};