import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api1': {
        target: 'http://localhost:5001', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api1/, '')

      },
      '/api2': {
        target: 'http://localhost:5002', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api2/, '')

      },
    },
  },
  preview: {
    port: 5000,
    host: true,
  },
});
