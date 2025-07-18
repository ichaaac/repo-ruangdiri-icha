// src/components/shared/schedule/hooks/useWebSocket.js - WebSocket Integration

import { useEffect, useState, useRef, useCallback } from "react"
import { io } from "socket.io-client"

export const useWebSocket = () => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const listenersMap = useRef(new Map());

  const on = useCallback((event, callback) => {
    if (!listenersMap.current.has(event)) {
      listenersMap.current.set(event, new Set());
    }
    listenersMap.current.get(event).add(callback);
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (listenersMap.current.has(event)) {
      listenersMap.current.get(event).delete(callback);
      if (socket) {
        socket.off(event, callback);
      }
      if (listenersMap.current.get(event).size === 0) {
        listenersMap.current.delete(event);
      }
    }
  }, [socket]);


  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL; // e.g., "https://improved-mammal-humane.ngrok-free.app/api/v1"
    let wsBaseUrl = import.meta.env.VITE_WS_URL; // Bisa undefined jika tidak diset

    if (!wsBaseUrl && apiBaseUrl) {
        try {
          // Menggunakan URL API untuk mendapatkan base domain dan protokol
          const url = new URL(apiBaseUrl); // Misalnya: new URL("https://improved-mammal-humane.ngrok-free.app/api/v1")
          wsBaseUrl = `${url.protocol}//${url.host}`; // Hasilnya: "https://improved-mammal-humane.ngrok-free.app"
        } catch (e) {
          console.error("Invalid VITE_API_URL format for WebSocket base URL extraction:", e);
          wsBaseUrl = "http://localhost:3000"; // Fallback jika VITE_API_URL tidak valid
        }
    } else if (!wsBaseUrl) {
        wsBaseUrl = "http://localhost:3000"; // Default fallback jika VITE_WS_URL dan VITE_API_URL kosong
    }

    // 🔥 FINAL WS_URL yang akan digunakan
    const finalWsUrl = `${wsBaseUrl}/notifications`; // 🔥 PASTIKAN SESUAI DENGAN NAMESPACE BACKEND

    const initializeSocket = () => {
      const token = localStorage.getItem("token")

      if (!token) {
        console.warn("No token found, skipping WebSocket connection")
        setIsConnected(false);
        return
      }

      if (socket && socket.connected && socket.io.uri === finalWsUrl) {
          console.log("WebSocket already connected to the correct namespace, skipping new connection attempt.");
          setIsConnected(true);
          return;
      }

      console.log(`🚀 Connecting WebSocket to: ${finalWsUrl}`); // 🔥 Log URL yang akan di-connect

      const socketInstance = io(finalWsUrl, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: false, 
        reconnection: true, 
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })

      socketInstance.on("connect", () => {
        console.log("WebSocket connected:", socketInstance.id)
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // socketInstance.emit("ping", "Hello from frontend")

        listenersMap.current.forEach((cbSet, event) => {
          cbSet.forEach(cb => {
            socketInstance.on(event, cb);
          });
        });
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason)
        setIsConnected(false)

        if (reason === "io server disconnect") {
          console.log("Server initiated disconnect. Will attempt manual reconnect after a delay.")
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            initializeSocket();
          }, 2000);
          return;
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`,
          )
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            socketInstance.connect();
          }, delay)
        } else {
            console.error("Max reconnection attempts reached. WebSocket will not reconnect automatically.");
        }
      })

      socketInstance.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error)
        setIsConnected(false)
      })

      socketInstance.on("pong", (data) => {
        console.log("Received pong from server:", data)
      })

      setSocket(socketInstance)
    }

    initializeSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        console.log("WebSocket cleanup: Disconnected on unmount.");
      }
    }
  }, []);

  return {
    socket,
    isConnected,
    on,
    off,
  };
};