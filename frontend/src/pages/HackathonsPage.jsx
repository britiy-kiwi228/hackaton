import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Предполагаем, что API экспортируется так. Если нет - подправьте импорт
import { hackathonsApi } from '../api/hackathonsApi';
import '../styles/HackathonsPage.css';

const HackathonsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('active'); // 'active' | 'archive'
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      setError(null);
      try {
        // Эмуляция вызова API с фильтрами
        // В реальности передавайте filter и page в ваш метод API
        const data = await hackathonsApi.getHackathons();

        // Если API возвращает массив сразу:
        if (Array.isArray(data)) {
          setHackathons(data);
        } else if (data.items) {
          // Если пагинация на бекенде
          setHackathons(data.items);
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить список хакатонов.');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, [filter, page]);

  const handleCardClick = (id) => {
    navigate(`/hackathons/${id}`);
  };

  return (
    <div className="hackathons-page">
      <div className="hackathons-container">

        {/* Заголовок / Поиск (визуально как на макете, функционально фильтры) */}
        <div className="page-header">
          <h1 className="page-title">Актуальные:</h1>
          {/* Можно добавить строку поиска, если нужно соответствовать скриншоту input_file_13 */}
        </div>

        {/* Фильтры (Табы) */}
        <div className="filters-container">
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => { setFilter('active'); setPage(1); }}
          >
            Текущие
          </button>
          <button
            className={`filter-btn ${filter === 'archive' ? 'active' : ''}`}
            onClick={() => { setFilter('archive'); setPage(1); }}
          >
            Архив
          </button>
        </div>

        {/* Состояния загрузки/ошибки */}
        {loading && (
          <div className="loader-container">
            <div className="spinner"></div>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
          </div>
        )}

        {/* Сетка хакатонов */}
        {!loading && !error && (
          <>
            <div className="hackathons-grid">
              {hackathons.map((item) => (
                <div
                  key={item.id}
                  className="hackathon-card"
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="card-header">
                    <h3 className="card-title">{item.title}</h3>
                    {/* Стрелочка как на макете */}
                    <svg className="card-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="#748495" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="card-meta">
                    <span className={`status-badge ${item.status === 'active' ? 'status-active' : 'status-finished'}`}>
                      {item.status === 'active' ? 'Активен' : 'Завершен'}
                    </span>
                    <span className="meta-text">{item.date_start} — {item.date_end}</span>
                  </div>

                  <p className="card-location">{item.location || 'Онлайн'}</p>

                  <p className="card-description">
                    {item.short_description || 'Краткое описание мероприятия...'}
                  </p>
                </div>
              ))}
            </div>

            {/* Пагинация (если хакатонов много) */}
            {hackathons.length > 0 && (
              <div className="pagination">
<button
  disabled={page === 1}
  onClick={() => setPage(p => p - 1)}
  className="page-btn"
>
  
                </button>
                <span className="page-info">{page} из {totalPages}</span>
<button
  disabled={page === totalPages}
  onClick={() => setPage(p => p + 1)}
  className="page-btn"
>
  
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HackathonsPage;
