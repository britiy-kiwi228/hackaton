import httpClient from './httpClient';

// Вспомогательная функция: берем tg_id из localStorage, чтобы не передавать его вручную в каждом вызове
// (Предполагается, что при логине вы сохраняете объект user или user_tg_id в localStorage)
const getStoredTgId = () => {
  const userStr = localStorage.getItem('user'); // Или 'user_tg_id', как у вас реализовано
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.tg_id || user.id; 
  } catch (e) {
    return null;
  }
};

const usersApi = {
  // 1. Логин
  loginTelegramUser: async (tgData) => {
    try {
      const response = await httpClient.post('/users/login', tgData);
      // Сохраняем данные пользователя при успешном входе, чтобы потом работали остальные запросы
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 2. Получить свой профиль
  // Мы проверяем, передал ли кто-то tg_id явно, если нет - берем из хранилища
  getMe: async (tg_id_arg) => {
    try {
      const tg_id = tg_id_arg || getStoredTgId();
      const response = await httpClient.get('/users/me', { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 3. Обновить свой профиль
  updateMe: async (payload) => {
    try {
      const tg_id = getStoredTgId();
      const response = await httpClient.put('/users/me', payload, { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Получить список пользователей (с фильтрами)
  getUsers: async (filters) => {
    try {
      const response = await httpClient.get('/users', { params: filters });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 5. Получить пользователя по ID (чужой профиль)
  getUser: async (userId) => {
    try {
      const response = await httpClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6. Получить список навыков
  getAllSkills: async () => {
    try {
      const response = await httpClient.get('/users/skills');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 7. Добавить достижение
  addAchievement: async (data) => {
    try {
      const tg_id = getStoredTgId();
      const response = await httpClient.post('/users/achievements', data, { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 8. Удалить достижение (Этого метода не хватало)
  deleteAchievement: async (achievementId) => {
    try {
      const tg_id = getStoredTgId();
      // Обычно DELETE требует ID ресурса в URL и данные авторизации (tg_id) в params
      const response = await httpClient.delete(`/users/achievements/${achievementId}`, { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Экспортируем как объект, чтобы работало: import { usersApi } from ...
export { usersApi };