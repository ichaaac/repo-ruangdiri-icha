// src/components/shared/chats/hooks/useChats.js - Simplified Chat Hook - Just Hit Endpoints

import { useState, useEffect, useCallback, useRef } from "react";
import Ably from "ably";
import { chatApi, sessionManager, timeUtils, messageUtils } from "../lib/chatsApi";

/**
 * Simple Chat Service for Ably - Backend handles token generation
 */
class ChatService {
  constructor() {
    this.ably = null;
    this.messageChannel = null;
    this.typingChannel = null;
    this.sessionId = "";
    this.eventHandlers = {};
    this.connectionState = "disconnected";
  }

  setEventHandlers(handlers) {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  async connect(sessionId) {
    try {
      this.sessionId = sessionId;
      this.connectionState = "connecting";
      this.eventHandlers.onConnectionStateChanged?.("connecting");

      // Backend handles token generation - just hit the endpoint
      const tokenResponse = await chatApi.getAblyToken(sessionId);
      
      if (!tokenResponse.success) {
        throw new Error(tokenResponse.message);
      }

      const { token, channelName, typingChannelName } = tokenResponse.data;

      // Initialize Ably with token from backend
      this.ably = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          callback(null, token);
        },
        disconnectedRetryTimeout: 5000,
        suspendedRetryTimeout: 10000,
        autoConnect: true,
      });

      // Connection state handlers  
      this.ably.connection.on("connected", () => {
        this.connectionState = "connected";
        this.eventHandlers.onConnectionStateChanged?.("connected");
        console.log("Chat: Connected to Ably");
      });

      this.ably.connection.on("disconnected", () => {
        this.connectionState = "disconnected";
        this.eventHandlers.onConnectionStateChanged?.("disconnected");
        console.log("Chat: Disconnected from Ably");
      });

      this.ably.connection.on("failed", (error) => {
        this.connectionState = "failed";
        this.eventHandlers.onConnectionStateChanged?.("failed");
        this.eventHandlers.onError?.(error);
        console.error("Chat: Ably connection failed:", error);
      });

      // Setup channels
      this.setupChannels(channelName, typingChannelName);

