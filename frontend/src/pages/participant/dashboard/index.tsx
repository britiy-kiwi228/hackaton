import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner } from '@/shared/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuthContext();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Приветствие */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">
            Привет, {user?.full_name || 'участник'}! 👋
          </h1>
          <p className="text-blue-100">
            Добро пожаловать на платформу поиска команд
          </p>
        </div>

        {/* Информация профиля */}
        <Card>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Твой профиль</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">Имя</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Роль</p>
                <p className="font-medium">{user?.main_role || 'Не указана'}</p>
              </div>
              {user?.username && (
                <div>
                  <p className="text-gray-600 text-sm">Username</p>
                  <p className="font-medium">@{user.username}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600 text-sm">Статус</p>
                <p className="font-medium">
                  {user?.ready_to_work ? '✅ Готов работать' : '❌ Не готов'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Навыки */}
        {user?.skills && user.skills.length > 0 && (
          <Card>
            <h2 className="text-xl font-bold mb-4">Твои навыки</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Быстрые ссылки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card onClick={() => navigate('/browse')} className="cursor-pointer">
            <h3 className="text-lg font-bold mb-2">🔍 Поиск участников</h3>
            <p className="text-gray-600 text-sm mb-4">
              Найди команду или коллег для своего проекта
            </p>
            <Button size="sm" variant="outline">
              Перейти
            </Button>
          </Card>

          <Card onClick={() => navigate('/teams')} className="cursor-pointer">
            <h3 className="text-lg font-bold mb-2">👥 Мои команды</h3>
            <p className="text-gray-600 text-sm mb-4">
              Управляй командами и участниками
            </p>
            <Button size="sm" variant="outline">
              Перейти
            </Button>
          </Card>

          <Card onClick={() => navigate('/requests')} className="cursor-pointer">
            <h3 className="text-lg font-bold mb-2">📬 Приглашения</h3>
            <p className="text-gray-600 text-sm mb-4">
              Просмотри входящие и исходящие приглашения
            </p>
            <Button size="sm" variant="outline">
              Перейти
            </Button>
          </Card>

          <Card onClick={() => navigate('/profile')} className="cursor-pointer">
            <h3 className="text-lg font-bold mb-2">⚙️ Профиль</h3>
            <p className="text-gray-600 text-sm mb-4">
              Отредактируй свой профиль и навыки
            </p>
            <Button size="sm" variant="outline">
              Перейти
            </Button>
          </Card>
        </div>

        {/* Выход */}
        <div className="flex justify-center">
          <Button
            onClick={handleLogout}
            variant="danger"
            size="md"
          >
            Выход
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
