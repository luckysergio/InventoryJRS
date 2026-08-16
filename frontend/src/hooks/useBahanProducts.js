import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useBahanProducts = (params = {}) => {
  const { search = '', with_count = true, perPage = 12, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.bahan.list({ search, with_count, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/bahan', {
        params: {
          search: search || undefined,
          with_count,
          per_page: perPage,
          page,
        },
      });
      return {
        bahanProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBahanProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/bahan', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'bahan');
    },
  });
};

export const useUpdateBahanProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/bahan/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(masterKeys.bahan.detail(variables.id), response.data.data);
      await invalidateRelatedCaches(queryClient, 'bahan');
    },
  });
};

export const useDeleteBahanProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/bahan/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.bahan.lists(), exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.bahan.lists() });
      queryClient.setQueriesData({ queryKey: masterKeys.bahan.lists() }, (old) => {
        if (!old?.bahanProducts) return old;
        return {
          ...old,
          bahanProducts: old.bahanProducts.filter((b) => b.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'bahan');
    },
  });
};