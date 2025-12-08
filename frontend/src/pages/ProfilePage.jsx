import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/usersApi';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    full_name: '',
    bio: '',
    main_role: '',
    ready_to_work: true,
    skills: []
  });
  
  const [skillInput, setSkillInput] = useState('');
  
  const [achievements, setAchievements] = useState([]);
  const [newAchieve, setNewAchieve] = useState({ name: '', description: '', date: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const me = await usersApi.getMe();
      setUserData({
        full_name: me.full_name || '',
        bio: me.bio || '',
        main_role: me.main_role || 'backend',
        ready_to_work: me.ready_to_work ?? true,
        skills: me.skills || [] 
      });
      setAchievements(me.achievements || []);
    } catch (error) {
      console.error(error);
      // Демо данные (если бэк упал)
      setUserData({
        full_name: 'Николай Демо',
        bio: 'Backend разработчик с опытом 3 года. Люблю хакатоны.',
        main_role: 'backend',
        ready_to_work: true,
        skills: [{ name: 'Python' }, { name: 'Docker' }]
      });
      setAchievements([
        { id: 1, name: 'Победитель HackMate 2023', description: '1 место в треке FinTech', unlocked_at: '2023-12-01' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      setUserData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: skillInput.trim() }]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (indexToRemove) => {
    setUserData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Функция сохранения с редиректом
  const handleSaveProfile = async () => {
    try {
      await usersApi.updateMe(userData);
      alert('Профиль сохранен!');
      navigate('/'); // <--- Перенаправление на главную страницу
    } catch (error) {
      alert('Ошибка сохранения или сервер недоступен. (Демо-режим)');
      navigate('/'); // Даже при ошибке в демо-режиме можно отправить на главную
    }
  };

  const handleAddAchievement = async () => {
    if (!newAchieve.name) return;
    try {
      // Имитация добавления
      const tempId = Date.now();
      const newAchievementObj = { ...newAchieve, id: tempId, unlocked_at: new Date().toISOString() };
      
      // В реальности здесь был бы запрос: await usersApi.addAchievement(newAchieve);
      setAchievements([...achievements, newAchievementObj]);
      setNewAchieve({ name: '', description: '', date: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAchievement = async (id) => {
    try {
      // В реальности: await usersApi.deleteAchievement(id);
      setAchievements(achievements.filter(a => a.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="profile-loading" style={{padding: '40px', textAlign: 'center'}}>Загрузка профиля...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        
        <h1 className="profile-page-title">Мой профиль</h1>

        <div className="profile-content-grid">
          
          {/* Левая колонка: Редактирование */}
          <div className="profile-left-col">
            <div className="profile-card edit-card">
              
              <div className="avatar-section">
                <div className="big-avatar">
                   <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#3C47B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="#3C47B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                   </svg>
                </div>
                <div className="name-display">
                  <h2>{userData.full_name || 'Ваше имя'}</h2>
                  <span className="username-tag">@username</span>
                </div>
              </div>

              <div className="form-group">
                <label>Полное имя</label>
                <input 
                  type="text" 
                  name="full_name" 
                  className="profile-input" 
                  value={userData.full_name} 
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>О себе</label>
                <textarea 
                  name="bio" 
                  className="profile-textarea" 
                  value={userData.bio} 
                  onChange={handleChange}
                  placeholder="Расскажите о своем опыте..."
                />
              </div>

              <div className="form-group">
                <label>Основная роль</label>
                <select 
                  name="main_role" 
                  className="profile-select" 
                  value={userData.main_role} 
                  onChange={handleChange}
                >
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                  <option value="design">Дизайн</option>
                  <option value="pm">Project Manager</option>
                  <option value="analyst">Аналитик</option>
                </select>
              </div>

              <div className="form-group toggle-group">
                <label>Готовность к работе</label>
                <div 
                  className={`custom-toggle ${userData.ready_to_work ? 'active' : ''}`}
                  onClick={() => setUserData(p => ({...p, ready_to_work: !p.ready_to_work}))}
                >
                  <div className="toggle-circle"></div>
                </div>
                <span className="toggle-status-text">
                  {userData.ready_to_work ? 'Активно ищу команду' : 'Временно занят'}
                </span>
              </div>

              <div className="form-group">
                <label>Навыки (Enter чтобы добавить)</label>
                <div className="skills-input-container">
                  {userData.skills.map((skill, idx) => (
                    <span key={idx} className="skill-chip" onClick={() => removeSkill(idx)}>
                      {skill.name} ×
                    </span>
                  ))}
                  <input 
                    type="text" 
                    className="skill-input-field"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Python, Figma..."
                  />
                </div>
              </div>

              <button className="btn-save" onClick={handleSaveProfile}>
                Сохранить изменения
              </button>

            </div>
          </div>

          {/* Правая колонка: Достижения */}
          <div className="profile-right-col">
            <h2 className="section-header">Достижения</h2>
            
            <div className="achievements-list">
              {achievements.map((ach) => (
                <div key={ach.id} className="achievement-card">
                  <div className="ach-header">
                    <h3 className="ach-title">{ach.name}</h3>
                    <button className="btn-delete-ach" onClick={() => handleDeleteAchievement(ach.id)}>
                      🗑
                    </button>
                  </div>
                  <p className="ach-desc">{ach.description}</p>
                  <span className="ach-date">{ach.unlocked_at ? ach.unlocked_at.split('T')[0] : ''}</span>
                </div>
              ))}
            </div>

            <div className="add-achievement-form">
              <h3>Добавить достижение</h3>
              <input 
                type="text" 
                className="profile-input mb-2" 
                placeholder="Название"
                value={newAchieve.name}
                onChange={(e) => setNewAchieve({...newAchieve, name: e.target.value})}
              />
              <textarea 
                className="profile-textarea mb-2" 
                placeholder="Описание"
                value={newAchieve.description}
                onChange={(e) => setNewAchieve({...newAchieve, description: e.target.value})}
              />
              <button className="btn-add-ach" onClick={handleAddAchievement}>
                Добавить
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;