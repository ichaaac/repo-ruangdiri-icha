// src/components/shared/chats/hooks/useRealtime.js - Ably Integration Hook

import { useState, useEffect, useRef, useCallback } from "react";
import { createChatApi } from "../lib/chatsApi";

export const useRealtime = (userType = "student") => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  
  const ablyClientRef = useRef(null);
  const chatChannelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const chatApi = createChatApi(userType);

  // Initialize Ably connection for a session
  const initializeConnection = useCallback(async (sessionId) => {
    try {
      // Skip for team session
      if (sessionId === 'team-ruangdiri') {
        setConnectionStatus('team');
        return { success: true, type: 'team' };
      }

      console.log('Initializing Ably connection for session:', sessionId);
      setConnectionStatus('connecting');

      // Get Ably token
      const tokenResponse = await chatApi.getAblyToken(sessionId);
      
      if (tokenResponse.status !== 'success' || !tokenResponse.data) {
        throw new Error('Failed to get Ably token');
      }

      const { token, channels } = tokenResponse.data;

      // Note: Since we can't actually use Ably in this environment,
      // we'll simulate the connection and return success
      // In real implementation, you would:
      
      // import Ably from 'ably';
      // const ably = new Ably.Realtime({
      //   authCallback: (tokenParams, callback) => {
      //     callback(null, token);
      //   },
      // });
      
      // ablyClientRef.current = ably;
      // chatChannelRef.current = ably.channels.get(channels.chat);
      // typingChannelRef.current = ably.channels.get(channels.typing);

      // // Subscribe to channels
      // chatChannelRef.current.subscribe('message', handleIncomingMessage);
      // chatChannelRef.current.subscribe('session_status', handleSessionStatus);
      // typingChannelRef.current.subscribe('typing', handleTypingIndicator);

      // // Handle connection state
      // ably.connection.on('connected', () => setConnectionStatus('connected'));
      // ably.connection.on('disconnected', () => setConnectionStatus('disconnected'));
      // ably.connection.on('failed', () => setConnectionStatus('failed'));

      // For now, simulate successful connection
      setConnectionStatus('connected');
      
      return { 
        success: true, 
        channels: channels,
        sessionId: sessionId
      };

    } catch (error) {
      console.error('Failed to initialize Ably connection:', error);
      setConnectionStatus('failed');
      return { success: false, error: error.message };
    }
  }, [chatApi]);

  // Disconnect from Ably
  const disconnect = useCallback(() => {
    console.log('Disconnecting from Ably...');
    
    // Clean up channels
    if (chatChannelRef.current) {
      chatChannelRef.current.unsubscribe();
      chatChannelRef.current = null;
    }
    
    if (typingChannelRef.current) {
      typingChannelRef.current.unsubscribe();
      typingChannelRef.current = null;
    }

    // Close Ably connection
    if (ablyClientRef.current) {
      ablyClientRef.current.close();
      ablyClientRef.current = null;
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    setConnectionStatus('disconnected');
    setIsTyping(false);
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (sessionId, isTyping) => {
    try {
      if (sessionId === 'team-ruangdiri') return;

      // In real implementation with Ably:
      // if (typingChannelRef.current) {
      //   typingChannelRef.current.publish('typing', {
      //     userId: getCurrentUserId(),
      //     isTyping,
      //     timestamp: new Date().toISOString()
      //   });
      // }

      // For now, use API fallback
      await chatApi.sendTypingIndicator(sessionId, isTyping);
      
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [chatApi]);

  // Handle typing with auto-stop timer
  const handleTyping = useCallback((sessionId, text) => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing start
    if (text.trim() && sessionId !== 'team-ruangdiri') {
      sendTypingIndicator(sessionId, true);
      
      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(sessionId, false);
      }, 3000);
    }
  }, [sendTypingIndicator]);

  // Event handlers (would be used with real Ably)
  const handleIncomingMessage = useCallback((message) => {
    console.log('Incoming message:', message);
    // This would be handled by the parent component
    // via callback or context
  }, []);

  const handleSessionStatus = useCallback((statusMessage) => {
    console.log('Session status change:', statusMessage);
    // Handle session status changes like chat_enabled, ending_soon, completed
  }, []);

  const handleTypingIndicator = useCallback((typingMessage) => {
    console.log('Typing indicator:', typingMessage);
    const { isTyping: typing } = typingMessage.data;
    setIsTyping(typing);
    
    // Auto-clear typing indicator
    if (typing) {
      setTimeout(() => setIsTyping(false), 5000);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Public API
  return {
    // State
    connectionStatus,
    isTyping,
    isConnected: connectionStatus === 'connected' || connectionStatus === 'team',

    // Methods
    initializeConnection,
    disconnect,
    sendTypingIndicator,
    handleTyping,

    // Event handlers (for parent to override)
    onIncomingMessage: handleIncomingMessage,
    onSessionStatus: handleSessionStatus,
    onTypingIndicator: handleTypingIndicator,

    // Connection info
    hasRealTimeSupport: connectionStatus !== 'team'
  };
};