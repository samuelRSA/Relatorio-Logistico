import path from 'node:path';
import react from '@vitejs/plugin-react';

export const createViteRuntimeConfig = (root = process.cwd()) => ({
  configFile: false,
  root,
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
  },
  build: {
    outDir: 'dist',
  },
});
