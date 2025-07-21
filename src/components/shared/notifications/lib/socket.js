// src/components/shared/notifications/lib/socket.js

import { io } from 'socket.io-client';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimeout = null;
    this.heartbeatInterval = null;
    this.connectionPromise = null;
  }

  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('🚨 No token found, cannot connect socket');
      return Promise.reject(new Error('No token'));
    }

    if (this.isConnected && this.socket?.connected) {
      console.log('🔗 Socket already connected');
      return Promise.resolve(this.socket);
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      const apiUrl = import.meta.env.VITE_API_URL;
      let wsBaseUrl = import.meta.env.VITE_WS_URL;

      // Fallback URL logic
      if (!wsBaseUrl && apiUrl) {
        try {
          const url = new URL(apiUrl);
          wsBaseUrl = `${url.protocol}//${url.host}`;
        } catch (e) {
          console.error("Invalid VITE_API_URL format:", e);
          wsBaseUrl = "http://localhost:3000";
        }
      } else if (!wsBaseUrl) {
        wsBaseUrl = "http://localhost:3000";
      }

      const finalWsUrl = `${wsBaseUrl}/notifications`;

      console.log('🚀 Connecting notification socket to:', finalWsUrl);
      console.log('🔑 Token length:', token?.length, 'chars');

      // Cleanup existing socket
      if (this.socket) {
        console.log('🔌 Disconnecting existing socket before reconnecting');
        this.socket.disconnect();
        this.socket = null;
      }

      // Create new socket connection
      this.socket = io(finalWsUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false,
      });

      // 🔥 CONNECTION SUCCESS
      this.socket.on('connect', () => {
        console.log('✅ Notification socket connected successfully!');
        console.log('🆔 Socket ID:', this.socket.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        
        // Send initial ping
        this.socket.emit('ping', { 
          message: 'Hello from frontend', 
          tokenSent: true,
          timestamp: new Date().toISOString()
        });
        
        // Start heartbeat
        this.startHeartbeat();
        
        resolve(this.socket);
      });

      // 🔥 CONNECTION ERROR
      this.socket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', error.message);
        this.connectionPromise = null;
        
        if (error.message.includes('Authentication') || error.message.includes('token')) {
          console.error('🔐 Token authentication failed - checking token validity');
          reject(new Error('Authentication failed'));
        } else {
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        }
      });

      // 🔥 DISCONNECTION
      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;
        this.connectionPromise = null;
        this.stopHeartbeat();
        
        if (reason === 'io server disconnect') {
          console.log('🚨 Server disconnected - will attempt reconnection');
          this.scheduleReconnection();
        } else if (reason === 'transport close' || reason === 'transport error') {
          console.log('🔄 Transport issue - will attempt reconnection');
          this.scheduleReconnection();
        }
      });

      // 🔥 RECONNECTION SUCCESS
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        this.startHeartbeat();
      });

      // 🔥 NOTIFICATION EVENTS
      this.socket.on('pong', (data) => {
        console.log('🏓 Received pong from server:', data);
      });

      this.socket.on('notification:created', (payload) => {
        console.log('🔔 Socket: New notification received:', payload);
        this.emit('notification:created', payload);
      });

      this.socket.on('notification:read', (payload) => {
        console.log('✅ Socket: Notification read event:', payload);
        this.emit('notification:read', payload);
      });

      this.socket.on('notification:mark-all-read', (payload) => {
        console.log('✅ Socket: Mark all read event:', payload);
        this.emit('notification:mark-all-read', payload);
      });

      // 🔥 DEBUG ALL EVENTS
      this.socket.onAny((event, ...args) => {
        console.log('🔍 Socket received event:', event, args);
        if (event.includes('auth') || event.includes('error')) {
          console.error('🔐 Auth/Error event:', event, args);
        }
      });

      // Set timeout for connection
      setTimeout(() => {
        if (!this.isConnected) {
          console.error('🕐 Socket connection timeout');
          this.connectionPromise = null;
          reject(new Error('Connection timeout'));
        }
      }, 30000); // 30 second timeout
    });

    return this.connectionPromise;
  }

  // 🔥 HEARTBEAT TO KEEP CONNECTION ALIVE
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', { 
          timestamp: new Date().toISOString(),
          heartbeat: true 
        });
      } else {
        console.warn('💔 Heartbeat: Socket not connected, attempting reconnection');
        this.stopHeartbeat();
        this.scheduleReconnection();
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 🔥 SCHEDULE RECONNECTION
  scheduleReconnection() {
    if (this.reconnectTimeout) return; // Already scheduled
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect().catch(err => {
        console.error('🚨 Reconnection failed:', err);
      });
    }, delay);
  }

  disconnect() {
    console.log('🔌 Disconnecting notification socket');
    
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
    this.connectionPromise = null;
  }

  // 🔥 EVENT LISTENER MANAGEMENT
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    console.log(`📡 Added listener for event: ${event}`);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      console.log(`📡 Removed listener for event: ${event}`);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      console.log(`📡 Emitting ${event} to ${callbacks.size} listeners`);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in notification listener:', error);
        }
      });
    }
  }

  // 🔥 STATUS CHECKS
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      hasListeners: this.listeners.size > 0,
      listenerCount: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0)
    };
  }

  // 🔥 FORCE RECONNECTION
  forceReconnect() {
    console.log('🔄 Forcing socket reconnection...');
    this.disconnect();
    return this.connect();
  }

  debugConnection() {
    const token = localStorage.getItem('token');
    const status = this.getConnectionStatus();
    
    console.log('🔍 Socket Debug Info:', {
      ...status,
      token: token ? `${token.substring(0, 20)}...` : 'missing',
    });
    
    if (this.socket?.handshake) {
      console.log('🤝 Handshake Details:', {
        headers: this.socket.handshake.headers, 
        auth: this.socket.handshake.auth,
        query: this.socket.handshake.query, 
      });
    }
  }
}

// 🔥 CREATE SINGLETON INSTANCE
const notificationSocket = new NotificationSocket();

// 🔥 AUTO-CONNECT ON MODULE LOAD IF TOKEN EXISTS
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🚀 Auto-connecting socket on module load...');
    notificationSocket.connect().catch(err => {
      console.error('🚨 Auto-connection failed:', err);
    });
  }
  
  // 🔥 RECONNECT ON STORAGE CHANGE (NEW TOKEN)
  window.addEventListener('storage', (e) => {
    if (e.key === 'token' && e.newValue && !notificationSocket.isSocketConnected()) {
      console.log('🔑 New token detected, connecting socket...');
      notificationSocket.connect().catch(err => {
        console.error('🚨 Token-based connection failed:', err);
      });
    }
  });
  
  // 🔥 GLOBAL SOCKET ACCESS FOR DEBUGGING
  window.notificationSocket = notificationSocket;
}

export default notificationSocket;