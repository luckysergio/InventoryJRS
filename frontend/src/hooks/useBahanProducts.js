import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const bahanProductKeys = {
  all: ['bahan_products'],
  lists: () => [...bahanProductKeys.all, 'list'],
  list: (filters) => [...bahanProductKeys.lists(), filters],
  details: () => [...bahanProductKeys.all, 'detail'],
  detail: (id) => [...bahanProductKeys.details(), id],
  dropdown: () => [...bahanProductKeys.all, 'dropdown'],
  statistics: () => [...bahanProductKeys.all, 'statistics'],
};

export const useBahanProducts = (params = {}) => {
  const { search = '', with_count = true, perPage = 12, page = 1 } = params;

  return useQuery({
    queryKey: bahanProductKeys.list({ search, with_count, perPage, page }),
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

export const useBahanProductsDropdown = () => {
  return useQuery({
    queryKey: bahanProductKeys.dropdown(),
    queryFn: async () => {
      const response = await api.get('/bahan/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

const forceInvalidateBahanProductCache = async (queryClient) => {
  await queryClient.cancelQueries({
    queryKey: bahanProductKeys.all,
    exact: false,
  });

  queryClient.removeQueries({
    queryKey: bahanProductKeys.all,
    exact: false,
  });

  await queryClient.invalidateQueries({
    queryKey: bahanProductKeys.all,
    exact: false,
    refetchType: 'all',
  });
};

export const useCreateBahanProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/bahan', data),
    onSuccess: async () => {
      await forceInvalidateBahanProductCache(queryClient);
    },
  });
};

export const useUpdateBahanProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/bahan/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(
        bahanProductKeys.detail(variables.id),
        response.data.data
      );
      await forceInvalidateBahanProductCache(queryClient);
    },
  });
};

export const useDeleteBahanProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/bahan/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: bahanProductKeys.lists(),
        exact: false,
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: bahanProductKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: bahanProductKeys.lists() },
        (old) => {
          if (!old?.bahanProducts) return old;
          return {
            ...old,
            bahanProducts: old.bahanProducts.filter((b) => b.id !== id),
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
      await forceInvalidateBahanProductCache(queryClient);
    },
  });
};