      console.log("Chat service connected successfully to session:", sessionId);
    } catch (error) {
      this.connectionState = "failed";
      this.eventHandlers.onConnectionStateChanged?.("failed");
      this.eventHandlers.onError?.(error);
      throw error;
    }
  }

  setupChannels(channelName, typingChannelName) {
    if (!this.ably) return;

    // Message channel
    this.messageChannel = this.ably.channels.get(channelName);
    this.messageChannel.subscribe("message", (message) => {
      console.log("New message received:", message.data);
      this.eventHandlers.onMessageReceived?.(message.data);
    });

    this.messageChannel.subscribe("session_status", (statusMessage) => {
      const { status, participants } = statusMessage.data;
      console.log("Session status changed:", status);
      this.eventHandlers.onSessionStatusChanged?.(status, participants);
    });

    // Typing channel
    this.typingChannel = this.ably.channels.get(typingChannelName);
    this.typingChannel.subscribe("typing", (typingMessage) => {
      const { userId, isTyping, timestamp } = typingMessage.data;
      this.eventHandlers.onTypingIndicator?.(userId, isTyping, timestamp);
    });
  }

  async sendTypingIndicator(isTyping) {
    if (!this.typingChannel || this.connectionState !== "connected") return;

    try {
      await this.typingChannel.publish("typing", {
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to send typing indicator:", error);
    }
  }

  disconnect() {
    if (this.ably) {
      this.ably.close();
      this.ably = null;
    }

    this.messageChannel = null;
    this.typingChannel = null;
    this.sessionId = "";
    this.connectionState = "disconnected";

    this.eventHandlers.onConnectionStateChanged?.("disconnected");
  }

  getConnectionState() {
    return this.connectionState;
  }
}

/**
 * Simple Chat Hook - Just hit endpoints, backend handles everything
 */
export const useChats = (options = {}) => {
  const {
    sessionId: initialSessionId,
    autoConnect = true,
    eventHandlers = {},
  } = options;

  // State
  const [connectionState, setConnectionState] = useState("disconnected");
  const [messages, setMessages] = useState([]);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [nextCursor, setNextCursor] = useState(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Refs
  const chatServiceRef = useRef(null);
  const typingTimeoutRef = useRef(new Map());
  const mountedRef = useRef(true);
  const stopPollingRef = useRef(null);

  // Initialize chat service
  useEffect(() => {
    chatServiceRef.current = new ChatService();

    const defaultEventHandlers = {
      onMessageReceived: (message) => {
        if (!mountedRef.current) return;
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },

      onTypingIndicator: (userId, isTyping, timestamp) => {
        if (!mountedRef.current) return;
        
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          
          if (isTyping) {
            newSet.add(userId);
            
            // Clear existing timeout
            if (typingTimeoutRef.current.has(userId)) {
              clearTimeout(typingTimeoutRef.current.get(userId));
            }
            
            // Auto-remove after 3 seconds
            const timeout = setTimeout(() => {
              if (mountedRef.current) {
                setTypingUsers((current) => {
                  const updated = new Set(current);
                  updated.delete(userId);
                  return updated;
                });
              }
              typingTimeoutRef.current.delete(userId);
            }, 3000);
            
            typingTimeoutRef.current.set(userId, timeout);
          } else {
            newSet.delete(userId);
            
            if (typingTimeoutRef.current.has(userId)) {
              clearTimeout(typingTimeoutRef.current.get(userId));
              typingTimeoutRef.current.delete(userId);
            }
          }
          
          return newSet;
        });
      },

      onSessionStatusChanged: (status, participants) => {
        if (!mountedRef.current) return;
        console.log("Session status changed:", status);
        
        setCurrentSession(prev => prev ? { ...prev, status } : null);
        
        if (status === "completed" || status === "cancelled") {
          sessionManager.clearSession();
          setCurrentSession(null);
        } else {
          sessionManager.updateSession({ status });
        }
        
        eventHandlers.onSessionStatusChanged?.(status, participants);
      },

      onConnectionStateChanged: (state) => {
        if (!mountedRef.current) return;
        setConnectionState(state);
        
        if (state === "connected") {
          setError(null);
        } else if (state === "failed") {
          setError("Connection failed");
        }
        
        eventHandlers.onConnectionStateChanged?.(state);
      },

      onError: (error) => {
        if (!mountedRef.current) return;
        console.error("Chat error:", error);
        setError(error.message || "An error occurred");
        eventHandlers.onError?.(error);
      },

      ...eventHandlers,
    };

    chatServiceRef.current.setEventHandlers(defaultEventHandlers);

    return () => {
      mountedRef.current = false;
      
      // Cleanup
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      
      if (stopPollingRef.current) {
        stopPollingRef.current();
      }
      
      chatServiceRef.current?.disconnect();
    };
  }, []);

  // Group messages by date
  useEffect(() => {
    const grouped = messageUtils.groupMessagesByDate(messages);
    setGroupedMessages(grouped);
  }, [messages]);

  // Auto-connect when sessionId is available
  useEffect(() => {
    if (
      autoConnect &&
      currentSession?.sessionId &&
      chatServiceRef.current &&
      connectionState === "disconnected"
    ) {
      connect(currentSession.sessionId);
    }
  }, [currentSession?.sessionId, autoConnect, connectionState]);

  // Check for existing session on mount
  useEffect(() => {
    if (!initialSessionId) {
      const session = sessionManager.getSession();
      if (session && session.sessionId) {
        setCurrentSession(session);
      }
    } else {
      loadSessionData(initialSessionId);
    }
  }, [initialSessionId]);

  // Load session data from backend
  const loadSessionData = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getSessionStatus(sessionId);
      
      if (response.success) {
        const sessionData = response.data;
        const session = sessionManager.setSession(sessionData);
        setCurrentSession(session);
      }
    } catch (error) {
      console.error("Failed to load session data:", error);
      setError(error.message || "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to chat
  const connect = useCallback(async (sessionId) => {
    if (!chatServiceRef.current || !sessionId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // 7. Connect to Ably → Initialize with backend token
      await chatServiceRef.current.connect(sessionId);

      // Load message history
      await loadMessageHistory(sessionId, null, true);

      // Start polling session status
      if (stopPollingRef.current) {
        stopPollingRef.current();
      }
      
      stopPollingRef.current = chatApi.startPolling(
        sessionId,
        (sessionData) => {
          setCurrentSession(sessionData);
          sessionManager.updateSession(sessionData);
        },
        (error) => {
          console.error("Session polling error:", error);
        }
      );

    } catch (error) {
      console.error("Failed to connect to chat:", error);
      setError(error.message || "Failed to connect to chat");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new chat session
  const createSession = useCallback(async (psychologistId) => {
    try {
      setIsLoading(true);
      setError(null);

      // 3. Create Chat Session → POST /api/v1/chat/sessions
      const response = await chatApi.createSession(psychologistId);
      
      if (response.success) {
        const sessionData = response.data;
        const session = sessionManager.setSession(sessionData);
        setCurrentSession(session);
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      setError(error.message || "Failed to create session");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept session (psychologist only)
  const acceptSession = useCallback(async (sessionId) => {
    try {
      setIsLoading(true);
      setError(null);

      // 5. Accept Session → POST /api/v1/chat/sessions/:sessionId/accept
      const response = await chatApi.acceptSession(sessionId);
      
      if (response.success) {
        const sessionData = response.data;
        const session = sessionManager.updateSession(sessionData);
        setCurrentSession(session);
        
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to accept session:", error);
      setError(error.message || "Failed to accept session");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message, messageType = "text") => {
    if (!currentSession?.sessionId || !message.trim()) return;

    try {
      // 8. Send Messages → POST /api/v1/chat/sessions/:sessionId/messages
      const response = await chatApi.sendMessage(currentSession.sessionId, message.trim(), messageType);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      return response;
    } catch (error) {
      console.error("Failed to send message:", error);
      setError(error.message || "Failed to send message");
      throw error;
    }
  }, [currentSession?.sessionId]);

  // Load message history
  const loadMessageHistory = useCallback(async (sessionId, cursor = null, replace = false) => {
    if (!sessionId) return;

    try {
      setIsFetchingMore(!replace);
      
      // 11. Get Message History → GET /api/v1/chat/sessions/:sessionId/messages
      const response = await chatApi.getMessageHistory(sessionId, cursor);
      
      if (response.success) {
        const { data: historyMessages, metadata } = response.data;
        
        if (replace) {
          // Sort oldest first for display
          setMessages(messageUtils.sortMessagesOldestFirst(historyMessages));
        } else {
          // Prepend older messages (for pagination from top)
          setMessages((prev) => [
            ...messageUtils.sortMessagesOldestFirst(historyMessages), 
            ...prev
          ]);
        }
        
        setHasMoreMessages(metadata.hasNextPage);
        setNextCursor(metadata.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load message history:", error);
      setError(error.message || "Failed to load message history");
    } finally {
      setIsFetchingMore(false);
    }
  }, []);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!currentSession?.sessionId || !hasMoreMessages || isFetchingMore) return;

    await loadMessageHistory(currentSession.sessionId, nextCursor, false);
  }, [currentSession?.sessionId, hasMoreMessages, isFetchingMore, nextCursor, loadMessageHistory]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (isTyping) => {
    if (!chatServiceRef.current || connectionState !== "connected") return;

    try {
      await chatServiceRef.current.sendTypingIndicator(isTyping);
    } catch (error) {
      console.error("Failed to send typing indicator:", error);
    }
  }, [connectionState]);

  // End current session
  const endSession = useCallback(async () => {
    if (!currentSession?.sessionId) return;

    try {
      setIsLoading(true);
      
      // 10. End Session → POST /api/v1/chat/sessions/:sessionId/end
      const response = await chatApi.endSession(currentSession.sessionId);
      
      if (response.success) {
        // Clear everything
        sessionManager.clearSession();
        setCurrentSession(null);
        setMessages([]);
        
        if (stopPollingRef.current) {
          stopPollingRef.current();
        }
        
        chatServiceRef.current?.disconnect();
      }
      
      return response;
    } catch (error) {
      console.error("Failed to end session:", error);
      setError(error.message || "Failed to end session");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentSession?.sessionId]);

  // Disconnect from chat
  const disconnect = useCallback(() => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
    }
    
    chatServiceRef.current?.disconnect();
    setCurrentSession(null);
    setMessages([]);
    setGroupedMessages({});
    setTypingUsers(new Set());
    setError(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!currentSession?.sessionId) return;

    try {
      await chatApi.markMessagesAsRead(currentSession.sessionId);
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  }, [currentSession?.sessionId]);

  // Get active sessions
  const getActiveSessions = useCallback(async () => {
    try {
      const response = await chatApi.getActiveSessions();
      return response.success ? response.data : [];
    } catch (error) {
      console.error("Failed to get active sessions:", error);
      return [];
    }
  }, []);

  return {
    // State
    connectionState,
    isConnected: connectionState === "connected",
    isConnecting: connectionState === "connecting",
    messages,
    groupedMessages,
    typingUsers: Array.from(typingUsers),
    error,
    session: currentSession,
    sessionId: currentSession?.sessionId || currentSession?.id,
    isLoading,
    hasMoreMessages,
    isFetchingMore,

    // Actions
    connect,
    disconnect,
    createSession,
    acceptSession,
    sendMessage,
    sendTypingIndicator,
    loadMoreMessages,
    endSession,
    markAsRead,
    getActiveSessions,

    // Utilities
    clearError,
    hasActiveSession: () => sessionManager.hasActiveSession(),
    getCurrentSession: () => sessionManager.getSession(),
    
    // Time utilities (same as notifications)
    formatTimeAgo: timeUtils.formatTimeAgo,
    formatMessageTime: timeUtils.formatMessageTime,
    formatDate: timeUtils.formatDate,
  };
};

export default useChats;