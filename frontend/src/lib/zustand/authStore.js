import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (credentials) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', credentials);
                    const { user, token } = response.data;

                    set({
                        user,
                        token,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    return { success: true, data: response.data };
                } catch (error) {
                    set({ isLoading: false });
                    return {
                        success: false,
                        message: error.response?.data?.message || 'Login gagal',
                        errors: error.response?.data?.errors,
                    };
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                    });
                }
            },

            refresh: async () => {
                try {
                    const response = await api.post('/auth/refresh');
                    const newToken = response.data.token;
                    set({ token: newToken });
                    return newToken;
                } catch (error) {
                    throw error;
                }
            },

            fetchProfile: async () => {
                try {
                    const response = await api.get('/auth/profile');
                    set({ user: response.data.user });
                    return response.data.user;
                } catch (error) {
                    console.error('Fetch profile error:', error);
                    throw error;
                }
            },

            setToken: (token) => set({ token }),

            hasRole: (role) => {
                const { user } = get();
                return user?.role === role;
            },

            hasAnyRole: (roles) => {
                const { user } = get();
                return roles.includes(user?.role);
            },
        }),
        {
            name: 'jrs-auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);