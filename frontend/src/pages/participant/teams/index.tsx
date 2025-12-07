import { useState, useEffect } from 'react';
import AppLayout from '@/layout/AppLayout';
import { Card, Button, Spinner, Badge, Avatar, Tabs, Input, Modal, Alert } from '@/shared/ui';
import { useTeam, useAuth, useHackathons } from '@/shared/hooks';
import { TeamResponse, TeamCreate, RoleEnum } from '@/shared/api/types';
import api from '@/shared/api';

type TeamTab = 'my-team' | 'all-teams' | 'create';

interface TeamMember {
  id: number;
  full_name: string;
  main_role: RoleEnum | null;
}

interface Hackathon {
  id: number;
  title: string;
  is_active: boolean;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const { hackathons } = useHackathons();
  const { team, members, loading, getTeam, createTeam, updateTeam, joinTeam, leaveTeam } = useTeam();

  const [activeTab, setActiveTab] = useState<TeamTab>('my-team');
  const [allTeams, setAllTeams] = useState<TeamResponse[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Форма создания команды
  const [createForm, setCreateForm] = useState<TeamCreate>({
    name: '',
    description: '',
    hackathon_id: 0,
  });

  useEffect(() => {
    if (hackathons.length > 0 && !selectedHackathon) {
      const activeHackathon = hackathons.find((h: Hackathon) => h.is_active);
      if (activeHackathon) {
        setSelectedHackathon(activeHackathon.id);
        setCreateForm((prev: TeamCreate) => ({ ...prev, hackathon_id: activeHackathon.id }));
      }
    }
  }, [hackathons, selectedHackathon]);

  // Форма редактирования команды
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_looking: true,
  });

  // Получаем активный хакатон по умолчанию
  useEffect(() => {
    if (hackathons.length > 0 && !selectedHackathon) {
      const activeHackathon = hackathons.find((h: Hackathon) => h.is_active);
      if (activeHackathon) {
        setSelectedHackathon(activeHackathon.id);
        setCreateForm((prev: TeamCreate) => ({ ...prev, hackathon_id: activeHackathon.id }));
      }
    }
  }, [hackathons, selectedHackathon]);

  // Загружаем команду пользователя
  useEffect(() => {
    if (user?.team_id && activeTab === 'my-team') {
      getTeam(user.team_id);
    }
  }, [user?.team_id, activeTab, getTeam]);

  // Загружаем все команды
  useEffect(() => {
    if (activeTab === 'all-teams' && selectedHackathon) {
      loadAllTeams();
    }
  }, [activeTab, selectedHackathon]);

  const loadAllTeams = async () => {
    if (!selectedHackathon) return;

    try {
      setLoadingTeams(true);
      const teams = await api.teams.getList({
        hackathon_id: selectedHackathon,
        is_looking: true
      });
      setAllTeams(teams.map((teamListItem: TeamResponse) => ({
        ...teamListItem,
        description: '',
        created_at: '',
        captain: null,
        members: []
      })));
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при загрузке команд' });
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!createForm.name.trim()) {
      setMessage({ type: 'error', text: 'Введите название команды' });
      return;
    }

    try {
      setMessage(null);
      await createTeam(createForm);
      setMessage({ type: 'success', text: 'Команда создана!' });
      setCreateForm({ name: '', description: '', hackathon_id: selectedHackathon || 0 });
      setActiveTab('my-team');
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при создании команды' });
    }
  };

  const handleEditTeam = async () => {
    if (!team || !editForm.name.trim()) {
      setMessage({ type: 'error', text: 'Введите название команды' });
      return;
    }

    try {
      setMessage(null);
      await updateTeam(team.id, editForm);
      setMessage({ type: 'success', text: 'Команда обновлена!' });
      setShowEditModal(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при обновлении команды' });
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    try {
      setMessage(null);
      await joinTeam(teamId);
      setMessage({ type: 'success', text: 'Вы присоединились к команде!' });
      setActiveTab('my-team');
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при присоединении к команде' });
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;

    if (confirm('Вы уверены, что хотите покинуть команду?')) {
      try {
        setMessage(null);
        await leaveTeam(team.id);
        setMessage({ type: 'success', text: 'Вы покинули команду' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Ошибка при выходе из команды' });
      }
    }
  };

  const openEditModal = () => {
    if (team) {
      setEditForm({
        name: team.name,
        description: team.description,
        is_looking: team.is_looking,
      });
      setShowEditModal(true);
    }
  };

  const getRoleColor = (role: RoleEnum | null) => {
    switch (role) {
      case RoleEnum.BACKEND: return 'bg-blue-100 text-blue-800';
      case RoleEnum.FRONTEND: return 'bg-green-100 text-green-800';
      case RoleEnum.DESIGN: return 'bg-purple-100 text-purple-800';
      case RoleEnum.PM: return 'bg-orange-100 text-orange-800';
      case RoleEnum.ANALYST: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'my-team', label: 'Моя команда' },
    { id: 'all-teams', label: 'Все команды' },
    { id: 'create', label: 'Создать команду' },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Команды</h1>
          <p className="text-gray-600">Управляйте своей командой или найдите новую</p>
        </div>

        {message && (
          <Alert
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
            className="mb-6"
          />
        )}

        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab: TeamTab) => setActiveTab(tab)}
        />

        {/* Моя команда */}
        {activeTab === 'my-team' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : team ? (
              <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{team.name}</h2>
                    <p className="text-gray-600 mb-4">{team.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={team.is_looking ? 'success' : 'secondary'}>
                        {team.is_looking ? 'Ищем участников' : 'Команда собрана'}
                      </Badge>
                      {user?.id === team.captain_id && (
                        <Badge variant="primary">Капитан</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user?.id === team.captain_id && (
                      <Button variant="outline" onClick={openEditModal}>
                        Редактировать
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleLeaveTeam}>
                      Покинуть команду
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Участники ({members.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member: TeamMember) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Avatar
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random`}
                          name={member.full_name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {member.full_name}
                            {member.id === team.captain_id && ' (Капитан)'}
                          </p>
                          {member.main_role && (
                            <Badge
                              className={`text-xs ${getRoleColor(member.main_role)}`}
                            >
                              {member.main_role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  У вас нет команды
                </h3>
                <p className="text-gray-600 mb-4">
                  Создайте новую команду или присоединитесь к существующей
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={() => setActiveTab('create')}>
                    Создать команду
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('all-teams')}>
                    Найти команду
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Все команды */}
        {activeTab === 'all-teams' && (
          <div>
            <div className="mb-6">
              <select
                value={selectedHackathon || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedHackathon(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите хакатон</option>
                {hackathons.map((hackathon: Hackathon) => (
                  <option key={hackathon.id} value={hackathon.id}>
                    {hackathon.title}
                  </option>
                ))}
              </select>
            </div>

            {loadingTeams ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allTeams.map((teamItem) => (
                  <Card key={teamItem.id} className="p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {teamItem.name}
                      </h3>
                      <Badge variant="success" className="mb-2">
                        Ищут участников
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        ID: {teamItem.id}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleJoinTeam(teamItem.id)}
                        disabled={!!user?.team_id}
                      >
                        {user?.team_id ? 'Уже в команде' : 'Присоединиться'}
                      </Button>
                    </div>
                  </Card>
                ))}

                {allTeams.length === 0 && !loadingTeams && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-600">Команды не найдены</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Создание команды */}
        {activeTab === 'create' && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Создать новую команду</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название команды *
                </label>
                <Input
                  value={createForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateForm((prev: TeamCreate) => ({ ...prev, name: e.target.value }))}
                  placeholder="Введите название команды"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm((prev: TeamCreate) => ({ ...prev, description: e.target.value }))}
                  placeholder="Расскажите о вашей команде"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Хакатон *
                </label>
                <select
                  value={createForm.hackathon_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateForm((prev: TeamCreate) => ({ ...prev, hackathon_id: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Выберите хакатон</option>
                  {hackathons.map((hackathon: Hackathon) => (
                    <option key={hackathon.id} value={hackathon.id}>
                      {hackathon.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleCreateTeam} disabled={loading}>
                  {loading ? 'Создание...' : 'Создать команду'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateForm({ name: '', description: '', hackathon_id: selectedHackathon || 0 });
                    setActiveTab('my-team');
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Модальное окно редактирования команды */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Редактировать команду"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название команды *
              </label>
              <Input
                value={editForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Введите название команды"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={editForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Расскажите о вашей команде"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_looking"
                checked={editForm.is_looking}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm((prev) => ({ ...prev, is_looking: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_looking" className="text-sm text-gray-700">
                Команда ищет новых участников
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleEditTeam} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
