import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../api/requestsApi';
import '../styles/RequestsPage.css';

const RequestsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Чтобы обновлять UI без перезагрузки
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data = [];
        if (activeTab === 'received') {
          data = await requestsApi.getReceived();
        } else {
          data = await requestsApi.getSent();
        }
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Ошибка загрузки запросов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, refreshKey]);

  // Обработчики действий
  const handleStatusChange = async (reqId, status) => {
    try {
      await requestsApi.updateStatus(reqId, status);
      setRefreshKey(prev => prev + 1); // Перезагрузить список
    } catch (error) {
      alert('Ошибка обновления статуса');
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm('Удалить запрос?')) return;
    try {
      await requestsApi.deleteRequest(reqId);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      alert('Ошибка удаления');
    }
  };

  // Вспомогательные функции для рендера
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="status-badge pending">● Ожидает</span>;
      case 'accepted': return <span className="status-badge accepted">● Принят</span>;
      case 'declined': return <span className="status-badge declined">● Отклонен</span>;
      case 'canceled': return <span className="status-badge canceled">● Отменен</span>;
      default: return <span>{status}</span>;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'join_team': return 'Запрос на вступление';
      case 'invite_team': return 'Приглашение в команду';
      case 'collaborate': return 'Сотрудничество';
      default: return type;
    }
  };

  return (
    <div className="requests-page">
      <div className="requests-container">
        <h1 className="page-title">Мои запросы</h1>

        {/* Вкладки */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Входящие
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Исходящие
          </button>
        </div>

        {/* Список */}
        <div className="requests-list">
          {loading ? (
            <div className="loading-text">Загрузка...</div>
          ) : requests.length > 0 ? (
            requests.map(req => (
              <div key={req.id} className="request-card-item">
                <div className="req-header">
                  <span className="req-type">{getTypeText(req.request_type)}</span>
                  {getStatusBadge(req.status)}
                </div>

                <div className="req-body">
                  {activeTab === 'received' ? (
                    <p>
                      <strong>От:</strong> {req.sender?.full_name || 'Неизвестный'} <br/>
                      {req.team && <span><strong>Команда:</strong> {req.team.name}</span>}
                    </p>
                  ) : (
                    <p>
                      <strong>Кому:</strong> {req.receiver?.full_name || (req.team ? `Команде ${req.team.name}` : 'Неизвестно')} <br/>
                      {req.team && <span><strong>Команда:</strong> {req.team.name}</span>}
                    </p>
                  )}
                  {req.hackathon && <p className="req-hackathon">Хакатон: {req.hackathon.title}</p>}
                </div>

                {/* Кнопки действий */}
                <div className="req-actions-row">
                  {/* Логика для ВХОДЯЩИХ */}
                  {activeTab === 'received' && req.status === 'pending' && (
                    <>
                      <button 
                        className="btn-req accept" 
                        onClick={() => handleStatusChange(req.id, 'accepted')}
                      >
                        Принять
                      </button>
                      <button 
                        className="btn-req decline" 
                        onClick={() => handleStatusChange(req.id, 'declined')}
                      >
                        Отклонить
                      </button>
                    </>
                  )}

                  {/* Логика для ИСХОДЯЩИХ */}
                  {activeTab === 'sent' && req.status === 'pending' && (
                    <button 
                      className="btn-req cancel" 
                      onClick={() => handleDelete(req.id)}
                    >
                      Отменить запрос
                    </button>
                  )}
                  
                  {/* Кнопка удаления для старых запросов */}
                  {(req.status === 'declined' || req.status === 'canceled') && (
                     <button 
                       className="btn-req delete-icon" 
                       onClick={() => handleDelete(req.id)}
                       title="Удалить из истории"
                     >
                       Удалить
                     </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-text">
              {activeTab === 'received' ? 'Нет входящих запросов' : 'Нет исходящих запросов'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RequestsPage;