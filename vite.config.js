import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Wajib biar bisa diakses dari IP publik (ngrok)
    allowedHosts: ['.ngrok-free.app'], // Ini wildcard domain ngrok lu
    port: 5173,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
