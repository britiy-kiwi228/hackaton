import httpClient from './httpClient';

// 1. Получить список команд с фильтрами (хакатон, статус поиска)
const getTeams = async ({ hackathon_id, is_looking, skip = 0, limit = 100 } = {}) => {
  try {
    const params = { skip, limit };
    if (hackathon_id) params.hackathon_id = hackathon_id;
    // Проверка на пустую строку, чтобы не отправлять лишнее
    if (is_looking !== undefined && is_looking !== '') params.is_looking = is_looking;

    const response = await httpClient.get('/teams', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 2. Получить одну команду
const getTeam = async (id) => {
  try {
    const response = await httpClient.get(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 3. Создать команду (привязываем к хакатону через URL)
const createTeam = async (hackathonId, data) => {
  try {
    // Важно: бэкенд ждет hackathonId в URL: POST /teams/{hackathon_id}
    const response = await httpClient.post(`/teams/${hackathonId}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 4. Обновить команду
const updateTeam = async (id, data) => {
  try {
    const response = await httpClient.put(`/teams/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 5. Удалить команду
const deleteTeam = async (id) => {
  try {
    const response = await httpClient.delete(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 6. Вступить в команду
const joinTeam = async (id) => {
  try {
    const response = await httpClient.post(`/teams/${id}/join`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 7. Покинуть команду
const leaveTeam = async (id) => {
  try {
    const response = await httpClient.post(`/teams/${id}/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// --- НОВЫЕ МЕТОДЫ ДЛЯ ЗАЯВОК (нужны для TeamDetailsPage) ---

// 8. Получить список заявок (для капитана)
const getRequests = async (teamId) => {
  try {
    const response = await httpClient.get(`/teams/${teamId}/requests`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 9. Принять или отклонить заявку
const handleRequest = async (requestId, action) => {
  try {
    // action должен быть 'accept' или 'decline'
    const response = await httpClient.put(`/teams/requests/${requestId}`, null, {
      params: { action }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Собираем всё в один объект teamsApi, чтобы импортировать как { teamsApi }
const teamsApi = {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  getRequests,
  handleRequest
};

export { teamsApi };