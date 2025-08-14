// src/components/shared/chats/hooks/useChats.js - Fixed Timezone

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';

// Fix timezone: Extract time directly from ISO string
const extractTimeFromISO = (isoString) => {
  if (!isoString) return new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
  const timePart = isoString.split('T')[1];
  return timePart.substring(0, 5);
};

export const useChats = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId);

  // Get sessions with proper error handling
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatsApi.getActiveSessions,
    staleTime: 120000, // 2 minutes
    cacheTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      // Retry only for network errors, not for auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Filter sessions based on user role
  const filteredSessions = useMemo(() => {
    if (!sessionsQuery.data) return [];
    
    const userRole = user?.role;
    
    if (userRole === 'psychologist') {
      // Psychologists see all sessions (including Team RuangDiri and client sessions)
      return sessionsQuery.data;
    } else {
      // Regular users see Team RuangDiri and their own sessions
      return sessionsQuery.data.filter(session => 
        session.isTeamChat || 
        session.clientId === user?.id ||
        session.psychologistId === user?.id
      );
    }
  }, [sessionsQuery.data, user?.role, user?.id]);

  // Stable session selector
  const selectSession = useCallback(async (session) => {
    if (!session) return;
    
    console.log('📋 Selecting session:', session.name);
    
    // Don't reconnect if already selected
    if (selectedSession?.sessionId === session.sessionId) {
      console.log('📋 Session already selected, skipping...');
      return;
    }
    
    // Disconnect previous session
    if (selectedSession?.sessionId !== session.sessionId) {
      ably.disconnect();
    }
    
    setSelectedSession(session);
    
    // Mark as read for real sessions (not AI)
    if (!session.isTeamChat && !session.isAIAssistant) {
      try {
        await chatsApi.markAsRead(session.sessionId);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    
    // Connect to appropriate service
    if (user?.id) {
      await ably.connect(session.sessionId, user.id);
    }
  }, [selectedSession?.sessionId, ably, user?.id]);

  // Auto-select Team RuangDiri on first load
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        selectSession(teamSession);
      } else if (filteredSessions.length > 0) {
        // If no team session, select first available
        selectSession(filteredSessions[0]);
      }
    }
  }, [filteredSessions, selectedSession, selectSession]);

  // Setup Ably callbacks for real-time sessions
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    const handleMessage = (messageData) => {
      console.log('📨 Real-time message received:', messageData);
      
      // Transform message data to match our format
      const transformedMessage = {
        id: messageData.id || Date.now().toString(),
        text: messageData.message || messageData.text,
        time: extractTimeFromISO(messageData.createdAt), // Fix timezone
        createdAt: messageData.createdAt || new Date().toISOString(),
        isUser: messageData.sender?.role !== 'psychologist',
        sender: messageData.sender || {
          id: messageData.senderId,
          name: messageData.senderName || 'Unknown',
          role: messageData.senderRole || 'user'
        },
        messageType: messageData.messageType || 'text',
        isAutomated: messageData.messageType === 'automated'
      };
      
      // Add message to current chat
      messages.addMessage(transformedMessage);
    };

    const handleSessionStatus = (statusData) => {
      console.log('📊 Session status change:', statusData);
      
      if (statusData.sessionId === selectedSession.sessionId) {
        setSelectedSession(prev => ({
          ...prev,
          ...statusData,
          isActive: statusData.isActive ?? prev.isActive,
          isChatEnabled: statusData.isChatEnabled ?? prev.isChatEnabled
        }));
      }
    };

    const handleTyping = (typingData) => {
      console.log('⌨️ Typing indicator:', typingData);
      // Typing is handled by useAbly hook
    };

    // Set callbacks for Ably hook
    ably.setCallbacks({
      onMessage: handleMessage,
      onSessionStatus: handleSessionStatus,
      onTyping: handleTyping
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, messages]);

  // Handle typing with proper debouncing
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && user?.id) {
      ably.handleTyping(selectedSession.sessionId, user.id, text);
    }
  }, [selectedSession?.sessionId, user?.id, ably, messages]);

  // Send message with AI support
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      console.warn('Cannot send message - session not ready or no message text');
      return;
    }

    try {
      await messages.sendCurrentMessage();
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // Handle AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      await messages.handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, messages]);

  // Get session status for UI display
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages]);

  // Check if user can send messages
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages]);

  // Handle booking navigation
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ably.disconnect();
    };
  }, [ably]);

  // Get user-specific display data
  const getUserDisplayData = useCallback(() => {
    const userRole = user?.role;
    
    if (userRole === 'psychologist') {
      return {
        title: 'Chat Klien',
        subtitle: 'Professional client communication',
        showClientInfo: true,
        showSessionControls: true
      };
    }
    
    return {
      title: 'Pesan',
      subtitle: 'Chat with counselors and support team',
      showClientInfo: false,
      showSessionControls: false
    };
  }, [user?.role]);

  // Memoized return object to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    // Data
    sessions: filteredSessions,
    selectedSession,
    messages: messages.messages,
    messageText: messages.messageText,
    
    // Loading states
    isLoadingSessions: sessionsQuery.isLoading,
    isLoadingMessages: messages.isLoading,
    isSendingMessage: messages.isSending,
    
    // Connection status
    connectionStatus: ably.connectionStatus,
    isConnected: ably.isConnected,
    isAISession: ably.isAISession,
    isTyping: ably.isTyping,
    
    // Errors
    sessionsError: sessionsQuery.error,
    messagesError: messages.error,
    sendError: messages.error,
    
    // Actions  
    selectSession,
    sendCurrentMessage,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    getSessionStatus,
    refetchSessions: sessionsQuery.refetch,
    
    // User-specific data
    userDisplayData: getUserDisplayData(),
    
    // Utility flags
    isEmpty: (filteredSessions.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false,
    isPsychologist: user?.role === 'psychologist'
  }), [
    // Dependencies for memoization
    filteredSessions,
    selectedSession,
    messages.messages,
    messages.messageText,
    messages.isLoading,
    messages.isSending,
    messages.error,
    sessionsQuery.isLoading,
    sessionsQuery.error,
    ably.connectionStatus,
    ably.isConnected,
    ably.isAISession,
    ably.isTyping,
    selectSession,
    sendCurrentMessage,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    getSessionStatus,
    sessionsQuery.refetch,
    getUserDisplayData,
    user?.role
  ]);

  return returnValue;
};