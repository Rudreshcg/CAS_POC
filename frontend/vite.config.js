import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure assets are referenced from root
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    proxy: {
      '/upload': 'http://localhost:5000',
      '/process': 'http://localhost:5000',
      '/download': 'http://localhost:5000',
      '/api': 'http://localhost:5000'
    }
  }
})
