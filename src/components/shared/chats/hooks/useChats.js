// src/components/shared/chats/hooks/useChats.js - Updated for Backend Integration

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';

// MAIN HOOK - UPDATED FOR BACKEND
export const useChats = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId);

  // Store user data untuk API access
  useEffect(() => {
    if (user && user.id) {
      console.log('🔍 useChats - Storing user data:', user);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      console.log('🔍 useChats - No user data or missing ID:', user);
    }
  }, [user]);

  // ✅ Updated: Get sessions using getChatHistories
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => {
      console.log('🔍 useChats - Fetching sessions...');
      return chatsApi.getChatHistories();
    },
    staleTime: 30000, // 30 detik
    cacheTime: 300000, // 5 menit
    retry: (failureCount, error) => {
      console.log('🔍 useChats - Query retry:', { failureCount, error: error.message });
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    onSuccess: (data) => {
      console.log('🔍 useChats - Sessions query success:', data);
    },
    onError: (error) => {
      console.log('🔍 useChats - Sessions query error:', error);
    }
  });

  // Filter sessions berdasarkan user role
  const filteredSessions = useMemo(() => {
    if (!sessionsQuery.data) return [];
    
    const userRole = user?.role;
    const userId = user?.id;
    
    console.log('🔍 Filtering sessions:', {
      userRole,
      userId,
      totalSessions: sessionsQuery.data.length,
      sessionsData: sessionsQuery.data
    });
    
    if (userRole === 'psychologist') {
      // Psychologist lihat semua session
      return sessionsQuery.data;
    } else {
      // ✅ User biasa (klien) lihat Team RuangDiri dan session mereka sendiri
      const filtered = sessionsQuery.data.filter(session => {
        const isTeamChat = session.isTeamChat;
        const isMyClientSession = session.clientId === userId;
        const isMyPsychologistSession = session.psychologistId === userId;
        
        console.log('🔍 Session filter check:', {
          sessionId: session.sessionId,
          sessionName: session.name,
          isTeamChat,
          isMyClientSession,
          isMyPsychologistSession,
          sessionClientId: session.clientId,
          sessionPsychologistId: session.psychologistId,
          userId
        });
        
        return isTeamChat || isMyClientSession || isMyPsychologistSession;
      });
      
      console.log('✅ Filtered sessions result:', filtered);
      return filtered;
    }
  }, [sessionsQuery.data, user?.role, user?.id]);

  // ✅ Updated: Select session dengan proper message loading
  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session) return;
    
    console.log('📋 Selecting session:', session.name, 'status:', session.status);
    
    // Jangan reconnect kalau sudah selected
    if (selectedSession?.sessionId === session.sessionId) {
      console.log('📋 Session already selected');
      return;
    }
    
    // ✅ Mark as read SEBELUM select session (kalau ada unread messages)
    if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
      try {
        console.log('📖 Marking session as read before selecting...');
        await chatsApi.markAsRead(session.sessionId);
        
        // Update session data to remove unread
        session.hasUnread = false;
        session.unreadCount = 0;
        
        // Refresh sessions list untuk update UI
        setTimeout(() => {
          sessionsQuery.refetch();
        }, 500);
        
        console.log('✅ Session marked as read successfully');
      } catch (error) {
        console.error('❌ Failed to mark as read:', error);
        // Continue anyway, don't block session selection
      }
    }
    
    // Disconnect session sebelumnya
    if (selectedSession?.sessionId !== session.sessionId) {
      ably.disconnect();
    }
    
    // ✅ Set selected session FIRST
    setSelectedSession(session);
    
    // ✅ Connect ke Ably HANYA kalau session active dan bukan completed
    if (user?.id && !session.isTeamChat && session.status !== 'completed') {
      console.log('🔌 Connecting to Ably for active session...');
      await ably.connect(session.sessionId, user.id);
    } else if (session.status === 'completed') {
      console.log('🔒 Session completed, skipping Ably connection');
      ably.disconnect(); // Make sure we're disconnected
    } else if (session.isTeamChat) {
      console.log('🤖 Team chat session, connecting to AI...');
      await ably.connect(session.sessionId, user.id);
    }
  }, [selectedSession?.sessionId, ably, user?.id, sessionsQuery]);

  // Auto-select Team RuangDiri di awal
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        selectSession(teamSession, false); // Don't mark as read for auto-select
      } else if (filteredSessions.length > 0) {
        selectSession(filteredSessions[0], false); // Don't mark as read for auto-select
      }
    }
  }, [filteredSessions, selectedSession, selectSession]);

  // Setup Ably callbacks
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    const handleMessage = (messageData) => {
      console.log('📨 Real-time message:', messageData);
      
      const transformedMessage = {
        id: messageData.id || Date.now().toString(),
        text: messageData.message || messageData.text,
        time: messageData.time || new Date().toLocaleTimeString("id-ID", {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta'
        }),
        createdAt: messageData.createdAt || new Date().toISOString(),
        isUser: messageData.senderId === user?.id, // ✅ Updated: Compare dengan current user ID
        sender: {
          id: messageData.sender?.id || messageData.senderId,
          name: messageData.senderId === user?.id ? 'You' : (messageData.sender?.fullName || messageData.senderName || 'Unknown'), // ✅ Show "You" for current user
          role: messageData.sender?.role || messageData.senderRole || 'user',
          profilePicture: messageData.sender?.profilePicture
        },
        messageType: messageData.messageType || 'text',
        isRead: messageData.isRead
      };
      
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

    ably.setCallbacks({
      onMessage: handleMessage,
      onSessionStatus: handleSessionStatus,
      onTyping: () => {}
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, messages, user?.id]);

  // Handle typing
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && user?.id) {
      ably.handleTyping(selectedSession.sessionId, user.id, text);
    }
  }, [selectedSession?.sessionId, user?.id, ably, messages]);

