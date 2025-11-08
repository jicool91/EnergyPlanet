import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: '@shared', replacement: path.resolve(__dirname, '../shared') },
    ],
  },
  server: {
    port: 5173,
   host: '0.0.0.0',
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, '..'), path.resolve(__dirname, '../shared')],
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
