import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar, Tabs, Input, Select } from '@/shared/ui';
import { useRecommendations, useUser, useHackathons } from '@/shared/hooks';
import { UserListResponse, TeamListResponse, RoleEnum } from '@/shared/api/types';

type SearchMode = 'users' | 'teams';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState<SearchMode>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleEnum | ''>('');
  const [selectedHackathon, setSelectedHackathon] = useState<number | null>(null);
  
  const { hackathons } = useHackathons();
  const { users, loading: usersLoading, fetchUsers } = useUser();
  const { 
    recommendations, 
    loading: recommendationsLoading, 
    fetchRecommendations 
  } = useRecommendations();

  // Получаем активный хакатон по умолчанию
  useEffect(() => {
    if (hackathons.length > 0 && !selectedHackathon) {
      const activeHackathon = hackathons.find(h => h.is_active);
      if (activeHackathon) {
        setSelectedHackathon(activeHackathon.id);
      }
    }
  }, [hackathons, selectedHackathon]);

  // Загружаем пользователей при изменении фильтров
  useEffect(() => {
    if (searchMode === 'users') {
      fetchUsers({
        role: selectedRole || undefined,
        hackathon_id: selectedHackathon || undefined,
      });
    }
  }, [searchMode, selectedRole, selectedHackathon, fetchUsers]);

  // Загружаем рекомендации
  useEffect(() => {
    if (selectedHackathon) {
      fetchRecommendations({
        for_what: searchMode === 'users' ? 'user' : 'team',
        hackathon_id: selectedHackathon,
        preferred_roles: selectedRole ? [selectedRole] : undefined,
        max_results: 10,
      });
    }
  }, [searchMode, selectedHackathon, selectedRole, fetchRecommendations]);

  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recommendedUsers = recommendations?.recommendations
    ?.filter(rec => rec.recommended_user)
    ?.map(rec => rec.recommended_user!) || [];

  const recommendedTeams = recommendations?.recommendations
    ?.filter(rec => rec.recommended_team)
    ?.map(rec => rec.recommended_team!) || [];

  const handleSendRequest = (userId: number) => {
    // TODO: Реализовать отправку запроса
    console.log('Sending request to user:', userId);
  };

  const handleJoinTeam = (teamId: number) => {
    // TODO: Реализовать запрос на вступление в команду
    console.log('Joining team:', teamId);
  };

  const roleOptions = [
    { value: '', label: 'Все роли' },
    { value: RoleEnum.FRONTEND, label: 'Frontend' },
    { value: RoleEnum.BACKEND, label: 'Backend' },
    { value: RoleEnum.DESIGN, label: 'Design' },
    { value: RoleEnum.PM, label: 'PM' },
    { value: RoleEnum.ANALYST, label: 'Analyst' },
  ];

  const hackathonOptions = hackathons.map(h => ({
    value: h.id.toString(),
    label: h.title,
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Поиск участников</h1>
          <p className="text-gray-600 mt-2">
            Найди идеальных коллег для своего проекта
          </p>
        </div>

        {/* Переключатель режима поиска */}
        <Tabs
          tabs={[
            { id: 'users', label: '👤 Участники' },
            { id: 'teams', label: '👥 Команды' },
          ]}
          activeTab={searchMode}
          onChange={(tab) => setSearchMode(tab as SearchMode)}
        />

        {/* Фильтры */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Фильтры</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Поиск по имени..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                options={roleOptions}
                value={selectedRole}
                onChange={(value) => setSelectedRole(value as RoleEnum | '')}
                placeholder="Выберите роль"
              />
              <Select
                options={hackathonOptions}
                value={selectedHackathon?.toString() || ''}
                onChange={(value) => setSelectedHackathon(value ? parseInt(value) : null)}
                placeholder="Выберите хакатон"
              />
            </div>
          </div>
        </Card>

        {searchMode === 'users' ? (
          <>
            {/* Рекомендации */}
            {recommendedUsers.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">🎯 Рекомендации для тебя</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedUsers.slice(0, 6).map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-3">
                        <Avatar name={user.full_name} size="md" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.full_name}
                          </h3>
                          {user.username && (
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          )}
                          {user.main_role && (
                            <Badge variant="primary" size="sm" className="mt-1">
                              {user.main_role}
                            </Badge>
                          )}
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(user.id)}
                              className="w-full"
                            >
                              Пригласить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Все участники */}
            <div>
              <h2 className="text-xl font-bold mb-4">Все участники</h2>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-3">
                        <Avatar name={user.full_name} size="md" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.full_name}
                          </h3>
                          {user.username && (
                            <p className="text-sm text-gray-500">@{user.username}</p>
                          )}
                          {user.main_role && (
                            <Badge variant="primary" size="sm" className="mt-1">
                              {user.main_role}
                            </Badge>
                          )}
                          {user.team_id && (
                            <Badge variant="secondary" size="sm" className="mt-1 ml-1">
                              В команде
                            </Badge>
                          )}
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => handleSendRequest(user.id)}
                              className="w-full"
                              disabled={!!user.team_id}
                            >
                              {user.team_id ? 'Занят' : 'Пригласить'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Участники не найдены</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Попробуйте изменить фильтры поиска
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Рекомендуемые команды */}
            {recommendedTeams.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">🎯 Рекомендуемые команды</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedTeams.map((team) => (
                    <Card key={team.id} className="hover:shadow-lg transition-shadow">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">{team.name}</h3>
                          {team.is_looking && (
                            <Badge variant="success" size="sm">
                              Ищут участников
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            Хакатон #{team.hackathon_id}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => handleJoinTeam(team.id)}
                            disabled={!team.is_looking}
                          >
                            {team.is_looking ? 'Присоединиться' : 'Команда полная'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Заглушка для команд */}
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">Поиск команд в разработке</p>
                <p className="text-sm text-gray-400 mt-1">
                  Скоро здесь появится список доступных команд
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
