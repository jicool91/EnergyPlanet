import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
   host: '0.0.0.0',
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    allowedHosts: [
      'epic-late-providing-antonio.trycloudflare.com',
      '.trycloudflare.com',
    ],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        visual: path.resolve(__dirname, 'visual.html'),
      },
    },
  },
});
