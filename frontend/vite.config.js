import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const config = {
    plugins: [react()],
    server: {
      headers: {
        'Content-Security-Policy': mode === 'development'
          ? "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * ws://* wss://*; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; frame-src *;"
          : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
      }
    }
  };

  return config;
});
