import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar, Tabs, Alert } from '@/shared/ui';
import { useRequests } from '@/shared/hooks';
import { RequestResponse, RequestStatusEnum, RequestTypeEnum } from '@/shared/api/types';

type RequestTab = 'incoming' | 'outgoing';

export default function RequestsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RequestTab>('incoming');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { 
    requests, 
    loading, 
    updateRequest, 
    fetchRequests 
  } = useRequests();

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      setMessage(null);
      await updateRequest(requestId, { status: RequestStatusEnum.ACCEPTED });
      setMessage({ type: 'success', text: 'Запрос принят!' });
      fetchRequests(); // Обновляем список
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при принятии запроса' });
    }
  };

  const handleDeclineRequest = async (requestId: number) => {
    try {
      setMessage(null);
      await updateRequest(requestId, { status: RequestStatusEnum.DECLINED });
      setMessage({ type: 'success', text: 'Запрос отклонен' });
      fetchRequests(); // Обновляем список
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отклонении запроса' });
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      setMessage(null);
      await updateRequest(requestId, { status: RequestStatusEnum.CANCELED });
      setMessage({ type: 'success', text: 'Запрос отменен' });
      fetchRequests(); // Обновляем список
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при отмене запроса' });
    }
  };

  // Фильтруем запросы по типу (входящие/исходящие)
  const incomingRequests = requests.filter(req => 
    req.receiver_id && req.status === RequestStatusEnum.PENDING
  );
  
  const outgoingRequests = requests.filter(req => 
    req.sender_id && req.status !== RequestStatusEnum.PENDING
  );

  const getRequestTypeLabel = (type: RequestTypeEnum) => {
    switch (type) {
      case RequestTypeEnum.JOIN_TEAM:
        return 'Заявка в команду';
      case RequestTypeEnum.INVITE:
        return 'Приглашение';
      case RequestTypeEnum.COLLABORATE:
        return 'Сотрудничество';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: RequestStatusEnum) => {
    switch (status) {
      case RequestStatusEnum.PENDING:
        return <Badge variant="warning">Ожидает</Badge>;
      case RequestStatusEnum.ACCEPTED:
        return <Badge variant="success">Принят</Badge>;
      case RequestStatusEnum.DECLINED:
        return <Badge variant="danger">Отклонен</Badge>;
      case RequestStatusEnum.CANCELED:
        return <Badge variant="secondary">Отменен</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Приглашения и заявки</h1>
          <p className="text-gray-600 mt-2">
            Управляй входящими и исходящими запросами
          </p>
        </div>

        {/* Сообщения */}
        {message && (
          <Alert variant={message.type}>
            {message.text}
          </Alert>
        )}

        {/* Переключатель вкладок */}
        <Tabs
          tabs={[
            { id: 'incoming', label: `📥 Входящие (${incomingRequests.length})` },
            { id: 'outgoing', label: `📤 Исходящие (${outgoingRequests.length})` },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as RequestTab)}
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'incoming' ? (
              <>
                {incomingRequests.length > 0 ? (
                  incomingRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {request.sender && (
                            <Avatar name={request.sender.full_name} size="md" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {request.sender?.full_name || 'Неизвестный пользователь'}
                              </h3>
                              {request.sender?.username && (
                                <span className="text-sm text-gray-500">
                                  @{request.sender.username}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="primary" size="sm">
                                  {getRequestTypeLabel(request.request_type)}
                                </Badge>
                                {getStatusBadge(request.status)}
                              </div>
                              
                              {request.team && (
                                <p className="text-sm text-gray-600">
                                  Команда: <span className="font-medium">{request.team.name}</span>
                                </p>
                              )}
                              
                              <p className="text-xs text-gray-500">
                                {formatDate(request.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.status === RequestStatusEnum.PENDING && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                            >
                              Отклонить
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                            >
                              Принять
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <div className="text-center py-8">
                      <p className="text-gray-500">Нет входящих запросов</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Когда кто-то пригласит вас в команду, запросы появятся здесь
                      </p>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <>
                {outgoingRequests.length > 0 ? (
                  outgoingRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {request.receiver && (
                            <Avatar name={request.receiver.full_name} size="md" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {request.receiver?.full_name || 'Неизвестный пользователь'}
                              </h3>
                              {request.receiver?.username && (
                                <span className="text-sm text-gray-500">
                                  @{request.receiver.username}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="primary" size="sm">
                                  {getRequestTypeLabel(request.request_type)}
                                </Badge>
                                {getStatusBadge(request.status)}
                              </div>
                              
                              {request.team && (
                                <p className="text-sm text-gray-600">
                                  Команда: <span className="font-medium">{request.team.name}</span>
                                </p>
                              )}
                              
                              <p className="text-xs text-gray-500">
                                {formatDate(request.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {request.status === RequestStatusEnum.PENDING && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              Отменить
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <div className="text-center py-8">
                      <p className="text-gray-500">Нет исходящих запросов</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Отправьте приглашения участникам через страницу поиска
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate('/browse')}
                      >
                        Найти участников
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Статистика */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{incomingRequests.length}</p>
              <p className="text-sm text-gray-600">Входящих запросов</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === RequestStatusEnum.ACCEPTED).length}
              </p>
              <p className="text-sm text-gray-600">Принятых запросов</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{outgoingRequests.length}</p>
              <p className="text-sm text-gray-600">Исходящих запросов</p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
