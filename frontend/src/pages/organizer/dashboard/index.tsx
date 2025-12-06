import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar } from '@/shared/ui';
import { useHackathons, useAuth } from '@/shared/hooks';
import { HackathonResponse } from '@/shared/api/types';
import api from '@/shared/api';

interface DashboardStats {
  totalHackathons: number;
  activeHackathons: number;
  totalParticipants: number;
  totalTeams: number;
}

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hackathons, loading: hackatonsLoading } = useHackathons();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalHackathons: 0,
    activeHackathons: 0,
    totalParticipants: 0,
    totalTeams: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [hackathons]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Подсчитываем статистику из хакатонов
      const totalHackathons = hackathons.length;
      const activeHackathons = hackathons.filter(h => h.is_active).length;
      
      // Загружаем участников и команды для активных хакатонов
      let totalParticipants = 0;
      let totalTeams = 0;
      
      for (const hackathon of hackathons.filter(h => h.is_active)) {
        try {
          const [users, teams] = await Promise.all([
            api.users.listUsers({ hackathon_id: hackathon.id }),
            api.teams.getList({ hackathon_id: hackathon.id })
          ]);
          totalParticipants += users.length;
          totalTeams += teams.length;
        } catch (error) {
          console.error(`Error loading data for hackathon ${hackathon.id}:`, error);
        }
      }
      
      setStats({
        totalHackathons,
        activeHackathons,
        totalParticipants,
        totalTeams,
      });
      
      // Создаем недавнюю активность из хакатонов
      const activity = hackathons
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(hackathon => ({
          id: hackathon.id,
          type: 'hackathon_created',
          title: `Создан хакатон "${hackathon.title}"`,
          time: new Date(hackathon.created_at).toLocaleDateString('ru-RU'),
          status: hackathon.is_active ? 'active' : 'inactive'
        }));
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading || hackatonsLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Панель организатора
          </h1>
          <p className="text-gray-600">
            Добро пожаловать, {user?.full_name}! Управляйте хакатонами и участниками.
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHackathons}</p>
                <p className="text-gray-600">Всего хакатонов</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeHackathons}</p>
                <p className="text-gray-600">Активных хакатонов</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                <p className="text-gray-600">Участников</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
                <p className="text-gray-600">Команд</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Быстрые действия */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Быстрые действия</h2>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/organizer/hackathons/create')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Создать новый хакатон
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/organizer/hackathons')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Управление хакатонами
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/organizer/participants')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Управление участниками
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/organizer/teams')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Управление командами
              </Button>
            </div>
          </Card>

          {/* Недавняя активность */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Недавняя активность</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500 mr-2">{activity.time}</p>
                        <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                          {activity.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Нет недавней активности</p>
            )}
          </Card>
        </div>

        {/* Активные хакатоны */}
        {hackathons.filter(h => h.is_active).length > 0 && (
          <Card className="p-6 mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Активные хакатоны</h2>
              <Button variant="outline" onClick={() => navigate('/organizer/hackathons')}>
                Посмотреть все
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hackathons
                .filter(h => h.is_active)
                .slice(0, 3)
                .map((hackathon) => (
                  <div key={hackathon.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{hackathon.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{hackathon.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="success">Активен</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/organizer/hackathons/${hackathon.id}`)}
                      >
                        Управлять
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}