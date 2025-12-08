// Базовый URL вашего бэкенда
// Если настроен Proxy в vite.config.js, оставьте '/api'
// Если нет, ставьте полный адрес: 'http://127.0.0.1:8000'
const BASE_URL = 'http://127.0.0.1:8000'; 

export const hackathonsApi = {
  
  // 1. Получить список всех хакатонов (с фильтрами)
  getHackathons: async ({ status, page } = {}) => {
    try {
      // Формируем URL с параметрами
      const url = new URL(`${BASE_URL}/hackathons/`);
      if (status) url.searchParams.append('status', status);
      if (page) url.searchParams.append('page', page);
      if (status === 'active') url.searchParams.append('is_active', true); // пример адаптации под бэк

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // 2. Получить только активные (для Главной)
  getActiveHackathons: async () => {
    try {
      const response = await fetch(`${BASE_URL}/hackathons/?is_active=true`);
      if (!response.ok) throw new Error('Failed to fetch active hackathons');
      return await response.json();
    } catch (error) {
      console.error(error);
      return []; // Возвращаем пустой массив, чтобы сайт не падал
    }
  },

  // 3. Получить детали конкретного хакатона по ID <--- ЭТОГО НЕ ХВАТАЛО
  getHackathonById: async (id) => {
    const response = await fetch(`${BASE_URL}/hackathons/${id}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Ошибка загрузки хакатона');
    }
    return await response.json();
  },

  // 4. Получить команды конкретного хакатона <--- И ЭТОГО
  // 4. Получить команды конкретного хакатона
  getHackathonTeams: async (id) => {
    try {
      // ПОПРОБУЙ ЭТОТ ВАРИАНТ (через query-параметры)
      // Бэкенд должен уметь фильтровать: /teams/?hackathon_id=1
      const response = await fetch(`${BASE_URL}/teams/?hackathon_id=${id}`);
      
      if (!response.ok) {
        // Если вдруг такого роута нет, попробуем старый вариант, чтобы точно узнать
        console.warn('Query param route failed, trying nested...');
        const nestedResponse = await fetch(`${BASE_URL}/hackathons/${id}/teams`);
        if (!nestedResponse.ok) throw new Error('Failed to load teams');
        return await nestedResponse.json();
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching teams:", error);
      return []; // Возвращаем пустой массив, чтобы страница не ломалась
    }
  },

  // 5. Уведомления
  getNotifications: async (tg_id) => {
    // Заглушка, если бэкенда еще нет
    return { has_notification: false };
  }
};