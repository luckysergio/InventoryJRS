import axios from 'axios';
import { useAuthStore } from '../zustand/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    const newToken = response.headers['authorization'];
    const isRefreshed = response.headers['x-token-refreshed'] === 'true';

    if (isRefreshed && newToken) {
      const cleanToken = newToken.replace('Bearer ', '');
      useAuthStore.getState().updateToken(cleanToken);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    const skipPaths = ['/auth/login', '/auth/logout', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];
    if (skipPaths.some((p) => originalRequest.url?.includes(p))) {
      return Promise.reject(error);
    }

    if (error.response?.data?.requires_relogin) {
      useAuthStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentToken = useAuthStore.getState().token;
        
        if (!currentToken) {
          throw new Error('No token available');
        }

        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data?.data?.token;

        if (newToken) {
          useAuthStore.getState().updateToken(newToken);
          processQueue(null, newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        throw new Error('Invalid refresh response');

      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;