// src/components/shared/notifications/lib/socket.js - SIMPLE AUTO-RECONNECT

import { io } from 'socket.io-client'

class NotificationSocket {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
  }

  connect() {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL
    
    if (!token) {
      console.warn('🚨 No token found, cannot connect socket')
      return
    }

    if (this.isConnected && this.socket) {
      console.log('🔗 Socket already connected')
      return this.socket
    }

    console.log('🚀 Connecting notification socket...')

    this.socket = io(`${apiUrl}/notifications`, {
      auth: { authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      forceNew: false,
    })

    this.socket.on('connect', () => {
      console.log('✅ Notification socket connected successfully!')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      this.isConnected = false
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        console.log('🔄 Server disconnected, attempting manual reconnect...')
        setTimeout(() => this.connect(), 2000)
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error.message)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚨 Max reconnection attempts reached')
      }
    })

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`)
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('reconnect_error', (error) => {
      console.error('🚨 Socket reconnection error:', error.message)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('🚨 Socket reconnection failed completely')
    })

    // 🔥 LISTEN FOR BACKEND EVENTS - HANDLE BOTH EVENT FORMATS
    this.socket.on('notification:created', (payload) => {
      console.log('🔔 Socket received notification:created:', payload)
      this.emit('notification:created', payload.data || payload)
    })

    this.socket.on('created', (payload) => {
      console.log('🔔 Socket received created:', payload)
      this.emit('notification:created', payload.data || payload)
    })

    this.socket.on('notification:updated', (payload) => {
      console.log('📝 Socket received notification:updated:', payload)
      this.emit('notification:updated', payload.data || payload)
    })

    this.socket.on('updated', (payload) => {
      console.log('📝 Socket received updated:', payload)
      this.emit('notification:updated', payload.data || payload)
    })

    this.socket.on('notification:read', (payload) => {
      console.log('✅ Socket received notification:read:', payload)
      this.emit('notification:read', payload.data || payload)
    })

    this.socket.on('read', (payload) => {
      console.log('✅ Socket received read:', payload)
      this.emit('notification:read', payload.data || payload)
    })

    this.socket.on('notification:mark-all-read', (payload) => {
      console.log('✅ Socket received notification:mark-all-read:', payload)
      this.emit('notification:mark-all-read', payload.data || payload)
    })

    this.socket.on('mark-all-read', (payload) => {
      console.log('✅ Socket received mark-all-read:', payload)
      this.emit('notification:mark-all-read', payload.data || payload)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting notification socket')
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
    console.log(`👂 Added listener for ${event}, total: ${this.listeners.get(event).size}`)
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
      console.log(`👋 Removed listener for ${event}, remaining: ${this.listeners.get(event).size}`)
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      console.log(`📡 Emitting ${event} to ${callbacks.size} listeners:`, data)
      
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ Error in notification listener:', error)
        }
      })
    } else {
      console.log(`⚠️ No listeners for event: ${event}`)
    }
  }

  // 🔥 LEGACY METHOD - NOW JUST CALLS CONNECT
  ensureConnection() {
    console.log('🔗 ensureConnection called - delegating to connect()')
    return this.connect()
  }

  // 🔥 UTILITY METHODS
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketExists: !!this.socket,
      socketConnected: this.socket?.connected || false,
      reconnectAttempts: this.reconnectAttempts,
      listenersCount: Array.from(this.listeners.entries()).map(([event, callbacks]) => ({
        event,
        count: callbacks.size
      }))
    }
  }

  // 🔥 DEBUG METHOD
  logStatus() {
    console.log('🔍 Socket Status:', this.getConnectionStatus())
  }
}

// 🔥 SINGLETON INSTANCE
const notificationSocket = new NotificationSocket()

// 🔥 AUTO-CONNECT ON IMPORT (if token exists)
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
  console.log('🚀 Auto-connecting socket on module load...')
  notificationSocket.connect()
}

export default notificationSocket