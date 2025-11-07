import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const message = error?.response?.data?.message || error.message || 'Error de red';
    if (error?.response?.status === 401) {
      try { localStorage.removeItem('token'); } catch {}
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
