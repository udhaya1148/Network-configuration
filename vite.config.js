import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api1': {
        target: 'http://localhost:5000', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api1/, ''), // Correct path replacement for /api1
      },
      '/api2': {
        target: 'http://localhost:5001', // Flask server URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api2/, ''), // Correct path replacement for /api2
      },
    },
  },
  preview: {
    port: 5002,
    host: true,
  },
});