// Send message
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      console.warn('Cannot send message');
      return;
    }

    try {
      await messages.sendCurrentMessage();
      console.log('✅ Message sent');
      
      // ✅ Refresh sessions to update lastMessage in sidebar
      setTimeout(() => {
        sessionsQuery.refetch();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, [selectedSession, messages, sessionsQuery]);

  // ✅ NEW: Send file
  const sendFile = useCallback(async (file, fileType) => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      console.warn('Cannot send file');
      return;
    }

    try {
      await messages.sendFile(file, fileType);
      console.log('✅ File sent');
      
      // ✅ Refresh sessions to update lastMessage in sidebar
      setTimeout(() => {
        sessionsQuery.refetch();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to send file:', error);
      throw error;
    }
  }, [selectedSession, messages, sessionsQuery]);
  // Handle AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      await messages.handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, messages]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages]);

  // Check if can send message
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages]);

  // Handle booking
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // ✅ Manual refresh function untuk mark as read
  const refreshSessions = useCallback(async () => {
    try {
      await sessionsQuery.refetch();
      console.log('✅ Sessions refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh sessions:', error);
    }
  }, [sessionsQuery]);

  // Cleanup
  useEffect(() => {
    return () => {
      ably.disconnect();
    };
  }, [ably]);

  // User display data
  const getUserDisplayData = useCallback(() => {
    const userRole = user?.role;
    
    if (userRole === 'psychologist') {
      return {
        title: 'Chat Klien',
        subtitle: 'Professional client communication'
      };
    }
    
    return {
      title: 'Pesan',
      subtitle: 'Chat with counselors and support team'
    };
  }, [user?.role]);

  // Return memoized object
  return useMemo(() => ({
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
    refetchSessions: refreshSessions, // ✅ Updated method
    
    // User data
    userDisplayData: getUserDisplayData(),
    
    // Flags
    isEmpty: (filteredSessions.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false,
    isPsychologist: user?.role === 'psychologist'
  }), [
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
    refreshSessions,
    getUserDisplayData,
    user?.role
  ]);
};

// Default export juga
export default useChats;