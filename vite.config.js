// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },    ...(isDev && {
      server: {
        host: true,
        port: 5173,
      },
    }),
    build: {
      outDir: 'dist',
    },
    define: { 
      'process.env': env 
    },
  }
})
