import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion'))  return 'vendor-motion';
          if (id.includes('node_modules/recharts'))        return 'vendor-charts';
          if (id.includes('node_modules/lucide-react'))    return 'vendor-icons';
          if (id.includes('node_modules/axios'))           return 'vendor-axios';
          if (id.includes('node_modules/react-dom'))       return 'vendor-react';
          if (id.includes('node_modules/react-router'))    return 'vendor-react';
          if (id.includes('node_modules/react'))           return 'vendor-react';
        }
      }
    }
  }
})
