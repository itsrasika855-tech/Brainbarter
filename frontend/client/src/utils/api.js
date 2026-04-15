import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Add token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('brainbarter_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brainbarter_token');
      localStorage.removeItem('brainbarter_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
