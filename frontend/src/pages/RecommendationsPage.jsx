import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationsApi } from '../api/recommendationsApi';
import { hackathonsApi } from '../api/hackathonsApi';
import { usersApi } from '../api/usersApi';
import { teamsApi } from '../api/teamsApi'; // Нужно добавить метод getMyTeams или определять капитанство через getMe
import '../styles/RecommendationsPage.css';

const RecommendationsPage = () => {
  const navigate = useNavigate();
  
  const [hackathons, setHackathons] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);

  // Фильтры
  const [filters, setFilters] = useState({
    for_what: 'team', // 'team' (ищу команду) или 'user' (ищу людей)
    hackathon_id: '',
    min_score: 0.1,
    max_results: 10,
    preferred_roles: [], // Можно сделать мультиселект, пока упростим
    role_input: '' // Для выбора одной роли
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        // 1. Грузим хакатоны
        const hacks = await hackathonsApi.getHackathons();
        setHackathons(Array.isArray(hacks) ? hacks : hacks.items || []);

        // 2. Грузим себя, чтобы понять, капитан ли я
        const me = await usersApi.getMe();
        setCurrentUser(me);

        // Если есть команда, где я капитан - сохраним её ID
        // Упрощение: предполагаем, что у юзера есть поле team_id или грузим список команд
        if (me && me.team_id) {
           // Можно подгрузить детали команды, чтобы узнать капитан ли я
           // Для примера оставим логику переключения вручную
        }
      } catch (error) {
        console.error(error);
      }
    };
    initData();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      // Подготовка данных
      const payload = {
        for_what: filters.for_what,
        hackathon_id: filters.hackathon_id ? Number(filters.hackathon_id) : null,
        min_score: Number(filters.min_score),
        max_results: Number(filters.max_results),
        preferred_roles: filters.role_input ? [filters.role_input] : [],
        preferred_skills: [] // Можно добавить инпут для навыков
      };

      let data = [];
      // Если ищем людей и у нас есть ID команды (здесь хардкод или выбор), используем спец. роут
      // Но для простоты используем общий роут /recommendations/
      data = await recommendationsApi.getRecommendations(payload);

      setResults(data);
    } catch (error) {
      console.error("Ошибка поиска:", error);
      alert('Не удалось получить рекомендации');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10B981'; // Зеленый
    if (score >= 0.5) return '#F59E0B'; // Оранжевый
    return '#DC2626'; // Красный
  };

  return (
    <div className="rec-page">
      <div className="rec-container">
        
        {/* Хедер с поиском (как в Фигме) */}
        <div className="rec-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="#3C47B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div className="search-bar-fake" onClick={() => setShowFilters(!showFilters)}>
            <span>{filters.for_what === 'team' ? 'Найти команду (Фильтры)' : 'Найти участников (Фильтры)'}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3C47B8" strokeWidth="2">
               <circle cx="11" cy="11" r="8"></circle>
               <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        {/* Блок фильтров (раскрывающийся) */}
        {showFilters && (
          <form className="filters-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label>Я ищу:</label>
              <select 
                value={filters.for_what}
                onChange={(e) => setFilters({...filters, for_what: e.target.value})}
                className="rec-select"
              >
                <option value="team">Команду (я участник)</option>
                <option value="user">Людей (я капитан)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Хакатон:</label>
              <select 
                value={filters.hackathon_id}
                onChange={(e) => setFilters({...filters, hackathon_id: e.target.value})}
                className="rec-select"
              >
                <option value="">Любой</option>
                {hackathons.map(h => (
                  <option key={h.id} value={h.id}>{h.title}</option>
                ))}
              </select>
            </div>

            {filters.for_what === 'user' && (
              <div className="form-group">
                <label>Нужная роль:</label>
                <select 
                  value={filters.role_input}
                  onChange={(e) => setFilters({...filters, role_input: e.target.value})}
                  className="rec-select"
                >
                  <option value="">Любая</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="design">Design</option>
                  <option value="analyst">Analyst</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-search-rec">Применить</button>
          </form>
        )}

        <h2 className="rec-title">Вам подходят:</h2>

        {loading ? (
          <div className="loading-text">Анализируем совместимость...</div>
        ) : (
          <div className="rec-list">
            {results.length > 0 ? results.map((item, idx) => {
              // item может быть TeamRecommendation или UserRecommendation
              const team = item.recommended_team;
              const user = item.recommended_user;
              const scorePercent = Math.round(item.compatibility_score * 100);

              if (team) {
                // Карточка КОМАНДЫ
                return (
                  <div key={idx} className="rec-card" onClick={() => navigate(`/teams/${team.id}`)}>
                    <div className="rec-card-main">
                      <h3 className="rec-card-title">{team.name}</h3>
                      <p className="rec-card-subtitle">
                        Хакатон: {team.hackathon_id /* Или название если есть в join */}
                      </p>
                      <div className="match-reasons">
                         {item.match_reasons && item.match_reasons.map((r, i) => (
                           <span key={i} className="reason-tag">{r}</span>
                         ))}
                      </div>
                    </div>
                    <div className="rec-score-block">
                      <div className="score-circle" style={{ borderColor: getScoreColor(item.compatibility_score) }}>
                        <span style={{ color: getScoreColor(item.compatibility_score) }}>{scorePercent}%</span>
                      </div>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="#748495" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              } else if (user) {
                // Карточка ПОЛЬЗОВАТЕЛЯ
                return (
                  <div key={idx} className="rec-card" onClick={() => navigate(`/profile/${user.id}`)}>
                    <div className="rec-card-main">
                      <h3 className="rec-card-title">{user.full_name}</h3>
                      <p className="rec-card-subtitle">{user.main_role}</p>
                      <div className="match-reasons">
                         {item.match_reasons && item.match_reasons.map((r, i) => (
                           <span key={i} className="reason-tag">{r}</span>
                         ))}
                      </div>
                    </div>
                    <div className="rec-score-block">
                      <div className="score-circle" style={{ borderColor: getScoreColor(item.compatibility_score) }}>
                        <span style={{ color: getScoreColor(item.compatibility_score) }}>{scorePercent}%</span>
                      </div>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="#748495" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                );
              }
              return null;
            }) : (
              <p className="no-data-text">Нет рекомендаций. Попробуйте изменить фильтры.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default RecommendationsPage;