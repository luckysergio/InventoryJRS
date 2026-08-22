import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import api from '../lib/api/axios';
import { useAuthStore } from '../lib/zustand/authStore';
import { useConfirmDialog } from './useConfirmDialog';
import { resetEcho, destroyEcho } from '../lib/websocket';

const AUTH_KEYS = {
  all: ['auth'],
  profile: () => [...AUTH_KEYS.all, 'profile'],
};

const LOGIN_PATH = '/jayarubberseallogin';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { info } = useConfirmDialog();

  const hasNavigatedRef = useRef(false);
  const hasShownLogoutInfoRef = useRef(false);

  // ==========================================
  // HANDLE LOGOUT EVENT
  // ==========================================

  useEffect(() => {
    const handleLogout = () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

      setTimeout(() => {
        hasNavigatedRef.current = false;
        hasShownLogoutInfoRef.current = false;
      }, 2000);

      queryClient.cancelQueries();
      queryClient.removeQueries();

      if (location.pathname !== LOGIN_PATH) {
        navigate(LOGIN_PATH, { replace: true });
      }

      if (!hasShownLogoutInfoRef.current) {
        hasShownLogoutInfoRef.current = true;
        info('Sesi Berakhir', 'Anda telah keluar dari sistem.');
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [navigate, location.pathname, queryClient, info]);

  // ==========================================
  // FETCH PROFILE
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

      try {
        resetEcho();
      } catch (e) {
        // ignore reset errors
      }
    },
  });

  // ==========================================
  // LOGOUT MUTATION
  // ==========================================

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch (err) {
        // ignore API errors - logout harus selalu "sukses"
      }
    },
    onMutate: () => {
      // Pre-emptive destroy (aman karena defensive destroyEcho)
      try {
        destroyEcho();
      } catch (e) {
        // ignore
      }
    },
    onSettled: () => {
      // clearAuth akan call destroyEcho() lagi via dynamic import,
      // tapi aman karena defensive (echoInstance sudah null)
      clearAuth();
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