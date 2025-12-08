import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-container">
        
        {/* Логотип */}
        <div className="home-logo">
          <span className="logo-hack">Hack</span>
          <span className="logo-mate">Mate</span>
        </div>

        {/* Меню */}
        <div className="menu-stack">
          
          {/* Кнопка 1: Профиль */}
          <button className="menu-btn btn-primary" onClick={() => navigate('/profile')}>
            <div className="icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="btn-text">Профиль</span>
          </button>

          {/* Кнопка 2: Найти команду */}
          <button className="menu-btn btn-accent" onClick={() => navigate('/recommendations')}>
            <div className="icon-group">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Иконка группы */}
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Человечек справа с плюсиком */}
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11684 19.0078 7.005C19.0078 7.89316 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="btn-text">Найти команду</span>
          </button>

          {/* Кнопка 3: Хакатоны */}
          <button className="menu-btn btn-outline" onClick={() => navigate('/hackathons')}>
            <span className="btn-text-dark">Хакатоны</span>
          </button>

          {/* Кнопка 4: Команды */}
          <button className="menu-btn btn-outline" onClick={() => navigate('/teams')}>
            <span className="btn-text-dark">Команды</span>
          </button>

        </div>
      </div>
    </div>
  );
};

export default HomePage;