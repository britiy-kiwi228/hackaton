import httpClient from './httpClient';

// Вспомогательная функция (такая же, как в usersApi), чтобы брать ID из localStorage
const getStoredTgId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.tg_id || user.id || user.user_id;
  } catch (e) {
    return null;
  }
};

const requestsApi = {
  // 1. Получить все (редко используется, но оставим)
  getRequests: async () => {
    try {
      const response = await httpClient.get('/requests');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 2. Исходящие (с передачей user_tg_id)
  getSent: async () => {
    try {
      const user_tg_id = getStoredTgId();
      if (!user_tg_id) return []; // Если не залогинен, возвращаем пустоту

      const response = await httpClient.get('/requests/sent', { 
        params: { user_tg_id } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 3. Входящие (с передачей user_tg_id)
  getReceived: async () => {
    try {
      const user_tg_id = getStoredTgId();
      if (!user_tg_id) return [];

      const response = await httpClient.get('/requests/received', { 
        params: { user_tg_id } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 4. Обновить статус (Принять/Отклонить)
  // В RequestsPage мы вызываем: updateStatus(reqId, 'accepted')
  updateStatus: async (id, status) => {
    try {
      // Обычно статус передают в query params: PUT /requests/123?status=accepted
      const response = await httpClient.put(`/requests/${id}`, null, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 5. Удалить/Отменить запрос
  deleteRequest: async (id) => {
    try {
      const response = await httpClient.delete(`/requests/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { requestsApi };