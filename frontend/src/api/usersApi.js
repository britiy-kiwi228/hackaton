import httpClient from './httpClient';

// Вспомогательная функция: получает tg_id из localStorage
const getStoredTgId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    // Проверяем разные варианты названия поля, которые могут прийти с бэка
    return user.tg_id || user.id || user.user_id; 
  } catch (e) {
    return null;
  }
};

const usersApi = {
  // 1. Логин через Telegram
  loginTelegramUser: async (tgData) => {
    try {
      const response = await httpClient.post('/users/login', tgData);
      if (response.data) {
        // Сохраняем данные, чтобы потом работал getStoredTgId()
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 2. Получить свой профиль
  getMe: async (tg_id_arg) => {
    try {
      const tg_id = tg_id_arg || getStoredTgId();
      
      // ВАЖНО: Если ID нет, не делаем запрос, чтобы не получать ошибку 422
      if (!tg_id) {
        return null; 
      }

      const response = await httpClient.get('/users/me', { params: { tg_id } });
      return response.data;
    } catch (error) {
      // Если сервер ответил 404 или 422, считаем что пользователь не найден (гость)
      if (error.response && (error.response.status === 422 || error.response.status === 404)) {
         return null;
      }
      throw error;
    }
  },

  // 3. Обновить свой профиль
  updateMe: async (payload) => {
    try {
      const tg_id = getStoredTgId();
      if (!tg_id) throw new Error("Пользователь не авторизован");
      
      const response = await httpClient.put('/users/me', payload, { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Получить список пользователей (с правильными фильтрами)
  getUsers: async (filters) => {
    try {
      // Формируем объект параметров, исключая пустые строки
      const params = {};

      // Бэкенд ждет 'main_role', а не 'role'
      if (filters.role && filters.role !== "") {
        params.main_role = filters.role;
      }

      // Бэкенд ждет 'ready_to_work', а не 'is_ready'
      if (filters.is_ready && filters.is_ready !== "") {
        params.ready_to_work = filters.is_ready;
      }
      
      if (filters.page) {
        params.page = filters.page;
      }

      const response = await httpClient.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 5. Получить чужой профиль по ID
  getUser: async (userId) => {
    try {
      const response = await httpClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 6. Получить все доступные навыки (для автокомплита)
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

  // 8. Удалить достижение
  deleteAchievement: async (achievementId) => {
    try {
      const tg_id = getStoredTgId();
      const response = await httpClient.delete(`/users/achievements/${achievementId}`, { params: { tg_id } });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { usersApi };