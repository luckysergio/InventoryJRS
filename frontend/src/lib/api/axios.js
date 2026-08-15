import axios from 'axios';
import { useAuthStore } from '../zustand/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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
        const newToken = response.headers['authorization']?.replace('Bearer ', '');
        const isRefreshed = response.headers['x-token-refreshed'] === 'true';

        if (isRefreshed && newToken) {
            useAuthStore.setState({ token: newToken });
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            const skipRetryUrls = ['/auth/login', '/auth/logout', '/auth/refresh'];
            if (skipRetryUrls.some((url) => originalRequest.url?.includes(url))) {
                return Promise.reject(error);
            }

            if (error.response?.data?.requires_relogin) {
                useAuthStore.getState().logout();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                return Promise.reject(error);
            }

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
                const refreshResponse = await api.post('/auth/refresh');
                const newToken = refreshResponse.data.token;

                useAuthStore.setState({ token: newToken });
                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().logout();
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