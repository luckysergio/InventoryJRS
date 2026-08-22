import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api/axios';
import { useAuthStore } from '../lib/zustand/authStore';
import { useConfirmDialog } from './useConfirmDialog';
import { resetEcho, destroyEcho } from '../lib/websocket';

const AUTH_KEYS = {
  all: ['auth'],
  profile: () => [...AUTH_KEYS.all, 'profile'],
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { info } = useConfirmDialog();

  // ==========================================
  // HANDLE LOGOUT EVENT
  // ==========================================
  
  useEffect(() => {
    const handleLogout = async () => {
      destroyEcho();
      await clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
      info('Sesi Berakhir', 'Anda telah keluar dari sistem.');
    };
    
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate, clearAuth, queryClient, info]);

  // ==========================================
  // FETCH PROFILE (jika ada token)
  // ==========================================
  
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
    },
  });

  useEffect(() => {
    if (profileData) {
      useAuthStore.getState().updateUser(profileData);
    }
  }, [profileData]);

  // ==========================================
  // LOGIN MUTATION
  // ==========================================
  
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data;
    },
    onSuccess: async (data) => {
      setAuth(data.user, data.token);
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.profile() });
      
      // Reset Echo instance dengan token baru
      try {
        resetEcho();
      } catch (e) {
        console.warn('Failed to reset Echo after login:', e);
      }
    },
  });

  // ==========================================
  // LOGOUT MUTATION
  // ==========================================
  
  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: async () => {
      destroyEcho();
      await clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
    },
    onError: async () => {
      destroyEcho();
      await clearAuth();
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