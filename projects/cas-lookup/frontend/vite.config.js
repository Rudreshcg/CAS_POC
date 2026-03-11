import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cas-lookup/', // Ensure assets are referenced from the correct path
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    proxy: {
      '/upload': { target: 'http://localhost:5000', changeOrigin: true },
      '/process': { target: 'http://localhost:5000', changeOrigin: true },
      '/download': { target: 'http://localhost:5000', changeOrigin: true },
      '/api': { target: 'http://localhost:5000', changeOrigin: true }
    }
  }
})
