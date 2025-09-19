// src/components/shared/chats/hooks/useAbly.js - CLEANED: Socket-Only Approach

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';
import { apiClient } from '../../../../lib/api.js';
import chatEncryption from '../lib/encryption';
import notificationSocket from '../../notifications/lib/socket';
import { installAblyErrorHandler } from '../utils/ablyErrorHandler';

// Install global Ably error handler
installAblyErrorHandler();

// Enhanced Ably Event Logger
const AblyLogger = {
  log: (level, category, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      debug: 'color: #9575CD; font-weight: bold;',
      event: 'color: #26A69A; font-weight: bold;',
      presence: 'color: #E91E63; font-weight: bold;',
      receipt: 'color: #4CAF50; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] ABLY-${category.toUpperCase()}:`,
      styles[level] || styles.info,
      message,
      data ? '\n📦 Data:' : '',
      data || ''
    );
  },

  logAblyMessage: (message, channelName) => {
    console.group(`📨 ABLY MESSAGE: ${message.name?.toUpperCase() || 'UNKNOWN'}`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📡 Channel:', channelName);
    console.log('🆔 Message ID:', message.id);
    console.log('📦 Raw Data:', message.data);
    console.groupEnd();
  }
};

export const useAbly = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);

  const ablyRef = useRef(null);
  const chatChannelRef = useRef(null);
  const currentSessionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  const messagesCacheRef = useRef(new Map());
  
  // Callback refs
  const onMessageRef = useRef(null);
  const onSessionStatusRef = useRef(null);
  const onTypingRef = useRef(null);
  const onUnreadCountRef = useRef(null);
  const onReadReceiptRef = useRef(null);
  const onDeliveryReceiptRef = useRef(null);
  const onUserPresenceRef = useRef(null);

  const isCleaningUpRef = useRef(false);

  // Simple connection status handler
  const handleConnectionStatusChange = useCallback((state, reason = null) => {
    if (isCleaningUpRef.current && (state === 'disconnected' || state === 'closed')) {
      return;
    }

    AblyLogger.log('info', 'CONNECTION', `State: ${state.toUpperCase()}`, { reason });
    setConnectionStatus(state);
  }, []);

  // Simple callbacks setup
  const setCallbacks = useCallback((callbacks) => {
    onMessageRef.current = callbacks.onMessage || null;
    onSessionStatusRef.current = callbacks.onSessionStatus || null;
    onTypingRef.current = callbacks.onTyping || null;
    onUnreadCountRef.current = callbacks.onUnreadCount || null;
    onReadReceiptRef.current = callbacks.onReadReceipt || null;
    onDeliveryReceiptRef.current = callbacks.onDeliveryReceipt || null;
    onUserPresenceRef.current = callbacks.onUserPresence || null;
  }, []);

  // Simple deduplication
  const isDuplicateMessage = useCallback((message) => {
    const key = message.id || `${message.timestamp}-${message.data?.senderId}`;
    if (messagesCacheRef.current.has(key)) {
      return true;
    }
    messagesCacheRef.current.set(key, true);
    
    // Keep cache manageable
    if (messagesCacheRef.current.size > 100) {
      const firstKey = messagesCacheRef.current.keys().next().value;
      messagesCacheRef.current.delete(firstKey);
    }
    return false;
  }, []);

  // Message decryption helper
  const decryptMessageContent = useCallback((encryptedMessage, sessionId) => {
    try {
      if (!encryptedMessage || typeof encryptedMessage !== 'string') {
        return encryptedMessage;
      }

      if (chatEncryption.isEncrypted(encryptedMessage)) {
        return chatEncryption.decrypt(encryptedMessage, sessionId);
      }
      return encryptedMessage;
    } catch (error) {
      AblyLogger.log('error', 'DECRYPT', 'Failed to decrypt', error);
      return encryptedMessage;
    }
  }, []);

  // MAIN CONNECT FUNCTION - SIMPLIFIED
  const connect = useCallback(async (sessionId, userId) => {
    try {
      currentSessionRef.current = sessionId;
      AblyLogger.log('info', 'CONNECT', `Connecting to: ${sessionId}`, { userId });

      // Handle AI Team session
      if (sessionId === 'team-ruangdiri') {
        handleConnectionStatusChange('ai');
        return true;
      }

      handleConnectionStatusChange('connecting');

      // Setup Socket.io
      try {
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }
        
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        
        notificationSocket.on('chat:enable-chat', (payload) => {
          if (onSessionStatusRef.current) {
            onSessionStatusRef.current(payload);
          }
        });

        notificationSocket.on('chat:initial-message', (payload) => {
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        });
      } catch (error) {
        AblyLogger.log('warn', 'SOCKET', 'Setup failed, continuing', error);
      }

      // Close existing Ably
      if (ablyRef.current) {
        try {
          ablyRef.current.close();
        } catch (e) {
          AblyLogger.log('warn', 'CLEANUP', 'Close error ignored', e);
        }
        ablyRef.current = null;
      }
      chatChannelRef.current = null;

      // Get Ably token
      const tokenData = await chatsApi.getAblyToken(sessionId);
      if (!tokenData) {
        handleConnectionStatusChange('disconnected');
        return false;
      }

      // Create Ably client
      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          callback(null, tokenData.token);
        },
        clientId: userId,
        disconnectedRetryTimeout: 5000,
        suspendedRetryTimeout: 10000,
        autoConnect: true,
        echoMessages: false
      });

      ablyRef.current = ably;

      // Get chat channel
      const chatChannelName = tokenData.channels?.chat || tokenData.channels;
      const chatChannel = ably.channels.get(chatChannelName);
      chatChannelRef.current = chatChannel;

      // SIMPLIFIED MESSAGE HANDLER - Just route by event name
      const handleChannelMessage = (message) => {
        AblyLogger.logAblyMessage(message, chatChannelName);
        
        if (isDuplicateMessage(message)) return;
        
        const eventName = message.name;
        let messageData = message.data;
        
        // Parse JSON if string
        if (typeof messageData === 'string') {
          try {
            messageData = JSON.parse(messageData);
          } catch (error) {
            AblyLogger.log('warn', 'PARSE', 'JSON parse failed', error);
          }
        }
        
        // ROUTE EVENTS
        switch (eventName) {
          case 'message':
            // Decrypt content if needed
            if (messageData.content || messageData.message) {
              const encryptedContent = messageData.content || messageData.message;
              const decryptedContent = decryptMessageContent(encryptedContent, sessionId);
              
              messageData = {
                ...messageData,
                content: decryptedContent,
                message: decryptedContent
              };
            }
            
            if (messageData.senderId !== userId && onMessageRef.current) {
              onMessageRef.current(messageData);
            }
            break;

          case 'delivery_receipt':
            AblyLogger.log('receipt', 'DELIVERY', 'Message delivered', messageData);
            if (onDeliveryReceiptRef.current) {
              onDeliveryReceiptRef.current({
                messageId: messageData.messageId,
                userId: messageData.userId,
                deliveredAt: messageData.deliveredAt,
                timestamp: messageData.timestamp
              });
            }
            break;

          case 'message_read':
          case 'read_receipt':
            AblyLogger.log('receipt', 'READ', 'Message read', messageData);
            if (onReadReceiptRef.current) {
              const messageIds = messageData.messageIds || (messageData.messageId ? [messageData.messageId] : []);
              onReadReceiptRef.current({
                messageIds: messageIds,
                messageId: messageIds[0],
                userId: messageData.userId,
                userFullname: messageData.userFullname,
                readAt: messageData.readAt,
                timestamp: messageData.timestamp
              });
            }
            break;

          case 'user_presence':
            AblyLogger.log('presence', 'USER_PRESENCE', `Status: ${messageData.status}`, messageData);
            if (onUserPresenceRef.current) {
              onUserPresenceRef.current({
                userId: messageData.userId,
                userFullname: messageData.userFullname,
                status: messageData.status, // "present" or "away"
                lastSeen: messageData.lastSeen,
                timestamp: messageData.timestamp
              });
            }
            break;

          case 'typing':
            const { isTyping: typing, userId: typingUserId } = messageData;
            if (typingUserId !== userId) {
              setIsTyping(typing);
              if (onTypingRef.current) {
                onTypingRef.current({
                  ...messageData,
                  isTyping: typing,
                  userId: typingUserId
                });
              }

              if (typing) {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                }, 5000);
              }
            }
            break;

          case 'session_status':
            if (onSessionStatusRef.current) {
              onSessionStatusRef.current(messageData);
            }
            break;

          case 'unread_count_update':
            if (onUnreadCountRef.current) {
              const parsedData = {
                ...messageData,
                unreadCount: typeof messageData.unreadCount === 'string' 
                  ? parseInt(messageData.unreadCount, 10) 
                  : messageData.unreadCount
              };
              onUnreadCountRef.current(parsedData);
            }
            break;

          case 'file_upload':
            // Decrypt file caption if present
            if (messageData.content || messageData.message) {
              const encryptedContent = messageData.content || messageData.message;
              const decryptedContent = decryptMessageContent(encryptedContent, sessionId);
              
              messageData = {
                ...messageData,
                content: decryptedContent,
                message: decryptedContent,
                messageType: 'file',
                isFileUpload: true
              };
            }
            
            if (onMessageRef.current) {
              onMessageRef.current(messageData);
            }
            break;

          default:
            AblyLogger.log('warn', 'UNKNOWN', `Unknown event: ${eventName}`, messageData);
            break;
        }
      };

      // Subscribe to all events on chat channel
      chatChannel.subscribe(handleChannelMessage);

      // Connection handlers
      ably.connection.on('connected', () => {
        handleConnectionStatusChange('connected');
      });

      ably.connection.on('disconnected', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('failed', (error) => {
        handleConnectionStatusChange('failed', error);
      });

      ably.connection.on('suspended', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('closed', () => {
        handleConnectionStatusChange('disconnected');
      });

      // Token refresh
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = setInterval(async () => {
        try {
          const newTokenData = await chatsApi.getAblyToken(sessionId);
          if (newTokenData && ablyRef.current) {
            await ablyRef.current.auth.authorize(newTokenData.token);
          }
        } catch (error) {
          AblyLogger.log('error', 'TOKEN', 'Refresh failed', error);
        }
      }, 25 * 60 * 1000);

      return true;
    } catch (error) {
      AblyLogger.log('error', 'CONNECT', 'Failed', error);
      handleConnectionStatusChange('failed');
      return false;
    }
  }, [handleConnectionStatusChange, isDuplicateMessage, decryptMessageContent]);

  // Simple disconnect
  const disconnect = useCallback(async () => {
    AblyLogger.log('info', 'DISCONNECT', 'Disconnecting...');
    
    isCleaningUpRef.current = true;
    
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    try {
      notificationSocket.off('chat:enable-chat');
      notificationSocket.off('chat:initial-message');
    } catch (error) {
      AblyLogger.log('warn', 'SOCKET', 'Error removing listeners', error);
    }

    if (chatChannelRef.current) {
      try {
        chatChannelRef.current.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error', error);
      }
    }

    if (ablyRef.current) {
      try {
        ablyRef.current.close();
      } catch (error) {
        AblyLogger.log('warn', 'CLOSE', 'Error ignored', error);
      }
      ablyRef.current = null;
    }

    messagesCacheRef.current.clear();
    currentSessionRef.current = null;
    setIsTyping(false);
    
    setTimeout(() => {
      isCleaningUpRef.current = false;
      setConnectionStatus('disconnected');
    }, 100);
  }, []);

  // Simple typing
  const sendTyping = useCallback(async (sessionId, isTyping, userId) => {
    if (sessionId === 'team-ruangdiri') return;

    const typingData = {
      sessionId,
      isTyping,
      userId,
      timestamp: new Date().toISOString()
    };

    try {
      if (ablyRef.current && chatChannelRef.current && connectionStatus === 'connected') {
        await chatChannelRef.current.publish('typing', typingData);
      } else {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
      }
    } catch (error) {
      try {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
      } catch (apiError) {
        AblyLogger.log('error', 'TYPING', 'Both Ably and API failed', apiError);
      }
    }
  }, [connectionStatus]);

  // Send message via Ably
  const sendMessageViaAbly = useCallback(async (sessionId, messageData) => {
    if (sessionId === 'team-ruangdiri') return false;

    try {
      if (ablyRef.current && chatChannelRef.current && connectionStatus === 'connected') {
        await chatChannelRef.current.publish('message', messageData);
        return true;
      }
    } catch (error) {
      AblyLogger.log('error', 'MESSAGE', 'Ably send failed', error);
    }
    
    return false;
  }, [connectionStatus]);

  // Handle typing with timeout
  const handleTyping = useCallback((sessionId, userId, text) => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim()) {
      sendTyping(sessionId, true, userId);
      
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(sessionId, false, userId);
      }, 3000);
    } else {
      sendTyping(sessionId, false, userId);
    }
  }, [sendTyping]);

  // AI typing simulation
  const simulateAITyping = useCallback((callback) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (callback) callback();
    }, 1000 + Math.random() * 2000);
  }, []);

  // Connection info
  const getConnectionInfo = useCallback(() => {
    return {
      status: connectionStatus,
      isConnected: ['connected', 'ai'].includes(connectionStatus),
      currentSession: currentSessionRef.current,
      hasAbly: !!ablyRef.current,
      ablyState: ablyRef.current?.connection?.state || 'none'
    };
  }, [connectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return useMemo(() => ({
    connectionStatus,
    isTyping,
    isConnected: ['connected', 'ai'].includes(connectionStatus),
    isAISession: connectionStatus === 'ai',
    currentSession: currentSessionRef.current,
    connect,
    disconnect,
    sendTyping,
    handleTyping,
    sendMessageViaAbly,
    simulateAITyping,
    setCallbacks,
    getConnectionInfo,
    logger: AblyLogger,
    decryptMessage: decryptMessageContent
  }), [
    connectionStatus,
    isTyping,
    connect,
    disconnect,
    sendTyping,
    handleTyping,
    sendMessageViaAbly,
    simulateAITyping,
    setCallbacks,
    getConnectionInfo,
    decryptMessageContent
  ]);
};