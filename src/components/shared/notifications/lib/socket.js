// src/components/shared/notifications/lib/socket.js

import { io } from 'socket.io-client'

class NotificationSocket {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.listeners = new Map()
  }

  connect() {
    const token = localStorage.getItem('token')
    const apiUrl = import.meta.env.VITE_API_URL
    
    if (!token || this.isConnected) return

    this.socket = io(`${apiUrl}/notifications`, {
      auth: { authorization: `Bearer ${token}` },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('🔗 Notification socket connected')
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('🚨 Socket connection error:', error.message)
    })

    // Listen for backend events
    this.socket.on('notification:created', (payload) => {
      this.emit('notification:created', payload.data || payload)
    })

    this.socket.on('notification:updated', (payload) => {
      this.emit('notification:updated', payload.data || payload)
    })

    this.socket.on('notification:read', (payload) => {
      this.emit('notification:read', payload.data || payload)
    })
  }

  disconnect() {
    if (this.socket) {
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
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback)
    }
  }

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

  ensureConnection() {
    if (!this.isConnected) {
      this.connect()
    }
  }
}

const notificationSocket = new NotificationSocket()

export default notificationSocket