// src/components/shared/chats/hooks/useAbly.js - E2E ENHANCED: With Complete E2E Message Processing

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';
import notificationSocket from '../../notifications/lib/socket';
import e2eEncryption from '../lib/encryption';

// E2E Enhanced Ably Event Logger
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
      crypto: 'color: #FF9800; font-weight: bold;',
      e2e: 'color: #E91E63; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] ABLY-E2E-${category.toUpperCase()}:`,
      styles[level] || styles.info,
      message,
      data ? '\n🔐 E2E Data:' : '',
      data || ''
    );
  },

  logCrypto: (operation, details) => {
    console.group(`🔐 E2E ABLY ${operation.toUpperCase()}`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    Object.entries(details).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
  },

  logAblyMessage: (message, channelName, eventType, isE2E = false) => {
    console.group(`📡 ${isE2E ? 'E2E ' : ''}ABLY MESSAGE RECEIVED`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📡 Channel:', channelName);
    console.log('🎯 Event Type:', eventType);
    console.log('🆔 Message ID:', message.id);
    console.log('👤 Client ID:', message.clientId);
    console.log('⚡ Action:', message.action);
    console.log('📤 Encoding:', message.encoding);
    console.log('🏷️ Name:', message.name);
    console.log('🕐 Message Timestamp:', message.timestamp);
    console.log('🔐 Is Encrypted:', message.data?.isEncrypted || false);
    console.log('📦 Raw Data:', message.data);
    console.log('📋 Full Message Object:', message);
    console.groupEnd();
  },

  logConnection: (state, reason = null, isE2E = false) => {
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
      `${isE2E ? 'E2E ' : ''}State changed to: ${state.toUpperCase()}`,
      reason ? { reason } : null
    );
  }
};

// E2E Message Processor for Ably
const E2EMessageProcessor = {
  /**
   * Process outgoing message - encrypt before broadcasting via Ably
   */
  processOutgoing: (message, sessionId = '') => {
    AblyLogger.logCrypto('ENCRYPT_OUTGOING', {
      'Session ID': sessionId?.slice(-8) || 'none',
      'Original Length': message?.content?.length || 0,
      'Has Content': !!message?.content,
      'Message Type': message?.messageType || 'unknown',
      'Has Session Key': !!e2eEncryption.getSessionKey(sessionId)
    });
    
    try {
      // Skip encryption for team chat
      if (sessionId === 'team-ruangdiri' || !message.content) {
        return message;
      }

      // Encrypt message content if we have session key
      if (e2eEncryption.getSessionKey(sessionId)) {
        const encryptedContent = e2eEncryption.encryptMessage(message.content, sessionId);
        
        const encryptedMessage = {
          ...message,
          content: encryptedContent,
          isEncrypted: true,
          originalContent: undefined // Don't send plaintext
        };
        
        AblyLogger.logCrypto('ENCRYPT_SUCCESS', {
          'Original Length': message.content.length,
          'Encrypted Length': encryptedContent.length,
          'Session ID': sessionId?.slice(-8),
          'Encryption Status': e2eEncryption.getStatus()
        });
        
        return encryptedMessage;
      }
      
      return message;
    } catch (error) {
      AblyLogger.log('error', 'CRYPTO', 'Outgoing encryption failed, sending plaintext', error);
      return message; // Fallback to unencrypted
    }
  },

  /**
   * Process incoming message - decrypt received data from Ably
   */
  processIncoming: (processedMessage, sessionId = '') => {
    AblyLogger.logCrypto('DECRYPT_INCOMING', {
      'Session ID': sessionId?.slice(-8) || 'none',
      'Has Content': !!processedMessage?.content,
      'Is Encrypted': !!processedMessage?.isEncrypted,
      'Message Type': processedMessage?.messageType || 'unknown',
      'Has Session Key': !!e2eEncryption.getSessionKey(sessionId)
    });
    
    try {
      // Skip decryption for team chat or non-encrypted messages
      if (sessionId === 'team-ruangdiri' || !processedMessage.isEncrypted || !processedMessage.content) {
        return processedMessage;
      }

      // Decrypt message content if encrypted
      if (e2eEncryption.getSessionKey(sessionId)) {
        const decryptedContent = e2eEncryption.decryptMessage(processedMessage.content, sessionId);
        
        const decryptedMessage = {
          ...processedMessage,
          content: decryptedContent,
          message: decryptedContent, // Also map to message field for consistency
          wasEncrypted: true
        };
        
        AblyLogger.logCrypto('DECRYPT_SUCCESS', {
          'Encrypted Length': processedMessage.content.length,
          'Decrypted Length': decryptedContent.length,
          'Session ID': sessionId?.slice(-8),
          'Was Successfully Decrypted': processedMessage.content !== decryptedContent
        });
        
        return decryptedMessage;
      } else {
        AblyLogger.log('warn', 'CRYPTO', 'No session key available for decryption', {
          sessionId: sessionId?.slice(-8),
          isEncrypted: processedMessage.isEncrypted
        });
        
        return processedMessage; // Return encrypted if no key
      }
      
    } catch (error) {
      AblyLogger.log('error', 'CRYPTO', 'Incoming decryption failed, returning as-is', error);
      return processedMessage; // Fallback to encrypted text
    }
  }
};

