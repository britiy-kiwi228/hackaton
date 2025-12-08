import React, { useState, useEffect, useRef } from 'react'; // <-- Добавили useRef
import { useParams, useNavigate } from 'react-router-dom';
import { hackathonsApi } from '../api/hackathonsApi';
import '../styles/HackathonDetailsPage.css';

const HackathonDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Реф для прокрутки к нижним кнопкам
  const actionsRef = useRef(null);
  
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const hackData = await hackathonsApi.getHackathonById(id);
        setHackathon(hackData);
        
        const teamsData = await hackathonsApi.getHackathonTeams(id);
        setTeams(teamsData || []);
      } catch (err) {
        console.error(err);
        setError('Ошибка загрузки данных хакатона.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // Функция для плавной прокрутки вниз
  const handleParticipateClick = () => {
    // Прокрутка к блоку с рефом actionsRef
    actionsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="details-loader"><div className="spinner"></div></div>;
  if (error || !hackathon) return <div className="details-error">{error || 'Хакатон не найден'}</div>;

  return (
    <div className="details-page">
      
      {/* Баннер с картинкой */}
      <div className="artistic-banner"></div>

      <div className="details-container">
        
        {/* Заголовок хакатона */}
        <div className="hackathon-header">
          <h1 className="hackathon-title">{hackathon.title}</h1>
        </div>
        
        {/* Кнопка "Участвовать" -> Скроллит вниз */}
        <div className="action-main">
           <button className="btn-participate" onClick={handleParticipateClick}>
             <span className="plus-icon">+</span> Участвовать
           </button>
        </div>

        {/* Инфо-блок */}
        <div className="info-block">
          <div className="info-row">
            <span className="info-icon">📅</span>
            <span className="info-text">
              {hackathon.date_start ? hackathon.date_start : 'Дата уточняется'}
              {hackathon.date_end ? ` — ${hackathon.date_end}` : ''}
            </span>
          </div>
          <div className="info-row">
            <span className="info-icon">📍</span>
            <span className="info-text">{hackathon.location || 'Онлайн'}</span>
          </div>
          
          <div className="description-text">
            {hackathon.description || 'ЗДЕСЬ КРУТО КЛАССНО (описание из базы данных)'}
          </div>

          {hackathon.tags && (
            <div className="tags-container">
              {hackathon.tags.map((tag, idx) => (
                <span key={idx} className="tech-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Статистика */}
        <h2 className="section-title">Статистика</h2>
        <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{hackathon.participants_count || 0}</span>
              <span className="stat-label">Участников</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{teams.length}</span>
              <span className="stat-label">Команд</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{hackathon.days_left || 0}</span>
              <span className="stat-label">Дней осталось</span>
            </div>
        </div>

        {/* Список команд */}
        <div className="teams-section">
          <div className="teams-title-container">
            <h2 className="teams-title-text">Выберите команду:</h2>
          </div>
          
          <div className="teams-grid">
            {teams.length > 0 ? teams.map((team) => (
              <div key={team.id} className="team-card">
                <h3 className="team-name">{team.name}</h3>
                <p className="team-meta">
                  Капитан: {team.captain_name || 'Не указан'}
                </p>
              </div>
            )) : (
              <p className="no-teams-text">Команд пока нет. Создайте свою!</p>
            )}
          </div>
        </div>

        {/* Кнопки действий (внизу) */}
        {/* Привязываем ref сюда, чтобы скроллить к этому месту */}
        <div className="bottom-actions" ref={actionsRef}>
           <button className="btn-action" onClick={() => navigate('/create-team')}>
             Создать команду
           </button>
           
           {/* Изменен путь на /recommendations */}
           <button className="btn-action" onClick={() => navigate('/recommendations')}>
             Найти команду
           </button>
        </div>

      </div>
    </div>
  );
};

export default HackathonDetailsPage;