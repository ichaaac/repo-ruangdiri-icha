// src/components/shared/chats/hooks/useChats.js - UPDATED: Clean & File Upload Support

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';

// Debug Logger
const ChatsLogger = {
  log: (level, message, data = null) => {
    try {
      const timestamp = new Date().toLocaleTimeString('id-ID');
      const styles = {
        error: 'color: #FF6B6B; font-weight: bold;',
        warn: 'color: #FFB74D; font-weight: bold;',
        info: 'color: #4FC3F7; font-weight: bold;',
        success: 'color: #66BB6A; font-weight: bold;',
        debug: 'color: #9575CD; font-weight: bold;'
      };

      console.log(
        `%c[${timestamp}] CHATS:`,
        styles[level] || styles.info,
        message,
        data ? '\n📦 Data:' : '',
        data || ''
      );
    } catch (error) {
      console.log('[CHATS]', level.toUpperCase(), message, data);
    }
  },

  error: (message, error) => {
    try {
      console.error(`[CHATS] ERROR: ${message}`, error);
      if (typeof window !== 'undefined') {
        window.lastChatError = { message, error, timestamp: new Date().toISOString() };
      }
    } catch (e) {
      console.error('[CHATS] CRITICAL:', message, error);
    }
  }
};

export const useChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId, ably);

  // Memoize user ID
  const userId = useMemo(() => user?.id, [user?.id]);

  // Store user data for API access
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Get sessions query
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      ChatsLogger.log('info', 'Fetching chat sessions...');
      
      try {
        const [histories, activeSessions] = await Promise.all([
          chatsApi.getChatHistories(),
          chatsApi.getActiveSessions()
        ]);
        
        ChatsLogger.log('success', 'Sessions fetched successfully', {
          historiesCount: histories?.length || 0,
          activeSessionsCount: activeSessions?.length || 0
        });
        
        return histories;
        
      } catch (error) {
        ChatsLogger.log('error', 'Error fetching sessions', error);
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

  // Memoize filtered sessions
  const filteredSessions = useMemo(() => {
    const sessions = (sessionsQuery.data || []).filter(session => {
      const userRole = user?.role;
      
      if (userRole === 'psychologist') {
        return true;
      } else {
        const isTeamChat = session.isTeamChat;
        const isMyClientSession = session.clientId === userId;
        const isMyPsychologistSession = session.psychologistId === userId;
        
        return isTeamChat || isMyClientSession || isMyPsychologistSession;
      }
    });

    return sessions;
  }, [sessionsQuery.data, user?.role, userId]);

  // Socket.io event handlers
  const handleChatEnableDisable = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:enable-chat event received', payload);
      
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
      
      sessionsQuery.refetch();
    } catch (error) {
      ChatsLogger.error('Failed to handle chat enable/disable event', error);
    }
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:initial-message event received', payload);
      sessionsQuery.refetch();
      
      if (selectedSession && payload.sessionId === selectedSession.sessionId) {
        messages.refetch();
      }
    } catch (error) {
      ChatsLogger.error('Failed to handle initial message event', error);
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  const handleChatInvalidate = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:invalidate event received', payload);
      sessionsQuery.refetch();
      
      if (selectedSession && payload.sessionId === selectedSession.sessionId) {
        messages.refetch();
      }
    } catch (error) {
      ChatsLogger.error('Failed to handle chat invalidate event', error);
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  // Setup Socket.io
  useEffect(() => {
    if (!notificationSocket.isSocketConnected()) {
      notificationSocket.connect().catch(err => {
        ChatsLogger.log('error', 'Failed to connect notification socket', err);
      });
    }

    // Remove existing listeners
    notificationSocket.off('chat:enable-chat');
    notificationSocket.off('chat:initial-message'); 
    notificationSocket.off('chat:invalidate');

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
    if (!session) {
      return;
    }
    
    if (selectedSession?.sessionId === session.sessionId) {
      return;
    }
    
    // Mark as read before selecting
    if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
      try {
        await chatsApi.markAsRead(session.sessionId);
        session.hasUnread = false;
        session.unreadCount = 0;
        
        setTimeout(() => {
          sessionsQuery.refetch();
        }, 500);
      } catch (error) {
        ChatsLogger.log('error', 'Failed to mark session as read', error);
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
      await ably.connect(session.sessionId, userId);
    } else if (session.status === 'completed') {
      ably.disconnect();
    } else if (session.isTeamChat) {
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

  // Message handling
  const handleAblyMessage = useCallback((messageData) => {
    const transformedMessage = {
      id: messageData.id || `realtime-${Date.now()}`,
      text: messageData.message || messageData.text || messageData.content || '',
      time: messageData.time || new Date().toLocaleTimeString("id-ID", {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }),
      createdAt: messageData.createdAt || new Date().toISOString(),
      isUser: messageData.senderId === userId,
      sender: {
        id: messageData.senderId || 'unknown',
        name: messageData.senderId === userId 
          ? 'You' 
          : (messageData.senderFullname || messageData.senderName || messageData.sender?.fullName || 'Unknown User'),
        role: messageData.senderRole || messageData.sender?.role || 'user',
        profilePicture: messageData.senderProfilePicture || messageData.sender?.profilePicture || null
      },
      messageType: messageData.messageType || 'text',
      isRead: messageData.isRead === true,
      attachmentUrl: messageData.attachmentUrl || null,
      attachmentType: messageData.attachmentType || null,
      attachmentName: messageData.attachmentName || null,
      attachmentSize: messageData.attachmentSize || null
    };
    
    if (transformedMessage.text?.trim() || transformedMessage.attachmentUrl) {
      messages.addMessage(transformedMessage);
    }
  }, [userId, messages]);

  const handleAblySessionStatus = useCallback((statusData) => {
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
  }, []);

  // Typing handler with proper name extraction
  const handleAblyTyping = useCallback((typingData) => {
    const { userId: typingUserId, isTyping, sessionId } = typingData;
    
    if (typingUserId !== userId && sessionId === selectedSession?.sessionId) {
      const extractName = () => {
        const nameFields = [
          typingData.senderFullName,
          typingData.senderFullname,
          typingData.fullName,
          typingData.userName,
          typingData.senderName,
          typingData.name,
          typingData.sender?.fullName,
          typingData.sender?.name,
          typingData.user?.fullName,
          typingData.user?.name
        ];
        
        for (const nameField of nameFields) {
          if (nameField && typeof nameField === 'string' && nameField.trim()) {
            return nameField.trim();
          }
        }
        
        if (typingUserId && filteredSessions) {
          const currentSession = filteredSessions.find(s => s.sessionId === sessionId);
          if (currentSession) {
            if (user?.role === 'psychologist' && currentSession.clientId === typingUserId) {
              const clientName = currentSession.name;
              if (clientName && clientName !== 'Unknown') {
                return clientName;
              }
            } else if (user?.role !== 'psychologist' && currentSession.psychologistId === typingUserId) {
              const psychName = currentSession.name;
              if (psychName && psychName !== 'Unknown') {
                return psychName;
              }
            }
          }
        }
        
        return 'Someone';
      };
      
      const displayName = extractName();
      
      setTypingUsers(prev => {
        if (isTyping) {
          return {
            ...prev,
            [typingUserId]: {
              isTyping: true,
              timestamp: Date.now(),
              userName: displayName,
              userId: typingUserId,
              sessionId: sessionId
            }
          };
        } else {
          const newTypingUsers = { ...prev };
          delete newTypingUsers[typingUserId];
          return newTypingUsers;
        }
      });
      
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newTypingUsers = { ...prev };
            if (newTypingUsers[typingUserId]) {
              delete newTypingUsers[typingUserId];
            }
            return newTypingUsers;
          });
        }, 5000);
      }
    }
  }, [userId, selectedSession?.sessionId, filteredSessions, user?.role]);

  // Get typing status
  const getTypingStatus = useCallback(() => {
    const typingUsersList = Object.values(typingUsers).filter(user => user.isTyping);
    
    if (typingUsersList.length === 0) {
      return null;
    }
    
    let status;
    if (typingUsersList.length === 1) {
      const typingUser = typingUsersList[0];
      status = `${typingUser.userName} sedang mengetik...`;
    } else if (typingUsersList.length === 2) {
      const names = typingUsersList.map(u => u.userName).join(' dan ');
      status = `${names} sedang mengetik...`;
    } else {
      const firstName = typingUsersList[0].userName;
      const count = typingUsersList.length - 1;
      status = `${firstName} dan ${count} lainnya sedang mengetik...`;
    }
    
    return status;
  }, [typingUsers]);

  // Unread count handler
  const handleAblyUnreadCount = useCallback((unreadData) => {
    try {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    } catch (error) {
      ChatsLogger.error('Failed to handle unread count update', error);
    }
  }, [queryClient]);

  // Setup Ably callbacks
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ably.setCallbacks({
      onMessage: handleAblyMessage,
      onSessionStatus: handleAblySessionStatus,
      onTyping: handleAblyTyping,
      onUnreadCount: handleAblyUnreadCount
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, handleAblyMessage, handleAblySessionStatus, handleAblyTyping, handleAblyUnreadCount]);

  // UPDATED: Typing handler - simplified
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      ably.handleTyping(selectedSession.sessionId, userId, text);
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  // UPDATED: Send message - simplified
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send message');
      return;
    }

    try {
      await messages.sendCurrentMessage();
      ChatsLogger.log('success', 'Message sent successfully');
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send message', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // UPDATED: Send file - proper integration with useMessages
  const sendFile = useCallback(async (file, fileType = null, caption = '') => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send file');
      return;
    }

    try {
      ChatsLogger.log('info', 'Sending file...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: fileType || 'auto-detect',
        hasCaption: !!caption
      });
      
      await messages.sendFile(file, fileType, caption);
      ChatsLogger.log('success', 'File sent successfully');
      
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send file', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      await messages.handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, messages.handleAIServiceSelection]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages.getSessionStatus]);

  // Can send message functions - return functions that can be called
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages.canSendMessage]);

  const canSendMessageWithText = useCallback(() => {
    return messages.canSendMessageWithText(selectedSession);
  }, [selectedSession, messages.canSendMessageWithText]);

  // UPDATED: Can send file function
  const canSendFile = useCallback((session) => {
    return messages.canSendFile(session || selectedSession);
  }, [selectedSession, messages.canSendFile]);

  // Handle booking
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Refresh sessions
  const refreshSessions = useCallback(async () => {
    try {
      await sessionsQuery.refetch();
    } catch (error) {
      ChatsLogger.log('error', 'Failed to refresh sessions', error);
    }
  }, [sessionsQuery.refetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      ably.disconnect();
      setTypingUsers({});
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

  // Return object - cleaned and organized
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
    isUploadingFile: messages.isUploadingFile, // UPDATED: File upload status
    
    // Connection status
    connectionStatus: ably.connectionStatus,
    isConnected: ably.isConnected,
    isAISession: ably.isAISession,
    isTyping: ably.isTyping,
    
    // Typing status
    typingStatus: getTypingStatus(),
    typingUsers,
    
    // Errors
    sessionsError: sessionsQuery.error,
    messagesError: messages.error,
    sendError: messages.error,
    
    // Actions  
    selectSession,
    sendCurrentMessage,
    sendFile, // UPDATED: File upload support
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendMessageWithText,
    canSendFile, // UPDATED: File sending capability
    getSessionStatus,
    refetchSessions: refreshSessions,
    
    // Infinite scroll support
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
    typingUsers,
    selectSession,
    sendCurrentMessage,
    sendFile,
    handleTyping,
    handleAIServiceSelection,
    handleBookingClick,
    canSendMessage,
    canSendMessageWithText,
    canSendFile,
    getSessionStatus,
    refreshSessions,
    getUserDisplayData,
    user?.role
  ]);
};