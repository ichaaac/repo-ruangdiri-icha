// src/components/shared/chats/hooks/useMessages.js - Stable Hook

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatsApi } from '../lib/chatsApi';

export const useMessages = (sessionId) => {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');

  // Get messages with stable config
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => chatsApi.getMessages(sessionId),
    enabled: !!sessionId,
    staleTime: 30000,
    retry: false
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: ({ sessionId, content }) => chatsApi.sendMessage(sessionId, content),
    onSuccess: (newMessage) => {
      // Add to cache
      queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
        const exists = old.some(msg => msg.id === newMessage.id);
        return exists ? old : [...old, newMessage];
      });
      
      // Clear input
      setMessageText('');
      
      // Invalidate sessions
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  // Mark as read mutation  
  const markAsReadMutation = useMutation({
    mutationFn: (sessionId) => chatsApi.markAsRead(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    }
  });

  // Stable handlers
  const sendMessage = useCallback(async (content) => {
    if (!sessionId || !content?.trim()) return;
    await sendMutation.mutateAsync({ sessionId, content: content.trim() });
  }, [sessionId, sendMutation]);

  const sendCurrentMessage = useCallback(async () => {
    if (!messageText.trim()) return;
    await sendMessage(messageText);
  }, [messageText, sendMessage]);

  const markAsRead = useCallback(() => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;
    markAsReadMutation.mutate(sessionId);
  }, [sessionId, markAsReadMutation]);

  const addMessage = useCallback((message) => {
    queryClient.setQueryData(['chat-messages', sessionId], (old = []) => {
      const exists = old.some(msg => msg.id === message.id);
      return exists ? old : [...old, message];
    });
  }, [sessionId, queryClient]);

  // Memoized values to prevent re-renders
  const messages = useMemo(() => messagesQuery.data || [], [messagesQuery.data]);
  
  const canSendMessage = useCallback((session) => {
    if (!sessionId || !messageText.trim()) return false;
    if (sessionId === 'team-ruangdiri') return true;
    return session?.isActive && session?.isChatEnabled;
  }, [sessionId, messageText]);

  const getSessionStatus = useCallback((session) => {
    if (!sessionId) return 'no_session';
    if (sessionId === 'team-ruangdiri') return 'team_chat';
    if (!session?.isActive) return 'session_ended';
    if (!session?.isChatEnabled) return 'chat_disabled';
    return 'ready';
  }, [sessionId]);

  return {
    messages,
    messageText,
    setMessageText,
    sendMessage,
    sendCurrentMessage,
    markAsRead,
    addMessage,
    canSendMessage,
    getSessionStatus,
    isLoading: messagesQuery.isLoading,
    isSending: sendMutation.isPending,
    error: messagesQuery.error || sendMutation.error,
    refetch: messagesQuery.refetch
  };
};