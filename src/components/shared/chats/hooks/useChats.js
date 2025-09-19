// src/components/shared/chats/hooks/useChats.js - CLEANED: Socket-Only Approach

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../../hooks/useAuth';
import { chatsApi } from '../lib/chatsApi';
import { useAbly } from './useAbly';
import { useMessages } from './useMessage';
import notificationSocket from '../../notifications/lib/socket';
import { toast } from 'sonner';

const ChatsLogger = {
  log: (level, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      presence: 'color: #9C27B0; font-weight: bold;',
      receipt: 'color: #4CAF50; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] CHATS:`,
      styles[level] || styles.info,
      message,
      data ? '\n📦 Data:' : '',
      data || ''
    );
  }
};

export const useChats = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  
  // SIMPLIFIED: Just track unread counts from socket events
  const [unreadCounts, setUnreadCounts] = useState({});
  
  // SIMPLIFIED: Track user presence from socket events only
  const [userPresence, setUserPresence] = useState({});
  
  const ably = useAbly();
  const messages = useMessages(selectedSession?.sessionId, ably);

  const userId = useMemo(() => user?.id, [user?.id]);

  // Store user data
  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Simple sessions query
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      ChatsLogger.log('info', 'Fetching sessions...');
      
      try {
        const [historiesResult, activeSessions] = await Promise.all([
          chatsApi.getChatHistories(),
          chatsApi.getActiveSessions()
        ]);
        
        let sessions, totalUnreadData;
        if (historiesResult.sessions) {
          sessions = historiesResult.sessions;
          totalUnreadData = historiesResult.totalUnreadData;
        } else {
          sessions = historiesResult;
          totalUnreadData = { totalUnread: 0, sessionUnreadCounts: {} };
        }
        
        // Extract initial unread counts
        if (sessions && Array.isArray(sessions)) {
          const initialUnreadCounts = {};
          sessions.forEach(session => {
            if (session.sessionId && session.unreadCount) {
              initialUnreadCounts[session.sessionId] = parseInt(session.unreadCount, 10) || 0;
            }
          });
          setUnreadCounts(prev => ({ ...prev, ...initialUnreadCounts }));
        }
        
        return { sessions, totalUnreadData };
        
      } catch (error) {
        ChatsLogger.log('error', 'Sessions fetch failed', error);
        throw error;
      }
    },
    staleTime: 30000,
    cacheTime: 300000,
    retry: 2
  });

  // Filter sessions with real-time unread counts
  const filteredSessions = useMemo(() => {
    const sessionsData = sessionsQuery.data?.sessions || [];
    const sessions = sessionsData.filter(session => {
      const userRole = user?.role;
      
      if (userRole === 'psychologist') {
        return true;
      } else {
        const isTeamChat = session.isTeamChat;
        const isMyClientSession = session.clientId === userId;
        const isMyPsychologistSession = session.psychologistId === userId;
        
        return isTeamChat || isMyClientSession || isMyPsychologistSession;
      }
    }).map(session => {
      // Apply real-time unread counts from socket events
      const realTimeUnreadCount = unreadCounts[session.sessionId] || session.unreadCount || 0;
      
      return {
        ...session,
        unreadCount: realTimeUnreadCount,
        hasUnread: realTimeUnreadCount > 0 && !session.isTeamChat
      };
    });

    return sessions;
  }, [sessionsQuery.data?.sessions, user?.role, userId, unreadCounts]);

  // SIMPLIFIED: Handle user presence from Ably - just update state
  const handleAblyUserPresence = useCallback((presenceData) => {
    ChatsLogger.log('presence', 'User presence update', presenceData);
    
    const { userId: presenceUserId, status, userFullname, lastSeen, timestamp } = presenceData;
    
    setUserPresence(prev => ({
      ...prev,
      [presenceUserId]: {
        status, // "present" or "away"
        userFullname,
        lastSeen,
        timestamp
      }
    }));

    // SIMPLIFIED: Update message status when recipient presence changes
    if (selectedSession?.sessionId) {
      queryClient.setQueryData(['chat-messages', selectedSession.sessionId], (oldMessages = []) => {
        return oldMessages.map(message => {
          if (message.senderId === userId && !message.isRead) {
            return {
              ...message,
              recipientPresence: status,
              isDelivered: true,
              deliveredAt: timestamp
            };
          }
          return message;
        });
      });
    }
  }, [selectedSession?.sessionId, userId, queryClient]);

  // SIMPLIFIED: Handle read receipts from Ably - just mark as read
  const handleAblyReadReceipt = useCallback((readData) => {
    ChatsLogger.log('receipt', 'Read receipt', readData);
    
    const { messageIds = [], userId: readByUserId, readAt } = readData;
    
    if (selectedSession?.sessionId && messageIds.length > 0) {
      queryClient.setQueryData(['chat-messages', selectedSession.sessionId], (oldMessages = []) => {
        return oldMessages.map(message => {
          if (messageIds.includes(message.id) && message.senderId === userId) {
            return {
              ...message,
              isRead: true, // Blue checkmarks
              readAt,
              readBy: readByUserId,
              recipientPresence: 'present' // Must be present to read
            };
          }
          return message;
        });
      });
    }
  }, [selectedSession?.sessionId, userId, queryClient]);

  // SIMPLIFIED: Handle delivery receipts from Ably - just mark as delivered
  const handleAblyDeliveryReceipt = useCallback((deliveryData) => {
    ChatsLogger.log('receipt', 'Delivery receipt', deliveryData);
    
    const { messageId, userId: recipientId } = deliveryData;
    
    if (selectedSession?.sessionId && messageId) {
      queryClient.setQueryData(['chat-messages', selectedSession.sessionId], (oldMessages = []) => {
        return oldMessages.map(message => {
          if (message.id === messageId && message.senderId === userId) {
            return {
              ...message,
              isDelivered: true,
              deliveredAt: deliveryData.deliveredAt,
              deliveredTo: recipientId
            };
          }
          return message;
        });
      });
    }
  }, [selectedSession?.sessionId, userId, queryClient]);

  // SIMPLIFIED: Socket.io event handlers - just invalidate queries
  const handleChatEnableDisable = useCallback((payload) => {
    ChatsLogger.log('info', 'Socket: chat enable/disable', payload);
    sessionsQuery.refetch();
  }, [sessionsQuery]);

  const handleInitialMessage = useCallback((payload) => {
    ChatsLogger.log('info', 'Socket: initial message', payload);
    sessionsQuery.refetch();
    if (selectedSession && payload.sessionId === selectedSession.sessionId) {
      messages.refetch();
    }
  }, [sessionsQuery, selectedSession?.sessionId, messages]);

  // SIMPLIFIED: Handle unread count updates from socket
  const handleUnreadCountUpdate = useCallback((payload) => {
    ChatsLogger.log('info', 'Socket: unread count update', payload);
    
    const { sessionId, userId: updateUserId, unreadCount } = payload;
    
    if (updateUserId === userId) {
      const parsedUnreadCount = typeof unreadCount === 'string' 
        ? parseInt(unreadCount, 10) 
        : unreadCount;
      
      setUnreadCounts(prev => ({
        ...prev,
        [sessionId]: parsedUnreadCount
      }));

      // Auto mark as read if session is open
      if (selectedSession?.sessionId === sessionId && parsedUnreadCount > 0) {
        setTimeout(() => {
          chatsApi.markAsRead(sessionId).catch(() => {});
        }, 1000);
      }
    }
  }, [userId, selectedSession?.sessionId]);

  // Setup Socket.io listeners
  useEffect(() => {
    const setupSocket = async () => {
      try {
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }

        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        notificationSocket.off('chat:unread_count_update');

        notificationSocket.on('chat:enable-chat', handleChatEnableDisable);
        notificationSocket.on('chat:initial-message', handleInitialMessage);
        notificationSocket.on('chat:unread_count_update', handleUnreadCountUpdate);
        
        ChatsLogger.log('success', 'Socket.io setup completed');
      } catch (error) {
        ChatsLogger.log('error', 'Socket.io setup failed', error);
      }
    };

    setupSocket();

    return () => {
      notificationSocket.off('chat:enable-chat', handleChatEnableDisable);
      notificationSocket.off('chat:initial-message', handleInitialMessage);
      notificationSocket.off('chat:unread_count_update', handleUnreadCountUpdate);
    };
  }, [handleChatEnableDisable, handleInitialMessage, handleUnreadCountUpdate]);

  // SIMPLIFIED: Session selection - just connect and mark as read
  const selectSession = useCallback(async (session, shouldMarkAsRead = true) => {
    if (!session || selectedSession?.sessionId === session.sessionId) {
      return;
    }
    
    try {
      // Mark as read and reset unread count
      if (!session.isTeamChat && session.hasUnread && shouldMarkAsRead) {
        setUnreadCounts(prev => ({
          ...prev,
          [session.sessionId]: 0
        }));
        
        chatsApi.markAsRead(session.sessionId).catch(() => {
          // Revert on error
          setUnreadCounts(prev => ({
            ...prev,
            [session.sessionId]: session.unreadCount || 0
          }));
        });
        
        session.hasUnread = false;
        session.unreadCount = 0;
      }
      
      setTypingUsers({});
      
      // Disconnect previous session
      if (selectedSession?.sessionId !== session.sessionId) {
        await ably.disconnect();
      }
      
      setSelectedSession(session);
      
      // Connect to Ably
      if (userId && session.sessionId !== 'team-ruangdiri') {
        try {
          const connected = await ably.connect(session.sessionId, userId);
          if (!connected) {
            ChatsLogger.log('warn', 'Ably connection failed');
          }
        } catch (error) {
          ChatsLogger.log('error', 'Ably connection error', error);
        }
      } else if (session.sessionId === 'team-ruangdiri') {
        await ably.connect(session.sessionId, userId);
      }
    } catch (error) {
      ChatsLogger.log('error', 'Session selection failed', error);
    }
  }, [selectedSession?.sessionId, ably, userId]);

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

  // SIMPLIFIED: Handle Ably message - just decrypt and add
  const handleAblyMessage = useCallback((messageData) => {
    const messageContent = messageData.content || messageData.message || '';
    
    const transformedMessage = {
      id: messageData.id || `realtime-${Date.now()}`,
      text: messageContent,
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
          : (messageData.senderFullname || 'Unknown User'),
        role: messageData.senderRole || 'user',
        profilePicture: messageData.senderProfilePicture || null
      },
      senderId: messageData.senderId,
      messageType: messageData.messageType || 'text',
      isRead: false,
      isSent: true,
      attachmentUrl: messageData.attachmentUrl || null,
      attachmentType: messageData.attachmentType || null,
      attachmentName: messageData.attachmentName || null,
      attachmentSize: messageData.attachmentSize || null
    };
    
    if (transformedMessage.text?.trim() || transformedMessage.attachmentUrl) {
      messages.addMessage(transformedMessage);
    }
  }, [userId, messages]);

  // Simple session status handler
  const handleAblySessionStatus = useCallback((statusData) => {
    setSelectedSession(prev => {
      if (prev && statusData.sessionId === prev.sessionId) {
        return { ...prev, ...statusData };
      }
      return prev;
    });
  }, []);

  // Simple typing handler
  const handleAblyTyping = useCallback((typingData) => {
    const { userId: typingUserId, isTyping, sessionId } = typingData;
    
    if (typingUserId !== userId && sessionId === selectedSession?.sessionId) {
      const displayName = typingData.senderFullName || typingData.senderFullname || 'Someone';
      
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
            delete newTypingUsers[typingUserId];
            return newTypingUsers;
          });
        }, 5000);
      }
    }
  }, [userId, selectedSession?.sessionId]);

  // Simple unread count handler from Ably
  const handleAblyUnreadCount = useCallback((unreadData) => {
    const { sessionId, userId: updateUserId, unreadCount } = unreadData;
    
    if (updateUserId === userId) {
      const parsedUnreadCount = typeof unreadCount === 'string' 
        ? parseInt(unreadCount, 10) 
        : unreadCount;
      
      setUnreadCounts(prev => ({
        ...prev,
        [sessionId]: parsedUnreadCount
      }));
    }
  }, [userId]);

  // Setup Ably callbacks
  useEffect(() => {
    if (!selectedSession || selectedSession.isTeamChat) return;

    ably.setCallbacks({
      onMessage: handleAblyMessage,
      onSessionStatus: handleAblySessionStatus,
      onTyping: handleAblyTyping,
      onUnreadCount: handleAblyUnreadCount,
      onReadReceipt: handleAblyReadReceipt,
      onDeliveryReceipt: handleAblyDeliveryReceipt,
      onUserPresence: handleAblyUserPresence
    });

  }, [selectedSession?.sessionId, selectedSession?.isTeamChat, ably, 
      handleAblyMessage, handleAblySessionStatus, handleAblyTyping, 
      handleAblyUnreadCount, handleAblyReadReceipt, handleAblyDeliveryReceipt, 
      handleAblyUserPresence]);

  // Simple typing handler
  const handleTyping = useCallback((text) => {
    messages.setMessageText(text);
    
    if (selectedSession && userId) {
      ably.handleTyping(selectedSession.sessionId, userId, text);
    }
  }, [selectedSession?.sessionId, userId, ably, messages.setMessageText]);

  // Simple send message
  const sendCurrentMessage = useCallback(async () => {
    if (!selectedSession || !messages.canSendMessage(selectedSession)) {
      return;
    }

    try {
      await messages.sendCurrentMessage();
    } catch (error) {
      toast.error('Failed to send message');
      throw error;
    }
  }, [selectedSession, messages]);

  // Simple file sending
  const sendFile = useCallback(async (file, fileType = null, caption = '') => {
    if (!selectedSession || !messages.canSendFile(selectedSession)) {
      return;
    }

    try {
      await messages.sendFile(file, fileType, caption);
    } catch (error) {
      toast.error('Failed to send file');
      throw error;
    }
  }, [selectedSession, messages]);

  // AI service selection
  const handleAIServiceSelection = useCallback(async (option) => {
    if (selectedSession?.isTeamChat) {
      try {
        await messages.handleAIServiceSelection(option);
      } catch (error) {
        toast.error('Failed to process selection');
      }
    }
  }, [selectedSession?.isTeamChat, messages.handleAIServiceSelection]);

  // Get session status
  const getSessionStatus = useCallback(() => {
    return messages.getSessionStatus(selectedSession);
  }, [selectedSession, messages.getSessionStatus]);

  // Capability checks
  const canSendMessage = useCallback(() => {
    return messages.canSendMessage(selectedSession);
  }, [selectedSession, messages.canSendMessage]);

  const canSendMessageWithText = useCallback(() => {
    return messages.canSendMessageWithText(selectedSession);
  }, [selectedSession, messages.canSendMessageWithText]);

  const canSendFile = useCallback((session) => {
    return messages.canSendFile(session || selectedSession);
  }, [selectedSession, messages.canSendFile]);

  // Booking handler
  const handleBookingClick = useCallback(() => {
    const userType = user?.role || 'student';
    window.open(`/booking-session/${userType}`, '_blank');
  }, [user?.role]);

  // Get typing status
  const getTypingStatus = useCallback(() => {
    const typingUsersList = Object.values(typingUsers).filter(user => user.isTyping);
    
    if (typingUsersList.length === 0) return null;
    
    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].userName} sedang mengetik...`;
    } else if (typingUsersList.length === 2) {
      const names = typingUsersList.map(u => u.userName).join(' dan ');
      return `${names} sedang mengetik...`;
    } else {
      const firstName = typingUsersList[0].userName;
      const count = typingUsersList.length - 1;
      return `${firstName} dan ${count} lainnya sedang mengetik...`;
    }
  }, [typingUsers]);

  // Get recipient presence
  const getRecipientPresence = useCallback(() => {
    if (!selectedSession || selectedSession.isTeamChat) return 'unknown';
    
    const otherUserId = selectedSession.clientId === userId 
      ? selectedSession.psychologistId 
      : selectedSession.clientId;
    
    return userPresence[otherUserId]?.status || 'unknown';
  }, [selectedSession, userId, userPresence]);

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

  // Cleanup
  useEffect(() => {
    return () => {
      setTypingUsers({});
      setUnreadCounts({});
      setUserPresence({});
    };
  }, []);

  return useMemo(() => ({
    // Data
    sessions: filteredSessions,
    selectedSession,
    messages: messages.messages,
    sessionAttachments: messages.sessionAttachments,
    messageText: messages.messageText,
    
    // Loading states
    isLoadingSessions: sessionsQuery.isLoading,
    isLoadingMessages: messages.isLoading,
    isLoadingAttachments: messages.isLoadingAttachments,
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
    
    // Unread counts
    unreadCounts,
    totalUnreadCount: Object.values(unreadCounts).reduce((sum, count) => sum + count, 0),
    
    // Error states
    sessionsError: sessionsQuery.error,
    messagesError: messages.error,
    hasErrors: !!(sessionsQuery.error || messages.error),
    
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
    refetchSessions: () => sessionsQuery.refetch(),
    
    // Infinite scroll
    loadMoreMessages: messages.loadMoreMessages,
    hasMoreMessages: messages.hasMore,
    isLoadingMoreMessages: messages.isLoadingMore,
    
    // User data
    userDisplayData: getUserDisplayData(),
    currentUserId: userId,
    
    // Presence and read receipts
    recipientPresence: getRecipientPresence(),
    userPresence,
    
    // Flags
    isEmpty: (filteredSessions.length || 0) === 0 && !sessionsQuery.isLoading,
    hasMessages: messages.messages.length > 0,
    isTeamSession: selectedSession?.isTeamChat || false,
    isPsychologist: user?.role === 'psychologist'
  }), [
    filteredSessions,
    selectedSession,
    messages.messages,
    messages.sessionAttachments,
    messages.messageText,
    messages.isLoading,
    messages.isLoadingAttachments,
    messages.isSending,
    messages.isUploadingFile,
    messages.error,
    messages.loadMoreMessages,
    messages.hasMore,
    messages.isLoadingMore,
    sessionsQuery.isLoading,
    sessionsQuery.error,
    ably.connectionStatus,
    ably.isConnected,
    ably.isAISession,
    ably.isTyping,
    getTypingStatus,
    typingUsers,
    unreadCounts,
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
    sessionsQuery.refetch,
    getUserDisplayData,
    getRecipientPresence,
    userPresence,
    user?.role,
    userId
  ]);
};