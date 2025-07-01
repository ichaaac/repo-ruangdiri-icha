"use client"

// src/components/shared/schedule/hooks/useWebSocket.js - WebSocket Integration

import { useEffect, useState, useRef } from "react"
import { io } from "socket.io-client"

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    // Get WebSocket URL from environment or default to API URL
    const wsUrl =
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000"

    const initializeSocket = () => {
      const token = localStorage.getItem("token")

      if (!token) {
        console.log("No token found, skipping WebSocket connection")
        return
      }

      const socketInstance = io(wsUrl, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      })

      socketInstance.on("connect", () => {
        console.log("WebSocket connected:", socketInstance.id)
        setIsConnected(true)
        reconnectAttemptsRef.current = 0

        // Send ping to test connection
        socketInstance.emit("ping", "Hello from frontend")
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason)
        setIsConnected(false)

        // Auto-reconnect logic
        if (reason === "io server disconnect") {
          // Server initiated disconnect, don't reconnect
          return
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`,
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            socketInstance.connect()
          }, delay)
        }
      })

      socketInstance.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error)
        setIsConnected(false)
      })

      socketInstance.on("pong", (data) => {
        console.log("Received pong from server:", data)
      })

      // Schedule-specific event listeners
      socketInstance.on("schedule:created", (data) => {
        console.log("Schedule created:", data)
      })

      socketInstance.on("schedule:updated", (data) => {
        console.log("Schedule updated:", data)
      })

      socketInstance.on("schedule:deleted", (data) => {
        console.log("Schedule deleted:", data)
      })

      socketInstance.on("notification:new", (data) => {
        console.log("New notification:", data)
      })

      setSocket(socketInstance)
    }

    initializeSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  return {
    socket,
    isConnected,
  }
}

// Default export for compatibility
export default useWebSocket
