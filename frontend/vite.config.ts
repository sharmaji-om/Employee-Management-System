// This file configures the frontend development server, API proxy and tests.
// The root launcher supplies the frontend and backend ports from .env.
// Run npm run dev from the root, or npm test from frontend for unit tests.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: Number(process.env.FRONTEND_PORT || 5173),
    strictPort: true,
    proxy: {
      '/api': { target: `http://127.0.0.1:${process.env.API_PORT || 8080}` },
      '/docs': { target: `http://127.0.0.1:${process.env.API_PORT || 8080}` },
      '/swagger-ui': { target: `http://127.0.0.1:${process.env.API_PORT || 8080}` },
      '/v3': { target: `http://127.0.0.1:${process.env.API_PORT || 8080}` },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
