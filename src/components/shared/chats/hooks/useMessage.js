// src/components/shared/chats/hooks/useMessages.js - Fixed Timezone

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';

// Fix timezone: Get current time in HH:mm format
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("id-ID", {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const useMessages = (sessionId) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');

  // Get messages with AI support
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatsApi.getMessages(sessionId),
    enabled: !!sessionId,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry for auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true
  });

  // Send message mutation with AI support
  const sendMutation = useMutation({
    mutationFn: ({ sessionId, content }) => chatsApi.sendMessage(sessionId, content),
    onMutate: async ({ sessionId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(['chat-messages', sessionId]);

      // Create optimistic user message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: content,
        time: getCurrentTime(), // Use fixed time
        timestamp: new Date().toISOString(),
        isUser: true,
        sender: {
          id: 'current-user',
          name: 'You',
          role: 'user'
        },
        messageType: 'text',
        isOptimistic: true
      };

      // Add optimistic message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        return [...old, optimisticMessage];
      });

      // For AI sessions, add optimistic AI response
      if (sessionId === 'team-ruangdiri') {
        setTimeout(() => {
          const aiResponse = {
            id: `ai-temp-${Date.now()}`,
            text: chatsApi.generateAIResponse(content),
            time: getCurrentTime(), // Use fixed time
            timestamp: new Date().toISOString(),
            isUser: false,
            sender: {
              id: 'team-ai',
              name: 'Team RuangDiri',
              role: 'ai_assistant'
            },
            messageType: 'ai_response',
            isAIMessage: true,
            isOptimistic: true
          };

          queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
            return [...old, aiResponse];
          });
        }, 1500); // Simulate AI processing time
      }

      return { previousMessages };
    },
    onError: (err, { sessionId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['chat-messages', sessionId], context.previousMessages);
      console.error('Failed to send message:', err);
    },
    onSuccess: (newMessage, { sessionId }) => {
      // Replace optimistic message with real message
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const withoutOptimistic = old.filter(msg => !msg.isOptimistic);
        const exists = withoutOptimistic.some(msg => msg.id === newMessage.id);
        return exists ? withoutOptimistic : [...withoutOptimistic, newMessage];
      });
      
      // Clear input text
      setMessageText('');
      
      // Invalidate sessions to update last message
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
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

  // Send current message from input
  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) {
      console.warn('Cannot send empty message');
      return;
    }
    
    const currentMessage = messageText.trim();
    await sendMessage(currentMessage);
  }, [messageText, sendMessage]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    
    markAsReadMutation.mutate(sessionId);
  }, [sessionId, markAsReadMutation]);

  // Add real-time message to cache
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
      time: getCurrentTime(), // Use fixed time
      timestamp: new Date().toISOString(),
      isUser: true,
      sender: {
        id: 'current-user',
        name: 'You',
        role: 'user'
      },
      messageType: 'service_selection'
    };

    addMessage(userMessage);

    // Get AI response for the selection
    try {
      const aiResponse = await chatsApi.handleAIServiceSelection(option);
      
      setTimeout(() => {
        const responseMessage = {
          id: `ai-response-${Date.now()}`,
          text: aiResponse.message,
          time: getCurrentTime(), // Use fixed time
          timestamp: new Date().toISOString(),
          isUser: false,
          sender: {
            id: 'team-ai',
            name: 'Team RuangDiri',
            role: 'ai_assistant'
          },
          messageType: 'ai_service_response',
          isAIMessage: true,
          actions: aiResponse.actions
        };

        addMessage(responseMessage);
      }, 1000);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [sessionId, addMessage]);

  // Check if user can send messages
  const canSendMessage = useCallback((session) => {
    if (!sessionId || !messageText.trim()) return false;
    
    // AI Team RuangDiri is always available
    if (sessionId === 'team-ruangdiri') return true;
    
    // For counseling sessions, check if active and chat enabled
    if (session) {
      return session.isActive && session.isChatEnabled;
    }
    
    return false;
  }, [sessionId, messageText]);

  // Get session status for UI
  const getSessionStatus = useCallback((session) => {
    if (!sessionId) return 'no_session';
    if (sessionId === 'team-ruangdiri') return 'ai_chat';
    if (!session) return 'no_session';
    if (!session.isActive) return 'session_ended';
    if (!session.isChatEnabled) return 'chat_disabled';
    return 'ready';
  }, [sessionId]);

  // Memoized messages to prevent unnecessary re-renders
  const messages = useMemo(() => {
    return messagesQuery.data || [];
  }, [messagesQuery.data]);

  // Memoized return object
  const returnValue = useMemo(() => ({
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
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    error: messagesQuery.error || sendMutation.error,
    refetch: messagesQuery.refetch
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
    messagesQuery.isLoading,
    messagesQuery.error,
    sendMutation.isPending,
    sendMutation.error,
    messagesQuery.refetch
  ]);

  return returnValue;
};