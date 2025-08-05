// src/components/shared/chats/lib/chatsApi.js - Simplified Chat API Integration

import axios from "axios";

// Configuration
const CHAT_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  CHAT_ENDPOINT: "/chat",
  POLLING_INTERVAL: 2000, // 2 seconds for session status polling
};

// Create axios instance for chat API
const chatApiClient = axios.create({
  baseURL: `${CHAT_CONFIG.API_BASE_URL}${CHAT_CONFIG.CHAT_ENDPOINT}`,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Request interceptor to add auth token
chatApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
chatApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Chat API: Unauthorized access");
    }
    return Promise.reject(error);
  }
);

/**
 * Time formatting utilities (same as notifications)
 */
export const timeUtils = {
  formatTimeAgo: (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} jam yang lalu`;
    } else if (diffInDays === 1) {
      return 'Kemarin';
    } else if (diffInDays < 7) {
      return `${diffInDays} hari yang lalu`;
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  },

  formatMessageTime: (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  },

  formatDate: (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    } else {
      return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
  },

  getDateKey: (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }
};

/**
 * Simple Chat API Service Class - Just hit endpoints
 */
class ChatApiService {
  constructor() {
    this.baseUrl = `${CHAT_CONFIG.API_BASE_URL}${CHAT_CONFIG.CHAT_ENDPOINT}`;
  }

  /**
   * Phase 2: Session Management
   */

  // 3. Create Chat Session → POST /api/v1/chat/sessions
  async createSession(psychologistId) {
    try {
      const response = await chatApiClient.post("/sessions", {
        psychologistId,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      throw this.handleError(error);
    }
  }

  // 4. Poll for Session Status → GET /api/v1/chat/sessions/:sessionId
  async getSessionStatus(sessionId) {
    try {
      const response = await chatApiClient.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to get session status:", error);
      throw this.handleError(error);
    }
  }

  // 5. Accept Session (psychologist) → POST /api/v1/chat/sessions/:sessionId/accept
  async acceptSession(sessionId) {
    try {
      const response = await chatApiClient.post(`/sessions/${sessionId}/accept`);
      return response.data;
    } catch (error) {
      console.error("Failed to accept chat session:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Phase 3: Real-time Communication
   */

  // 6. Get Ably Token → POST /api/v1/chat/sessions/:sessionId/token
  async getAblyToken(sessionId) {
    try {
      const response = await chatApiClient.post(`/sessions/${sessionId}/token`);
      return response.data;
    } catch (error) {
      console.error("Failed to get Ably token:", error);
      throw this.handleError(error);
    }
  }

  // 8. Send Messages → POST /api/v1/chat/sessions/:sessionId/messages
  async sendMessage(sessionId, message, messageType = "text") {
    try {
      const response = await chatApiClient.post(`/sessions/${sessionId}/messages`, {
        message,
        messageType,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Phase 4: Session Completion
   */

  // 10. End Session → POST /api/v1/chat/sessions/:sessionId/end
  async endSession(sessionId) {
    try {
      const response = await chatApiClient.post(`/sessions/${sessionId}/end`);
      return response.data;
    } catch (error) {
      console.error("Failed to end chat session:", error);
      throw this.handleError(error);
    }
  }

  // 11. Get Message History → GET /api/v1/chat/sessions/:sessionId/messages
  async getMessageHistory(sessionId, cursor = null, limit = 20) {
    try {
      const params = { limit };
      if (cursor) params.cursor = cursor;

      const response = await chatApiClient.get(`/sessions/${sessionId}/messages`, { params });
      return response.data;
    } catch (error) {
      console.error("Failed to get message history:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Additional helpful endpoints
   */

  // Get user's active chat sessions
  async getActiveSessions() {
    try {
      const response = await chatApiClient.get("/sessions/active");
      return response.data;
    } catch (error) {
      console.error("Failed to get active sessions:", error);
      throw this.handleError(error);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(sessionId) {
    try {
      const response = await chatApiClient.put(`/sessions/${sessionId}/read`);
      return response.data;
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Simple polling utility
   */
  startPolling(sessionId, onStatusChange, onError, interval = CHAT_CONFIG.POLLING_INTERVAL) {
    let lastStatus = null;
    let isPolling = true;
    
    const poll = async () => {
      if (!isPolling) return;
      
      try {
        const response = await this.getSessionStatus(sessionId);
        const currentStatus = response.data.status;
        
        if (currentStatus !== lastStatus) {
          lastStatus = currentStatus;
          onStatusChange?.(response.data);
        }
      } catch (error) {
        onError?.(error);
      }
      
      if (isPolling) {
        setTimeout(poll, interval);
      }
    };

    // Start polling
    poll();

    // Return stop function
    return () => {
      isPolling = false;
    };
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      return {
        success: false,
        message: data?.message || "An error occurred",
        statusCode: status,
        error: data?.error || "API_ERROR",
      };
    } else if (error.request) {
      return {
        success: false,
        message: "Network error. Please check your connection.",
        statusCode: 0,
        error: "NETWORK_ERROR",
      };
    } else {
      return {
        success: false,
        message: error.message || "An unexpected error occurred",
        statusCode: 0,
        error: "UNKNOWN_ERROR",
      };
    }
  }
}

/**
 * Simple Session Manager - Just localStorage
 */
class SessionManager {
  constructor() {
    this.storageKey = "currentChatSession";
  }

  setSession(sessionData) {
    const session = {
      sessionId: sessionData.sessionId || sessionData.id,
      psychologistId: sessionData.psychologistId,
      clientId: sessionData.clientId,
      status: sessionData.status,
      createdAt: sessionData.createdAt || new Date().toISOString(),
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt,
      isActive: sessionData.isActive,
      ...sessionData,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
    return session;
  }

  getSession() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to parse stored session:", error);
      this.clearSession();
      return null;
    }
  }

  updateSession(updates) {
    const current = this.getSession();
    if (current) {
      const updated = { ...current, ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      return updated;
    }
    return null;
  }

  clearSession() {
    localStorage.removeItem(this.storageKey);
  }

  hasActiveSession() {
    const session = this.getSession();
    return session && session.isActive && (session.status === "pending" || session.status === "active");
  }
}

/**
 * Message grouping utilities
 */
export const messageUtils = {
  groupMessagesByDate: (messages = []) => {
    const grouped = {};
    
    messages.forEach((message) => {
      const dateKey = timeUtils.getDateKey(message.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    // Sort messages within each group (oldest first for chat)
    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    return grouped;
  },

  sortMessagesOldestFirst: (messages = []) => {
    return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
};

// Export instances
export const chatApi = new ChatApiService();
export const sessionManager = new SessionManager();
export { CHAT_CONFIG };

export default chatApi;