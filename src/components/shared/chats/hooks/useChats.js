// src/components/shared/chats/hooks/useChats.js - ENHANCED: With Debug Integration

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';

// 🆕 ENHANCED: Debug Logger for useChats with error handling
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
      // Fallback logging if anything goes wrong
      console.log('[CHATS]', level.toUpperCase(), message, data);
    }
  },

  // Safe error logging
  error: (message, error) => {
    try {
      console.error(`[CHATS] ERROR: ${message}`, error);
      // Expose error info for debugging
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
  const [typingUsers, setTypingUsers] = useState({}); // Track who's typing
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId, ably);

  // Memoize user ID to prevent re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Store user data for API access
  useEffect(() => {
    if (user && user.id) {
      ChatsLogger.log('debug', 'Storing user data', { userId: user.id, role: user.role });
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
        ChatsLogger.log('error', 'Authentication error, stopping retries', error);
        return false;
      }
      ChatsLogger.log('warn', `Retry attempt ${failureCount + 1}`, error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  // Memoize filtered sessions to prevent re-renders
  const filteredSessions = useMemo(() => {
    const sessions = (sessionsQuery.data || []).filter(session => {
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

    ChatsLogger.log('debug', 'Sessions filtered', {
      totalSessions: sessionsQuery.data?.length || 0,
      filteredCount: sessions.length,
      userRole: user?.role,
      userId
    });

    return sessions;
  }, [sessionsQuery.data, user?.role, userId]);

  // ✅ ENHANCED: Socket.io event handlers with debug logging and error handling
  const handleChatEnableDisable = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:enable-chat event received', payload);
      
      // Update selected session if it matches
      setSelectedSession(prev => {
        if (prev && payload.sessionId === prev.sessionId) {
          ChatsLogger.log('info', 'Updating selected session status', {
            sessionId: payload.sessionId,
            oldStatus: prev.status,
            newStatus: payload.status,
            isActive: payload.isActive,
            isChatEnabled: payload.isChatEnabled
          });
          
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
      ChatsLogger.log('info', 'Refetching sessions due to enable-chat event');
      sessionsQuery.refetch();
    } catch (error) {
      ChatsLogger.error('Failed to handle chat enable/disable event', error);
    }
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:initial-message event received', payload);
      
      // Refetch sessions to update last message and unread count in sidebar  
      ChatsLogger.log('info', 'Refetching sessions due to initial-message event');
      sessionsQuery.refetch();
      
      // If the message is for current session, refetch messages too
      if (selectedSession && payload.sessionId === selectedSession.sessionId) {
        ChatsLogger.log('info', 'Refetching messages for current session', {
          sessionId: selectedSession.sessionId
        });
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

  // ✅ ENHANCED: Setup Socket.io with debug logging
  useEffect(() => {
    ChatsLogger.log('info', 'Setting up Socket.io event listeners...');
    
    if (!notificationSocket.isSocketConnected()) {
      ChatsLogger.log('info', 'Connecting notification socket...');
      notificationSocket.connect().catch(err => {
        ChatsLogger.log('error', 'Failed to connect notification socket', err);
      });
    }

    // Remove existing listeners to prevent duplicates
    notificationSocket.off('chat:enable-chat');
    notificationSocket.off('chat:initial-message'); 
    notificationSocket.off('chat:invalidate');

    // Register event listeners
    notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
    notificationSocket.on('chat:initial-message', handleInitialMessage);
    notificationSocket.on('chat:invalidate', handleChatInvalidate);

    ChatsLogger.log('success', 'Socket.io event listeners registered');

    return () => {
      ChatsLogger.log('info', 'Cleaning up Socket.io event listeners...');
      notificationSocket.off('chat:enable-chat', handleChatEnableDisable);
      notificationSocket.off('chat:initial-message', handleInitialMessage);
      notificationSocket.off('chat:invalidate', handleChatInvalidate);
    };
  }, [handleChatEnableDisable, handleInitialMessage, handleChatInvalidate]);

  // Select session
  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session) {
      ChatsLogger.log('warn', 'Attempted to select null session');
      return;
    }
    
    ChatsLogger.log('info', 'Selecting session', {
      sessionName: session.name,
      sessionId: session.sessionId,
      isTeamChat: session.isTeamChat,
      shouldMarkAsRead
    });
    
    if (selectedSession?.sessionId === session.sessionId) {
      ChatsLogger.log('debug', 'Session already selected, skipping');
      return;
    }
    
    // Mark as read before selecting
    if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
      try {
        ChatsLogger.log('info', 'Marking session as read...', {
          sessionId: session.sessionId,
          unreadCount: session.unreadCount
        });
        
        await chatsApi.markAsRead(session.sessionId);
        
        session.hasUnread = false;
        session.unreadCount = 0;
        
        // Refetch after marking as read
        setTimeout(() => {
          sessionsQuery.refetch();
        }, 500);
        
        ChatsLogger.log('success', 'Session marked as read');
      } catch (error) {
        ChatsLogger.log('error', 'Failed to mark session as read', error);
      }
    }
    
    // Clear typing users when switching sessions
    setTypingUsers({});
    ChatsLogger.log('debug', 'Cleared typing users for session switch');
    
    // Disconnect previous session
    if (selectedSession?.sessionId !== session.sessionId) {
      ChatsLogger.log('debug', 'Disconnecting from previous session');
      ably.disconnect();
    }
    
    // Set selected session
    setSelectedSession(session);
    
    // Connect to Ably if needed
    if (userId && !session.isTeamChat && session.status !== 'completed') {
      ChatsLogger.log('info', 'Connecting to Ably for session', {
        sessionId: session.sessionId,
        status: session.status
      });
      await ably.connect(session.sessionId, userId);
    } else if (session.status === 'completed') {
      ChatsLogger.log('info', 'Session completed, skipping Ably connection');
      ably.disconnect();
    } else if (session.isTeamChat) {
      ChatsLogger.log('info', 'Team chat session, connecting to AI mode');
      await ably.connect(session.sessionId, userId);
    }
  }, [selectedSession?.sessionId, ably, userId, sessionsQuery]);

  // Auto-select Team RuangDiri
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        ChatsLogger.log('info', 'Auto-selecting team session');
        selectSession(teamSession, false);
      } else if (filteredSessions.length > 0) {
        ChatsLogger.log('info', 'Auto-selecting first available session');
        selectSession(filteredSessions[0], false);
      }
    }
  }, [filteredSessions, selectedSession, selectSession]);

  // ✅ ENHANCED: Message handling with debug logging and simplified extraction
  const handleAblyMessage = useCallback((messageData) => {
    ChatsLogger.log('event', 'Ably message received', {
      messageId: messageData.id,
      senderId: messageData.senderId,
      messageType: messageData.messageType,
      hasText: !!messageData.message,
      isOwnMessage: messageData.senderId === userId,
      senderName: messageData.senderFullname || messageData.senderName || 'Unknown'
    });
    
    // ✅ SIMPLIFIED: Extract and transform message data
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
    
    // ✅ SIMPLIFIED: Only add valid messages
    if (transformedMessage.text?.trim() || transformedMessage.attachmentUrl) {
      ChatsLogger.log('success', 'Adding valid realtime message', {
        messageId: transformedMessage.id,
        hasText: !!transformedMessage.text,
        hasAttachment: !!transformedMessage.attachmentUrl,
        senderName: transformedMessage.sender.name
      });
      
      messages.addMessage(transformedMessage);
      
      // Update performance monitor if available
      if (window.ablyDebug?.monitor) {
        window.ablyDebug.monitor.recordMessage(messageData);
      }
    } else {
      ChatsLogger.log('warn', 'Skipping empty message', messageData);
    }
  }, [userId, messages]);

  const handleAblySessionStatus = useCallback((statusData) => {
    ChatsLogger.log('event', 'Ably session status change', statusData);
    
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

  // ✅ ENHANCED: Typing handler with debug logging and proper name extraction
const handleAblyTyping = useCallback((typingData) => {
  ChatsLogger.log('event', 'Ably typing indicator received', {
    userId: typingData.userId,
    isTyping: typingData.isTyping,
    sessionId: typingData.sessionId,
    // Multiple possible name fields
    userName: typingData.userName,
    senderName: typingData.senderName, 
    senderFullName: typingData.senderFullName,
    senderFullname: typingData.senderFullname,
    fullName: typingData.fullName,
    name: typingData.name,
    // Debug: show all available fields
    availableFields: Object.keys(typingData).filter(key => 
      key.toLowerCase().includes('name') || key.toLowerCase().includes('user')
    )
  });
  
  const { userId: typingUserId, isTyping, sessionId } = typingData;
  
  // Only handle typing for current session and not from current user
  if (typingUserId !== userId && sessionId === selectedSession?.sessionId) {
    
    // 🔧 ENHANCED: Better name extraction with fallback priority
    const extractName = () => {
      // Priority order for name fields
      const nameFields = [
        typingData.senderFullName,     // Backend standard
        typingData.senderFullname,     // Alternative casing
        typingData.fullName,           // Short version
        typingData.userName,           // User specific
        typingData.senderName,         // Sender specific  
        typingData.name,               // Generic name
        // Extract from nested sender object
        typingData.sender?.fullName,
        typingData.sender?.name,
        // Try other possible structures
        typingData.user?.fullName,
        typingData.user?.name
      ];
      
      // Find first non-empty name
      for (const nameField of nameFields) {
        if (nameField && typeof nameField === 'string' && nameField.trim()) {
          return nameField.trim();
        }
      }
      
      // If we have userId, try to get name from current sessions
      if (typingUserId && filteredSessions) {
        const currentSession = filteredSessions.find(s => s.sessionId === sessionId);
        if (currentSession) {
          // For psychologist view - get client name
          if (user?.role === 'psychologist' && currentSession.clientId === typingUserId) {
            const clientName = currentSession.name;
            if (clientName && clientName !== 'Unknown') {
              return clientName;
            }
          }
          // For client view - get psychologist name  
          else if (user?.role !== 'psychologist' && currentSession.psychologistId === typingUserId) {
            const psychName = currentSession.name;
            if (psychName && psychName !== 'Unknown') {
              return psychName;
            }
          }
        }
      }
      
      // Try to extract from userId (last resort)
      if (typingUserId && typeof typingUserId === 'string') {
        // If userId has readable format, extract
        if (typingUserId.includes('-')) {
          const parts = typingUserId.split('-');
          return `User ${parts[parts.length - 1].slice(0, 8)}`;
        }
      }
      
      return 'Someone'; // Final fallback
    };
    
    const displayName = extractName();
    
    // 📝 Log extracted name for debugging
    ChatsLogger.log('info', `Typing from: "${displayName}" (${typingUserId})`, {
      originalData: typingData,
      extractedName: displayName,
      isTyping
    });
    
    setTypingUsers(prev => {
      if (isTyping) {
        ChatsLogger.log('info', `${displayName} started typing`);
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
        ChatsLogger.log('info', `${displayName} stopped typing`);
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
            ChatsLogger.log('debug', `Auto-clearing typing for ${displayName}`);
            delete newTypingUsers[typingUserId];
          }
          return newTypingUsers;
        });
      }, 5000);
    }
    
    // Update performance monitor
    if (window.ablyDebug?.monitor) {
      window.ablyDebug.monitor.recordTypingEvent();
    }
  }
}, [userId, selectedSession?.sessionId, filteredSessions, user?.role]);

