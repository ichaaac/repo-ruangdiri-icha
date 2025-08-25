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
    this.autoReconnect = true;
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

      // 🔥 ENHANCED: Better URL fallback logic
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
      console.log('🔑 Using token:', token?.substring(0, 20) + '...');

      // Cleanup existing socket
      if (this.socket) {
        console.log('🔌 Disconnecting existing socket before reconnecting');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // 🔥 ENHANCED: Create new socket connection with better config
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
        // 🔥 ADDED: Extra options for stability
        pingTimeout: 60000,
        pingInterval: 25000,
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
        
        // 🔥 ENHANCED: Better initial handshake
        this.socket.emit('ping', { 
          message: 'Hello from frontend', 
          tokenSent: true,
          timestamp: new Date().toISOString(),
          clientId: this.socket.id
        });
        
        // Start heartbeat
        this.startHeartbeat();
        
        // 🔥 ADDED: Re-register all existing listeners
        this.reregisterListeners();
        
        resolve(this.socket);
      });

      // 🔥 ENHANCED: Better error handling
      this.socket.on('connect_error', (error) => {
        console.error('🚨 Socket connection error:', {
          message: error.message,
          description: error.description,
          type: error.type,
          data: error.data
        });
        
        this.isConnected = false;
        this.connectionPromise = null;
        
        if (error.message.includes('Authentication') || 
            error.message.includes('token') || 
            error.message.includes('unauthorized')) {
          console.error('🔐 Token authentication failed');
          this.autoReconnect = false; // Stop auto-reconnect on auth failure
          reject(new Error('Authentication failed'));
        } else {
          this.reconnectAttempts++;
          console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.autoReconnect = false;
            reject(error);
          }
        }
      });

      // 🔥 ENHANCED: Better disconnection handling
      this.socket.on('disconnect', (reason, details) => {
        console.log('❌ Socket disconnected:', { reason, details });
        this.isConnected = false;
        this.connectionPromise = null;
        this.stopHeartbeat();
        
        // 🔥 ENHANCED: Better auto-reconnect logic
        if (this.autoReconnect) {
          if (reason === 'io server disconnect') {
            console.log('🚨 Server disconnected - will attempt reconnection');
            this.scheduleReconnection();
          } else if (reason === 'transport close' || reason === 'transport error') {
            console.log('🔄 Transport issue - will attempt reconnection');
            this.scheduleReconnection();
          } else if (reason === 'ping timeout') {
            console.log('🏓 Ping timeout - will attempt reconnection');
            this.scheduleReconnection();
          }
        }
      });

      // 🔥 RECONNECTION SUCCESS
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionPromise = null;
        this.autoReconnect = true; // Re-enable auto-reconnect
        this.startHeartbeat();
        this.reregisterListeners();
      });

      // 🔥 ENHANCED: Notification events with better logging
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

      // 🔥 ENHANCED: Authentication events
      this.socket.on('auth:success', (data) => {
        console.log('🔐 Authentication successful:', data);
      });

      this.socket.on('auth:error', (error) => {
        console.error('🔐 Authentication error:', error);
        this.autoReconnect = false;
        reject(new Error('Authentication failed'));
      });

      // 🔥 DEBUG ALL EVENTS with filtering
      this.socket.onAny((event, ...args) => {
        if (!event.includes('ping') && !event.includes('pong')) {
          console.log('🔍 Socket received event:', event, args);
        }
        
        if (event.includes('auth') || event.includes('error')) {
          console.error('🔐 Auth/Error event:', event, args);
        }
      });

      // 🔥 ENHANCED: Connection timeout with retry
      const connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('🕐 Socket connection timeout - will retry');
          this.connectionPromise = null;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.scheduleReconnection();
          } else {
            reject(new Error('Connection timeout'));
          }
        }
      }, 30000); // 30 second timeout

      // Clear timeout when connected
      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout);
      });
    });

    return this.connectionPromise;
  }

  // 🔥 ENHANCED: Re-register listeners after reconnection
  reregisterListeners() {
    console.log('📡 Re-registering listeners after reconnection');
    // Emit a custom event to notify components to re-setup their listeners
    this.emit('socket:reconnected', { socketId: this.socket?.id });
  }

  // 🔥 ENHANCED: Heartbeat with better error handling
  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', { 
          timestamp: new Date().toISOString(),
          heartbeat: true,
          socketId: this.socket.id
        });
      } else {
        console.warn('💔 Heartbeat: Socket not connected');
        this.stopHeartbeat();
        if (this.autoReconnect) {
          this.scheduleReconnection();
        }
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 🔥 ENHANCED: Better reconnection scheduling
  scheduleReconnection() {
    if (this.reconnectTimeout || !this.autoReconnect) return; // Already scheduled or disabled
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.autoReconnect) {
        this.connect().catch(err => {
          console.error('🚨 Scheduled reconnection failed:', err);
        });
      }
    }, delay);
  }

  // 🔥 ENHANCED: Better disconnect with cleanup
  disconnect() {
    console.log('🔌 Disconnecting notification socket');
    
    this.autoReconnect = false; // Disable auto-reconnect
    this.stopHeartbeat();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.listeners.clear();
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  // 🔥 ENHANCED: Event listener management with better tracking
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    // console.log(`📡 Added listener for event: ${event} (total: ${this.listeners.get(event).size})`);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      // console.log(`📡 Removed listener for event: ${event} (remaining: ${this.listeners.get(event).size})`);
      
      // Clean up empty sets
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      console.log(`📡 Emitting ${event} to ${callbacks.size} listeners:`, data);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} listener:`, error);
        }
      });
    } else {
      console.log(`📡 No listeners for event: ${event}`);
    }
  }

  // 🔥 STATUS CHECKS
  isSocketConnected() {
    const connected = this.isConnected && this.socket && this.socket.connected;
    console.log('🔍 Socket status check:', {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected || false,
      finalStatus: connected
    });
    return connected;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      autoReconnect: this.autoReconnect,
      hasListeners: this.listeners.size > 0,
      listenerCount: Array.from(this.listeners.values()).reduce((total, set) => total + set.size, 0),
      listenerEvents: Array.from(this.listeners.keys())
    };
  }

  // 🔥 ENHANCED: Force reconnection with full cleanup
  forceReconnect() {
    console.log('🔄 Forcing socket reconnection...');
    this.autoReconnect = true; // Re-enable auto-reconnect
    this.reconnectAttempts = 0; // Reset attempts
    this.disconnect();
    return this.connect();
  }

  // 🔥 ENHANCED: Debug function
  debugConnection() {
    const token = localStorage.getItem('token');
    const status = this.getConnectionStatus();
    
    console.log('🔍 Socket Debug Info:', {
      ...status,
      token: token ? `${token.substring(0, 20)}...` : 'missing',
      wsUrl: import.meta.env.VITE_WS_URL,
      apiUrl: import.meta.env.VITE_API_URL,
    });
    
    if (this.socket?.handshake) {
      console.log('🤝 Handshake Details:', {
        headers: this.socket.handshake.headers, 
        auth: this.socket.handshake.auth,
        query: this.socket.handshake.query, 
      });
    }

    // Test connection
    if (this.isSocketConnected()) {
      this.socket.emit('ping', { test: 'debug', timestamp: new Date().toISOString() });
    }
  }
}

// 🔥 CREATE SINGLETON INSTANCE
const notificationSocket = new NotificationSocket();

// 🔥 ENHANCED: Auto-connect logic
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🚀 Auto-connecting socket on module load...');
    notificationSocket.connect().catch(err => {
      console.error('🚨 Auto-connection failed:', err);
    });
  }
  
  // 🔥 ENHANCED: Token change detection
  window.addEventListener('storage', (e) => {
    if (e.key === 'token') {
      if (e.newValue && !notificationSocket.isSocketConnected()) {
        console.log('🔑 New token detected, connecting socket...');
        notificationSocket.autoReconnect = true;
        notificationSocket.connect().catch(err => {
          console.error('🚨 Token-based connection failed:', err);
        });
      } else if (!e.newValue && notificationSocket.isSocketConnected()) {
        console.log('🔑 Token removed, disconnecting socket...');
        notificationSocket.disconnect();
      }
    }
  });
  
  // 🔥 GLOBAL SOCKET ACCESS FOR DEBUGGING
  window.notificationSocket = notificationSocket;
  
  // 🔥 ADDED: Debug helper
  window.debugSocket = () => notificationSocket.debugConnection();
}

export default notificationSocket;