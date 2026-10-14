import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5273, watch: { ignored: ['**/.chrome-cdp/**', '**/.chrome*/**'] } },
  build: { target: 'es2022' },
});
