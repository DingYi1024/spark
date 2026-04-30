import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'modern',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./modern/src', import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    outDir: '../dist-modern',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['../tests/unit/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
