import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../lib/zustand/authStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api/axios';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user, token, isAuthenticated, fetchProfile } = useAuthStore();

    useEffect(() => {
        const handleLogout = () => {
            navigate('/jayarubberseallogin', { replace: true });
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [navigate]);

    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            const response = await api.post('/auth/login', credentials);
            const { user: userData, token: tokenData, message } = response.data;

            useAuthStore.setState({
                user: userData,
                token: tokenData,
                isAuthenticated: true,
            });

            queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });

            return {
                success: true,
                message: message || 'Login berhasil.',
                user: userData,
                token: tokenData,
            };
        },
    });

    const logoutMutation = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSettled: () => {
            useAuthStore.setState({
                user: null,
                token: null,
                isAuthenticated: false,
            });
            queryClient.clear();
        },
    });

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: () => api.get('/auth/profile').then((res) => res.data.user),
        enabled: !!token && isAuthenticated,
        staleTime: 5 * 60 * 1000,
        retry: 1,
        retryDelay: 1000,
        onError: (error) => {
            console.warn('Profile fetch failed:', error.message);
        },
    });

    return {
        user: profile || user,
        token,
        isAuthenticated,
        isLoading: isProfileLoading,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        fetchProfile,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        loginError: loginMutation.error,
    };
};