import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../lib/zustand/authStore';
import api from '../lib/api/axios';

// ==========================================
// QUERY KEYS
// ==========================================
export const dashboardKeys = {
  all: ['dashboard'],
  stats: (params) => [...dashboardKeys.all, 'stats', params],
  chart: (months) => [...dashboardKeys.all, 'chart', months],
  realtime: (params) => [...dashboardKeys.all, 'realtime', params],
  loginLogs: (limit = 10) => [...dashboardKeys.all, 'login-logs', limit],
  loginStats: () => [...dashboardKeys.all, 'login-stats'],
};

// TTL cache berdasarkan period (ms)
const CACHE_TTL = {
  daily: 30 * 1000,
  weekly: 5 * 60 * 1000,
  monthly: 30 * 60 * 1000,
  yearly: 60 * 60 * 1000,
  custom: 10 * 60 * 1000,
  all: 60 * 60 * 1000,
};

// ==========================================
// DASHBOARD STATS HOOKS
// ==========================================

/**
 * Hook untuk fetch dashboard stats
 * Auto-disable jika user belum login
 */
export const useDashboardStats = (params) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const period = params?.period || 'daily';
  const staleTime = params?.realtime ? 0 : (CACHE_TTL[period] || 30000);
  const isCustomIncomplete = period === 'custom' && (!params?.from || !params?.to);

  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', { params });
      return res.data;
    },
    enabled: isAuthenticated && !isCustomIncomplete,
    staleTime,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook untuk fetch chart data (lightweight)
 */
export const useDashboardChart = (months = 6) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: dashboardKeys.chart(months),
    queryFn: async () => {
      const res = await api.get('/dashboard/chart', { params: { months } });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook untuk real-time data (bypass cache)
 */
export const useDashboardRealtime = (params) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: dashboardKeys.realtime(params),
    queryFn: async () => {
      const res = await api.get('/dashboard/realtime', { params });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

// ==========================================
// LOGIN LOGS HOOKS
// ==========================================

/**
 * Hook untuk fetch recent login logs (initial load)
 */
export const useLoginLogs = (limit = 10) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: dashboardKeys.loginLogs(limit),
    queryFn: async () => {
      const res = await api.get('/dashboard/login-logs', { 
        params: { limit: Math.min(Math.max(1, limit), 50) } 
      });
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};

/**
 * Hook untuk fetch login stats summary
 */
export const useLoginStats = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  return useQuery({
    queryKey: dashboardKeys.loginStats(),
    queryFn: async () => {
      const res = await api.get('/dashboard/login-stats');
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

// ==========================================
// CACHE INVALIDATION HOOKS
// ==========================================

export const useInvalidateDashboard = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await api.post('/dashboard/cache/invalidate');
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.all,
        exact: false,
      });
    },
  });
};

export const useRefreshDashboard = () => {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
      exact: false,
    });
  };
};

export const useRefreshLoginLogs = () => {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardKeys.loginLogs(),
      exact: false,
    });
  };
};

export const useRefreshLoginStats = () => {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: dashboardKeys.loginStats(),
      exact: false,
    });
  };
};