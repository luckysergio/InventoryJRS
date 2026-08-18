import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../lib/api/axios';
import { useAuthStore } from '../lib/zustand/authStore';

const AUTH_KEYS = {
  all: ['auth'],
  profile: () => [...AUTH_KEYS.all, 'profile'],
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, setAuth, clearAuth, updateToken } = useAuthStore();

  // ✅ Listen for logout event dari axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
      navigate('/jayarubberseallogin', { replace: true });
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate, clearAuth, queryClient]);

  // ✅ Fetch profile untuk validasi token saat page refresh
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: AUTH_KEYS.profile(),
    queryFn: async () => {
      const res = await api.get('/auth/profile');
      return res.data.data?.user || null;
    },
    enabled: !!token && isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  // Sync profile data ke store
  useEffect(() => {
    if (profileData) {
      useAuthStore.getState().updateUser(profileData);
    }
  }, [profileData]);

  // ✅ Login mutation
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

  // ✅ Logout mutation - clear ALL cache
  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
    },
    onError: () => {
      clearAuth();
      queryClient.cancelQueries();
      queryClient.removeQueries();
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