import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from './package.json';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version),
    '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
  },
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 600,
    outDir: 'dist',
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
    tsconfigPaths(),
  ],
})
