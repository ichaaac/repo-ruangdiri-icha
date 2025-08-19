// src/components/shared/chats/hooks/useChats.js - FIXED: Socket Events & Message Status

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

  // Memoize user ID to prevent re-renders
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

  // Memoize filtered sessions to prevent re-renders
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

  // ✅ FIXED: Enhanced Socket.io event handlers
  const handleChatEnableDisable = useCallback((payload) => {
    console.log('🔄 Socket: chat:enable-chat event:', payload);
    
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
    
    // ✅ ALWAYS refetch sessions to update sidebar
    console.log('🔄 Refetching sessions due to enable-chat event');
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    console.log('📨 Socket: chat:initial-message event:', payload);
    
    // ✅ ALWAYS refetch sessions to update last message and unread count in sidebar  
    console.log('🔄 Refetching sessions due to initial-message event');
    sessionsQuery.refetch();
    
    // If the message is for current session, refetch messages too
    if (selectedSession && payload.sessionId === selectedSession.sessionId) {
      console.log('🔄 Refetching messages for current session');
      messages.refetch();
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  const handleChatInvalidate = useCallback((payload) => {
    console.log('🔄 Socket: chat:invalidate event:', payload);
    sessionsQuery.refetch();
    
    if (selectedSession && payload.sessionId === selectedSession.sessionId) {
      messages.refetch();
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  // ✅ ENHANCED: Setup Socket.io with proper event listening
  useEffect(() => {
    console.log('🔌 Setting up Socket.io event listeners...');
    
    if (!notificationSocket.isSocketConnected()) {
      console.log('📡 Connecting notification socket...');
      notificationSocket.connect().catch(err => {
        console.warn('⚠️ Failed to connect notification socket:', err);
      });
    }

    // ✅ Remove existing listeners to prevent duplicates
    notificationSocket.off('chat:enable-chat');
    notificationSocket.off('chat:initial-message'); 
    notificationSocket.off('chat:invalidate');

    // ✅ Register event listeners
    notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
    notificationSocket.on('chat:initial-message', handleInitialMessage);
    notificationSocket.on('chat:invalidate', handleChatInvalidate);

    console.log('✅ Socket.io event listeners registered');

    return () => {
      console.log('🔌 Cleaning up Socket.io event listeners...');
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
        
        // ✅ REDUCED: Only refetch after marking as read, not on every action
        setTimeout(() => {
          sessionsQuery.refetch();
        }, 500);
        
        console.log('✅ Session marked as read');
      } catch (error) {
        console.error('❌ Failed to mark as read:', error);
      }
    }
    
    // Clear typing users when switching sessions
    setTypingUsers({});
    
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

  // ✅ FIXED: Enhanced message transformation to handle sender data properly
  const handleAblyMessage = useCallback((messageData) => {
    console.log('📨 Ably: Real-time message received:', messageData);
    
    // ✅ ENHANCED: Better message transformation with proper sender handling
    const transformedMessage = {
      id: messageData.id || `realtime-${Date.now()}`,
      text: messageData.message || messageData.text || '',
      time: messageData.time || new Date().toLocaleTimeString("id-ID", {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }),
      createdAt: messageData.createdAt || new Date().toISOString(),
      isUser: messageData.senderId === userId,
      sender: {
        id: messageData.senderId || messageData.sender?.id || 'unknown',
        name: messageData.senderId === userId 
          ? 'You' 
          : (messageData.senderName || messageData.sender?.fullName || messageData.sender?.name || 'Unknown User'),
        role: messageData.senderRole || messageData.sender?.role || 'user',
        profilePicture: messageData.senderProfilePicture || messageData.sender?.profilePicture || null
      },
      messageType: messageData.messageType || 'text',
      isRead: messageData.isRead !== undefined ? messageData.isRead : false, // ✅ HANDLE isRead properly
      attachmentUrl: messageData.attachmentUrl || null,
      attachmentType: messageData.attachmentType || null,
      attachmentName: messageData.attachmentName || null,
      attachmentSize: messageData.attachmentSize || null
    };
    
    // ✅ FILTER: Only add non-empty messages with actual content
    if (transformedMessage.text?.trim() || transformedMessage.attachmentUrl) {
      console.log('✅ Adding valid realtime message:', transformedMessage);
      messages.addMessage(transformedMessage);
      
      // ✅ REMOVED: Don't refetch sessions here, let socket events handle it
      // setTimeout(() => { sessionsQuery.refetch(); }, 500);
    } else {
      console.warn('⚠️ Skipping empty message:', messageData);
    }
  }, [userId, messages]);

  const handleAblySessionStatus = useCallback((statusData) => {
    console.log('📊 Ably: Session status change:', statusData);
    
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
    
    // ✅ REMOVED: Don't refetch here, let socket events handle it
    // sessionsQuery.refetch();
  }, []);

  // ✅ ENHANCED: Typing handler with better user info and framer-motion support
  const handleAblyTyping = useCallback((typingData) => {
    console.log('⌨️ Ably: Typing indicator received:', typingData);
    
    const { userId: typingUserId, isTyping, sessionId, userName, senderName } = typingData;
    
    // Only handle typing for current session and not from current user
    if (typingUserId !== userId && sessionId === selectedSession?.sessionId) {
      const displayName = userName || senderName || 'Someone';
      
      setTypingUsers(prev => {
        if (isTyping) {
          console.log(`✅ ${displayName} started typing`);
          return {
            ...prev,
            [typingUserId]: {
              isTyping: true,
              timestamp: Date.now(),
              userName: displayName
            }
          };
        } else {
          console.log(`✅ ${displayName} stopped typing`);
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
            if (newTypingUsers[typingUserId]) {
              console.log(`⏰ Auto-clearing typing for ${displayName}`);
              delete newTypingUsers[typingUserId];
            }
            return newTypingUsers;
          });
        }, 5000);
      }
    }
  }, [userId, selectedSession?.sessionId]);

  // ✅ ENHANCED: Unread count handler with proper invalidation
  const handleAblyUnreadCount = useCallback((unreadData) => {
    console.log('🔢 Ably: Unread count update:', unreadData);
    
    // ✅ ONLY invalidate, don't refetch immediately
    console.log('🔄 Invalidating sessions due to unread count update');
    sessionsQuery.invalidateQueries();
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

  // Memoize typing handler to prevent re-renders
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      ably.handleTyping(selectedSession.sessionId, userId, text);
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  // ✅ FIXED: Send message without refetching - let socket events handle updates
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      console.warn('Cannot send message');
      return;
    }

    try {
      await messages.sendCurrentMessage();
      console.log('✅ Message sent successfully');
      
      // ✅ REMOVED: Don't refetch here, socket events will handle updates
      // setTimeout(() => { sessionsQuery.refetch(); }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // ✅ FIXED: Send file without refetching - let socket events handle updates
  const sendFile = useCallback(async (file, fileType) => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      console.warn('Cannot send file');
      return;
    }

    try {
      await messages.sendFile(file, fileType);
      console.log('✅ File sent successfully');
      
      // ✅ REMOVED: Don't refetch here, socket events will handle updates
      // setTimeout(() => { sessionsQuery.refetch(); }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to send file:', error);
      throw error;
    }
  }, [selectedSession, messages]);

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

  // ✅ ENHANCED: Typing status with framer-motion support
  const getTypingStatus = useCallback(() => {
    const typingUsersList = Object.values(typingUsers).filter(user => user.isTyping);
    
    if (typingUsersList.length === 0) {
      return null;
    }
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].userName} sedang mengetik...`;
    }
    
    return `${typingUsersList.length} orang sedang mengetik...`;
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
  }, []); // Empty dependency array

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

  // ✅ DEBUG: Enhanced debug info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.selectedSession = selectedSession;
      window.debugChat = {
        selectedSession,
        messageText: messages.messageText,
        canSendMessage: canSendMessage(),
        canSendMessageWithText: canSendMessageWithText(),
        connectionStatus: ably.connectionStatus,
        sessionsCount: filteredSessions.length,
        typingUsers,
        typingStatus: getTypingStatus(),
        socketConnected: notificationSocket.isSocketConnected(),
        ablyCallbacks: {
          hasMessageCallback: !!ably.onMessageRef?.current,
          hasTypingCallback: !!ably.onTypingRef?.current
        }
      };
    }
  }, [selectedSession, messages.messageText, canSendMessage, canSendMessageWithText, ably.connectionStatus, filteredSessions.length, typingUsers, getTypingStatus]);

  // Memoize return object to prevent re-renders
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
    
    // Typing status for header
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
    
    // ✅ NEW: Infinite scroll support
    loadMoreMessages: messages.loadMoreMessages,
    hasMoreMessages: messages.hasMore,
    
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
    messages.loadMoreMessages,
    messages.hasMore,
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