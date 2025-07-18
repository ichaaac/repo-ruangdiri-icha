// src/components/shared/notifications/lib/socket.js

import { io } from 'socket.io-client';

class NotificationSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  connect() {
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('🚨 No token found, cannot connect socket');
      return;
    }

    if (this.isConnected && this.socket) {
      console.log('🔗 Socket already connected');
      return this.socket;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    let wsBaseUrl = import.meta.env.VITE_WS_URL;

    // if (!wsBaseUrl && apiUrl) {
    //   try {
    //     const url = new URL(apiUrl);
    //     wsBaseUrl = `${url.protocol}//${url.host}`;
    //   } catch (e) {
    //     console.error("Invalid VITE_API_URL format:", e);
    //     wsBaseUrl = "http://localhost:3000";
    //   }
    // } else if (!wsBaseUrl) {
    //   wsBaseUrl = "http://localhost:3000";
    // }

    const finalWsUrl = `${wsBaseUrl}/notifications`;

    console.log('🚀 Connecting notification socket to:', finalWsUrl);
    console.log('🔑 Token length:', token?.length, 'chars');
    console.log('🔑 Token start:', token ? `${token.substring(0, 20)}...` : 'N/A');

    if (this.socket) {
      console.log('🔌 Disconnecting existing socket before reconnecting');
      this.socket.disconnect();
      this.socket = null;
    }


    this.socket = io(finalWsUrl, {
      auth: {
        token: token, // nih anj
      },
   
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Notification socket connected successfully!');
      console.log('🆔 Socket ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.socket.emit('ping', { message: 'Hello from frontend', tokenSent: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        console.log('🚨 Server disconnected - possible auth issue or server restart');
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error.message);
      if (error.message.includes('Authentication') || error.message.includes('token')) {
        console.error('🔐 Token authentication failed - checking token format');
      }
      this.reconnectAttempts++;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('pong', (data) => console.log('🏓 Received pong from server:', data));
    this.socket.on('notification:created', (payload) => this.emit('notification:created', payload));
    this.socket.on('notification:read', (payload) => this.emit('notification:read', payload));
    this.socket.on('notification:mark-all-read', (payload) => this.emit('notification:mark-all-read', payload));
    this.socket.onAny((event, ...args) => {
      console.log('🔍 Socket received event:', event, args);
      if (event.includes('auth') || event.includes('error')) console.error('🔐 Auth/Error event:', event, args);
    });

    return this.socket;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      console.log('🔌 Disconnecting notification socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in notification listener:', error);
        }
      });
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  debugConnection() {
    const token = localStorage.getItem('token');
    console.log('🔍 Socket Debug Info:', {
      isConnected: this.isConnected,
      socketConnected: this.socket?.connected,
      socketId: this.socket?.id,
      token: token ? `${token.substring(0, 20)}...` : 'missing',
    });
    if (this.socket?.handshake) {
      console.log('🤝 Handshake Details (client-side):', {
        headers: this.socket.handshake.headers, 
        auth: this.socket.handshake.auth,
        query: this.socket.handshake.query, 
      });
    }
  }
}

const notificationSocket = new NotificationSocket();

if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  console.log('🚀 Auto-connecting socket on module load...');
  notificationSocket.connect();
}

export default notificationSocket;