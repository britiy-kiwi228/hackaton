import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamsApi } from '../api/teamsApi';
import { hackathonsApi } from '../api/hackathonsApi';
import '../styles/TeamsPage.css';

const TeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Фильтры
  const [filters, setFilters] = useState({
    hackathon_id: '',
    is_looking: ''
  });

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Загружаем хакатоны для фильтра
        const hacks = await hackathonsApi.getHackathons(); // Предполагаем, что этот метод есть
        setHackathons(Array.isArray(hacks) ? hacks : hacks.items || []);
        
        // Загружаем команды
        await fetchTeams();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // Отдельная функция для обновления списка при смене фильтров
  useEffect(() => {
    fetchTeams();
  }, [filters]);

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getTeams(filters);
      setTeams(Array.isArray(data) ? data : data.items || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="teams-page">
      <div className="teams-container">
        
        <div className="teams-header-row">
          <h1 className="page-title">Команды</h1>
          <button className="btn-create-team" onClick={() => navigate('/create-team')}>
            + Создать
          </button>
        </div>

        {/* Фильтры */}
        <div className="filters-card">
          <select 
            name="hackathon_id" 
            className="filter-select"
            value={filters.hackathon_id} 
            onChange={handleFilterChange}
          >
            <option value="">Все хакатоны</option>
            {hackathons.map(h => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
          
          <select 
            name="is_looking" 
            className="filter-select"
            value={filters.is_looking} 
            onChange={handleFilterChange}
          >
            <option value="">Любой статус</option>
            <option value="true">Ищут участников</option>
            <option value="false">Состав набран</option>
          </select>
        </div>

        {/* Список карточек */}
        <div className="teams-list">
          {loading ? (
            <div className="loader">Загрузка...</div>
          ) : teams.length > 0 ? (
            teams.map(team => (
              <div key={team.id} className="team-list-card" onClick={() => navigate(`/teams/${team.id}`)}>
                <div className="team-info">
                  <h3 className="team-list-name">{team.name}</h3>
                  <p className="team-list-meta">
                    {/* Капитан: {team.captain?.full_name || 'Не указан'} */}
                    Хакатон: {team.hackathon?.title || 'Не указан'}
                  </p>
                  <p className="team-list-desc">
                    {team.is_looking ? '🔍 Ищем людей' : '🔒 Состав набран'}
                  </p>
                </div>
                {/* Иконка стрелочки справа, как на скрине */}
                <div className="team-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="#748495" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">Команд не найдено</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeamsPage;