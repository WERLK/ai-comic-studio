import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    proxy: {
      // 将 /api 请求转发到后端账号数据库服务 (server/index.ts)
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
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
