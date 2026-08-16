import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useTypeProducts = (params = {}) => {
  const { search = '', jenisId = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.type.list({ search, jenisId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/type', {
        params: {
          search: search || undefined,
          jenis_id: jenisId || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        typeProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTypeProductsByJenis = (jenisId) => {
  return useQuery({
    queryKey: masterKeys.type.byJenis(jenisId),
    queryFn: async () => {
      const response = await api.get(`/type/by-jenis/${jenisId}`);
      return response.data.data || [];
    },
    enabled: !!jenisId,
    staleTime: 15 * 60 * 1000,
  });
};

export const useTypeProductStatistics = () => {
  return useQuery({
    queryKey: masterKeys.type.statistics(),
    queryFn: async () => {
      const response = await api.get('/type/statistics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTypeProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/type', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};

export const useUpdateTypeProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/type/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(masterKeys.type.detail(variables.id), response.data.data);
      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};

export const useDeleteTypeProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/type/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.type.lists(), exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.type.lists() });
      queryClient.setQueriesData({ queryKey: masterKeys.type.lists() }, (old) => {
        if (!old?.typeProducts) return old;
        return {
          ...old,
          typeProducts: old.typeProducts.filter((t) => t.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};