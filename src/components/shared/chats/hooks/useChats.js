// src/components/shared/chats/hooks/useChats.js - E2E ENHANCED: With Complete E2E Flow Integration

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';
import e2eEncryption from '../lib/encryption';

// E2E Enhanced Debug Logger
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
        e2e: 'color: #FF9800; font-weight: bold;' // E2E specific logs
      };

      console.log(
        `%c[${timestamp}] CHATS-E2E:`,
        styles[level] || styles.info,
        message,
        data ? '\n🔐 E2E Data:' : '',
        data || ''
      );
    } catch (error) {
      console.log('[CHATS-E2E]', level.toUpperCase(), message, data);
    }
  },

  error: (message, error) => {
    try {
      console.error(`[CHATS-E2E] ERROR: ${message}`, error);
      if (typeof window !== 'undefined') {
        window.lastChatE2EError = { message, error, timestamp: new Date().toISOString() };
      }
    } catch (e) {
      console.error('[CHATS-E2E] CRITICAL:', message, error);
    }
  }
};

export const useChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [e2eFlowStatus, setE2eFlowStatus] = useState({}); // Track E2E setup status per session
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId, ably);

  // Memoize user ID to prevent re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  // Store user data for API access
  useEffect(() => {
    if (user && user.id) {
      ChatsLogger.log('debug', 'Storing user data with E2E support', { userId: user.id, role: user.role });
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // ===================================
  // E2E FLOW MANAGEMENT FUNCTIONS
  // ===================================

  /**
   * Handle automated message trigger (10 minutes before session)
   */
  const handleAutomatedE2ESetup = useCallback(async (sessionId, participants) => {
    try {
      ChatsLogger.log('e2e', 'Starting automated E2E setup', { 
        sessionId: sessionId?.slice(-8),
        participantsCount: participants.length 
      });

      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'setting_up', step: 'automated_trigger' }
      }));

      // Step 1: Setup E2E session
      await chatsApi.setupE2ESession(sessionId, participants);
      
      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'setting_up', step: 'session_setup_complete' }
      }));

      // Step 2: Initiate handshake (both user and psychologist can initiate)
      const publicKey = e2eEncryption.getAccountPublicKey();
      if (publicKey) {
        await chatsApi.initiateHandshake(sessionId, publicKey);
        
        setE2eFlowStatus(prev => ({
          ...prev,
          [sessionId]: { status: 'setting_up', step: 'handshake_initiated' }
        }));
      }

      // Step 3: Generate session key and prepare for chat
      const sessionKey = e2eEncryption.generateSessionKey(sessionId);
      
      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'ready', step: 'ready_for_chat', sessionKey }
      }));

      ChatsLogger.log('success', 'Automated E2E setup completed', { 
        sessionId: sessionId?.slice(-8),
        hasSessionKey: !!sessionKey
      });

      return { sessionKey, status: 'ready' };
    } catch (error) {
      ChatsLogger.error('Automated E2E setup failed', error);
      
      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'failed', error: error.message }
      }));
      
      throw error;
    }
  }, []);

  /**
   * Complete handshake (after 15 minutes or session end)
   */
  const completeE2EHandshake = useCallback(async (sessionId, participants) => {
    try {
      ChatsLogger.log('e2e', 'Completing E2E handshake', { 
        sessionId: sessionId?.slice(-8) 
      });

      const sharedSecret = e2eEncryption.generateSharedSecret(sessionId, participants);
      await chatsApi.completeHandshake(sessionId, sharedSecret, participants);

      // Clear session key after handshake completion
      e2eEncryption.clearSessionKey(sessionId);
      
      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'completed', step: 'handshake_completed' }
      }));

      ChatsLogger.log('success', 'E2E handshake completed and session key cleared', { 
        sessionId: sessionId?.slice(-8) 
      });

      return true;
    } catch (error) {
      ChatsLogger.error('E2E handshake completion failed', error);
      throw error;
    }
  }, []);

  /**
   * Handle key rotation for returning participants
   */
  const handleE2EKeyRotation = useCallback(async (sessionId) => {
    try {
      ChatsLogger.log('e2e', 'Handling E2E key rotation', { 
        sessionId: sessionId?.slice(-8) 
      });

      // Rotate session key for continued conversation
      const newSessionKey = e2eEncryption.rotateSessionKey(sessionId);
      
      setE2eFlowStatus(prev => ({
        ...prev,
        [sessionId]: { status: 'rotated', step: 'key_rotated', sessionKey: newSessionKey }
      }));

      ChatsLogger.log('success', 'E2E key rotation completed', { 
        sessionId: sessionId?.slice(-8) 
      });

      return newSessionKey;
    } catch (error) {
      ChatsLogger.error('E2E key rotation failed', error);
      throw error;
    }
  }, []);

  /**
   * Setup E2E for new chat session
   */
  const initializeE2EForSession = useCallback(async (sessionData) => {
    if (!sessionData || sessionData.isTeamChat) {
      return; // Skip E2E for team chat
    }

    try {
      const sessionId = sessionData.sessionId;
      const participants = [sessionData.clientId, sessionData.psychologistId].filter(Boolean);

      ChatsLogger.log('e2e', 'Initializing E2E for session', {
        sessionId: sessionId?.slice(-8),
        isE2EEnabled: sessionData.isE2EEnabled,
        participantsCount: participants.length
      });

      // Check if E2E is already setup for this session
      const currentStatus = e2eFlowStatus[sessionId];
      if (currentStatus?.status === 'ready' || currentStatus?.status === 'completed') {
        ChatsLogger.log('debug', 'E2E already setup for session', { sessionId: sessionId?.slice(-8) });
        return;
      }

      // Check if we have existing session key (key rotation scenario)
      if (e2eEncryption.getSessionKey(sessionId)) {
        await handleE2EKeyRotation(sessionId);
        return;
      }

      // Initialize E2E flow
      await handleAutomatedE2ESetup(sessionId, participants);

    } catch (error) {
      ChatsLogger.error('E2E initialization failed for session', error);
    }
  }, [e2eFlowStatus, handleAutomatedE2ESetup, handleE2EKeyRotation]);

  // ===================================
  // SESSION QUERIES & MANAGEMENT
  // ===================================

  // Get sessions query with E2E support
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      ChatsLogger.log('info', 'Fetching E2E chat sessions...');
      
      try {
        const [histories, activeSessions] = await Promise.all([
          chatsApi.getChatHistories(),
          chatsApi.getActiveSessions()
        ]);
        
        ChatsLogger.log('success', 'E2E sessions fetched successfully', {
          historiesCount: histories?.length || 0,
          activeSessionsCount: activeSessions?.length || 0
        });
        
        return histories;
        
      } catch (error) {
        ChatsLogger.log('error', 'Error fetching E2E sessions', error);
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

  // Memoize filtered sessions with E2E support
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

    ChatsLogger.log('debug', 'E2E sessions filtered', {
      totalSessions: sessionsQuery.data?.length || 0,
      filteredCount: sessions.length,
      userRole: user?.role,
      userId
    });

    return sessions;
  }, [sessionsQuery.data, user?.role, userId]);

  // ===================================
  // SOCKET EVENT HANDLERS
  // ===================================

  const handleChatEnableDisable = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:enable-chat event received', payload);
      
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
      
      sessionsQuery.refetch();
    } catch (error) {
      ChatsLogger.error('Failed to handle chat enable/disable event', error);
    }
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    try {
      ChatsLogger.log('event', 'Socket: chat:initial-message event received', payload);
      
      // Check if this is the automated message for E2E setup
      if (payload.messageType === 'automated' || payload.isAutomated) {
        ChatsLogger.log('e2e', 'Automated message received, triggering E2E setup', {
          sessionId: payload.sessionId?.slice(-8)
        });
        
        // Trigger E2E setup for this session
        const sessionData = filteredSessions.find(s => s.sessionId === payload.sessionId);
        if (sessionData) {
          initializeE2EForSession(sessionData);
        }
      }
      
      sessionsQuery.refetch();
      
      if (selectedSession && payload.sessionId === selectedSession.sessionId) {
        messages.refetch();
      }
    } catch (error) {
      ChatsLogger.error('Failed to handle initial message event', error);
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages, filteredSessions, initializeE2EForSession]);

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

  // Setup Socket.io with E2E event handling
  useEffect(() => {
    ChatsLogger.log('info', 'Setting up Socket.io event listeners with E2E support...');
    
    if (!notificationSocket.isSocketConnected()) {
      ChatsLogger.log('info', 'Connecting notification socket...');
      notificationSocket.connect().catch(err => {
        ChatsLogger.log('error', 'Failed to connect notification socket', err);
      });
    }

    notificationSocket.off('chat:enable-chat');
    notificationSocket.off('chat:initial-message'); 
    notificationSocket.off('chat:invalidate');

    notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
    notificationSocket.on('chat:initial-message', handleInitialMessage);
    notificationSocket.on('chat:invalidate', handleChatInvalidate);

    ChatsLogger.log('success', 'Socket.io event listeners registered with E2E support');

    return () => {
      ChatsLogger.log('info', 'Cleaning up Socket.io event listeners...');
      notificationSocket.off('chat:enable-chat', handleChatEnableDisable);
      notificationSocket.off('chat:initial-message', handleInitialMessage);
      notificationSocket.off('chat:invalidate', handleChatInvalidate);
    };
  }, [handleChatEnableDisable, handleInitialMessage, handleChatInvalidate]);

  // ===================================
  // SESSION SELECTION & E2E INITIALIZATION
  // ===================================

  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session) {
      ChatsLogger.log('warn', 'Attempted to select null session');
      return;
    }
    
    ChatsLogger.log('info', 'Selecting E2E session', {
      sessionName: session.name,
      sessionId: session.sessionId,
      isTeamChat: session.isTeamChat,
      isE2EEnabled: session.isE2EEnabled,
      shouldMarkAsRead
    });
    
    if (selectedSession?.sessionId === session.sessionId) {
      ChatsLogger.log('debug', 'Session already selected, skipping');
      return;
    }
    
    // Mark as read before selecting
    if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
      try {
        await chatsApi.markAsRead(session.sessionId);
        session.hasUnread = false;
        session.unreadCount = 0;
        setTimeout(() => sessionsQuery.refetch(), 500);
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
    
    // Initialize E2E for the session
    if (!session.isTeamChat && session.isE2EEnabled !== false) {
      await initializeE2EForSession(session);
    }
    
    // Connect to Ably
    if (userId && !session.isTeamChat && session.status !== 'completed') {
      ChatsLogger.log('info', 'Connecting to Ably for E2E session', {
        sessionId: session.sessionId,
        status: session.status,
        isE2EEnabled: session.isE2EEnabled
      });
      await ably.connect(session.sessionId, userId);
    } else if (session.status === 'completed') {
      ably.disconnect();
    } else if (session.isTeamChat) {
      await ably.connect(session.sessionId, userId);
    }
  }, [selectedSession?.sessionId, ably, userId, sessionsQuery, initializeE2EForSession]);

  // Auto-select Team RuangDiri
  useEffect(() => {
    if (filteredSessions.length > 0 && !selectedSession) {
      const teamSession = filteredSessions.find(s => s.isTeamChat);
      if (teamSession) {
        ChatsLogger.log('info', 'Auto-selecting team session');
        selectSession(teamSession, false);
      } else if (filteredSessions.length > 0) {
        ChatsLogger.log('info', 'Auto-selecting first available E2E session');
        selectSession(filteredSessions[0], false);
      }
    }
  }, [filteredSessions, selectedSession, selectSession]);

  // ===================================
  // ABLY MESSAGE HANDLING WITH E2E
  // ===================================

  const handleAblyMessage = useCallback((messageData) => {
    ChatsLogger.log('event', 'Ably E2E message received', {
      messageId: messageData.id,
      senderId: messageData.senderId,
      messageType: messageData.messageType,
      hasText: !!messageData.message,
      isOwnMessage: messageData.senderId === userId,
      isEncrypted: !!messageData.isEncrypted
    });
    
    // Transform and decrypt E2E message
    let decryptedContent = messageData.message || messageData.text || messageData.content || '';
    
    // Decrypt if encrypted and we have session key
    if (messageData.isEncrypted && selectedSession?.sessionId) {
      try {
        decryptedContent = e2eEncryption.decryptMessage(decryptedContent, selectedSession.sessionId);
        ChatsLogger.log('success', 'E2E message decrypted', {
          messageId: messageData.id,
          originalLength: messageData.message?.length,
          decryptedLength: decryptedContent?.length
        });
      } catch (error) {
        ChatsLogger.log('warn', 'Failed to decrypt E2E message', error);
      }
    }
    
    const transformedMessage = {
      id: messageData.id || `realtime-${Date.now()}`,
      text: decryptedContent,
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
      attachmentSize: messageData.attachmentSize || null,
      isEncrypted: !!messageData.isEncrypted
    };
    
    if (transformedMessage.text?.trim() || transformedMessage.attachmentUrl) {
      ChatsLogger.log('success', 'Adding valid E2E realtime message', {
        messageId: transformedMessage.id,
        hasText: !!transformedMessage.text,
        hasAttachment: !!transformedMessage.attachmentUrl,
        wasEncrypted: !!messageData.isEncrypted
      });
      
      messages.addMessage(transformedMessage);
    } else {
      ChatsLogger.log('warn', 'Skipping empty E2E message', messageData);
    }
  }, [userId, messages, selectedSession?.sessionId]);

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

  const handleAblyTyping = useCallback((typingData) => {
    ChatsLogger.log('event', 'Ably typing indicator received', {
      userId: typingData.userId,
      isTyping: typingData.isTyping,
      sessionId: typingData.sessionId
    });
    
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
            }
            else if (user?.role !== 'psychologist' && currentSession.psychologistId === typingUserId) {
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

  const handleAblyUnreadCount = useCallback((unreadData) => {
    try {
      ChatsLogger.log('event', 'Ably unread count update', unreadData);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    } catch (error) {
      ChatsLogger.error('Failed to handle unread count update', error);
    }
  }, [queryClient]);

  // Setup Ably callbacks with E2E support
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ChatsLogger.log('info', 'Setting up Ably callbacks for E2E session', {
      sessionId: selectedSession.sessionId,
      isTeamChat: selectedSession.isTeamChat,
      isE2EEnabled: selectedSession.isE2EEnabled
    });

    ably.setCallbacks({
      onMessage: handleAblyMessage,
      onSessionStatus: handleAblySessionStatus,
      onTyping: handleAblyTyping,
      onUnreadCount: handleAblyUnreadCount
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, handleAblyMessage, handleAblySessionStatus, handleAblyTyping, handleAblyUnreadCount]);

  // ===================================
  // MESSAGE HANDLING WITH E2E
  // ===================================

  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      ably.handleTyping(selectedSession.sessionId, userId, text);
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send E2E message', {
        hasSession: !!selectedSession,
        canSend: messages.canSendMessage(selectedSession)
      });
      return;
    }

    try {
      ChatsLogger.log('info', 'Sending E2E message...', {
        sessionId: selectedSession.sessionId,
        messageLength: messages.messageText?.length || 0,
        hasSessionKey: !!e2eEncryption.getSessionKey(selectedSession.sessionId)
      });
      
      await messages.sendCurrentMessage();
      ChatsLogger.log('success', 'E2E message sent successfully');
      
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send E2E message', error);
      throw error;
    }
  }, [selectedSession, messages]);

  const sendFile = useCallback(async (file, fileType) => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      ChatsLogger.log('warn', 'Cannot send E2E file', {
        hasSession: !!selectedSession,
        canSendFile: messages.canSendFile(selectedSession)
      });
      return;
    }

    try {
      ChatsLogger.log('info', 'Sending E2E file...', {
        sessionId: selectedSession.sessionId,
        fileName: file.name,
        fileSize: file.size,
        fileType
      });
      
      await messages.sendFile(file, fileType);
      ChatsLogger.log('success', 'E2E file sent successfully');
      
    } catch (error) {
      ChatsLogger.log('error', 'Failed to send E2E file', error);
      throw error;
    }
  }, [selectedSession, messages]);

  // Handle AI service selection (unchanged)
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      ChatsLogger.log('info', 'Handling AI service selection', { option });
      await messages.handleAIServiceSelection(option);
    }
  }, [selectedSession?.isTeamChat, messages.handleAIServiceSelection]);

  // Session status and validation functions
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages.getSessionStatus]);

  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages.canSendMessage]);

  const canSendMessageWithText = useCallback(() => {
    return messages.canSendMessageWithText(selectedSession);
  }, [selectedSession, messages.canSendMessageWithText]);

  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    ChatsLogger.log('info', 'Opening booking page', { userType });
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  const refreshSessions = useCallback(async () => {
    try {
      ChatsLogger.log('info', 'Refreshing E2E sessions...');
      await sessionsQuery.refetch();
      ChatsLogger.log('success', 'E2E sessions refreshed successfully');
    } catch (error) {
      ChatsLogger.log('error', 'Failed to refresh E2E sessions', error);
    }
  }, [sessionsQuery.refetch]);

  // Cleanup with E2E session cleanup
  useEffect(() => {
    return () => {
      ChatsLogger.log('info', 'Cleaning up useChats with E2E...');
      
      // Complete handshake for any active E2E sessions
      Object.keys(e2eFlowStatus).forEach(sessionId => {
        const status = e2eFlowStatus[sessionId];
        if (status?.status === 'ready') {
          const session = filteredSessions.find(s => s.sessionId === sessionId);
          if (session) {
            const participants = [session.clientId, session.psychologistId].filter(Boolean);
            completeE2EHandshake(sessionId, participants).catch(console.error);
          }
        }
      });
      
      ably.disconnect();
      setTypingUsers({});
      setE2eFlowStatus({});
    };
  }, []); 

  const getUserDisplayData = useCallback(() => {
    const userRole = user?.role;
    
    if (userRole === 'psychologist') {
      return {
        title: 'Chat Klien',
        subtitle: 'Professional E2E encrypted client communication'
      };
    }
    
    return {
      title: 'Pesan',
      subtitle: 'E2E encrypted chat with counselors and support team'
    };
  }, [user?.role]);

  // Debug info with E2E status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.selectedSession = selectedSession;
      window.debugChatE2E = {
        selectedSession,
        messageText: messages.messageText,
        canSendMessage: canSendMessage(),
        canSendMessageWithText: canSendMessageWithText(),
        connectionStatus: ably.connectionStatus,
        sessionsCount: filteredSessions.length,
        typingUsers,
        typingStatus: getTypingStatus(),
        e2eFlowStatus,
        e2eEncryptionStatus: e2eEncryption.getStatus(),
        socketConnected: notificationSocket.isSocketConnected()
      };
    }
  }, [selectedSession, messages.messageText, canSendMessage, canSendMessageWithText, ably.connectionStatus, filteredSessions.length, typingUsers, getTypingStatus, e2eFlowStatus]);

  // Memoize return object with E2E enhancements
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
    
    // E2E specific
    e2eFlowStatus,
    isE2EEnabled: selectedSession?.isE2EEnabled !== false,
    
    // E2E Actions
    initializeE2EForSession,
    completeE2EHandshake,
    handleE2EKeyRotation,
    
    // Debug utilities
    debug: {
      logger: ChatsLogger,
      ably: ably,
      e2eEncryption: e2eEncryption
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
    typingUsers,
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
    user?.role,
    e2eFlowStatus,
    initializeE2EForSession,
    completeE2EHandshake,
    handleE2EKeyRotation
  ]);
};