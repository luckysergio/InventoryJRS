import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api/axios';
import { useAuthStore } from '../lib/zustand/authStore';
import { useConfirmDialog } from './useConfirmDialog';

const AUTH_KEYS = {
  all: ['auth'],
  profile: () => [...AUTH_KEYS.all, 'profile'],
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { info } = useConfirmDialog();

  useEffect(() => {
    const handleLogout = () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
      info('Sesi Berakhir', 'Anda telah keluar dari sistem.');
    };
    
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate, clearAuth, queryClient, info]);

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: AUTH_KEYS.profile(),
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data.data?.user || null;
    },
    enabled: !!token && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    onError: () => {
      clearAuth();
    }
  });

  useEffect(() => {
    if (profileData) {
      useAuthStore.getState().updateUser(profileData);
    }
  }, [profileData]);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data; // { user, token }
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.profile() });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
    },
    onError: () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
    },
  });

  return {
    user: profileData || user,
    token,
    isAuthenticated,
    isLoading: isProfileLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
};