// FIXED: Enhanced getTypingStatus function
const getTypingStatus = useCallback(() => {
  const typingUsersList = Object.values(typingUsers).filter(user => user.isTyping);
  
  if (typingUsersList.length === 0) {
    return null;
  }
  
  // 🔧 ENHANCED: Better status message with real names
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
  
  ChatsLogger.log('debug', 'Typing status updated', {
    typingUsersCount: typingUsersList.length,
    status,
    users: typingUsersList.map(u => ({ name: u.userName, id: u.userId }))
  });
  
  return status;
}, [typingUsers]);

// 🔧 ENHANCED: Debug helper for typing data
useEffect(() => {
  if (typeof window !== 'undefined') {
    window.debugTyping = {
      currentTypingUsers: typingUsers,
      typingStatus: getTypingStatus(),
      extractNameTest: (testData) => {
        console.log('🔍 Testing name extraction:', testData);
        // Test the name extraction logic
        const nameFields = [
          testData.senderFullName,
          testData.senderFullname, 
          testData.fullName,
          testData.userName,
          testData.senderName,
          testData.name,
          testData.sender?.fullName,
          testData.sender?.name,
          testData.user?.fullName,
          testData.user?.name
        ];
        
        for (const nameField of nameFields) {
          if (nameField && typeof nameField === 'string' && nameField.trim()) {
            console.log('✅ Found name:', nameField.trim());
            return nameField.trim();
          }
        }
        
        console.log('❌ No valid name found, using fallback');
        return 'Someone';
      },
      clearAllTyping: () => {
        setTypingUsers({});
        console.log('🧹 Cleared all typing users');
      }
    };
  }
}, [typingUsers, getTypingStatus]);
  // ✅ ENHANCED: Unread count handler with debug logging and error handling
  const handleAblyUnreadCount = useCallback((unreadData) => {
    try {
      ChatsLogger.log('event', 'Ably unread count update', unreadData);
      
      // Invalidate sessions query using queryClient
      ChatsLogger.log('info', 'Invalidating sessions due to unread count update');
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    } catch (error) {
      ChatsLogger.error('Failed to handle unread count update', error);
    }
  }, [queryClient]);

  // Setup Ably callbacks with memoized handlers
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ChatsLogger.log('info', 'Setting up Ably callbacks for session', {
      sessionId: selectedSession.sessionId,
      isTeamChat: selectedSession.isTeamChat
    });

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

  // ✅ ENHANCED: Send message with debug logging
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send message', {
        hasSession: !!selectedSession,
        canSend: messages.canSendMessage(selectedSession)
      });
      return;
    }

    try {
      ChatsLogger.log('info', 'Sending message...', {
        sessionId: selectedSession.sessionId,
        messageLength: messages.messageText?.length || 0
      });
      
      await messages.sendCurrentMessage();
      
      // Update performance monitor
      if (window.ablyDebug?.monitor) {
        window.ablyDebug.monitor.recordSentMessage();
      }
      
      ChatsLogger.log('success', 'Message sent successfully');
      
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send message', error);
      
      // Update performance monitor
      if (window.ablyDebug?.monitor) {
        window.ablyDebug.monitor.recordError(error);
      }
      
      throw error;
    }
  }, [selectedSession, messages]);

  // ✅ ENHANCED: Send file with debug logging
  const sendFile = useCallback(async (file, fileType) => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send file', {
        hasSession: !!selectedSession,
        canSendFile: messages.canSendFile(selectedSession)
      });
      return;
    }

    try {
      ChatsLogger.log('info', 'Sending file...', {
        sessionId: selectedSession.sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType
      });
      
      await messages.sendFile(file, fileType);
      ChatsLogger.log('success', 'File sent successfully');
      
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send file', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // Handle AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      ChatsLogger.log('info', 'Handling AI service selection', { option });
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



  // Handle booking
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    ChatsLogger.log('info', 'Opening booking page', { userType });
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Refresh sessions
  const refreshSessions = useCallback(async () => {
    try {
      ChatsLogger.log('info', 'Refreshing sessions...');
      await sessionsQuery.refetch();
      ChatsLogger.log('success', 'Sessions refreshed successfully');
    } catch (error) {
      ChatsLogger.log('error', 'Failed to refresh sessions', error);
    }
  }, [sessionsQuery.refetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      ChatsLogger.log('info', 'Cleaning up useChats...');
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

  // ✅ ENHANCED: Debug info with performance metrics
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
        },
        // Performance metrics
        metrics: window.ablyDebug?.monitor?.getSummary?.() || 'Not available',
        // Quick test methods
        testMessage: (message = 'Test from debugChat') => {
          if (selectedSession?.sessionId) {
            window.ablyDebug?.testMessage(selectedSession.sessionId, message);
          }
        },
        testTyping: (duration = 3000) => {
          if (selectedSession?.sessionId) {
            window.ablyDebug?.testTyping(selectedSession.sessionId, duration);
          }
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
    
    // Typing status for header and components
    typingStatus: getTypingStatus(),
    typingUsers, // ✅ NEW: Expose typing users data
    
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
    
    // Infinite scroll support
    loadMoreMessages: messages.loadMoreMessages,
    hasMoreMessages: messages.hasMore,
    
    // User data
    userDisplayData: getUserDisplayData(),
    
    // Flags
    isEmpty: (filteredSessions.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false,
    isPsychologist: user?.role === 'psychologist',
    
    // Debug utilities
    debug: {
      logger: ChatsLogger,
      ably: ably,
      performance: window.ablyDebug?.monitor?.getSummary?.() || null
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
    ably.connectionStatus,
    ably.isConnected,
    ably.isAISession,
    ably.isTyping,
    getTypingStatus,
    typingUsers, // ✅ NEW: Include in dependencies
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