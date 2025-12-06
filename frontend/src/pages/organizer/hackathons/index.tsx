import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/layout';
import { Card, Button, Spinner, Badge, Input, Modal, Alert, Tabs } from '@/shared/ui';
import { useHackathons } from '@/shared/hooks';
import { HackathonResponse } from '@/shared/api/types';

type HackathonTab = 'all' | 'active' | 'inactive';

interface HackathonCreate {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  logo_url?: string;
}

export default function OrganizerHackathons() {
  const { hackathons, loading: hackatonsLoading, fetchHackathons } = useHackathons();

  const [activeTab, setActiveTab] = useState<HackathonTab>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonResponse | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Форма создания хакатона
  const [createForm, setCreateForm] = useState<HackathonCreate>({
    title: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    logo_url: '',
  });
  
  // Форма редактирования хакатона
  const [editForm, setEditForm] = useState<Partial<HackathonCreate & { is_active: boolean }>>({});

  const filteredHackathons = hackathons.filter(hackathon => {
    switch (activeTab) {
      case 'active': return hackathon.is_active;
      case 'inactive': return !hackathon.is_active;
      default: return true;
    }
  });

  const handleCreateHackathon = async () => {
    if (!createForm.title.trim() || !createForm.description.trim()) {
      setMessage({ type: 'error', text: 'Заполните обязательные поля' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      // Поскольку у нас нет API для создания хакатонов, симулируем создание
      // В реальном проекте здесь был бы вызов api.hackathons.create(createForm)
      console.log('Creating hackathon:', createForm);
      
      setMessage({ type: 'success', text: 'Хакатон создан!' });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        location: '',
        start_date: '',
        end_date: '',
        registration_deadline: '',
        logo_url: '',
      });
      
      // Обновляем список хакатонов
      fetchHackathons();
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при создании хакатона' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditHackathon = async () => {
    if (!selectedHackathon || !editForm.title?.trim()) {
      setMessage({ type: 'error', text: 'Заполните обязательные поля' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      // Симулируем обновление хакатона
      console.log('Updating hackathon:', selectedHackathon.id, editForm);
      
      setMessage({ type: 'success', text: 'Хакатон обновлен!' });
      setShowEditModal(false);
      setSelectedHackathon(null);
      setEditForm({});
      
      // Обновляем список хакатонов
      fetchHackathons();
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при обновлении хакатона' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (hackathon: HackathonResponse) => {
    try {
      setLoading(true);
      setMessage(null);
      
      // Симулируем переключение статуса
      console.log('Toggling hackathon status:', hackathon.id, !hackathon.is_active);
      
      setMessage({ 
        type: 'success', 
        text: `Хакатон ${!hackathon.is_active ? 'активирован' : 'деактивирован'}!` 
      });
      
      // Обновляем список хакатонов
      fetchHackathons();
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка при изменении статуса хакатона' });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (hackathon: HackathonResponse) => {
    setSelectedHackathon(hackathon);
    setEditForm({
      title: hackathon.title,
      description: hackathon.description,
      location: hackathon.location,
      start_date: hackathon.start_date.split('T')[0],
      end_date: hackathon.end_date.split('T')[0],
      registration_deadline: hackathon.registration_deadline.split('T')[0],
      logo_url: hackathon.logo_url || '',
      is_active: hackathon.is_active,
    });
    setShowEditModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const tabs = [
    { id: 'all', label: `Все (${hackathons.length})` },
    { id: 'active', label: `Активные (${hackathons.filter(h => h.is_active).length})` },
    { id: 'inactive', label: `Неактивные (${hackathons.filter(h => !h.is_active).length})` },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление хакатонами</h1>
            <p className="text-gray-600">Создавайте и управляйте хакатонами</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Создать хакатон
          </Button>
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
  onChange={(tabId: string) => setActiveTab(tabId as HackathonTab)}
/>

        {hackatonsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((hackathon) => (
              <Card key={hackathon.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {hackathon.title}
                    </h3>
                    <Badge variant={hackathon.is_active ? 'success' : 'secondary'} className="mb-2">
                      {hackathon.is_active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {hackathon.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {hackathon.location}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Регистрация до: {formatDate(hackathon.registration_deadline)}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openEditModal(hackathon)}
                    className="flex-1"
                  >
                    Редактировать
                  </Button>
                  <Button 
                    size="sm" 
                    variant={hackathon.is_active ? 'secondary' : 'primary'}
                    onClick={() => handleToggleActive(hackathon)}
                    disabled={loading}
                  >
                    {hackathon.is_active ? 'Деактивировать' : 'Активировать'}
                  </Button>
                </div>
              </Card>
            ))}
            
            {filteredHackathons.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600">
                  {activeTab === 'all' ? 'Хакатоны не найдены' : 
                   activeTab === 'active' ? 'Нет активных хакатонов' : 
                   'Нет неактивных хакатонов'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Модальное окно создания хакатона */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Создать новый хакатон"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название хакатона *
              </label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название хакатона"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание *
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Расскажите о хакатоне"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Место проведения *
              </label>
              <Input
                value={createForm.location}
                onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Введите место проведения"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата начала *
                </label>
                <input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата окончания *
                </label>
                <input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дедлайн регистрации *
              </label>
              <input
                type="date"
                value={createForm.registration_deadline}
                onChange={(e) => setCreateForm(prev => ({ ...prev, registration_deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL логотипа
              </label>
              <Input
                value={createForm.logo_url}
                onChange={(e) => setCreateForm(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={handleCreateHackathon} disabled={loading}>
                {loading ? 'Создание...' : 'Создать хакатон'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Отмена
              </Button>
            </div>
          </div>
        </Modal>

        {/* Модальное окно редактирования хакатона */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Редактировать хакатон"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название хакатона *
              </label>
              <Input
                value={editForm.title || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Введите название хакатона"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание *
              </label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Расскажите о хакатоне"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Место проведения *
              </label>
              <Input
                value={editForm.location || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Введите место проведения"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата начала *
                </label>
                <input
                  type="date"
                  value={editForm.start_date || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата окончания *
                </label>
                <input
                  type="date"
                  value={editForm.end_date || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дедлайн регистрации *
              </label>
              <input
                type="date"
                value={editForm.registration_deadline || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, registration_deadline: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL логотипа
              </label>
              <Input
                value={editForm.logo_url || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={editForm.is_active || false}
                onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_active_edit" className="text-sm text-gray-700">
                Хакатон активен
              </label>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button onClick={handleEditHackathon} disabled={loading}>
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
