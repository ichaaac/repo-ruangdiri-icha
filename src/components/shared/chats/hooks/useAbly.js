// src/components/shared/chats/hooks/useAbly.js - FIXED: Message Decryption & Unread Count Updates

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';
import chatEncryption from '../lib/encryption';
import notificationSocket from '../../notifications/lib/socket';
import { installAblyErrorHandler } from '../utils/ablyErrorHandler';

// Install global Ably error handler immediately
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
      crypto: 'color: #FF9800; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] ABLY-${category.toUpperCase()}:`,
      styles[level] || styles.info,
      message,
      data ? '\n📦 Data:' : '',
      data || ''
    );
  },

  logMessageName: (msgName, channelName, data = null) => {
    console.log(
      `%c[ABLY-EVENT] ${msgName.toUpperCase()}`,
      'color: #26A69A; font-weight: bold;',
      `on ${channelName}`,
      data ? data : ''
    );
  },

  logAblyMessage: (message, channelName, eventType) => {
    if (message.name) {
      AblyLogger.logMessageName(message.name, channelName, message.data);
    }

    console.group(`📨 ABLY MESSAGE RECEIVED`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📡 Channel:', channelName);
    console.log('🏷️ Event Name (msg.name):', message.name);
    console.log('🎯 Event Type:', eventType);
    console.log('🆔 Message ID:', message.id);
    console.log('👤 Client ID:', message.clientId);
    console.log('⚡ Action:', message.action);
    console.log('📤 Encoding:', message.encoding);
    console.log('🕐 Message Timestamp:', message.timestamp);
    console.log('📦 Raw Data:', message.data);
    console.log('🔍 Full Message Object:', message);
    console.groupEnd();
  },

  logConnection: (state, reason = null) => {
    const stateColors = {
      connected: 'success',
      connecting: 'info', 
      disconnected: 'warn',
      suspended: 'warn',
      failed: 'error',
      closed: 'error'
    };
    
    AblyLogger.log(
      stateColors[state] || 'info',
      'CONNECTION',
      `State changed to: ${state.toUpperCase()}`,
      reason ? { reason } : null
    );
  },

  logChannel: (channelName, eventType, details) => {
    AblyLogger.log('event', 'CHANNEL', `${channelName} - ${eventType}`, details);
  },

  logSendAttempt: (type, data) => {
    console.group(`📤 SENDING ${type.toUpperCase()}`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📦 Data being sent:', data);
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

  const isCleaningUpRef = useRef(false);

  // Enhanced connection status handler
  const handleConnectionStatusChange = useCallback((state, reason = null) => {
    if (isCleaningUpRef.current && (state === 'disconnected' || state === 'closed')) {
      AblyLogger.log('debug', 'CONNECTION', 'Ignoring status change during cleanup', { state, reason });
      return;
    }

    AblyLogger.logConnection(state, reason);
    setConnectionStatus(state);
    
    if (typeof window !== 'undefined') {
      window.ablyConnectionInfo = {
        state,
        reason,
        timestamp: new Date().toISOString(),
        ablyState: ablyRef.current?.connection?.state,
        chatChannel: chatChannelRef.current ? 'attached' : 'none',
        currentSession: currentSessionRef.current
      };
    }
  }, []);

  // Fixed callbacks setup
  const setCallbacks = useCallback((callbacks) => {
    AblyLogger.log('info', 'SETUP', 'Setting Ably callbacks', {
      hasMessage: !!callbacks.onMessage,
      hasSessionStatus: !!callbacks.onSessionStatus,
      hasTyping: !!callbacks.onTyping,
      hasUnreadCount: !!callbacks.onUnreadCount
    });

    onMessageRef.current = callbacks.onMessage || null;
    onSessionStatusRef.current = callbacks.onSessionStatus || null;
    onTypingRef.current = callbacks.onTyping || null;
    onUnreadCountRef.current = callbacks.onUnreadCount || null;
  }, []);

  // FIXED: Enhanced deduplication helper
  const isDuplicateMessage = useCallback((message) => {
    const key = message.id || `${message.timestamp}-${message.data?.senderId}-${message.data?.message}`;
    if (messagesCacheRef.current.has(key)) {
      AblyLogger.log('warn', 'DEDUPE', `Duplicate message ignored: ${key}`);
      return true;
    }
    
    messagesCacheRef.current.set(key, true);
    
    // Keep cache size manageable (last 100 messages)
    if (messagesCacheRef.current.size > 100) {
      const firstKey = messagesCacheRef.current.keys().next().value;
      messagesCacheRef.current.delete(firstKey);
    }
    
    return false;
  }, []);

  // FIXED: Message decryption helper
  const decryptMessageContent = useCallback((encryptedMessage, sessionId) => {
    try {
      if (!encryptedMessage || typeof encryptedMessage !== 'string') {
        AblyLogger.log('warn', 'DECRYPT', 'Invalid encrypted message input');
        return encryptedMessage;
      }

      // Check if message is in encrypted format
      if (chatEncryption.isEncrypted(encryptedMessage)) {
        const decrypted = chatEncryption.decrypt(encryptedMessage, sessionId);
        AblyLogger.log('crypto', 'DECRYPT', 'Message decrypted from Ably', {
          sessionId: sessionId?.slice(-8),
          originalLength: encryptedMessage.length,
          decryptedLength: decrypted.length
        });
        return decrypted;
      } else {
        AblyLogger.log('debug', 'DECRYPT', 'Message not encrypted, using as-is');
        return encryptedMessage;
      }
    } catch (error) {
      AblyLogger.log('error', 'DECRYPT', 'Failed to decrypt message from Ably', error);
      return encryptedMessage; // Return original on error
    }
  }, []);

  // UPDATED: Single channel connect function with decryption
  const connect = useCallback(async (sessionId, userId) => {
    try {
      currentSessionRef.current = sessionId;
      
      AblyLogger.log('info', 'CONNECT', `Connecting to session: ${sessionId}`, { userId });

      // Handle AI Team RuangDiri session
      if (sessionId === 'team-ruangdiri') {
        handleConnectionStatusChange('ai');
        AblyLogger.log('success', 'CONNECT', 'Connected to AI Team RuangDiri');
        return true;
      }

      handleConnectionStatusChange('connecting');

      // Setup Socket.io (unchanged)
      try {
        AblyLogger.log('info', 'SOCKET', 'Setting up Socket.io connection...');
        
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }
        
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        
        notificationSocket.on('chat:enable-chat', (payload) => {
          AblyLogger.log('event', 'SOCKET', 'chat:enable-chat received', payload);
          if (onSessionStatusRef.current) {
            onSessionStatusRef.current({
              sessionId: payload.sessionId,
              isActive: payload.isActive,
              isChatEnabled: payload.isChatEnabled,
              status: payload.status
            });
          }
        });

        notificationSocket.on('chat:initial-message', (payload) => {
          AblyLogger.log('event', 'SOCKET', 'chat:initial-message received', payload);
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        });

        AblyLogger.log('success', 'SOCKET', 'Socket.io connected and listeners registered');
      } catch (error) {
        AblyLogger.log('warn', 'SOCKET', 'Socket.io setup failed, continuing with Ably only', error);
      }

      // Close existing Ably connection
      if (ablyRef.current) {
        AblyLogger.log('info', 'CLEANUP', 'Closing existing Ably connection...');
        try {
          const currentState = ablyRef.current.connection?.state;
          if (currentState && currentState !== 'closed' && currentState !== 'closing') {
            ablyRef.current.close();
          } else {
            AblyLogger.log('debug', 'CLEANUP', `Ably already ${currentState}, skipping close`);
          }
        } catch (e) {
          AblyLogger.log('warn', 'CLEANUP', 'Error closing existing Ably', e);
        }
        ablyRef.current = null;
      }
      chatChannelRef.current = null;

      // Get Ably token
      AblyLogger.log('info', 'TOKEN', 'Requesting Ably token...');
      const tokenData = await chatsApi.getAblyToken(sessionId);
      
      if (!tokenData) {
        AblyLogger.log('warn', 'TOKEN', 'No Ably token available');
        handleConnectionStatusChange('disconnected');
        return false;
      }

      AblyLogger.log('success', 'TOKEN', 'Ably token received', {
        sessionId: tokenData.sessionId,
        chatChannel: tokenData.channels?.chat || tokenData.channels,
        expiresAt: tokenData.expiresAt
      });

      // Create Ably client
      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          AblyLogger.log('info', 'AUTH', 'Ably auth callback triggered');
          callback(null, tokenData.token);
        },
        clientId: userId,
        disconnectedRetryTimeout: 5000,
        suspendedRetryTimeout: 10000,
        autoConnect: true,
        echoMessages: false,
        log: {
          level: 4,
          handler: (msg) => {
            AblyLogger.log('debug', 'ABLY-SDK', msg.toString());
          }
        }
      });

      ablyRef.current = ably;

      // Get chat channel
      const chatChannelName = tokenData.channels?.chat || tokenData.channels;
      const chatChannel = ably.channels.get(chatChannelName);
      chatChannelRef.current = chatChannel;

      AblyLogger.log('info', 'CHANNELS', 'Setting up single Ably chat channel', {
        chatChannel: chatChannelName
      });

      // FIXED: Enhanced channel message handler with decryption
      const handleChannelMessage = (message) => {
        AblyLogger.logAblyMessage(message, chatChannelName, 'ALL_EVENTS');
        
        // Check for duplicates
        if (isDuplicateMessage(message)) {
          return;
        }
        
        // Route by message.name
        const eventName = message.name;
        let messageData = message.data;
        
        // Parse JSON data if it's a string
        if (typeof messageData === 'string') {
          try {
            messageData = JSON.parse(messageData);
          } catch (error) {
            AblyLogger.log('warn', 'PARSE', 'Failed to parse message data as JSON', error);
          }
        }
        
switch (eventName) {
          case 'message':
            AblyLogger.log('info', 'MESSAGE', 'Processing chat message');
            
            // FIXED: Decrypt message content if present
            if (messageData.content || messageData.message) {
              const encryptedContent = messageData.content || messageData.message;
              const decryptedContent = decryptMessageContent(encryptedContent, sessionId);
              
              // Update messageData with decrypted content
              messageData = {
                ...messageData,
                content: decryptedContent,
                message: decryptedContent, // Ensure both fields are updated
                wasDecrypted: encryptedContent !== decryptedContent
              };
              
              AblyLogger.log('crypto', 'MESSAGE', 'Message content processed', {
                wasEncrypted: messageData.wasDecrypted,
                contentLength: decryptedContent?.length || 0
              });
            }
            
            if (messageData.senderId !== userId && onMessageRef.current) {
              AblyLogger.log('info', 'MESSAGE', 'Forwarding to message handler', {
                senderId: messageData.senderId,
                currentUserId: userId,
                messageType: messageData.messageType,
                hasText: !!(messageData.message || messageData.content)
              });
              onMessageRef.current(messageData);
            }
            
            // FIXED: Also update last message in histories
            if (onLastMessageUpdateRef.current) {
              const lastMessageData = {
                sessionId: sessionId,
                message: messageData.content || messageData.message,
                senderId: messageData.senderId,
                senderFullName: messageData.senderFullname || messageData.senderFullName,
                messageType: messageData.messageType,
                timestamp: messageData.timestamp,
                createdAt: messageData.timestamp
              };
              
              AblyLogger.log('info', 'LAST_MSG_UPDATE', 'Updating last message in histories', {
                sessionId: sessionId?.slice(-8),
                senderId: messageData.senderId?.slice(-8),
                messageLength: lastMessageData.message?.length || 0
              });
              
              onLastMessageUpdateRef.current(lastMessageData);
            }
            break;

          case 'delivery_receipt':
            AblyLogger.log('info', 'DELIVERY', 'Processing delivery receipt', messageData);
            
            if (onDeliveryReceiptRef.current) {
              const deliveryData = {
                messageId: messageData.messageId,
                userId: messageData.userId,
                deliveredAt: messageData.deliveredAt,
                timestamp: messageData.timestamp
              };
              
              AblyLogger.log('success', 'DELIVERY', 'Delivery receipt processed', {
                messageId: deliveryData.messageId?.slice(-8),
                userId: deliveryData.userId?.slice(-8)
              });
              
              onDeliveryReceiptRef.current(deliveryData);
            }
            break;

          case 'message_read':
            AblyLogger.log('info', 'READ_RECEIPT', 'Processing read receipt', messageData);
            
            if (onReadReceiptRef.current) {
              const readData = {
                messageId: messageData.messageId,
                userId: messageData.userId,
                userFullname: messageData.userFullname,
                readAt: messageData.readAt,
                timestamp: messageData.timestamp
              };
              
              AblyLogger.log('success', 'READ_RECEIPT', 'Read receipt processed', {
                messageId: readData.messageId?.slice(-8),
                userId: readData.userId?.slice(-8),
                readBy: readData.userFullname
              });
              
              onReadReceiptRef.current(readData);
            }
            break;

          case 'typing':
            AblyLogger.log('debug', 'TYPING', 'Processing typing indicator', messageData);
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

              // Clear typing after timeout
              if (typing) {
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                typingTimeoutRef.current = setTimeout(() => {
                  setIsTyping(false);
                  AblyLogger.log('debug', 'TYPING', 'Auto-cleared typing indicator');
                }, 5000);
              }
            }
            break;

          case 'session_status':
            AblyLogger.log('info', 'SESSION', 'Processing session status update', messageData);
            if (onSessionStatusRef.current) {
              onSessionStatusRef.current(messageData);
            }
            break;

          case 'unread_count_update':
            AblyLogger.log('info', 'UNREAD', 'Processing unread count update', messageData);
            
            // FIXED: Enhanced unread count handling
            if (onUnreadCountRef.current) {
              try {
                // Parse unreadCount if it's a string
                const parsedData = {
                  ...messageData,
                  unreadCount: typeof messageData.unreadCount === 'string' 
                    ? parseInt(messageData.unreadCount, 10) 
                    : messageData.unreadCount
                };

                // If sessionId is not provided in payload, infer from channel name
                if (!parsedData.sessionId && typeof chatChannelName === 'string') {
                  const parts = chatChannelName.split(':');
                  const maybeSessionId = parts[parts.length - 1];
                  if (maybeSessionId && maybeSessionId !== 'chat' && maybeSessionId !== 'session') {
                    parsedData.sessionId = maybeSessionId;
                  }
                }
                
                AblyLogger.log('info', 'UNREAD', 'Processed unread count', {
                  userId: parsedData.userId?.slice(-8),
                  sessionId: parsedData.sessionId?.slice(-8),
                  unreadCount: parsedData.unreadCount,
                  timestamp: parsedData.timestamp
                });
                
                onUnreadCountRef.current(parsedData);
              } catch (error) {
                AblyLogger.log('error', 'UNREAD', 'Failed to process unread count', error);
              }
            }
            break;

          case 'user_presence':
            AblyLogger.log('info', 'PRESENCE', 'Processing user presence', messageData);
            break;

          case 'file_upload':
            AblyLogger.log('info', 'FILE', 'Processing file upload', messageData);
            
            // FIXED: Decrypt file caption/message if present
            if (messageData.content || messageData.message) {
              const encryptedContent = messageData.content || messageData.message;
              const decryptedContent = decryptMessageContent(encryptedContent, sessionId);
              
              messageData = {
                ...messageData,
                content: decryptedContent,
                message: decryptedContent,
                messageType: 'file',
                isFileUpload: true,
                wasDecrypted: encryptedContent !== decryptedContent
              };
            }
            
            if (onMessageRef.current) {
              onMessageRef.current(messageData);
            }
            
            // FIXED: Also update last message for file uploads
            if (onLastMessageUpdateRef.current) {
              const lastMessageData = {
                sessionId: sessionId,
                message: messageData.content || messageData.message || '[File]',
                senderId: messageData.senderId,
                senderFullName: messageData.senderFullname || messageData.senderFullName,
                messageType: 'file',
                timestamp: messageData.timestamp,
                createdAt: messageData.timestamp,
                attachmentName: messageData.attachmentName,
                attachmentUrl: messageData.attachmentUrl
              };
              
              onLastMessageUpdateRef.current(lastMessageData);
            }
            break;

          case 'notification':
            AblyLogger.log('info', 'NOTIFICATION', 'Processing notification', messageData);
            break;

          case 'automated_message':
            AblyLogger.log('info', 'AUTOMATED', 'Processing automated message', messageData);
            
            // FIXED: Don't decrypt automated messages
            if (onMessageRef.current) {
              onMessageRef.current({
                ...messageData,
                isAutomated: true,
                messageType: 'automated'
              });
            }
            
            // Update last message for automated messages
            if (onLastMessageUpdateRef.current) {
              const lastMessageData = {
                sessionId: sessionId,
                message: messageData.message || messageData.content,
                senderId: messageData.senderId,
                senderFullName: messageData.senderFullname || messageData.senderFullName,
                messageType: 'automated',
                timestamp: messageData.timestamp,
                createdAt: messageData.timestamp
              };
              
              onLastMessageUpdateRef.current(lastMessageData);
            }
            break;

          default:
            AblyLogger.log('warn', 'UNKNOWN', `Unknown event name: ${eventName}`, messageData);
            break;
        }
      };

      // Setup channel logging
      chatChannel.on('attached', () => {
        AblyLogger.logChannel(chatChannelName, 'ATTACHED', 'Chat channel successfully attached');
      });

      chatChannel.on('detached', () => {
        AblyLogger.logChannel(chatChannelName, 'DETACHED', 'Chat channel detached');
      });

      chatChannel.on('failed', (error) => {
        AblyLogger.logChannel(chatChannelName, 'FAILED', { error });
      });

      chatChannel.on('suspended', () => {
        AblyLogger.logChannel(chatChannelName, 'SUSPENDED', 'Chat channel suspended');
      });

      // Subscribe to chat channel for all events
      AblyLogger.log('info', 'SUBSCRIBE', 'Subscribing to single chat channel for all events...');
      chatChannel.subscribe(handleChannelMessage);

      // Connection handlers (unchanged)
      ably.connection.on('connected', () => {
        handleConnectionStatusChange('connected');
        AblyLogger.log('success', 'CONNECTION', 'Ably connection established', {
          connectionId: ably.connection.id,
          connectionKey: ably.connection.key,
          clientId: ably.connection.clientId
        });
      });

      ably.connection.on('disconnected', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('failed', (error) => {
        handleConnectionStatusChange('failed', error);
        AblyLogger.log('error', 'CONNECTION', 'Connection failed', error);
      });

      ably.connection.on('suspended', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('closed', () => {
        handleConnectionStatusChange('disconnected');
      });

      // Token refresh (unchanged)
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = setInterval(async () => {
        try {
          AblyLogger.log('info', 'TOKEN', 'Refreshing Ably token...');
          const newTokenData = await chatsApi.getAblyToken(sessionId);
          if (newTokenData && ablyRef.current) {
            await ablyRef.current.auth.authorize(newTokenData.token);
            AblyLogger.log('success', 'TOKEN', 'Token refreshed successfully');
          }
        } catch (error) {
          AblyLogger.log('error', 'TOKEN', 'Token refresh failed', error);
        }
      }, 25 * 60 * 1000);

      return true;
    } catch (error) {
      AblyLogger.log('error', 'CONNECT', 'Chat connection failed', error);
      handleConnectionStatusChange('failed');
      return false;
    }
  }, [handleConnectionStatusChange, isDuplicateMessage, decryptMessageContent]);

  // Other functions remain the same but with encryption logging
  const disconnect = useCallback(() => {
    AblyLogger.log('info', 'DISCONNECT', 'Disconnecting chat...');
    
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
      AblyLogger.log('warn', 'SOCKET', 'Error removing socket listeners', error);
    }

    if (chatChannelRef.current) {
      try {
        AblyLogger.log('info', 'UNSUBSCRIBE', 'Unsubscribing from chat channel...');
        chatChannelRef.current.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error unsubscribing chat', error);
      }
    }

    chatChannelRef.current = null;

    if (ablyRef.current) {
      try {
        AblyLogger.log('info', 'CLOSE', 'Closing Ably connection...');
        const currentState = ablyRef.current.connection?.state;
        if (currentState && currentState !== 'closed' && currentState !== 'closing') {
          ablyRef.current.close();
          AblyLogger.log('success', 'CLOSE', 'Ably connection close initiated');
        } else {
          AblyLogger.log('debug', 'CLOSE', `Ably already ${currentState}, skipping close`);
        }
      } catch (error) {
        AblyLogger.log('warn', 'CLOSE', 'Error closing Ably (ignoring)', error);
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
    
    AblyLogger.log('success', 'DISCONNECT', 'Chat disconnected successfully');
  }, []);

  const sendTyping = useCallback(async (sessionId, isTyping, userId) => {
    if (sessionId === 'team-ruangdiri') return;

    const typingData = {
      sessionId,
      isTyping,
      userId,
      timestamp: new Date().toISOString()
    };

    AblyLogger.logSendAttempt('TYPING', typingData);

    try {
      if (ablyRef.current && chatChannelRef.current && connectionStatus === 'connected') {
        AblyLogger.log('info', 'TYPING', 'Sending typing via Ably chat channel');
        await chatChannelRef.current.publish('typing', typingData);
        AblyLogger.log('success', 'TYPING', 'Typing sent via Ably successfully');
      } else {
        AblyLogger.log('info', 'TYPING', 'Sending typing via API fallback');
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'Typing sent via API successfully');
      }
    } catch (error) {
      AblyLogger.log('error', 'TYPING', 'Error sending typing', error);
      try {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'API fallback succeeded');
      } catch (apiError) {
        AblyLogger.log('error', 'TYPING', 'API fallback failed', apiError);
      }
    }
  }, [connectionStatus]);

  const sendMessageViaAbly = useCallback(async (sessionId, messageData) => {
    if (sessionId === 'team-ruangdiri') return false;

    AblyLogger.logSendAttempt('MESSAGE', messageData);

    try {
      if (ablyRef.current && chatChannelRef.current && connectionStatus === 'connected') {
        AblyLogger.log('info', 'MESSAGE', 'Broadcasting message via Ably chat channel');
        await chatChannelRef.current.publish('message', messageData);
        AblyLogger.log('success', 'MESSAGE', 'Message broadcasted via Ably successfully');
        return true;
      } else {
        AblyLogger.log('warn', 'MESSAGE', 'Ably not available for message broadcast', {
          hasAbly: !!ablyRef.current,
          hasChannel: !!chatChannelRef.current,
          connectionStatus
        });
      }
    } catch (error) {
      AblyLogger.log('error', 'MESSAGE', 'Ably broadcast failed', error);
    }
    
    return false;
  }, [connectionStatus]);

  const handleTyping = useCallback((sessionId, userId, text) => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;

    AblyLogger.log('debug', 'TYPING', 'Handling typing indicator', {
      sessionId,
      userId,
      textLength: text?.length || 0,
      hasText: !!text?.trim()
    });

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

  const simulateAITyping = useCallback((callback) => {
    AblyLogger.log('info', 'AI', 'Simulating AI typing...');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      AblyLogger.log('success', 'AI', 'AI typing simulation completed');
      if (callback) callback();
    }, 1000 + Math.random() * 2000);
  }, []);

  const getConnectionInfo = useCallback(() => {
    const info = {
      status: connectionStatus,
      isConnected: ['connected', 'ai'].includes(connectionStatus),
      currentSession: currentSessionRef.current,
      chatChannel: chatChannelRef.current ? 'attached' : 'none',
      hasAbly: !!ablyRef.current?.connection?.state,
      hasNotificationSocket: notificationSocket.isSocketConnected(),
      ablyState: ablyRef.current?.connection?.state || 'none',
      hasRealtime: connectionStatus === 'connected',
      connectionId: ablyRef.current?.connection?.id,
      clientId: ablyRef.current?.connection?.clientId,
      isCleaningUp: isCleaningUpRef.current,
      cacheSize: messagesCacheRef.current.size,
      encryptionEnabled: chatEncryption.getStatus().isEnabled
    };
    
    AblyLogger.log('debug', 'INFO', 'Connection info requested', info);
    return info;
  }, [connectionStatus]);

  // Debug utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.ablyDebug = {
        logger: AblyLogger,
        connection: getConnectionInfo,
        ably: ablyRef.current,
        chatChannel: chatChannelRef.current,
        messageCache: messagesCacheRef.current,
        encryption: chatEncryption,
        forceLog: (level, category, message, data) => {
          AblyLogger.log(level, category, message, data);
        }
      };
    }
  }, [getConnectionInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      AblyLogger.log('info', 'CLEANUP', 'Component unmounting, cleaning up...');
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
