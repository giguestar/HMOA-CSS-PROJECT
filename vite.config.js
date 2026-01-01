import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    allowedHosts: [
      'all',
      '.sandbox.novita.ai',
      '3000-i1n2c951nczu9isc6assz-dfc00ec5.sandbox.novita.ai',
      '.trycloudflare.com',
      'apache-bidding-symbol-recreational.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    },
    hmr: {
      clientPort: 3000
    }
  }
});
