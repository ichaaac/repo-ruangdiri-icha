// src/components/shared/chats/hooks/useAbly.js - ENHANCED: Detailed Logging & Debugging

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';
import notificationSocket from '../../notifications/lib/socket';

// 🆕 ENHANCED: Detailed Ably Event Logger
const AblyLogger = {
  // Log with styled colors for better readability
  log: (level, category, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const styles = {
      error: 'color: #FF6B6B; font-weight: bold;',
      warn: 'color: #FFB74D; font-weight: bold;',
      info: 'color: #4FC3F7; font-weight: bold;',
      success: 'color: #66BB6A; font-weight: bold;',
      debug: 'color: #9575CD; font-weight: bold;',
      event: 'color: #26A69A; font-weight: bold;'
    };

    console.log(
      `%c[${timestamp}] ABLY-${category.toUpperCase()}:`,
      styles[level] || styles.info,
      message,
      data ? '\n📦 Data:' : '',
      data || ''
    );
  },

  // Log raw Ably message structure
  logAblyMessage: (message, channelName, eventType) => {
    console.group(`🔔 ABLY MESSAGE RECEIVED`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📡 Channel:', channelName);
    console.log('🎯 Event Type:', eventType);
    console.log('🆔 Message ID:', message.id);
    console.log('👤 Client ID:', message.clientId);
    console.log('⚡ Action:', message.action);
    console.log('🔤 Encoding:', message.encoding);
    console.log('📝 Name:', message.name);
    console.log('🕐 Message Timestamp:', message.timestamp);
    console.log('📦 Raw Data:', message.data);
    console.log('🔍 Full Message Object:', message);
    console.groupEnd();
  },

  // Log connection state changes
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

  // Log channel events
  logChannel: (channelName, eventType, details) => {
    AblyLogger.log('event', 'CHANNEL', `${channelName} - ${eventType}`, details);
  },

  // Log typing events with details
  logTyping: (data, channelName) => {
    // console.group(`⌨️ TYPING EVENT`);
    // console.log('📡 Channel:', channelName);
    // console.log('👤 User ID:', data.userId);
    // console.log('📝 User Name:', data.userName || data.senderName || 'Unknown');
    // console.log('⌨️ Is Typing:', data.isTyping);
    // console.log('🆔 Session ID:', data.sessionId);
    // console.log('⏰ Timestamp:', data.timestamp);
    // console.log('📦 Full Data:', data);
    // console.groupEnd();
  },

  // Log message send attempts
  logSendAttempt: (type, data) => {
    console.group(`📤 SENDING ${type.toUpperCase()}`);
    console.log('⏰ Timestamp:', new Date().toLocaleTimeString('id-ID'));
    console.log('📦 Data being sent:', data);
    console.groupEnd();
  }
};

// 🆕 SIMPLE: Message processing (no crypto for now)
const MessageProcessor = {
  // Simple pass-through for now
  process: (message) => {
    AblyLogger.log('debug', 'PROCESS', 'Processing message', { message });
    return message;
  },

  // Simple pass-through for now
  unprocess: (processedMessage) => {
    AblyLogger.log('debug', 'PROCESS', 'Unprocessing message', { processedMessage });
    return processedMessage;
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

  // 🆕 ENHANCED: Enhanced connection status handler
  const handleConnectionStatusChange = useCallback((state, reason = null) => {
    AblyLogger.logConnection(state, reason);
    setConnectionStatus(state);
    
    // Store connection info for debugging
    if (typeof window !== 'undefined') {
      window.ablyConnectionInfo = {
        state,
        reason,
        timestamp: new Date().toISOString(),
        ablyState: ablyRef.current?.connection?.state,
        channels: Object.keys(channelsRef.current),
        currentSession: currentSessionRef.current
      };
    }
  }, []);

  // ✅ FIXED: Memoize setCallbacks to prevent re-renders
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

  // ✅ FIXED: Memoize connect function to prevent re-renders
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

      // 🆕 ENHANCED: Setup Socket.io with detailed logging
      try {
        AblyLogger.log('info', 'SOCKET', 'Setting up Socket.io connection...');
        
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }
        
        // Cleanup existing listeners first
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        
        // Register new listeners with enhanced logging
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
        channels: tokenData.channels,
        expiresAt: tokenData.expiresAt
      });

      // Create REAL Ably client with enhanced logging
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
          level: 4, // Enable verbose logging
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

      AblyLogger.log('info', 'CHANNELS', 'Setting up Ably channels', {
        chatChannel: tokenData.channels.chat,
        typingChannel: tokenData.channels.typing
      });

      // 🆕 ENHANCED: Message handlers with detailed logging
      const handleChatMessage = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'CHAT_MESSAGE');
        
        // 🆕 PROCESS: Simple message processing (no crypto for now)
        const processedData = MessageProcessor.unprocess(message.data);
        
        if (processedData.senderId !== userId && onMessageRef.current) {
          AblyLogger.log('info', 'MESSAGE', 'Processing incoming chat message', {
            senderId: processedData.senderId,
            currentUserId: userId,
            messageType: processedData.messageType,
            hasText: !!processedData.message
          });
          onMessageRef.current(processedData);
        } else {
          AblyLogger.log('debug', 'MESSAGE', 'Ignoring own message or no handler', {
            isOwnMessage: processedData.senderId === userId,
            hasHandler: !!onMessageRef.current
          });
        }
      };

      const handleSessionStatus = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'SESSION_STATUS');
        if (onSessionStatusRef.current) {
          onSessionStatusRef.current(message.data);
        }
      };

      const handleAutomatedMessage = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'AUTOMATED_MESSAGE');
        if (onMessageRef.current) {
          onMessageRef.current({
            ...message.data,
            isAutomated: true,
            messageType: 'automated'
          });
        }
      };

      const handleUnreadCount = (message) => {
        AblyLogger.logAblyMessage(message, tokenData.channels.chat, 'UNREAD_COUNT');
        if (onUnreadCountRef.current) {
          onUnreadCountRef.current(message.data);
        }
      };

      const handleTypingIndicator = (message) => {
        AblyLogger.logTyping(message.data, tokenData.channels.typing);
        
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
              AblyLogger.log('debug', 'TYPING', 'Auto-cleared typing indicator after timeout');
            }, 5000);
          }
        }
      };

      // 🆕 ENHANCED: Channel event handlers with logging
      const setupChannelLogging = (channel, channelName) => {
        channel.on('attached', () => {
          AblyLogger.logChannel(channelName, 'ATTACHED', 'Channel successfully attached');
        });

        channel.on('detached', () => {
          AblyLogger.logChannel(channelName, 'DETACHED', 'Channel detached');
        });

        channel.on('failed', (error) => {
          AblyLogger.logChannel(channelName, 'FAILED', { error });
        });

        channel.on('suspended', () => {
          AblyLogger.logChannel(channelName, 'SUSPENDED', 'Channel suspended');
        });
      };

      // Setup channel logging
      setupChannelLogging(chatChannel, 'CHAT');
      setupChannelLogging(typingChannel, 'TYPING');

      // Subscribe to channels with enhanced logging
      AblyLogger.log('info', 'SUBSCRIBE', 'Subscribing to Ably channels...');
      
      chatChannel.subscribe('message', handleChatMessage);
      chatChannel.subscribe('session_status', handleSessionStatus);
      chatChannel.subscribe('automated_message', handleAutomatedMessage);
      chatChannel.subscribe('unread_count_update', handleUnreadCount);
      typingChannel.subscribe('typing', handleTypingIndicator);

      // 🆕 ENHANCED: Connection handlers with detailed logging
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

      // 🆕 ENHANCED: Setup token refresh with logging
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
  }, []); // ✅ FIXED: Empty dependency array

  // ✅ FIXED: Memoize disconnect function
  const disconnect = useCallback(() => {
    AblyLogger.log('info', 'DISCONNECT', 'Disconnecting chat...');
    
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
        AblyLogger.log('info', 'UNSUBSCRIBE', 'Unsubscribing from chat channel...');
        channelsRef.current.chat.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error unsubscribing chat', error);
      }
    }

    if (channelsRef.current.typing) {
      try {
        AblyLogger.log('info', 'UNSUBSCRIBE', 'Unsubscribing from typing channel...');
        channelsRef.current.typing.unsubscribe();
      } catch (error) {
        AblyLogger.log('error', 'UNSUBSCRIBE', 'Error unsubscribing typing', error);
      }
    }

    channelsRef.current = {};

    // Close Ably connection
    if (ablyRef.current) {
      try {
        AblyLogger.log('info', 'CLOSE', 'Closing Ably connection...');
        ablyRef.current.close();
      } catch (error) {
        AblyLogger.log('error', 'CLOSE', 'Error closing Ably', error);
      }
      ablyRef.current = null;
    }

    // Reset state
    currentSessionRef.current = null;
    handleConnectionStatusChange('disconnected');
    setIsTyping(false);
    
    AblyLogger.log('success', 'DISCONNECT', 'Chat disconnected successfully');
  }, []); // ✅ FIXED: Empty dependency array

  // ✅ FIXED: Memoize sendTyping function
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
      // Send via Ably if available
      if (ablyRef.current && channelsRef.current.typing && connectionStatus === 'connected') {
        AblyLogger.log('info', 'TYPING', 'Sending typing via Ably');
        await channelsRef.current.typing.publish('typing', typingData);
        AblyLogger.log('success', 'TYPING', 'Typing sent via Ably successfully');
      } else {
        // Fallback to API
        AblyLogger.log('info', 'TYPING', 'Sending typing via API fallback');
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'Typing sent via API successfully');
      }
    } catch (error) {
      AblyLogger.log('error', 'TYPING', 'Error sending typing', error);
      // Fallback to API
      try {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
        AblyLogger.log('success', 'TYPING', 'API fallback succeeded');
      } catch (apiError) {
        AblyLogger.log('error', 'TYPING', 'API fallback failed', apiError);
      }
    }
  }, [connectionStatus]);

  // ✅ FIXED: Memoize sendMessageViaAbly function
  const sendMessageViaAbly = useCallback(async (sessionId, messageData) => {
    if (sessionId === 'team-ruangdiri') return false;

    AblyLogger.logSendAttempt('MESSAGE', messageData);

    try {
      if (ablyRef.current && channelsRef.current.chat && connectionStatus === 'connected') {
        // 🆕 PROCESS: Simple message processing (no crypto for now)
        const processedData = MessageProcessor.process(messageData);
        
        AblyLogger.log('info', 'MESSAGE', 'Broadcasting message via Ably');
        await channelsRef.current.chat.publish('message', processedData);
        AblyLogger.log('success', 'MESSAGE', 'Message broadcasted via Ably successfully');
        return true;
      } else {
        AblyLogger.log('warn', 'MESSAGE', 'Ably not available for message broadcast', {
          hasAbly: !!ablyRef.current,
          hasChannel: !!channelsRef.current.chat,
          connectionStatus
        });
      }
    } catch (error) {
      AblyLogger.log('error', 'MESSAGE', 'Ably broadcast failed', error);
    }
    
    return false;
  }, [connectionStatus]);

  // ✅ FIXED: Memoize handleTyping function
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

  // ✅ FIXED: Memoize simulateAITyping function
  const simulateAITyping = useCallback((callback) => {
    AblyLogger.log('info', 'AI', 'Simulating AI typing...');
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      AblyLogger.log('success', 'AI', 'AI typing simulation completed');
      if (callback) callback();
    }, 1000 + Math.random() * 2000);
  }, []);

  // ✅ FIXED: Memoize getConnectionInfo function
  const getConnectionInfo = useCallback(() => {
    const info = {
      status: connectionStatus,
      isConnected: ['connected', 'ai'].includes(connectionStatus),
      currentSession: currentSessionRef.current,
      channels: channelsRef.current,
      hasAbly: !!ablyRef.current?.connection?.state,
      hasNotificationSocket: notificationSocket.isSocketConnected(),
      ablyState: ablyRef.current?.connection?.state || 'none',
      hasRealtime: connectionStatus === 'connected',
      connectionId: ablyRef.current?.connection?.id,
      clientId: ablyRef.current?.connection?.clientId
    };
    
    AblyLogger.log('debug', 'INFO', 'Connection info requested', info);
    return info;
  }, [connectionStatus]);

  // 🆕 ENHANCED: Debug utilities for window access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.ablyDebug = {
        logger: AblyLogger,
        processor: MessageProcessor,
        connection: getConnectionInfo,
        ably: ablyRef.current,
        channels: channelsRef.current,
        forceLog: (level, category, message, data) => {
          AblyLogger.log(level, category, message, data);
        },
        // Test message processing
        testProcessor: (message) => {
          const processed = MessageProcessor.process(message);
          const unprocessed = MessageProcessor.unprocess(processed);
          console.log('🔄 Processor test:', { original: message, processed, unprocessed });
          return { processed, unprocessed };
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

  // ✅ FIXED: Memoize return object to prevent re-renders
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
    // 🆕 ENHANCED: Expose utilities for debugging
    logger: AblyLogger,
    processor: MessageProcessor
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