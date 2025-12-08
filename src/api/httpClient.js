import axios from 'axios';

const baseURL = 'http://localhost:8000';
const httpClient = axios.create({
  baseURL,
});

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

httpClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('HTTP Error:', error);
    return Promise.reject(error);
  }
);

export default httpClient;
