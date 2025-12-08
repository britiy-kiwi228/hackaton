// ВРЕМЕННОЕ РЕШЕНИЕ ДЛЯ РАЗРАБОТКИ
if (import.meta.env.DEV) {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * ws://* wss://*; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:;";
  document.head.prepend(meta);
}
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
