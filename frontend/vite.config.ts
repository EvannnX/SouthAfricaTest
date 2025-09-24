import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    },
    // 支持SPA路由，所有路由都返回index.html
    historyApiFallback: true
  },
  build: {
    // 确保构建时正确处理路由
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
}) 