import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Простая и надежная CSP для разработки
  const devCsp = "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * ws://* wss://*; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:; frame-src *;"
  
  // Безопасная CSP для продакшена
  const prodCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  
  return {
    plugins: [react()],
    server: {
      headers: {
        'Content-Security-Policy': mode === 'development' ? devCsp : prodCsp
      }
    }
  }
})