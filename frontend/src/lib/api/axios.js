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

// ==========================================
// REFRESH TOKEN QUEUE
// ==========================================

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

// Paths yang tidak perlu auth / refresh
const SKIP_AUTH_PATHS = [
  '/auth/login',
  '/auth/logout', 
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/register',
  '/public/',
  '/master/',
  '/broadcasting/auth', // Broadcasting auth handle sendiri
];

// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    // Skip auth untuk public endpoints
    const shouldSkipAuth = SKIP_AUTH_PATHS.some((p) => 
      config.url?.includes(p)
    );
    
    if (shouldSkipAuth) return config;

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => {
    // Auto-update token jika backend mengirim token baru (via header)
    const newToken = response.headers['authorization'];
    const isRefreshed = response.headers['x-token-refreshed'] === 'true';

    if (isRefreshed && newToken) {
      const cleanToken = newToken.replace(/^Bearer\s+/i, '').trim();
      useAuthStore.getState().updateToken(cleanToken);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh untuk auth endpoints
    const shouldSkip = SKIP_AUTH_PATHS.some((p) => 
      originalRequest.url?.includes(p)
    );
    if (shouldSkip) {
      return Promise.reject(error);
    }

    // Force relogin jika backend minta
    if (error.response?.data?.requires_relogin) {
      await useAuthStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    // Handle 401 - try refresh token
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
        await useAuthStore.getState().clearAuth();
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