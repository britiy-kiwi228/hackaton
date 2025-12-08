import React from 'react';
import '../styles/LoginPage.css';

const LoginPage = () => {
  // Проверяем, находимся ли мы в режиме разработки
  const isDev = process.env.NODE_ENV === 'development';

  const handleTelegramLogin = () => {
    // Здесь логика авторизации через Telegram
    console.log("Login via Telegram");
  };

  const handleAdminLogin = () => {
    // Логика входа для разработчика/админа
    console.log("Admin Login triggered");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* Логотип */}
        <div className="logo-container">
          <span className="logo-text-hack">Hack</span>
          <span className="logo-text-mate">Mate</span>
        </div>

        {/* Описание */}
        <p className="description">
          Платформа для поиска команды на хакатон
        </p>

        {/* Кнопка входа через Telegram */}
        <button className="btn-telegram" onClick={handleTelegramLogin}>
          {/* SVG иконка телеграма (самолетик) для соответствия стилю */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="tg-icon"
          >
            <path 
              d="M21.5 2L2 9.5L9.5 12.5L18.5 5.5L11.5 14.5L19 20L21.5 2Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          Войти через Telegram
        </button>

        {/* Кнопка админа (только в dev режиме) */}
        {isDev && (
          <button className="btn-admin" onClick={handleAdminLogin}>
            Войти как администратор
          </button>
        )}

      </div>
    </div>
  );
};

export default LoginPage;