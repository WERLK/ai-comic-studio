import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand'],
          animation: ['framer-motion'],
          icons: ['lucide-react'],
        },
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
})
