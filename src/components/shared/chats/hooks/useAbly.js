// src/components/shared/chats/hooks/useAbly.js - FIXED: Infinite Rendering

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';
import notificationSocket from '../../notifications/lib/socket';

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

  // ✅ FIXED: Memoize setCallbacks to prevent re-renders
  const setCallbacks = useCallback((callbacks) => {
    onMessageRef.current = callbacks.onMessage || null;
    onSessionStatusRef.current = callbacks.onSessionStatus || null;
    onTypingRef.current = callbacks.onTyping || null;
    onUnreadCountRef.current = callbacks.onUnreadCount || null;
  }, []);

  // ✅ FIXED: Memoize connect function to prevent re-renders
  const connect = useCallback(async (sessionId, userId) => {
    try {
      currentSessionRef.current = sessionId;

      // Handle AI Team RuangDiri session
      if (sessionId === 'team-ruangdiri') {
        setConnectionStatus('ai');
        console.log('🤖 Connected to AI Team RuangDiri');
        return true;
      }

      console.log('🚀 Connecting to chat for session:', sessionId);
      setConnectionStatus('connecting');

      // ✅ FIXED: Setup Socket.io for invalidation - memoized handlers
      try {
        console.log('📡 Ensuring notification socket...');
        if (!notificationSocket.isSocketConnected()) {
          await notificationSocket.connect();
        }
        
        // Cleanup existing listeners first
        notificationSocket.off('chat:enable-chat');
        notificationSocket.off('chat:initial-message');
        
        // Register new listeners
        notificationSocket.on('chat:enable-chat', (payload) => {
          console.log('🔄 Chat enable/disable event:', payload);
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
          console.log('📨 Initial message event:', payload);
          if (onMessageRef.current) {
            onMessageRef.current(payload);
          }
        });

        console.log('✅ Socket.io connected for chat events');
      } catch (error) {
        console.warn('⚠️ Socket.io failed, continuing with Ably only:', error);
      }

      // Disconnect existing Ably
      if (ablyRef.current) {
        console.log('🔌 Closing existing Ably...');
        try {
          ablyRef.current.close();
        } catch (e) {
          console.warn('Error closing Ably:', e);
        }
        ablyRef.current = null;
      }
      channelsRef.current = {};

      // Get Ably token
      const tokenData = await chatsApi.getAblyToken(sessionId);
      
      if (!tokenData) {
        console.log('🔒 No Ably token available');
        setConnectionStatus('disconnected');
        return false;
      }

      console.log('🎫 Got Ably token:', {
        sessionId: tokenData.sessionId,
        channels: tokenData.channels
      });

      // Create REAL Ably client
      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          console.log('🔑 Ably auth callback');
          callback(null, tokenData.token);
        },
        clientId: userId,
        disconnectedRetryTimeout: 5000,
        suspendedRetryTimeout: 10000,
        autoConnect: true,
        echoMessages: false
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

      console.log('📡 Subscribing to Ably channels...');

      // ✅ FIXED: Memoized channel handlers
      const handleChatMessage = (message) => {
        console.log('📨 Ably chat message:', message.data);
        
        if (message.data.senderId !== userId && onMessageRef.current) {
          onMessageRef.current(message.data);
        }
      };

      const handleSessionStatus = (message) => {
        console.log('📊 Ably session status:', message.data);
        if (onSessionStatusRef.current) {
          onSessionStatusRef.current(message.data);
        }
      };

      const handleAutomatedMessage = (message) => {
        console.log('🤖 Ably automated message:', message.data);
        if (onMessageRef.current) {
          onMessageRef.current({
            ...message.data,
            isAutomated: true,
            messageType: 'automated'
          });
        }
      };

      const handleUnreadCount = (message) => {
        console.log('🔢 Ably unread count update:', message.data);
        if (onUnreadCountRef.current) {
          onUnreadCountRef.current(message.data);
        }
      };

      const handleTypingIndicator = (message) => {
        console.log('⌨️ Ably typing:', message.data);
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
            }, 5000);
          }
        }
      };

      // Subscribe to channels
      chatChannel.subscribe('message', handleChatMessage);
      chatChannel.subscribe('session_status', handleSessionStatus);
      chatChannel.subscribe('automated_message', handleAutomatedMessage);
      chatChannel.subscribe('unread_count_update', handleUnreadCount);
      typingChannel.subscribe('typing', handleTypingIndicator);

      // Connection handlers
      ably.connection.on('connected', () => {
        console.log('✅ Ably connected');
        setConnectionStatus('connected');
      });

      ably.connection.on('disconnected', () => {
        console.log('🔌 Ably disconnected');
        setConnectionStatus('disconnected');
      });

      ably.connection.on('failed', (error) => {
        console.error('❌ Ably failed:', error);
        setConnectionStatus('failed');
      });

      ably.connection.on('suspended', () => {
        console.log('⏸️ Ably suspended');
        setConnectionStatus('disconnected');
      });

      ably.connection.on('closed', () => {
        console.log('🔒 Ably closed');
        setConnectionStatus('disconnected');
      });

      // Setup token refresh
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = setInterval(async () => {
        try {
          console.log('🔄 Refreshing Ably token...');
          const newTokenData = await chatsApi.getAblyToken(sessionId);
          if (newTokenData && ablyRef.current) {
            await ablyRef.current.auth.authorize(newTokenData.token);
            console.log('✅ Token refreshed');
          }
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
        }
      }, 25 * 60 * 1000);

      return true;
    } catch (error) {
      console.error('❌ Chat connection failed:', error);
      setConnectionStatus('failed');
      return false;
    }
  }, []); // ✅ FIXED: Empty dependency array

  // ✅ FIXED: Memoize disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting chat...');
    
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
        console.log('📡 Unsubscribing from chat...');
        channelsRef.current.chat.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing chat:', error);
      }
    }

    if (channelsRef.current.typing) {
      try {
        console.log('📡 Unsubscribing from typing...');
        channelsRef.current.typing.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing typing:', error);
      }
    }

    channelsRef.current = {};

    // Close Ably connection
    if (ablyRef.current) {
      try {
        console.log('🔒 Closing Ably...');
        ablyRef.current.close();
      } catch (error) {
        console.error('Error closing Ably:', error);
      }
      ablyRef.current = null;
    }

    // Reset state
    currentSessionRef.current = null;
    setConnectionStatus('disconnected');
    setIsTyping(false);
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

    try {
      // Send via Ably if available
      if (ablyRef.current && channelsRef.current.typing && connectionStatus === 'connected') {
        console.log('⌨️ Sending typing via Ably');
        await channelsRef.current.typing.publish('typing', typingData);
      } else {
        // Fallback to API
        console.log('⌨️ Sending typing via API');
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
      }
    } catch (error) {
      console.error('❌ Error sending typing:', error);
      // Fallback to API
      try {
        await chatsApi.sendTypingIndicator(sessionId, isTyping);
      } catch (apiError) {
        console.error('❌ API fallback failed:', apiError);
      }
    }
  }, [connectionStatus]);

  // ✅ FIXED: Memoize sendMessageViaAbly function
  const sendMessageViaAbly = useCallback(async (sessionId, messageData) => {
    if (sessionId === 'team-ruangdiri') return false;

    try {
      if (ablyRef.current && channelsRef.current.chat && connectionStatus === 'connected') {
        console.log('📤 Broadcasting via Ably');
        await channelsRef.current.chat.publish('message', messageData);
        return true;
      }
    } catch (error) {
      console.error('❌ Ably broadcast failed:', error);
    }
    
    return false;
  }, [connectionStatus]);

  // ✅ FIXED: Memoize handleTyping function
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

  // ✅ FIXED: Memoize simulateAITyping function
  const simulateAITyping = useCallback((callback) => {
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      if (callback) callback();
    }, 1000 + Math.random() * 2000);
  }, []);

  // ✅ FIXED: Memoize getConnectionInfo function
  const getConnectionInfo = useCallback(() => {
    return {
      status: connectionStatus,
      isConnected: ['connected', 'ai'].includes(connectionStatus),
      currentSession: currentSessionRef.current,
      channels: channelsRef.current,
      hasAbly: !!ablyRef.current?.connection?.state,
      hasNotificationSocket: notificationSocket.isSocketConnected(),
      ablyState: ablyRef.current?.connection?.state || 'none',
      hasRealtime: connectionStatus === 'connected'
    };
  }, [connectionStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    getConnectionInfo
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