import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { teamsApi } from '../api/teamsApi';
import '../styles/CreateTeamPage.css';

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit'); 
  
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hackathon_id: '', // Оставляем в стейте, но скрываем из UI
    is_looking: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (editId) {
          const team = await teamsApi.getTeam(editId);
          setFormData({
            name: team.name,
            description: team.description,
            hackathon_id: team.hackathon_id,
            is_looking: team.is_looking
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Проверяем только название, так как хакатон теперь необязателен
    if (!formData.name) {
      alert('Пожалуйста, введите название команды');
      return;
    }

    setLoading(true);
    try {
      if (editId) {
        // Редактирование
        await teamsApi.updateTeam(editId, {
          name: formData.name,
          description: formData.description,
          is_looking: formData.is_looking
        });
      } else {
        // Создание
        // Так как мы убрали выбор хакатона, передаем заглушку или null.
        // Если ваш бэкенд требует ID, замените '1' на дефолтный ID или логику.
        // Если бэкенд умеет принимать без ID, передайте null.
        const targetHackathonId = formData.hackathon_id || 1; 
        
        await teamsApi.createTeam(targetHackathonId, {
          name: formData.name,
          description: formData.description,
          is_looking: formData.is_looking
        });
      }
      
      // Успешный редирект на страницу команд
      navigate('/teams');
      
    } catch (error) {
      alert('Ошибка сохранения. Возможно имя занято.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-page">
      <div className="create-container">
        <h1 className="page-title">{editId ? 'Редактировать команду' : 'Создать команду'}</h1>
        
        <form className="create-form" onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Название команды *</label>
            <input 
              type="text" 
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="VibeCoders"
            />
          </div>

          {/* ПОЛЕ ВЫБОРА ХАКАТОНА УДАЛЕНО ПО ТРЕБОВАНИЮ */}

          <div className="form-group">
            <label>Описание</label>
            <textarea 
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Кого ищем, стек технологий..."
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                name="is_looking"
                checked={formData.is_looking}
                onChange={handleChange}
              />
              Активно ищем участников
            </label>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Сохранение...' : (editId ? 'Обновить' : 'Создать')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamPage;