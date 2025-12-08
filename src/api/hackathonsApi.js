import httpClient from './httpClient';

const getHackathons = async () => {
  try {
    const response = await httpClient.get('/hackathons');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getActiveHackathons = async () => {
  try {
    const response = await httpClient.get('/hackathons/active');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getHackathonCalendar = async () => {
  try {
    const response = await httpClient.get('/hackathons/calendar');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getHackathonNotifications = async () => {
  try {
    const response = await httpClient.get('/hackathons/notifications');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getHackathon = async (id) => {
  try {
    const response = await httpClient.get(`/hackathons/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getHackathonTeams = async (id) => {
  try {
    const response = await httpClient.get(`/hackathons/${id}/teams`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getHackathonStats = async (id) => {
  try {
    const response = await httpClient.get(`/hackathons/${id}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { getHackathons, getActiveHackathons, getHackathonCalendar, getHackathonNotifications, getHackathon, getHackathonTeams, getHackathonStats };
