// src/components/shared/notifications/lib/socket.js

import { io } from 'socket.io-client'

class NotificationSocket {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
  }

  /**
   * Connect ke notification namespace dengan Bearer token
   */
  connect() {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL
    
    if (!token || this.isConnected) return

    // Connect sesuai backend gateway spec
    this.socket = io(`${apiUrl}/notifications`, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔗 Notification socket connected:', this.socket.id)
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error)
    })

    // Listen backend events sesuai NotificationGateway
    this.socket.on('notification:created', (payload) => {
      console.log('📢 New notification:', payload)
      this.emit('notification:created', payload.data)
    })

    this.socket.on('notification:updated', (payload) => {
      console.log('📝 Notification updated:', payload)
      this.emit('notification:updated', payload.data)
    })

    this.socket.on('notification:read', (payload) => {
      console.log('✅ Notifications read:', payload)
      this.emit('notification:read', payload.data)
    })
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

  /**
   * Emit event ke listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in notification listener:', error)
        }
      })
    }
  }

  /**
   * Check connection status
   */
  isSocketConnected() {
    return this.isConnected && this.socket?.connected
  }

  /**
   * Ensure connection (reconnect if needed)
   */
  ensureConnection() {
    if (!this.isSocketConnected()) {
      this.connect()
    }
  }
}

// Singleton instance
const notificationSocket = new NotificationSocket()

export default notificationSocket