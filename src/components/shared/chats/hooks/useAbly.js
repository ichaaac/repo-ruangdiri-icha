// src/components/shared/chats/hooks/useAbly.js - Fix Infinite Rendering

import { useState, useRef, useCallback, useEffect } from 'react';
import Ably from 'ably';
import { chatsApi } from '../lib/chatsApi';

export const useAbly = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);

  const ablyRef = useRef(null);
  const channelsRef = useRef({});
  const currentSessionRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Stable callback refs - INI YANG FIX INFINITE RENDERING
  const onMessageRef = useRef(null);
  const onSessionStatusRef = useRef(null);
  const onTypingRef = useRef(null);

  // Set callbacks - stable function
  const setCallbacks = useCallback((callbacks) => {
    onMessageRef.current = callbacks.onMessage || null;
    onSessionStatusRef.current = callbacks.onSessionStatus || null;
    onTypingRef.current = callbacks.onTyping || null;
  }, []);

  // Connect to Ably
  const connect = useCallback(async (sessionId, userId) => {
    try {
      if (sessionId === 'team-ruangdiri') {
        setConnectionStatus('team');
        currentSessionRef.current = sessionId;
        return true;
      }

      console.log('🚀 Connecting to Ably for session:', sessionId);
      setConnectionStatus('connecting');

      const tokenData = await chatsApi.getAblyToken(sessionId);
      if (!tokenData) throw new Error('No Ably token');

      const ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          callback(null, tokenData.token);
        },
        clientId: userId
      });

      ablyRef.current = ably;
      currentSessionRef.current = sessionId;

      // Get channels
      const chatChannel = ably.channels.get(tokenData.channels.chat);
      const typingChannel = ably.channels.get(tokenData.channels.typing);
      
      channelsRef.current = { chat: chatChannel, typing: typingChannel };

      // Subscribe to events
      chatChannel.subscribe('message', (message) => {
        if (onMessageRef.current) {
          onMessageRef.current(message.data);
        }
      });

      chatChannel.subscribe('session_status', (message) => {
        if (onSessionStatusRef.current) {
          onSessionStatusRef.current(message.data);
        }
      });

      typingChannel.subscribe('typing', (message) => {
        const { isTyping: typing } = message.data;
        setIsTyping(typing);
        
        if (onTypingRef.current) {
          onTypingRef.current(message.data);
        }

        // Auto-clear typing
        if (typing) {
          setTimeout(() => setIsTyping(false), 5000);
        }
      });

      // Connection events
      ably.connection.on('connected', () => {
        console.log('✅ Ably connected');
        setConnectionStatus('connected');
      });

      ably.connection.on('disconnected', () => {
        console.log('🔌 Ably disconnected');
        setConnectionStatus('disconnected');
      });

      ably.connection.on('failed', () => {
        console.error('❌ Ably failed');
        setConnectionStatus('failed');
      });

      return true;
    } catch (error) {
      console.error('❌ Ably connect failed:', error);
      setConnectionStatus('failed');
      return false;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting Ably...');
    
    // Unsubscribe channels
    Object.values(channelsRef.current).forEach(channel => {
      if (channel) channel.unsubscribe();
    });
    channelsRef.current = {};

    // Close connection
    if (ablyRef.current) {
      ablyRef.current.close();
      ablyRef.current = null;
    }

    // Clear timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset state
    currentSessionRef.current = null;
    setConnectionStatus('disconnected');
    setIsTyping(false);
  }, []);

  // Send typing
  const sendTyping = useCallback((sessionId, isTyping, userId) => {
    if (sessionId === 'team-ruangdiri') return;

    const typingChannel = channelsRef.current.typing;
    if (typingChannel && connectionStatus === 'connected') {
      typingChannel.publish('typing', {
        userId,
        isTyping,
        sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }, [connectionStatus]);

  // Handle typing with timeout
  const handleTyping = useCallback((sessionId, userId, text) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionStatus,
    isTyping,
    isConnected: connectionStatus === 'connected' || connectionStatus === 'team',
    currentSession: currentSessionRef.current,
    connect,
    disconnect,
    sendTyping,
    handleTyping,
    setCallbacks
  };
};