export const useAbly = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);

  const ablyRef = useRef(null);
  const channelsRef = useRef({});
  const currentSessionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  
  // Callback refs
  const onMessageRef = useRef(null);
  const onSessionStatusRef = useRef(null);
  const onTypingRef = useRef(null);
  const onUnreadCountRef = useRef(null);

  // E2E Enhanced connection status handler
  const handleConnectionStatusChange = useCallback((state, reason = null) => {
    const isE2E = currentSessionRef.current !== 'team-ruangdiri';
    AblyLogger.logConnection(state, reason, isE2E);
    setConnectionStatus(state);
    
    // Store enhanced connection info for debugging
    if (typeof window !== 'undefined') {
      window.ablyConnectionInfo = {
        state,
        reason,
        timestamp: new Date().toISOString(),
        ablyState: ablyRef.current?.connection?.state,
        channels: Object.keys(channelsRef.current),
        currentSession: currentSessionRef.current,
        encryptionStatus: e2eEncryption.getStatus(),
        isE2ESession: isE2E,
        hasSessionKey: !!e2eEncryption.getSessionKey(currentSessionRef.current)
      };
    }
  }, []);

  // Memoize setCallbacks to prevent re-renders
  const setCallbacks = useCallback((callbacks) => {
    AblyLogger.log('info', 'SETUP', 'Setting E2E Ably callbacks', {
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

  // E2E Enhanced connect function
  const connect = useCallback(async (sessionId, userId) => {
    try {
      currentSessionRef.current = sessionId;
      const isE2E = sessionId !== 'team-ruangdiri';
      
      AblyLogger.log('info', 'CONNECT', `Connecting to ${isE2E ? 'E2E' : 'AI'} session: ${sessionId}`, { 
        userId,
        encryptionEnabled: e2eEncryption.getStatus().isEnabled,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId),
        sessionType: isE2E ? 'E2E Counseling' : 'AI Chat'
      });

      // Handle AI Team RuangDiri session (no E2E)
      if (sessionId === 'team-ruangdiri') {
        handleConnectionStatusChange('ai');
        AblyLogger.log('success', 'CONNECT', 'Connected to AI Team RuangDiri (no E2E)');
        return true;
      }

      handleConnectionStatusChange('connecting');

      // E2E Enhanced Socket.io setup
      try {
        AblyLogger.log('info', 'SOCKET', 'Setting up Socket.io with E2E support...');
        
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }
        
        // Cleanup existing listeners first
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        
        // Register E2E enhanced listeners
        notificationSocket.on('chat:enable-chat', (payload) => {
          AblyLogger.log('event', 'SOCKET', 'chat:enable-chat received (E2E)', {
            ...payload,
            hasSessionKey: !!e2eEncryption.getSessionKey(payload.sessionId)
          });
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
          AblyLogger.log('event', 'SOCKET', 'chat:initial-message received (E2E)', {
            ...payload,
            hasSessionKey: !!e2eEncryption.getSessionKey(payload.sessionId)
          });
          
          // Process E2E message if encrypted
          const processedPayload = E2EMessageProcessor.processIncoming(payload, payload.sessionId);
          
          if (onMessageRef.current) {
            onMessageRef.current(processedPayload);
          }
        });

        AblyLogger.log('success', 'SOCKET', 'Socket.io connected with E2E support');
      } catch (error) {
        AblyLogger.log('warn', 'SOCKET', 'Socket.io setup failed, continuing with Ably only', error);
      }

      // Disconnect existing Ably
      if (ablyRef.current) {
        AblyLogger.log('info', 'CLEANUP', 'Closing existing Ably connection...');
        try {
          ablyRef.current.close();
        } catch (e) {
          AblyLogger.log('warn', 'CLEANUP', 'Error closing Ably', e);
        }
        ablyRef.current = null;
      }
      channelsRef.current = {};

      // Get Ably token for E2E session
      AblyLogger.log('info', 'TOKEN', 'Requesting Ably token for E2E session...');
      const tokenData = await chatsApi.getAblyToken(sessionId);
      
      if (!tokenData) {
        AblyLogger.log('warn', 'TOKEN', 'No Ably token available for E2E session');
        handleConnectionStatusChange('disconnected');
        return false;
      }

      AblyLogger.log('success', 'TOKEN', 'E2E Ably token received', {
        sessionId: tokenData.sessionId,
        channels: tokenData.channels,
        expiresAt: tokenData.expiresAt
      });

      // Create REAL Ably client with E2E enhanced logging
      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          AblyLogger.log('info', 'AUTH', 'E2E Ably auth callback triggered');
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

      // Get channels using exact names from backend
      const chatChannel = ably.channels.get(tokenData.channels.chat);
      const typingChannel = ably.channels.get(tokenData.channels.typing);
      
      channelsRef.current = { 
        chat: chatChannel, 
        typing: typingChannel,
        chatChannelName: tokenData.channels.chat,
        typingChannelName: tokenData.channels.typing
      };

      AblyLogger.log('info', 'CHANNELS', 'Setting up E2E Ably channels', {
        chatChannel: tokenData.channels.chat,
        typingChannel: tokenData.channels.typing,
        hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
      });

      // E2E Enhanced message handlers
      const handleChatMessage = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'CHAT_MESSAGE', true);
        
        // Process incoming E2E encrypted message
        const processedData = E2EMessageProcessor.processIncoming(message.data, sessionId);
        
        if (processedData.senderId !== userId && onMessageRef.current) {
          AblyLogger.log('info', 'MESSAGE', 'Processing incoming E2E chat message', {
            senderId: processedData.senderId,
            currentUserId: userId,
            messageType: processedData.messageType,
            hasText: !!(processedData.content || processedData.message),
            wasEncrypted: processedData.wasEncrypted || false
          });
          onMessageRef.current(processedData);
        } else {
          AblyLogger.log('debug', 'MESSAGE', 'Ignoring own E2E message or no handler', {
            isOwnMessage: processedData.senderId === userId,
            hasHandler: !!onMessageRef.current
          });
        }
      };

      const handleSessionStatus = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'SESSION_STATUS', true);
        if (onSessionStatusRef.current) {
          onSessionStatusRef.current(message.data);
        }
      };

      const handleAutomatedMessage = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'AUTOMATED_MESSAGE', true);
        if (onMessageRef.current) {
          // Process automated messages (might be encrypted)
          const processedData = E2EMessageProcessor.processIncoming({
            ...message.data,
            isAutomated: true,
            messageType: 'automated'
          }, sessionId);
          
          onMessageRef.current(processedData);
        }
      };

      const handleUnreadCount = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'UNREAD_COUNT', true);
        if (onUnreadCountRef.current) {
          onUnreadCountRef.current(message.data);
        }
      };

      const handleTypingIndicator = (message) => {
        AblyLogger.log('event', 'TYPING', 'E2E typing indicator received', {
          userId: message.data?.userId,
          isTyping: message.data?.isTyping,
          sessionId: message.data?.sessionId
        });
        
        const { isTyping: typing, userId: typingUserId } = message.data;
        
        if (typingUserId !== userId) {
          setIsTyping(typing);
          
          if (onTypingRef.current) {
            onTypingRef.current({
              ...message.data,
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
              AblyLogger.log('debug', 'TYPING', 'Auto-cleared E2E typing indicator after timeout');
            }, 5000);
          }
        }
      };

      // Enhanced channel event handlers with E2E logging
      const setupChannelLogging = (channel, channelName) => {
        channel.on('attached', () => {
          AblyLogger.log('success', 'CHANNEL', `E2E ${channelName} channel successfully attached`);
        });

        channel.on('detached', () => {
          AblyLogger.log('warn', 'CHANNEL', `E2E ${channelName} channel detached`);
        });

        channel.on('failed', (error) => {
          AblyLogger.log('error', 'CHANNEL', `E2E ${channelName} channel failed`, { error });
        });

        channel.on('suspended', () => {
          AblyLogger.log('warn', 'CHANNEL', `E2E ${channelName} channel suspended`);
        });
      };

      // Setup channel logging
      setupChannelLogging(chatChannel, 'CHAT');
      setupChannelLogging(typingChannel, 'TYPING');

      // Subscribe to E2E channels
      AblyLogger.log('info', 'SUBSCRIBE', 'Subscribing to E2E Ably channels...');
      
      chatChannel.subscribe('message', handleChatMessage);
      chatChannel.subscribe('session_status', handleSessionStatus);
      chatChannel.subscribe('automated_message', handleAutomatedMessage);
      chatChannel.subscribe('unread_count_update', handleUnreadCount);
      typingChannel.subscribe('typing', handleTypingIndicator);

      // E2E Enhanced connection handlers
      ably.connection.on('connected', () => {
        handleConnectionStatusChange('connected');
        AblyLogger.log('success', 'CONNECTION', 'E2E Ably connection established', {
          connectionId: ably.connection.id,
          connectionKey: ably.connection.key,
          clientId: ably.connection.clientId,
          sessionId: sessionId?.slice(-8),
          hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
        });
      });

      ably.connection.on('disconnected', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('failed', (error) => {
        handleConnectionStatusChange('failed', error);
        AblyLogger.log('error', 'CONNECTION', 'E2E connection failed', error);
      });

      ably.connection.on('suspended', () => {
        handleConnectionStatusChange('disconnected');
      });

      ably.connection.on('closed', () => {
        handleConnectionStatusChange('disconnected');
      });

      // E2E Enhanced token refresh
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = setInterval(async () => {
        try {
          AblyLogger.log('info', 'TOKEN', 'Refreshing E2E Ably token...');
          const newTokenData = await chatsApi.getAblyToken(sessionId);
          if (newTokenData && ablyRef.current) {
            await ablyRef.current.auth.authorize(newTokenData.token);
            AblyLogger.log('success', 'TOKEN', 'E2E token refreshed successfully');
          }
        } catch (error) {
          AblyLogger.log('error', 'TOKEN', 'E2E token refresh failed', error);
        }
      }, 25 * 60 * 1000);

      return true;
    } catch (error) {
      AblyLogger.log('error', 'CONNECT', 'E2E chat connection failed', error);
      handleConnectionStatusChange('failed');
      return false;
    }
  }, []);

  // E2E Enhanced disconnect function
  const disconnect = useCallback(() => {
    const isE2E = currentSessionRef.current !== 'team-ruangdiri';
    AblyLogger.log('info', 'DISCONNECT', `Disconnecting ${isE2E ? 'E2E' : 'AI'} chat...`);
    
    // Clear intervals and timeouts
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Remove socket.io listeners
    notificationSocket.off('chat:enable-chat');
    notificationSocket.off('chat:initial-message');

    // Unsubscribe from Ably channels
    if (channelsRef.current.chat) {
      try {
        AblyLogger.log('info', 'UNSUBSCRIBE', 'Unsubscribing from E2E chat channel...');
        channelsRef.current.chat.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error unsubscribing E2E chat', error);
      }
    }

    if (channelsRef.current.typing) {
      try {
        AblyLogger.log('info', 'UNSUBSCRIBE', 'Unsubscribing from E2E typing channel...');
        channelsRef.current.typing.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error unsubscribing E2E typing', error);
      }
    }

    channelsRef.current = {};

    // Close Ably connection
    if (ablyRef.current) {
      try {
        AblyLogger.log('info', 'CLOSE', 'Closing E2E Ably connection...');
        ablyRef.current.close();
      } catch (error) {
        AblyLogger.log('error', 'CLOSE', 'Error closing E2E Ably', error);
      }
      ablyRef.current = null;
    }

    // Reset state
    currentSessionRef.current = null;
    handleConnectionStatusChange('disconnected');
    setIsTyping(false);
    
    AblyLogger.log('success', 'DISCONNECT', `${isE2E ? 'E2E' : 'AI'} chat disconnected successfully`);
  }, []);

  // E2E Enhanced sendTyping function
  const sendTyping = useCallback(async (sessionId, isTyping, userId) => {
    if (sessionId === 'team-ruangdiri') return;

    const typingData = {
      sessionId,
      isTyping,
      userId,
      timestamp: new Date().toISOString()
    };

    AblyLogger.log('info', 'TYPING', 'Sending E2E typing indicator', {
      sessionId: sessionId?.slice(-8),
      isTyping,
      hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
    });

    try {
      // Send via Ably if available
      if (ablyRef.current && channelsRef.current.typing && connectionStatus === 'connected') {
        AblyLogger.log('info', 'TYPING', 'Sending typing via E2E Ably');
        await channelsRef.current.typing.publish('typing', typingData);
        AblyLogger.log('success', 'TYPING', 'E2E typing sent via Ably successfully');
      } else {
        // Fallback to API
        AblyLogger.log('info', 'TYPING', 'Sending typing via API fallback (E2E)');
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'E2E typing sent via API successfully');
      }
    } catch (error) {
      AblyLogger.log('error', 'TYPING', 'Error sending E2E typing', error);
      // Fallback to API
      try {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'E2E API fallback succeeded');
      } catch (apiError) {
        AblyLogger.log('error', 'TYPING', 'E2E API fallback failed', apiError);
      }
    }
  }, [connectionStatus]);

  // E2E Enhanced sendMessageViaAbly function with encryption
  const sendMessageViaAbly = useCallback(async (sessionId, messageData) => {
    if (sessionId === 'team-ruangdiri') return false;

    AblyLogger.log('crypto', 'SEND_MESSAGE', 'Preparing E2E message for Ably broadcast', {
      sessionId: sessionId?.slice(-8),
      hasContent: !!messageData?.content,
      hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
    });

    try {
      if (ablyRef.current && channelsRef.current.chat && connectionStatus === 'connected') {
        // Process outgoing message with E2E encryption for Ably broadcast
        const processedData = E2EMessageProcessor.processOutgoing(messageData, sessionId);
        
        AblyLogger.log('info', 'MESSAGE', 'Broadcasting E2E encrypted message via Ably');
        await channelsRef.current.chat.publish('message', processedData);
        AblyLogger.log('success', 'MESSAGE', 'E2E encrypted message broadcasted successfully');
        return true;
      } else {
        AblyLogger.log('warn', 'MESSAGE', 'E2E Ably not available for message broadcast', {
          hasAbly: !!ablyRef.current,
          hasChannel: !!channelsRef.current.chat,
          connectionStatus
        });
      }
    } catch (error) {
      AblyLogger.log('error', 'MESSAGE', 'E2E Ably broadcast failed', error);
    }
    
    return false;
  }, [connectionStatus]);

  // E2E Enhanced handleTyping function
  const handleTyping = useCallback((sessionId, userId, text) => {
    if (!sessionId || sessionId === 'team-ruangdiri') return;

    AblyLogger.log('debug', 'TYPING', 'Handling E2E typing indicator', {
      sessionId: sessionId?.slice(-8),
      userId,
      textLength: text?.length || 0,
      hasText: !!text?.trim(),
      hasSessionKey: !!e2eEncryption.getSessionKey(sessionId)
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

  // Simulate AI typing (unchanged)
  const simulateAITyping = useCallback((callback) => {
    AblyLogger.log('info', 'AI', 'Simulating AI typing...');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      AblyLogger.log('success', 'AI', 'AI typing simulation completed');
      if (callback) callback();
    }, 1000 + Math.random() * 2000);
  }, []);

  // E2E Enhanced getConnectionInfo function
  const getConnectionInfo = useCallback(() => {
    const currentSession = currentSessionRef.current;
    const isE2E = currentSession !== 'team-ruangdiri';
    
    const info = {
      status: connectionStatus,
      isConnected: ['connected', 'ai'].includes(connectionStatus),
      currentSession: currentSession,
      channels: channelsRef.current,
      hasAbly: !!ablyRef.current?.connection?.state,
      hasNotificationSocket: notificationSocket.isSocketConnected(),
      ablyState: ablyRef.current?.connection?.state || 'none',
      hasRealtime: connectionStatus === 'connected',
      connectionId: ablyRef.current?.connection?.id,
      clientId: ablyRef.current?.connection?.clientId,
      // E2E specific info
      isE2ESession: isE2E,
      hasSessionKey: !!e2eEncryption.getSessionKey(currentSession),
      encryptionStatus: e2eEncryption.getStatus(),
      sessionKeys: e2eEncryption.sessionKeys?.size || 0
    };
    
    AblyLogger.log('debug', 'INFO', 'E2E Connection info requested', info);
    return info;
  }, [connectionStatus]);

  // E2E Enhanced debug utilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.ablyDebug = {
        logger: AblyLogger,
        processor: E2EMessageProcessor,
        encryption: e2eEncryption,
        connection: getConnectionInfo,
        ably: ablyRef.current,
        channels: channelsRef.current,
        forceLog: (level, category, message, data) => {
          AblyLogger.log(level, category, message, data);
        },
        // E2E test utilities
        testE2EEncryption: (message = 'Test E2E message', sessionId = 'test-session') => {
          const testData = { content: message, sessionId, messageType: 'text' };
          const encrypted = E2EMessageProcessor.processOutgoing(testData, sessionId);
          const decrypted = E2EMessageProcessor.processIncoming(encrypted, sessionId);
          console.log('🔐 E2E Ably encryption test:', { 
            original: testData, 
            encrypted, 
            decrypted,
            success: testData.content === decrypted.content
          });
          return { encrypted, decrypted };
        },
        testMessage: (sessionId, message = 'Test from debugChat') => {
          if (sessionId && ablyRef.current && channelsRef.current.chat) {
            const testData = E2EMessageProcessor.processOutgoing({
              content: message,
              senderId: 'debug-user',
              messageType: 'text'
            }, sessionId);
            
            channelsRef.current.chat.publish('message', testData);
            console.log('📤 Test E2E message sent:', testData);
          }
        },
        testTyping: (sessionId, duration = 3000) => {
          if (sessionId && ablyRef.current && channelsRef.current.typing) {
            const typingData = {
              sessionId,
              isTyping: true,
              userId: 'debug-user',
              timestamp: new Date().toISOString()
            };
            
            channelsRef.current.typing.publish('typing', typingData);
            console.log('⌨️ Test E2E typing sent:', typingData);
            
            setTimeout(() => {
              channelsRef.current.typing.publish('typing', { ...typingData, isTyping: false });
              console.log('⌨️ Test E2E typing stopped');
            }, duration);
          }
        },
        // Performance monitoring
        monitor: {
          messageCount: 0,
          errorCount: 0,
          startTime: Date.now(),
          recordMessage: (messageData) => {
            window.ablyDebug.monitor.messageCount++;
          },
          recordError: (error) => {
            window.ablyDebug.monitor.errorCount++;
          },
          getSummary: () => ({
            uptime: Date.now() - window.ablyDebug.monitor.startTime,
            messageCount: window.ablyDebug.monitor.messageCount,
            errorCount: window.ablyDebug.monitor.errorCount,
            connectionStatus,
            isE2ESession: currentSessionRef.current !== 'team-ruangdiri',
            hasSessionKey: !!e2eEncryption.getSessionKey(currentSessionRef.current)
          })
        }
      };
    }
  }, [getConnectionInfo, connectionStatus]);

  // Cleanup on unmount with E2E cleanup
  useEffect(() => {
    return () => {
      AblyLogger.log('info', 'CLEANUP', 'Component unmounting, cleaning up E2E...');
      disconnect();
    };
  }, [disconnect]);

  // Memoize return object with E2E enhancements
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
    // E2E Enhanced utilities
    logger: AblyLogger,
    processor: E2EMessageProcessor,
    encryption: e2eEncryption,
    // E2E specific properties
    isE2ESession: currentSessionRef.current !== 'team-ruangdiri',
    hasSessionKey: !!e2eEncryption.getSessionKey(currentSessionRef.current),
    getE2EStatus: () => ({
      isE2ESession: currentSessionRef.current !== 'team-ruangdiri',
      hasSessionKey: !!e2eEncryption.getSessionKey(currentSessionRef.current),
      encryptionStatus: e2eEncryption.getStatus(),
      currentSession: currentSessionRef.current
    })
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
    getConnectionInfo
  ]);
};