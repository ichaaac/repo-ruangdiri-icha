// src/components/shared/chats/hooks/useChats.js - Stable Main Hook

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';

export const useChats = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId);

  // Get sessions
const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatsApi.getActiveSessions,
    staleTime: 120000,
    retry: false
  });

  // Stable session selector
  const selectSession = useCallback(async (session) => {
    console.log('📋 Selecting session:', session.name);
    
    // Disconnect previous
    if (selectedSession?.sessionId !== session.sessionId) {
      ably.disconnect();
    }
    
    setSelectedSession(session);
    
    // Mark as read
    if (!session.isTeamChat) {
      messages.markAsRead();
    }
    
    // Connect to Ably
    if (!session.isTeamChat && user?.id) {
      await ably.connect(session.sessionId, user.id);
    }
  }, [selectedSession, ably, messages, user]);

  // Auto-select team session
  useEffect(() => {
    if (sessionsQuery.data?.length > 0 && !selectedSession) {
      const teamSession = sessionsQuery.data.find(s => s.isTeamChat);
      if (teamSession) {
        selectSession(teamSession);
      }
    }
  }, [sessionsQuery.data, selectedSession, selectSession]);

  // Setup Ably callbacks - STABLE
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ably.setCallbacks({
      onMessage: (messageData) => {
        console.log('📨 Real-time message:', messageData);
        
        const transformedMessage = {
          id: messageData.id || Date.now().toString(),
          text: messageData.message || messageData.text,
          time: new Date().toLocaleTimeString("id-ID", {
            hour: '2-digit',
            minute: '2-digit'
          }),
          timestamp: messageData.timestamp || new Date().toISOString(),
          isUser: messageData.sender?.role !== 'psychologist',
          sender: messageData.sender || {
            id: messageData.senderId,
            name: messageData.senderName || 'Unknown',
            role: messageData.senderRole || 'user'
          },
          messageType: messageData.messageType || 'text'
        };
        
        messages.addMessage(transformedMessage);
      },
      
      onSessionStatus: (statusData) => {
        console.log('📊 Session status:', statusData);
        
        if (statusData.sessionId === selectedSession.sessionId) {
          setSelectedSession(prev => ({
            ...prev,
            ...statusData,
            isActive: statusData.isActive ?? prev.isActive,
            isChatEnabled: statusData.isChatEnabled ?? prev.isChatEnabled
          }));
        }
      },
      
      onTyping: (typingData) => {
        console.log('⌨️ Typing:', typingData);
      }
    });
  }, [selectedSession, ably, messages]);

  // Handle typing
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && !selectedSession.isTeamChat && user?.id) {
      ably.handleTyping(selectedSession.sessionId, user.id, text);
    }
  }, [selectedSession, user, ably, messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) return;
    await messages.sendCurrentMessage();
  }, [selectedSession, messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      ably.disconnect();
    };
  }, [ably]);

  // Memoized returns to prevent re-renders
  const stableReturn = useMemo(() => ({
    // Data
    sessions: sessionsQuery.data || [],
    selectedSession,
    messages: messages.messages,
    messageText: messages.messageText,
    
    // Loading
    isLoadingSessions: sessionsQuery.isLoading,
    isLoadingMessages: messages.isLoading,
    isSendingMessage: messages.isSending,
    
    // Connection
    connectionStatus: ably.connectionStatus,
    isConnected: ably.isConnected,
    isTyping: ably.isTyping,
    
    // Actions  
    selectSession,
    sendMessage,
    handleTyping,
    canSendMessage: () => messages.canSendMessage(selectedSession),
    getSessionStatus: () => messages.getSessionStatus(selectedSession),
    
    // Utils
    isEmpty: (sessionsQuery.data?.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false
  }), [
    sessionsQuery.data,
    sessionsQuery.isLoading,
    selectedSession,
    messages.messages,
    messages.messageText,
    messages.isLoading,
    messages.isSending,
    ably.connectionStatus,
    ably.isConnected,
    ably.isTyping,
    selectSession,
    sendMessage,
    handleTyping,
    messages.canSendMessage,
    messages.getSessionStatus
  ]);

  return stableReturn;
};