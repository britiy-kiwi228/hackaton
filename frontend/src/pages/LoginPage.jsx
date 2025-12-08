import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginTelegramUser } from '../api/usersApi';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [tgId, setTgId] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  const handleDevLogin = async () => {
    try {
      const userData = await loginTelegramUser({ tg_id: tgId, username, full_name: fullName });
      localStorage.setItem('tg_id', userData.tg_id);
      loginWithToken(userData.token);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleTelegramLogin = async () => {
    try {
      const userData = await loginTelegramUser({ tg_id: tgId, username, full_name: fullName });
      localStorage.setItem('tg_id', userData.tg_id);
      loginWithToken(userData.token);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 style={{ color: '#1F2937', fontFamily: 'Roboto Bold', fontSize: '28px' }}>Hack</h1>
        <h1 style={{ color: '#4A6CF7', fontFamily: 'Roboto Bold', fontSize: '28px', marginLeft: '8px' }}>Mate</h1>
        <p style={{ color: '#4B5563', fontFamily: 'Roboto Regular', fontSize: '16px', marginBottom: '8px' }}>
          Платформа для поиска команды на хакатон
        </p>
        <button onClick={handleTelegramLogin} style={{ backgroundColor: '#4A6CF7', color: 'white', borderRadius: '50px', padding: '14px 24px', fontFamily: 'Roboto Medium', fontSize: '16px' }}>
          Войти через Telegram
        </button>
        {process.env.NODE_ENV === 'development' && (
          <div className="dev-block">
            <h2 style={{ fontFamily: 'Roboto Bold', fontSize: '14px', color: '#1F2937' }}>Тестовые данные</h2>
            <input
              type="text"
              placeholder="Telegram ID"
              value={tgId}
              onChange={(e) => setTgId(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', padding: '8px 12px' }}
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', padding: '8px 12px' }}
            />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', padding: '8px 12px' }}
            />
            <button onClick={handleDevLogin} style={{ backgroundColor: '#1F2937', color: 'white', borderRadius: '8px', fontFamily: 'Roboto Medium', fontSize: '14px' }}>
              Войти как тестовый пользователь
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
