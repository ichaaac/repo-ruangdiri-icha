// src/components/shared/chats/hooks/useChats.js - FIXED: Infinite Rendering

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';

export const useChats = () => {
  const { user } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // Track who's typing
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId, ably);

  // ✅ FIXED: Memoize user ID to prevent re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Store user data for API access
  useEffect(() => {
    if (user && user.id) {
      console.log('📞 useChats - Storing user data:', user);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Get sessions query
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      console.log('📞 useChats - Fetching sessions...');
      
      try {
        const [histories, activeSessions] = await Promise.all([
          chatsApi.getChatHistories(),
          chatsApi.getActiveSessions()
        ]);
        
        console.log('📞 Chat histories:', histories);
        console.log('📞 Active sessions:', activeSessions);
        
        // Just use histories (which now includes real last messages)
        return histories;
        
      } catch (error) {
        console.error('📞 Error fetching sessions:', error);
        return chatsApi.getChatHistories();
      }
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // ✅ FIXED: Memoize filtered sessions to prevent re-renders
  const filteredSessions = useMemo(() => {
    return (sessionsQuery.data || []).filter(session => {
      const userRole = user?.role;
      
      if (userRole === 'psychologist') {
        return true; // Psychologist sees all
      } else {
        const isTeamChat = session.isTeamChat;
        const isMyClientSession = session.clientId === userId;
        const isMyPsychologistSession = session.psychologistId === userId;
        
        return isTeamChat || isMyClientSession || isMyPsychologistSession;
      }
    });
  }, [sessionsQuery.data, user?.role, userId]);

  // ✅ FIXED: Memoize notification handlers to prevent re-registration
  const handleChatEnableDisable = useCallback((payload) => {
    console.log('🔄 Chat enable/disable event:', payload);
    
    // Update selected session if it matches
    setSelectedSession(prev => {
      if (prev && payload.sessionId === prev.sessionId) {
        return {
          ...prev,
          isActive: payload.isActive,
          isChatEnabled: payload.isChatEnabled,
          status: payload.status
        };
      }
      return prev;
    });
    
    // Refetch sessions to update sidebar
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    console.log('📨 Initial message event:', payload);
    
    // Refetch sessions to update last message in sidebar
    sessionsQuery.refetch();
    
    // If the message is for current session, refetch messages
    if (selectedSession && payload.sessionId === selectedSession.sessionId) {
      messages.refetch();
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  const handleChatInvalidate = useCallback((payload) => {
    console.log('🔄 Chat invalidate event:', payload);
    sessionsQuery.refetch();
    
    if (selectedSession && payload.sessionId === selectedSession.sessionId) {
      messages.refetch();
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  // ✅ FIXED: Setup Socket.io invalidation with memoized handlers
  useEffect(() => {
    if (!notificationSocket.isSocketConnected()) {
      console.log('📡 Connecting notification socket...');
      notificationSocket.connect().catch(err => {
        console.warn('⚠️ Failed to connect notification socket:', err);
      });
    }

    // Register event listeners
    notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
    notificationSocket.on('chat:initial-message', handleInitialMessage);
    notificationSocket.on('chat:invalidate', handleChatInvalidate);

    return () => {
      notificationSocket.off('chat:enable-chat', handleChatEnableDisable);
      notificationSocket.off('chat:initial-message', handleInitialMessage);
      notificationSocket.off('chat:invalidate', handleChatInvalidate);
    };
  }, [handleChatEnableDisable, handleInitialMessage, handleChatInvalidate]);

  // Select session
  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session) return;
    
    console.log('📋 Selecting session:', session.name);
    
    if (selectedSession?.sessionId === session.sessionId) {
      console.log('📋 Session already selected');
      return;
    }
    
    // Mark as read before selecting
    if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
      try {
        console.log('📖 Marking session as read...');
        await chatsApi.markAsRead(session.sessionId);
        
        session.hasUnread = false;
        session.unreadCount = 0;
        
        setTimeout(() => {
          sessionsQuery.refetch();
        }, 500);
        
        console.log('✅ Session marked as read');
      } catch (error) {
        console.error('❌ Failed to mark as read:', error);
      }
    }
    
    // Disconnect previous session
    if (selectedSession?.sessionId !== session.sessionId) {
      ably.disconnect();
    }
    
    // Set selected session
    setSelectedSession(session);
    
    // Connect to Ably if needed
    if (userId && !session.isTeamChat && session.status !== 'completed') {
      console.log('📡 Connecting to Ably...');
      await ably.connect(session.sessionId, userId);
    } else if (session.status === 'completed') {
      console.log('🔒 Session completed, skipping Ably');
      ably.disconnect();
    } else if (session.isTeamChat) {
      console.log('🤖 Team chat session...');
      await ably.connect(session.sessionId, userId);
    }
  }, [selectedSession?.sessionId, ably, userId, sessionsQuery]);

  // Auto-select Team RuangDiri
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        selectSession(teamSession, false);
      } else if (filteredSessions.length > 0) {
        selectSession(filteredSessions[0], false);
      }
    }
  }, [filteredSessions, selectedSession, selectSession]);

  // ✅ FIXED: Memoize Ably callbacks to prevent re-registration
  const handleAblyMessage = useCallback((messageData) => {
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
      isUser: messageData.senderId === userId,
      sender: {
        id: messageData.sender?.id || messageData.senderId,
        name: messageData.senderId === userId ? 'You' : (messageData.sender?.fullName || messageData.senderName || 'Unknown'),
        role: messageData.sender?.role || messageData.senderRole || 'user',
        profilePicture: messageData.sender?.profilePicture
      },
      messageType: messageData.messageType || 'text',
      isRead: messageData.isRead,
      attachmentUrl: messageData.attachmentUrl,
      attachmentType: messageData.attachmentType,
      attachmentName: messageData.attachmentName,
      attachmentSize: messageData.attachmentSize
    };
    
    messages.addMessage(transformedMessage);
    
    // Refetch sessions to update sidebar last message
    setTimeout(() => {
      sessionsQuery.refetch();
    }, 500);
  }, [userId, messages, sessionsQuery]);

  const handleAblySessionStatus = useCallback((statusData) => {
    console.log('📊 Session status change:', statusData);
    
    setSelectedSession(prev => {
      if (prev && statusData.sessionId === prev.sessionId) {
        return {
          ...prev,
          ...statusData,
          isActive: statusData.isActive ?? prev.isActive,
          isChatEnabled: statusData.isChatEnabled ?? prev.isChatEnabled
        };
      }
      return prev;
    });
    
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  const handleAblyTyping = useCallback((typingData) => {
    console.log('⌨️ Typing indicator:', typingData);
    
    const { userId: typingUserId, isTyping, sessionId } = typingData;
    
    if (typingUserId !== userId && sessionId === selectedSession?.sessionId) {
      setTypingUsers(prev => {
        if (isTyping) {
          return {
            ...prev,
            [typingUserId]: {
              isTyping,
              timestamp: Date.now(),
              userName: typingData.userName || 'Someone'
            }
          };
        } else {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[typingUserId];
          return newTypingUsers;
        }
      });
      
      // Clear typing after timeout
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            delete newTypingUsers[typingUserId];
            return newTypingUsers;
          });
        }, 5000);
      }
    }
  }, [userId, selectedSession?.sessionId]);

  const handleAblyUnreadCount = useCallback((unreadData) => {
    console.log('🔢 Unread count update:', unreadData);
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  // Setup Ably callbacks with memoized handlers
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ably.setCallbacks({
      onMessage: handleAblyMessage,
      onSessionStatus: handleAblySessionStatus,
      onTyping: handleAblyTyping,
      onUnreadCount: handleAblyUnreadCount
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, handleAblyMessage, handleAblySessionStatus, handleAblyTyping, handleAblyUnreadCount]);

  // ✅ FIXED: Memoize typing handler to prevent re-renders
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      ably.handleTyping(selectedSession.sessionId, userId, text);
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  // Send message
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      console.warn('Cannot send message');
      return;
    }

    try {
      await messages.sendCurrentMessage();
      console.log('✅ Message sent');
      
      setTimeout(() => {
        sessionsQuery.refetch();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, [selectedSession, messages, sessionsQuery]);

  // Send file
  const sendFile = useCallback(async (file, fileType) => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      console.warn('Cannot send file');
      return;
    }

    try {
      await messages.sendFile(file, fileType);
      console.log('✅ File sent');
      
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
  }, [selectedSession?.isTeamChat, messages.handleAIServiceSelection]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages.getSessionStatus]);

  // Check if can send message - return function that can be called
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages.canSendMessage]);

  // Check if can send message with text - return function that can be called
  const canSendMessageWithText = useCallback(() => {
    return messages.canSendMessageWithText(selectedSession);
  }, [selectedSession, messages.canSendMessageWithText]);

  // ✅ FIXED: Memoize typing status to prevent re-renders
  const getTypingStatus = useCallback(() => {
    const typingUsersList = Object.values(typingUsers).filter(user => user.isTyping);
    
    if (typingUsersList.length === 0) {
      return null;
    }
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].userName} is typing...`;
    }
    
    return `${typingUsersList.length} people are typing...`;
  }, [typingUsers]);

  // Handle booking
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Refresh sessions
  const refreshSessions = useCallback(async () => {
    try {
      await sessionsQuery.refetch();
      console.log('✅ Sessions refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh sessions:', error);
    }
  }, [sessionsQuery.refetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      ably.disconnect();
      setTypingUsers({});
    };
  }, []); // ✅ FIXED: Empty dependency array

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

  // ✅ FIXED: Memoize return object to prevent re-renders
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
    isUploadingFile: messages.isUploadingFile,
    
    // Connection status
    connectionStatus: ably.connectionStatus,
    isConnected: ably.isConnected,
    isAISession: ably.isAISession,
    isTyping: ably.isTyping,
    
    // NEW: Typing status for header
    typingStatus: getTypingStatus(),
    
    // Errors
    sessionsError: sessionsQuery.error,
    messagesError: messages.error,
    sendError: messages.error,
    
    // Actions  
    selectSession,
    sendCurrentMessage,
    sendFile,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendMessageWithText,
    canSendFile: (session) => messages.canSendFile(session || selectedSession),
    getSessionStatus,
    refetchSessions: refreshSessions,
    
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
    messages.isUploadingFile,
    messages.error,
    sessionsQuery.isLoading,
    sessionsQuery.error,
    ably.connectionStatus,
    ably.isConnected,
    ably.isAISession,
    ably.isTyping,
    getTypingStatus,
    selectSession,
    sendCurrentMessage,
    sendFile,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendMessageWithText,
    getSessionStatus,
    refreshSessions,
    getUserDisplayData,
    user?.role
  ]);
};