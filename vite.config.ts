// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5176,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  }
});
