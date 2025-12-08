import httpClient from './httpClient';

const recommendationsApi = {
  // 1. Основной поиск (POST, так как отправляем сложный фильтр в body)
  getRecommendations: async (payload) => {
    try {
      // payload: { for_what, hackathon_id, preferred_roles, min_score, ... }
      const response = await httpClient.post('/recommendations/', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 2. Рекомендации людей для конкретной команды (если я капитан)
  getTeamRecommendations: async (teamId, payload) => {
    try {
      const response = await httpClient.post(`/recommendations/teams/${teamId}`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 3. Статистика (оставляем GET, пригодится для дашборда)
  getRecommendationStats: async () => {
    try {
      const response = await httpClient.get('/recommendations/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export { recommendationsApi };