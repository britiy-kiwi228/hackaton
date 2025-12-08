import httpClient from './httpClient';

const getTeams = async () => {
  try {
    const response = await httpClient.get('/teams');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getTeam = async (id) => {
  try {
    const response = await httpClient.get(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const createTeam = async (data) => {
  try {
    const response = await httpClient.post('/teams', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateTeam = async (id, data) => {
  try {
    const response = await httpClient.put(`/teams/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteTeam = async (id) => {
  try {
    const response = await httpClient.delete(`/teams/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const joinTeam = async (id) => {
  try {
    const response = await httpClient.post(`/teams/${id}/join`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const leaveTeam = async (id) => {
  try {
    const response = await httpClient.post(`/teams/${id}/leave`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getTeams, getTeam, createTeam, updateTeam, deleteTeam, joinTeam, leaveTeam };
