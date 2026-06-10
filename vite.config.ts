import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { version } from './package.json';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  define: {
    // 将 package.json 的 version 注入到前端（使用方式: import.meta.env.VITE_APP_VERSION）
    // 同时保留 __APP_VERSION__ 作为兼容入口
    __APP_VERSION__: JSON.stringify(version),
  },
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
