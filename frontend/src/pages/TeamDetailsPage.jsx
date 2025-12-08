import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamsApi } from '../api/teamsApi';
import { usersApi } from '../api/usersApi';
import '../styles/TeamDetailsPage.css';

const TeamDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Пытаемся получить текущего юзера
      // Если вернется null (гость), код не упадет
      const me = await usersApi.getMe();
      setCurrentUser(me);

      // 2. Получаем команду
      const teamData = await teamsApi.getTeam(id);
      setTeam(teamData);

      // 3. Если пользователь авторизован И он капитан — грузим заявки
      if (me && teamData && me.id === teamData.captain_id) {
        const reqs = await teamsApi.getRequests(id);
        setRequests(reqs || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  // Проверки безопасности: isCaptain true только если currentUser существует
  const isCaptain = currentUser && team && currentUser.id === team.captain_id;
  
  const isMember = currentUser && team && (
    team.members?.some(u => u.id === currentUser.id) || isCaptain
  );

  const handleJoin = async () => {
    if (!currentUser) {
      alert("Сначала войдите в систему (Login)");
      navigate('/login');
      return;
    }
    try {
      await teamsApi.joinTeam(team.id);
      alert('Заявка подана!');
    } catch (e) {
      alert('Ошибка подачи заявки');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Вы точно хотите покинуть команду?')) return;
    try {
      await teamsApi.leaveTeam(team.id);
      navigate('/teams');
    } catch (e) {
      alert('Ошибка');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить команду?')) return;
    try {
      await teamsApi.deleteTeam(team.id);
      navigate('/teams');
    } catch (e) {
      alert('Ошибка удаления');
    }
  };

  const handleRequestAction = async (reqId, action) => {
    try {
      await teamsApi.handleRequest(reqId, action);
      setRequests(requests.filter(r => r.id !== reqId));
      // Обновляем команду, чтобы увидеть нового участника
      const updatedTeam = await teamsApi.getTeam(id);
      setTeam(updatedTeam);
    } catch (e) {
      alert('Ошибка обработки заявки');
    }
  };

  if (loading) return <div className="loading-centered">Загрузка...</div>;
  if (!team) return <div className="loading-centered">Команда не найдена</div>;

  return (
    <div className="team-details-page">
      <div className="details-container">
        
        <div className="team-header-block">
          <div>
            <h1 className="team-title">{team.name}</h1>
            <span className="hackathon-badge">{team.hackathon?.title}</span>
          </div>
          {isCaptain && (
            <button className="btn-edit" onClick={() => navigate(`/create-team?edit=${team.id}`)}>
              ✎ Ред.
            </button>
          )}
        </div>

        <div className="team-card-section">
          <h3>О команде</h3>
          <p className="team-desc">{team.description || 'Описание отсутствует'}</p>
          <div className="team-status-row">
            <span className={team.is_looking ? 'status-looking' : 'status-full'}>
              {team.is_looking ? '● Ищем участников' : '● Состав набран'}
            </span>
          </div>
        </div>

        <div className="team-card-section">
          <h3>Состав ({team.members?.length || 0})</h3>
          <ul className="members-list">
            <li className="member-item captain">
              <span className="role-badge">Капитан</span>
              {team.captain?.full_name || 'Неизвестно'} 
            </li>
            {team.members?.filter(m => m.id !== team.captain_id).map(m => (
              <li key={m.id} className="member-item">
                {m.full_name}
              </li>
            ))}
          </ul>
        </div>

        {isCaptain && requests.length > 0 && (
          <div className="team-card-section requests-section">
            <h3>Заявки на вступление ({requests.length})</h3>
            {requests.map(req => (
              <div key={req.id} className="request-card">
                <div className="req-user">
                  <strong>{req.sender?.full_name}</strong>
                  <span className="req-role">{req.sender?.main_role}</span>
                </div>
                <div className="req-actions">
                  <button className="btn-accept" onClick={() => handleRequestAction(req.id, 'accept')}>✓</button>
                  <button className="btn-decline" onClick={() => handleRequestAction(req.id, 'decline')}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bottom-actions-team">
          {isCaptain ? (
            <button className="btn-danger" onClick={handleDelete}>Удалить команду</button>
          ) : isMember ? (
            <button className="btn-danger" onClick={handleLeave}>Покинуть команду</button>
          ) : (
            <button className="btn-primary-action" onClick={handleJoin}>
              Подать заявку
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeamDetailsPage;