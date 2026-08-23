import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  loginLogs: (params) => [...dashboardKeys.all, 'login-logs', params],
  loginLogDetail: (id) => [...dashboardKeys.all, 'login-logs', 'detail', id],
  loginStats: (params) => [...dashboardKeys.all, 'login-stats', params],
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
    retryDelay: (i) => Math.min(1000 * 2 ** i, 5000),
  });
};

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
 * List login logs. Period ikut parameter (dari PeriodSelector global).
 */
export const useLoginLogs = (params = {}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const {
    period = 'daily',
    from = '',
    to = '',
    page = 1,
    perPage = 10,
    search = '',
    success = '',
    ip = '',
  } = params;

  const isCustomIncomplete = period === 'custom' && (!from || !to);

  return useQuery({
    queryKey: dashboardKeys.loginLogs({ period, from, to, page, perPage, search, success, ip }),
    queryFn: async () => {
      const res = await api.get('/dashboard/login-logs', {
        params: {
          period,
          from: from || undefined,
          to: to || undefined,
          page,
          per_page: perPage,
          search: search || undefined,
          success: success || undefined,
          ip: ip || undefined,
        },
      });
      return res.data;
    },
    enabled: isAuthenticated && !isCustomIncomplete,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (prev) => prev,
  });
};

export const useLoginLogDetail = (id) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: dashboardKeys.loginLogDetail(id),
    queryFn: async () => {
      const res = await api.get(`/dashboard/login-logs/${id}`);
      return res.data;
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * ✅ Login stats summary — SEKARANG IKUT PERIODE (sama seperti stats utama).
 */
export const useLoginStats = (params = {}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { period = 'daily', from = '', to = '' } = params;
  const isCustomIncomplete = period === 'custom' && (!from || !to);

  return useQuery({
    queryKey: dashboardKeys.loginStats({ period, from, to }),
    queryFn: async () => {
      const res = await api.get('/dashboard/login-stats', {
        params: {
          period,
          from: from || undefined,
          to: to || undefined,
        },
      });
      return res.data;
    },
    enabled: isAuthenticated && !isCustomIncomplete,
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
      queryKey: [...dashboardKeys.all, 'login-logs'],
      exact: false,
    });
    await queryClient.invalidateQueries({
      queryKey: [...dashboardKeys.all, 'login-stats'],
      exact: false,
    });
  };
};