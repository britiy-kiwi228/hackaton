import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar, Input, Select, Tabs, Modal, Alert } from '@/shared/ui';
import { useHackathons } from '@/shared/hooks';
import { UserListResponse, RoleEnum, HackathonResponse } from '@/shared/api/types';
import api from '@/shared/api';

type ParticipantTab = 'all' | 'with_team' | 'without_team' | 'looking';

export default function OrganizerParticipants() {
  const navigate = useNavigate();
  const { hackathons, loading: hackatonsLoading } = useHackathons();
  
  const [activeTab, setActiveTab] = useState<ParticipantTab>('all');
  const [selectedHackathon, setSelectedHackathon] = useState<number | null>(null);
  const [participants, setParticipants] = useState<UserListResponse[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<UserListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleEnum | 'all'>('all');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<UserListResponse | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeHackathons = hackathons.filter(h => h.is_active);

  useEffect(() => {
    if (activeHackathons.length > 0 && !selectedHackathon) {
      setSelectedHackathon(activeHackathons[0].id);
    }
  }, [activeHackathons, selectedHackathon]);

  useEffect(() => {
    if (selectedHackathon) {
      loadParticipants();
    }
  }, [selectedHackathon]);

  useEffect(() => {
    filterParticipants();
  }, [participants, activeTab, searchQuery, selectedRole]);

  const loadParticipants = async () => {
    if (!selectedHackathon) return;
    
    try {
      setLoading(true);
      const response = await api.users.listUsers({ hackathon_id: selectedHackathon });
      setParticipants(response);
    } catch (error) {
      console.error('Error loading participants:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке участников' });
    } finally {
      setLoading(false);
    }
  };

  const filterParticipants = () => {
    let filtered = [...participants];

    // Фильтр по вкладке
    switch (activeTab) {
      case 'with_team':
        filtered = filtered.filter(p => p.team_id !== null);
        break;
      case 'without_team':
        filtered = filtered.filter(p => p.team_id === null);
        break;
      case 'looking':
        // Здесь нужно будет добавить поле ready_to_work в UserListResponse или загружать полную информацию
        break;
    }

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.full_name.toLowerCase().includes(query) ||
        (p.username && p.username.toLowerCase().includes(query))
      );
    }

    // Фильтр по роли
    if (selectedRole !== 'all') {
      filtered = filtered.filter(p => p.main_role === selectedRole);
    }

    setFilteredParticipants(filtered);
  };

  const handleViewDetails = async (participant: UserListResponse) => {
    setSelectedParticipant(participant);
    setShowDetailsModal(true);
  };

  const getRoleColor = (role: RoleEnum | null) => {
    switch (role) {
      case RoleEnum.FRONTEND: return 'bg-blue-100 text-blue-800';
      case RoleEnum.BACKEND: return 'bg-green-100 text-green-800';
      case RoleEnum.DESIGN: return 'bg-purple-100 text-purple-800';
      case RoleEnum.PM: return 'bg-orange-100 text-orange-800';
      case RoleEnum.ANALYST: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRoleText = (role: RoleEnum | null) => {
    switch (role) {
      case RoleEnum.FRONTEND: return 'Frontend';
      case RoleEnum.BACKEND: return 'Backend';
      case RoleEnum.DESIGN: return 'Design';
      case RoleEnum.PM: return 'PM';
      case RoleEnum.ANALYST: return 'Analyst';
      default: return 'Не указано';
    }
  };

  if (hackatonsLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (activeHackathons.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Управление участниками</h1>
            <p className="text-gray-600 mb-6">У вас нет активных хакатонов</p>
            <Button onClick={() => navigate('/organizer/hackathons')}>
              Создать хакатон
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Управление участниками</h1>
          
          {message && (
            <Alert 
              type={message.type} 
              message={message.text}
              onClose={() => setMessage(null)}
              className="mb-4"
            />
          )}

          {/* Выбор хакатона */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Хакатон
            </label>
            <Select
              value={selectedHackathon?.toString() || ''}
              onChange={(value) => setSelectedHackathon(Number(value))}
              className="max-w-md"
            >
              {activeHackathons.map(hackathon => (
                <option key={hackathon.id} value={hackathon.id}>
                  {hackathon.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Input
              placeholder="Поиск по имени или username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select
              value={selectedRole}
              onChange={(value) => setSelectedRole(value as RoleEnum | 'all')}
              className="w-full sm:w-48"
            >
              <option value="all">Все роли</option>
              <option value={RoleEnum.FRONTEND}>Frontend</option>
              <option value={RoleEnum.BACKEND}>Backend</option>
              <option value={RoleEnum.DESIGN}>Design</option>
              <option value={RoleEnum.PM}>PM</option>
              <option value={RoleEnum.ANALYST}>Analyst</option>
            </Select>
          </div>

          {/* Вкладки */}
          <Tabs
            tabs={[
              { id: 'all', label: `Все (${participants.length})` },
              { id: 'with_team', label: `В команде (${participants.filter(p => p.team_id !== null).length})` },
              { id: 'without_team', label: `Без команды (${participants.filter(p => p.team_id === null).length})` },
              { id: 'looking', label: 'Ищут команду' },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as ParticipantTab)}
            className="mb-6"
          />
        </div>

        {/* Список участников */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredParticipants.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Участники не найдены</p>
              </Card>
            ) : (
              filteredParticipants.map(participant => (
                <Card key={participant.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar 
                        name={participant.full_name}
                        size="md"
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {participant.full_name}
                        </h3>
                        {participant.username && (
                          <p className="text-sm text-gray-500">@{participant.username}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(participant.main_role)}>
                            {getRoleText(participant.main_role)}
                          </Badge>
                          {participant.team_id ? (
                            <Badge className="bg-green-100 text-green-800">
                              В команде
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Без команды
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(participant)}
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Модальное окно с деталями участника */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Информация об участнике"
        >
          {selectedParticipant && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar 
                  name={selectedParticipant.full_name}
                  size="lg"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedParticipant.full_name}
                  </h3>
                  {selectedParticipant.username && (
                    <p className="text-gray-500">@{selectedParticipant.username}</p>
                  )}
                  <p className="text-sm text-gray-500">ID: {selectedParticipant.id}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Роль</label>
                  <Badge className={getRoleColor(selectedParticipant.main_role)}>
                    {getRoleText(selectedParticipant.main_role)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Статус команды</label>
                  {selectedParticipant.team_id ? (
                    <Badge className="bg-green-100 text-green-800">
                      В команде (ID: {selectedParticipant.team_id})
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Без команды
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}