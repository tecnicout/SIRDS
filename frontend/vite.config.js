import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true,
    proxy: {
      // Proxy para comunicarse con el backend Express en puerto 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
})
