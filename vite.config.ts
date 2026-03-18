import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'app',
  publicDir: '../sample',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app'),
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
