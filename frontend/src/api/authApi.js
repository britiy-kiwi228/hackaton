import httpClient from './httpClient';

const loginWithEmailPassword = async (email, password) => {
  try {
    const response = await httpClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const registerUser = async (data) => {
  try {
    const response = await httpClient.post('/auth/register', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const loginWithTelegram = async (authData) => {
  try {
    const response = await httpClient.post('/auth/telegram/login', authData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getCurrentUser = async () => {
  try {
    const response = await httpClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export { loginWithEmailPassword, registerUser, loginWithTelegram, getCurrentUser };
