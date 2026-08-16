import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useDistributors = (params = {}) => {
  const { search = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.distributor.list({ search, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/distributors', {
        params: {
          search: search || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        distributors: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export { useDistributorsDropdown } from './useMasterData';

export const useCreateDistributor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/distributors', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'distributor');
    },
  });
};

export const useUpdateDistributor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/distributors/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(masterKeys.distributor.detail(variables.id), response.data.data);
      await invalidateRelatedCaches(queryClient, 'distributor');
    },
  });
};

export const useDeleteDistributor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/distributors/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.distributor.lists(), exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.distributor.lists() });
      queryClient.setQueriesData({ queryKey: masterKeys.distributor.lists() }, (old) => {
        if (!old?.distributors) return old;
        return {
          ...old,
          distributors: old.distributors.filter((d) => d.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'distributor');
    },
  });
};