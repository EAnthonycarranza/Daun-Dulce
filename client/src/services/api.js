import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  // Don't override if Authorization was already set (e.g. by CustomerContext)
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('daundulce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear admin token if the 401 came from a non-customer endpoint
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (!url.startsWith('/customers')) {
        localStorage.removeItem('daundulce_token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
