import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Avatar, Input, Select, Alert } from '@/shared/ui';
import { useAuthContext } from '@/context';
import { useUser } from '@/shared/hooks';
import { RoleEnum, UserUpdate } from '@/shared/api/types';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { updateUser, loading: updateLoading } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserUpdate>({});
  const [skills, setSkills] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Инициализируем форму данными пользователя
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        main_role: user.main_role || undefined,
        ready_to_work: user.ready_to_work,
      });
      setSkills(user.skills?.map(s => s.name).join(', ') || '');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setMessage(null);
      
      const updateData: UserUpdate = {
        ...formData,
        skills: skills.split(',').map(s => s.trim()).filter(s => s.length > 0),
      };

      await updateUser(updateData);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при обновлении профиля' });
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        main_role: user.main_role || undefined,
        ready_to_work: user.ready_to_work,
      });
      setSkills(user.skills?.map(s => s.name).join(', ') || '');
    }
    setIsEditing(false);
    setMessage(null);
  };

  const roleOptions = [
    { value: '', label: 'Не выбрано' },
    { value: RoleEnum.FRONTEND, label: 'Frontend разработчик' },
    { value: RoleEnum.BACKEND, label: 'Backend разработчик' },
    { value: RoleEnum.DESIGN, label: 'Дизайнер' },
    { value: RoleEnum.PM, label: 'Проект-менеджер' },
    { value: RoleEnum.ANALYST, label: 'Аналитик' },
  ];

  if (authLoading) {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
            <p className="text-gray-600 mt-2">
              Управляй своей информацией и настройками
            </p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                ✏️ Редактировать
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateLoading}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSave}
                  loading={updateLoading}
                >
                  Сохранить
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Сообщения */}
        {message && (
          <Alert variant={message.type}>
            {message.text}
          </Alert>
        )}

        {/* Основная информация */}
        <Card>
          <div className="space-y-6">
            <div className="flex items-start space-x-6">
              <Avatar name={user.full_name} size="xl" />
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                  {user.username && (
                    <p className="text-gray-600">@{user.username}</p>
                  )}
                </div>
                
                {/* Статус готовности */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Статус:</span>
                  {isEditing ? (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.ready_to_work || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          ready_to_work: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Готов к работе</span>
                    </label>
                  ) : (
                    <Badge variant={user.ready_to_work ? 'success' : 'secondary'}>
                      {user.ready_to_work ? '✅ Готов к работе' : '❌ Не готов'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Роль и навыки */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Основная роль */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Основная роль</h3>
              {isEditing ? (
                <Select
                  options={roleOptions}
                  value={formData.main_role || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    main_role: value as RoleEnum || undefined
                  }))}
                  placeholder="Выберите роль"
                />
              ) : (
                <div>
                  {user.main_role ? (
                    <Badge variant="primary" size="lg">
                      {roleOptions.find(r => r.value === user.main_role)?.label || user.main_role}
                    </Badge>
                  ) : (
                    <p className="text-gray-500">Роль не указана</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Навыки */}
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Навыки</h3>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    placeholder="React, Node.js, Python..."
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Перечислите навыки через запятую
                  </p>
                </div>
              ) : (
                <div>
                  {user.skills && user.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Навыки не указаны</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Биография */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">О себе</h3>
            {isEditing ? (
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Расскажите о себе, своем опыте и интересах..."
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  bio: e.target.value
                }))}
              />
            ) : (
              <div>
                {user.bio ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
                ) : (
                  <p className="text-gray-500">Информация о себе не указана</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Достижения */}
        {user.achievements && user.achievements.length > 0 && (
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Достижения</h3>
              <div className="space-y-3">
                {user.achievements.map((achievement) => (
                  <div key={achievement.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{achievement.hackathon_name}</h4>
                      <Badge variant="primary">
                        {achievement.place ? `${achievement.place} место` : 'Участник'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Команда: {achievement.team_name} • {achievement.year}
                    </p>
                    {achievement.description && (
                      <p className="text-sm text-gray-700 mt-1">{achievement.description}</p>
                    )}
                    {achievement.project_link && (
                      <a
                        href={achievement.project_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                      >
                        🔗 Ссылка на проект
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Команда */}
        {user.team_id && (
          <Card>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Текущая команда</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700">Вы состоите в команде</p>
                  <p className="text-sm text-gray-500">ID команды: {user.team_id}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/teams')}
                >
                  Перейти к команде
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
