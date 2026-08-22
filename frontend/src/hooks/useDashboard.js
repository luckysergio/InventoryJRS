import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../lib/api/axios';

// ==========================================
// QUERY KEYS
// ==========================================
export const dashboardKeys = {
  all: ['dashboard'],
  stats: (params) => [...dashboardKeys.all, 'stats', params],
  chart: (months) => [...dashboardKeys.all, 'chart', months],
  realtime: (params) => [...dashboardKeys.all, 'realtime', params],
};

const CACHE_TTL = {
  daily: 30 * 1000,
  weekly: 5 * 60 * 1000,
  monthly: 30 * 60 * 1000,
  yearly: 60 * 60 * 1000,
  custom: 10 * 60 * 1000,
  all: 60 * 60 * 1000,
};

/**
 * ✅ FIXED: Handle custom period dengan proper validation
 */
export const useDashboardStats = (params) => {
  const period = params.period || 'daily';
  const staleTime = params.realtime ? 0 : (CACHE_TTL[period] || 30000);

  // ✅ Skip query jika period=custom tapi from/to belum ada
  const isCustomIncomplete = period === 'custom' && (!params.from || !params.to);

  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', { params });
      return res.data;
    },
    enabled: !isCustomIncomplete, // ✅ Don't fetch if custom params incomplete
    staleTime,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

export const useDashboardChart = (months = 6) => {
  return useQuery({
    queryKey: dashboardKeys.chart(months),
    queryFn: async () => {
      const res = await api.get('/dashboard/chart', { params: { months } });
      return res.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useDashboardRealtime = (params) => {
  return useQuery({
    queryKey: dashboardKeys.realtime(params),
    queryFn: async () => {
      const res = await api.get('/dashboard/realtime', { params });
      return res.data;
    },
    staleTime: 0,
    gcTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
};

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