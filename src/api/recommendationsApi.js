import httpClient from './httpClient';

const getRecommendations = async () => {
  try {
    const response = await httpClient.get('/recommendations');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTeamRecommendations = async (teamId) => {
  try {
    const response = await httpClient.get(`/recommendations/teams/${teamId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getRecommendationStats = async () => {
  try {
    const response = await httpClient.get('/recommendations/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getRecommendations, getTeamRecommendations, getRecommendationStats };
