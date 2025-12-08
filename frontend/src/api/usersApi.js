import httpClient from './httpClient';

const loginTelegramUser = async (tgData) => {
  try {
    const response = await httpClient.post('/users/login', tgData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUserMe = async (tg_id) => {
  try {
    const response = await httpClient.get('/users/me', { params: { tg_id } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateUserMe = async (tg_id, payload) => {
  try {
    const response = await httpClient.put('/users/me', payload, { params: { tg_id } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUsers = async (filters) => {
  try {
    const response = await httpClient.get('/users', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getUser = async (userId) => {
  try {
    const response = await httpClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getAllSkills = async () => {
  try {
    const response = await httpClient.get('/users/skills');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createAchievement = async (tg_id, data) => {
  try {
    const response = await httpClient.post('/users/achievements', data, { params: { tg_id } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { loginTelegramUser, getUserMe, updateUserMe, getUsers, getUser, getAllSkills, createAchievement };
