import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import '../styles/ProfileDetailsPage.css';

const ProfileDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Загружаем данные пользователя, чей профиль смотрим
        const userData = await usersApi.getUser(id);
        setUser(userData);

        // 2. Загружаем свои данные, чтобы проверить, не свой ли это профиль
        const me = await usersApi.getMe();
        setCurrentUser(me);
      } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleInvite = () => {
    // Здесь должна быть логика отправки приглашения
    // POST /teams/{my_team_id}/invite { user_id: user.id }
    alert(`Приглашение отправлено пользователю ${user.full_name}!`);
  };

  if (loading) return <div className="loading-centered">Загрузка профиля...</div>;
  if (!user) return <div className="loading-centered">Пользователь не найден</div>;

  const isMe = currentUser && currentUser.id === user.id;

  return (
    <div className="profile-details-page">
      <div className="details-container">
        
        {/* Шапка профиля */}
        <div className="profile-header-card">
          <div className="profile-avatar-large">
             {/* Плейсхолдер или картинка */}
             <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#3C47B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="#3C47B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          
          <div className="profile-main-info">
            <h1 className="profile-name">{user.full_name}</h1>
            <p className="profile-username">@{user.username || 'username'}</p>
            <div className="profile-badges">
              <span className="role-badge-large">{user.main_role || 'Роль не указана'}</span>
              <span className={user.ready_to_work ? 'status-ready-badge' : 'status-busy-badge'}>
                {user.ready_to_work ? '● Готов к работе' : '● Занят'}
              </span>
            </div>
          </div>
        </div>

        {/* Блок "О себе" */}
        <div className="info-card-section">
          <h3>О себе:</h3>
          <p className="bio-text">
            {user.bio || 'Пользователь не добавил описание.'}
          </p>
        </div>

        {/* Блок "Навыки" */}
        <div className="info-card-section">
          <h3>Навыки:</h3>
          {user.skills && user.skills.length > 0 ? (
            <div className="skills-list-view">
              {user.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag-view">{skill.name}</span>
              ))}
            </div>
          ) : (
            <p className="bio-text">Навыки не указаны</p>
          )}
        </div>

        {/* Блок "Достижения" */}
        <div className="info-card-section">
          <h3>Достижения:</h3>
          {user.achievements && user.achievements.length > 0 ? (
            <div className="achievements-list-view">
              {user.achievements.map((ach) => (
                <div key={ach.id} className="achievement-card-view">
                  <h4 className="ach-title-view">{ach.name}</h4>
                  <p className="ach-desc-view">{ach.description}</p>
                  <span className="ach-date-view">{ach.unlocked_at ? ach.unlocked_at.split('T')[0] : ''}</span>
                </div>
              ))}
            </div>
          ) : (
             <p className="bio-text">Нет достижений</p>
          )}
        </div>

        {/* Кнопка действия */}
        <div className="bottom-actions-profile">
          {isMe ? (
            <button className="btn-edit-profile" onClick={() => navigate('/profile')}>
              Редактировать мой профиль
            </button>
          ) : (
            <button className="btn-invite" onClick={handleInvite}>
              + Пригласить в команду
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileDetailsPage;