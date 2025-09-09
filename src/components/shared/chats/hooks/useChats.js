// src/components/shared/chats/hooks/useChats.js - ENHANCED: Error Handling & Retry Integration

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';
import { toast } from 'sonner';

// Enhanced Debug Logger
const ChatsLogger = {
  log: (level, message, data = null) => {
    try {
      const timestamp = new Date().toLocaleTimeString('id-ID');
      const styles = {
        error: 'color: #FF6B6B; font-weight: bold;',
        warn: 'color: #FFB74D; font-weight: bold;',
        info: 'color: #4FC3F7; font-weight: bold;',
        success: 'color: #66BB6A; font-weight: bold;',
        debug: 'color: #9575CD; font-weight: bold;',
        retry: 'color: #FF9800; font-weight: bold;'
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
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [isRecoveringConnection, setIsRecoveringConnection] = useState(false);
  
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

  // Enhanced sessions query with better error handling
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
        
        // If network error, try to get cached data
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          const cachedData = queryClient.getQueryData(['chat-sessions']);
          if (cachedData) {
            ChatsLogger.log('info', 'Using cached sessions data during network error');
            return cachedData;
          }
        }
        
        // Fallback to basic chat histories
        return chatsApi.getChatHistories();
      }
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        ChatsLogger.log('error', 'Authentication error, not retrying');
        return false;
      }
      
      // Retry network errors up to 3 times
      if (failureCount < 3) {
        ChatsLogger.log('retry', `Retrying sessions fetch, attempt ${failureCount + 1}`);
        return true;
      }
      
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    onError: (error) => {
      ChatsLogger.error('Sessions query failed', error);
      
      // Show user-friendly error message
      if (error?.response?.status === 401) {
        toast.error('Session expired', {
          description: 'Please refresh the page to continue',
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload()
          }
        });
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network connection lost', {
          description: 'Check your internet connection',
          action: {
            label: 'Retry',
            onClick: () => sessionsQuery.refetch()
          }
        });
      }
    }
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

  // Enhanced Socket.io event handlers with error recovery
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

  // Enhanced Socket.io setup with connection recovery
  useEffect(() => {
    const setupSocket = async () => {
      try {
        if (!notificationSocket.isSocketConnected()) {
          ChatsLogger.log('info', 'Connecting notification socket...');
          await notificationSocket.connect();
        }

        // Remove existing listeners to prevent duplicates
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message'); 
        notificationSocket.off('chat:invalidate');

        // Register event listeners
        notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
        notificationSocket.on('chat:initial-message', handleInitialMessage);
        notificationSocket.on('chat:invalidate', handleChatInvalidate);
        
        ChatsLogger.log('success', 'Socket.io setup completed');
      } catch (error) {
        ChatsLogger.error('Failed to setup Socket.io', error);
        
        // Retry socket connection after delay
        setTimeout(() => {
          ChatsLogger.log('retry', 'Retrying Socket.io connection...');
          setupSocket();
        }, 5000);
      }
    };

    setupSocket();

    return () => {
      notificationSocket.off('chat:enable-chat', handleChatEnableDisable);
      notificationSocket.off('chat:initial-message', handleInitialMessage);
      notificationSocket.off('chat:invalidate', handleChatInvalidate);
    };
  }, [handleChatEnableDisable, handleInitialMessage, handleChatInvalidate]);

  // Enhanced session selection with connection recovery
  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session) {
      return;
    }
    
    if (selectedSession?.sessionId === session.sessionId) {
      return;
    }
    
    try {
      setIsRecoveringConnection(true);
      
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
        await ably.disconnect();
      }
      
      // Set selected session
      setSelectedSession(session);
      
      // Connect to Ably with retry logic
      if (userId && !session.isTeamChat && session.status !== 'completed') {
        ChatsLogger.log('info', 'Connecting to Ably for session', session.sessionId);
        
        const maxRetries = 3;
        let retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            const connected = await ably.connect(session.sessionId, userId);
            if (connected) {
              ChatsLogger.log('success', 'Successfully connected to Ably');
              setConnectionRetryCount(0);
              break;
            }
          } catch (error) {
            retryCount++;
            ChatsLogger.log('retry', `Ably connection attempt ${retryCount} failed`, error);
            
            if (retryCount >= maxRetries) {
              ChatsLogger.log('error', 'All Ably connection attempts failed');
              setConnectionRetryCount(retryCount);
              
              // Show retry option to user
              toast.error('Failed to connect to chat', {
                description: 'Connection to real-time chat failed',
                action: {
                  label: 'Retry',
                  onClick: () => selectSession(session, false)
                }
              });
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
      } else if (session.status === 'completed') {
        ably.disconnect();
      } else if (session.isTeamChat) {
        await ably.connect(session.sessionId, userId);
      }
    } catch (error) {
      ChatsLogger.error('Failed to select session', error);
      toast.error('Failed to switch chat', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => selectSession(session, false)
        }
      });
    } finally {
      setIsRecoveringConnection(false);
    }
  }, [selectedSession?.sessionId, ably, userId, sessionsQuery]);

  // Auto-select Team RuangDiri with error handling
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession && !isRecoveringConnection) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        selectSession(teamSession, false);
      } else if (filteredSessions.length > 0) {
        selectSession(filteredSessions[0], false);
      }
    }
  }, [filteredSessions, selectedSession, selectSession, isRecoveringConnection]);

  // Enhanced message handling with status tracking
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
      isSent: true, // Message received via Ably means it was sent successfully
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

  // Enhanced typing handler with better name extraction
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

  // Get typing status with enhanced formatting
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

  // Unread count handler with error handling
  const handleAblyUnreadCount = useCallback((unreadData) => {
    try {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    } catch (error) {
      ChatsLogger.error('Failed to handle unread count update', error);
    }
  }, [queryClient]);

  // Setup Ably callbacks with error monitoring
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    try {
      ably.setCallbacks({
        onMessage: handleAblyMessage,
        onSessionStatus: handleAblySessionStatus,
        onTyping: handleAblyTyping,
        onUnreadCount: handleAblyUnreadCount
      });
    } catch (error) {
      ChatsLogger.error('Failed to set Ably callbacks', error);
    }

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, handleAblyMessage, handleAblySessionStatus, handleAblyTyping, handleAblyUnreadCount]);

  // Enhanced typing handler
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      try {
        ably.handleTyping(selectedSession.sessionId, userId, text);
      } catch (error) {
        ChatsLogger.log('warn', 'Failed to send typing indicator', error);
      }
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  // Enhanced send message
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
      
      // Show user-friendly error
      toast.error('Failed to send message', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => sendCurrentMessage()
        }
      });
      
      throw error;
    }
  }, [selectedSession, messages]);

  // Enhanced file sending
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
      
      // Show user-friendly error
      toast.error('Failed to send file', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => sendFile(file, fileType, caption)
        }
      });
      
      throw error;
    }
  }, [selectedSession, messages]);

  // AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      try {
        await messages.handleAIServiceSelection(option);
      } catch (error) {
        ChatsLogger.error('Failed to handle AI service selection', error);
        toast.error('Failed to process selection', {
          description: error.message
        });
      }
    }
  }, [selectedSession?.isTeamChat, messages.handleAIServiceSelection]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages.getSessionStatus]);

  // Enhanced capability checks
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages.canSendMessage]);

  const canSendMessageWithText = useCallback(() => {
    return messages.canSendMessageWithText(selectedSession);
  }, [selectedSession, messages.canSendMessageWithText]);

  const canSendFile = useCallback((session) => {
    return messages.canSendFile(session || selectedSession);
  }, [selectedSession, messages.canSendFile]);

  // Handle booking
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Enhanced refresh with error recovery
  const refreshSessions = useCallback(async () => {
    try {
      ChatsLogger.log('info', 'Refreshing sessions...');
      await sessionsQuery.refetch();
      
      // Also refresh current session if needed
      if (selectedSession && messages.error) {
        await messages.refetch();
      }
      
      ChatsLogger.log('success', 'Sessions refreshed successfully');
    } catch (error) {
      ChatsLogger.log('error', 'Failed to refresh sessions', error);
      toast.error('Failed to refresh', {
        description: error.message,
        action: {
          label: 'Retry',
          onClick: () => refreshSessions()
        }
      });
    }
  }, [sessionsQuery.refetch, selectedSession, messages]);

  // Enhanced cleanup with error handling
  useEffect(() => {
    return () => {
      try {
        ably.disconnect();
        setTypingUsers({});
      } catch (error) {
        ChatsLogger.error('Error during cleanup', error);
      }
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

  // Return enhanced object with error states and recovery functions
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
    isRecoveringConnection,
    
    // Connection status with enhanced error information
    connectionStatus: ably.connectionStatus,
    isConnected: ably.isConnected,
    isAISession: ably.isAISession,
    isTyping: ably.isTyping,
    hasConnectionErrors: ably.hasErrors,
    connectionRetryCount,
    
    // Typing status
    typingStatus: getTypingStatus(),
    typingUsers,
    
    // Enhanced error states
    sessionsError: sessionsQuery.error,
    messagesError: messages.error,
    sendError: messages.error,
    hasErrors: !!(sessionsQuery.error || messages.error || ably.hasErrors),
    
    // Actions  
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
    refetchSessions: refreshSessions,
    
    // Enhanced recovery actions
    retryConnection: () => {
      if (selectedSession && userId) {
        return selectSession(selectedSession, false);
      }
    },
    forceRefresh: () => window.location.reload(),
    
    // Infinite scroll support
    loadMoreMessages: messages.loadMoreMessages,
    hasMoreMessages: messages.hasMore,
    
    // User data
    userDisplayData: getUserDisplayData(),
    
    // Enhanced flags
    isEmpty: (filteredSessions.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false,
    isPsychologist: user?.role === 'psychologist',
    
    // Debug utilities
    debug: {
      ably: ably.getConnectionInfo(),
      sessions: sessionsQuery,
      messages: messages,
      lastError: window.lastChatError
    }
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
    isRecoveringConnection,
    ably.connectionStatus,
    ably.isConnected,
    ably.isAISession,
    ably.isTyping,
    ably.hasErrors,
    connectionRetryCount,
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
    user?.role,
    userId
  ]);
};