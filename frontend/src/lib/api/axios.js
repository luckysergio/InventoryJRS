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
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ✅ Request Interceptor: Attach token
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

// ✅ Response Interceptor: Header-based refresh + 401 fallback
api.interceptors.response.use(
  (response) => {
    // Backend bisa mengirim token baru via header (optional optimization)
    const newToken = response.headers['authorization']?.replace('Bearer ', '');
    const isRefreshed = response.headers['x-token-refreshed'] === 'true';

    if (isRefreshed && newToken) {
      useAuthStore.getState().updateToken(newToken);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip retry untuk auth endpoints
    const skipPaths = ['/auth/login', '/auth/logout', '/auth/refresh', '/auth/forgot-password'];
    if (skipPaths.some((p) => originalRequest.url?.includes(p))) {
      return Promise.reject(error);
    }

    // ✅ Backend signal: requires_relogin → force logout
    if (error.response?.data?.requires_relogin) {
      useAuthStore.getState().clearAuth();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return Promise.reject(error);
    }

    // ✅ 401 → Try refresh token
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
          useAuthStore.getState().clearAuth();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject(error);
        }

        const refreshResponse = await api.post('/auth/refresh');

        // ✅ FIX: Backend response format = { status, data: { token } }
        const newToken = refreshResponse.data?.data?.token;

        if (newToken) {
          useAuthStore.getState().updateToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }

        throw new Error('No token in refresh response');
      } catch (refreshError) {
        processQueue(refreshError, null);
        // ✅ FIX: Gunakan clearAuth() bukan logout() (method yang ada di store)
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