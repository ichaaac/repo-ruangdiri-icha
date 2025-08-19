// src/components/shared/chats/hooks/useAbly.js - Fixed for Completed Sessions

import { useState, useRef, useCallback, useEffect } from 'react';
import { chatsApi } from '../lib/chatsApi';

export const useAbly = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);

  const ablyRef = useRef(null);
  const channelsRef = useRef({});
  const currentSessionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const tokenRefreshIntervalRef = useRef(null);
  
  // Stable callback refs to prevent infinite re-renders
  const onMessageRef = useRef(null);
  const onSessionStatusRef = useRef(null);
  const onTypingRef = useRef(null);

  // Set callbacks - stable function
  const setCallbacks = useCallback((callbacks) => {
    onMessageRef.current = callbacks.onMessage || null;
    onSessionStatusRef.current = callbacks.onSessionStatus || null;
    onTypingRef.current = callbacks.onTyping || null;
  }, []);

  // Connect to Ably or setup AI session
  const connect = useCallback(async (sessionId, userId) => {
    try {
      currentSessionRef.current = sessionId;

      // Handle AI Team RuangDiri session
      if (sessionId === 'team-ruangdiri') {
        setConnectionStatus('ai');
        console.log('🤖 Connected to AI Team RuangDiri');
        return true;
      }

      console.log('🚀 Connecting to Ably for session:', sessionId);
      setConnectionStatus('connecting');

      // Disconnect existing connection first
      if (ablyRef.current) {
        ablyRef.current.close();
        ablyRef.current = null;
      }

      const tokenData = await chatsApi.getAblyToken(sessionId);
      
      // ✅ Handle case where token is null (completed/inactive sessions)
      if (!tokenData) {
        console.log('🔒 No Ably token available (session may be completed/inactive), setting disconnected state');
        setConnectionStatus('disconnected');
        return false;
      }

      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          callback(null, tokenData.token);
        },
        clientId: userId,
        disconnectedRetryTimeout: 5000,
        suspendedRetryTimeout: 10000,
        autoConnect: true
      });

      ablyRef.current = ably;

      // Get channels
      const chatChannel = ably.channels.get(tokenData.channels.chat);
      const typingChannel = ably.channels.get(tokenData.channels.typing);
      
      channelsRef.current = { chat: chatChannel, typing: typingChannel };

      // Subscribe to chat events
      chatChannel.subscribe('message', (message) => {
        console.log('📨 Received message:', message.data);
        if (onMessageRef.current && message.data.senderId !== userId) {
          onMessageRef.current(message.data);
        }
      });

      chatChannel.subscribe('session_status', (message) => {
        console.log('📊 Session status change:', message.data);
        if (onSessionStatusRef.current) {
          onSessionStatusRef.current(message.data);
        }
      });

      chatChannel.subscribe('automated_message', (message) => {
        console.log('🤖 Automated message:', message.data);
        if (onMessageRef.current) {
          onMessageRef.current({
            ...message.data,
            isAutomated: true,
            messageType: 'automated'
          });
        }
      });

      // Subscribe to typing events
      typingChannel.subscribe('typing', (message) => {
        const { isTyping: typing, userId: typingUserId } = message.data;
        
        // Don't show our own typing indicator
        if (typingUserId !== userId) {
          setIsTyping(typing);
          
          if (onTypingRef.current) {
            onTypingRef.current(message.data);
          }

          // Auto-clear typing indicator after 5 seconds
          if (typing) {
            if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 5000);
          }
        }
      });

      // Connection event handlers
      ably.connection.on('connected', () => {
        console.log('✅ Ably connected');
        setConnectionStatus('connected');
      });

      ably.connection.on('disconnected', () => {
        console.log('🔌 Ably disconnected');
        setConnectionStatus('disconnected');
      });

      ably.connection.on('failed', (error) => {
        console.error('❌ Ably connection failed:', error);
        setConnectionStatus('failed');
      });

      ably.connection.on('suspended', () => {
        console.log('⏸️ Ably connection suspended');
        setConnectionStatus('disconnected');
      });

      ably.connection.on('closed', () => {
        console.log('🔒 Ably connection closed');
        setConnectionStatus('disconnected');
      });

      // Setup token refresh (every 25 minutes, token expires in 30)
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      
      tokenRefreshIntervalRef.current = setInterval(async () => {
        try {
          console.log('🔄 Refreshing Ably token...');
          const newTokenData = await chatsApi.getAblyToken(sessionId);
          if (newTokenData && ablyRef.current) {
            await ablyRef.current.auth.authorize(newTokenData.token);
            console.log('✅ Token refreshed successfully');
          }
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
        }
      }, 25 * 60 * 1000); // 25 minutes

      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setConnectionStatus('failed');
      return false;
    }
  }, []);

  // Disconnect with proper cleanup
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting...');
    
    // Clear token refresh interval
    if (tokenRefreshIntervalRef.current) {
      clearInterval(tokenRefreshIntervalRef.current);
      tokenRefreshIntervalRef.current = null;
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Unsubscribe and cleanup channels
    Object.values(channelsRef.current).forEach(channel => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing channel:', error);
        }
      }
    });
    channelsRef.current = {};

    // Close Ably connection
    if (ablyRef.current) {
      try {
        ablyRef.current.close();
      } catch (error) {
        console.error('Error closing Ably connection:', error);
      }
      ablyRef.current = null;
    }

    // Reset state
    currentSessionRef.current = null;
    setConnectionStatus('disconnected');
    setIsTyping(false);
  }, []);

  // Send typing indicator
  const sendTyping = useCallback(async (sessionId, isTyping, userId) => {
    // AI sessions don't need typing indicators
    if (sessionId === 'team-ruangdiri') return;

    try {
      // Use backend API endpoint for typing indicators
      await chatsApi.sendTypingIndicator(sessionId, isTyping);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, []);

  // Handle typing with debounce
  const handleTyping = useCallback((sessionId, userId, text) => {
    if (!sessionId) return;

    // For AI sessions, don't send typing indicators
    if (sessionId === 'team-ruangdiri') return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim()) {
      // Send typing start
      sendTyping(sessionId, true, userId);
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(sessionId, false, userId);
      }, 3000);
    } else {
      // Send typing stop immediately
      sendTyping(sessionId, false, userId);
    }
  }, [sendTyping]);

  // Simulate AI typing for better UX
  const simulateAITyping = useCallback((callback) => {
    setIsTyping(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      setIsTyping(false);
    if (callback) callback();
    }, 1000 + Math.random() * 2000); // 1-3 seconds
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    isTyping,
    isConnected: ['connected', 'ai'].includes(connectionStatus),
    isAISession: connectionStatus === 'ai',
    currentSession: currentSessionRef.current,
    connect,
    disconnect,
    sendTyping,
    handleTyping,
    simulateAITyping,
    setCallbacks
  };
};