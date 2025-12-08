import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import '../styles/UsersPage.css';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: '', is_ready: '' });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Делаем реальный запрос к базе
      const data = await usersApi.getUsers(filters);
      
      // Бэкенд может вернуть массив [...] или объект { items: [...], total: ... }
      // Проверяем формат:
      const userList = Array.isArray(data) ? data : (data.items || []);
      
      setUsers(userList);
    } catch (error) {
      console.error("Ошибка загрузки пользователей:", error);
      // !!! ВАЖНО: Мы убрали демо-данные отсюда.
      // Теперь, если ошибка, список будет пустым, и вы увидите ошибку в консоли (F12)
      setUsers([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="users-page">
      <div className="users-container">
        
        {/* Блок фильтров */}
        <div className="filters-block">
          <h2 className="filters-title">Поиск специалистов</h2>
          <div className="filters-row">
            <select 
              name="role" 
              className="filter-select" 
              value={filters.role}
              onChange={handleFilterChange}
            >
              <option value="">Все роли</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="design">Дизайн</option>
              <option value="analyst">Аналитика</option>
              <option value="pm">Менеджмент</option>
            </select>

            <select 
              name="is_ready" 
              className="filter-select"
              value={filters.is_ready}
              onChange={handleFilterChange}
            >
              <option value="">Любой статус</option>
              <option value="true">Готов к работе</option>
              <option value="false">Занят</option>
            </select>
          </div>
        </div>

        {/* Сетка пользователей */}
        {loading ? (
          <div className="loading-state">Загрузка...</div>
        ) : (
          <div className="users-grid">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="card-header-user">
                    <div className="user-avatar-placeholder">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="ava" />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#3C47B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="#3C47B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div className="user-info-text">
                      <h3 className="user-name">{user.full_name || 'Без имени'}</h3>
                      <span className="user-role">
                        {user.main_role || 'Роль не указана'}
                      </span>
                    </div>
                  </div>

                  <div className="user-skills-list">
                    {user.skills && user.skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill.name}</span>
                    ))}
                    {user.skills && user.skills.length > 4 && (
                      <span className="skill-tag">+{user.skills.length - 4}</span>
                    )}
                  </div>

                  <div className="user-status-row">
                    {user.ready_to_work ? (
                      <span className="status-ready">● Готов к работе</span>
                    ) : (
                      <span className="status-busy">● Не готов</span>
                    )}
                  </div>

                  <div className="user-card-actions">
                    <button className="btn-profile" onClick={() => navigate(`/profile/${user.id}`)}>
                      Профиль
                    </button>
                    {/* Кнопка действия пока неактивна */}
                    {/* <button className="btn-collaborate">Сотрудничать</button> */}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#666' }}>
                Пользователи не найдены или произошла ошибка загрузки.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;