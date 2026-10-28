import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// In development the API is proxied so the session cookie stays same-origin.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true },
      // Images uploaded through the admin are stored and served by the API server
      '/uploads': { target: process.env.VITE_DEV_API_TARGET || 'http://localhost:5000', changeOrigin: true },
    },
  },
})
