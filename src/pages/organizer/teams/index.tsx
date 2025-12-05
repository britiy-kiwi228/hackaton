import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar, Input, Select, Tabs, Modal, Alert } from '@/shared/ui';
import { useHackathons } from '@/shared/hooks';
import { TeamListResponse, TeamResponse, UserListResponse, RoleEnum } from '@/shared/api/types';
import api from '@/shared/api';

type TeamTab = 'all' | 'looking' | 'full';

export default function OrganizerTeams() {
  const navigate = useNavigate();
  const { hackathons, loading: hackatonsLoading } = useHackathons();
  
  const [activeTab, setActiveTab] = useState<TeamTab>('all');
  const [selectedHackathon, setSelectedHackathon] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamListResponse[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamListResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserListResponse[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeHackathons = hackathons.filter(h => h.is_active);

  useEffect(() => {
    if (activeHackathons.length > 0 && !selectedHackathon) {
      setSelectedHackathon(activeHackathons[0].id);
    }
  }, [activeHackathons, selectedHackathon]);

  useEffect(() => {
    if (selectedHackathon) {
      loadTeams();
    }
  }, [selectedHackathon]);

  useEffect(() => {
    filterTeams();
  }, [teams, activeTab, searchQuery]);

  const loadTeams = async () => {
    if (!selectedHackathon) return;
    
    try {
      setLoading(true);
      const response = await api.teams.getList({ hackathon_id: selectedHackathon });
      setTeams(response);
    } catch (error) {
      console.error('Error loading teams:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке команд' });
    } finally {
      setLoading(false);
    }
  };

  const filterTeams = () => {
    let filtered = [...teams];

    // Фильтр по вкладке
    switch (activeTab) {
      case 'looking':
        filtered = filtered.filter(t => t.is_looking);
        break;
      case 'full':
        filtered = filtered.filter(t => !t.is_looking);
        break;
    }

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query)
      );
    }

    setFilteredTeams(filtered);
  };

  const handleViewDetails = async (team: TeamListResponse) => {
    try {
      setLoading(true);
      const [teamDetails, members] = await Promise.all([
        api.teams.getById(team.id),
        api.users.listUsers({ team_id: team.id })
      ]);
      
      setSelectedTeam(teamDetails);
      setTeamMembers(members);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading team details:', error);
      setMessage({ type: 'error', text: 'Ошибка при загрузке деталей команды' });
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Управление командами</h1>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Управление командами</h1>
          
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
              placeholder="Поиск по названию команды..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Вкладки */}
          <Tabs
            tabs={[
              { id: 'all', label: `Все команды (${teams.length})` },
              { id: 'looking', label: `Ищут участников (${teams.filter(t => t.is_looking).length})` },
              { id: 'full', label: `Набор закрыт (${teams.filter(t => !t.is_looking).length})` },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as TeamTab)}
            className="mb-6"
          />
        </div>

        {/* Список команд */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTeams.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">Команды не найдены</p>
              </Card>
            ) : (
              filteredTeams.map(team => (
                <Card key={team.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {team.name}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {team.id}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {team.is_looking ? (
                            <Badge className="bg-green-100 text-green-800">
                              Ищут участников
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Набор закрыт
                            </Badge>
                          )}
                          <Badge className="bg-blue-100 text-blue-800">
                            Капитан: ID {team.captain_id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(team)}
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

        {/* Модальное окно с деталями команды */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Информация о команде"
          size="lg"
        >
          {selectedTeam && (
            <div className="space-y-6">
              {/* Основная информация о команде */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {selectedTeam.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {selectedTeam.name}
                  </h3>
                  <p className="text-gray-500">ID: {selectedTeam.id}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {selectedTeam.is_looking ? (
                      <Badge className="bg-green-100 text-green-800">
                        Ищут участников
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">
                        Набор закрыт
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Описание команды */}
              {selectedTeam.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedTeam.description}
                  </p>
                </div>
              )}

              {/* Участники команды */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Участники команды ({teamMembers.length})
                </label>
                <div className="space-y-3">
                  {teamMembers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      В команде пока нет участников
                    </p>
                  ) : (
                    teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            name={member.full_name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.full_name}
                              {member.id === selectedTeam.captain_id && (
                                <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                                  Капитан
                                </Badge>
                              )}
                            </p>
                            {member.username && (
                              <p className="text-sm text-gray-500">@{member.username}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(member.main_role)}>
                            {getRoleText(member.main_role)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Дата создания
                  </label>
                  <p className="text-gray-900">
                    {new Date(selectedTeam.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Хакатон
                  </label>
                  <p className="text-gray-900">
                    {hackathons.find(h => h.id === selectedTeam.hackathon_id)?.title || 'Неизвестно'}
                  </p>
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