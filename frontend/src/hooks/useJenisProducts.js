import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const jenisProductKeys = {
  all: ['jenis_products'],
  lists: () => [...jenisProductKeys.all, 'list'],
  list: (filters) => [...jenisProductKeys.lists(), filters],
  details: () => [...jenisProductKeys.all, 'detail'],
  detail: (id) => [...jenisProductKeys.details(), id],
  dropdown: () => [...jenisProductKeys.all, 'dropdown'],
  statistics: () => [...jenisProductKeys.all, 'statistics'],
};

export const useJenisProducts = (params = {}) => {
  const { search = '', with_count = true, perPage = 12, page = 1 } = params;

  return useQuery({
    queryKey: jenisProductKeys.list({ search, with_count, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/jenis', {
        params: {
          search: search || undefined,
          with_count,
          per_page: perPage,
          page,
        },
      });

      return {
        jenisProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJenisProductsDropdown = () => {
  return useQuery({
    queryKey: jenisProductKeys.dropdown(),
    queryFn: async () => {
      const response = await api.get('/jenis/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useJenisProductStatistics = () => {
  return useQuery({
    queryKey: jenisProductKeys.statistics(),
    queryFn: async () => {
      const response = await api.get('/jenis/statistics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const forceInvalidateJenisProductCache = async (queryClient) => {
  await queryClient.cancelQueries({
    queryKey: jenisProductKeys.all,
    exact: false,
  });

  queryClient.removeQueries({
    queryKey: jenisProductKeys.all,
    exact: false,
  });

  await queryClient.invalidateQueries({
    queryKey: jenisProductKeys.all,
    exact: false,
    refetchType: 'all',
  });
};

export const useCreateJenisProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/jenis', data),
    onSuccess: async () => {
      await forceInvalidateJenisProductCache(queryClient);
    },
  });
};

export const useUpdateJenisProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jenis/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(
        jenisProductKeys.detail(variables.id),
        response.data.data
      );
      await forceInvalidateJenisProductCache(queryClient);
    },
  });
};

export const useDeleteJenisProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/jenis/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: jenisProductKeys.lists(),
        exact: false,
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: jenisProductKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: jenisProductKeys.lists() },
        (old) => {
          if (!old?.jenisProducts) return old;
          return {
            ...old,
            jenisProducts: old.jenisProducts.filter((j) => j.id !== id),
            meta: {
              ...old.meta,
              total: (old.meta.total || 0) - 1,
            },
          };
        }
      );

      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: async () => {
      await forceInvalidateJenisProductCache(queryClient);
    },
  });
};