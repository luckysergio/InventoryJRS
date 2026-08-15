import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const karyawanKeys = {
  all: ['karyawans'],
  lists: () => [...karyawanKeys.all, 'list'],
  list: (filters) => [...karyawanKeys.lists(), filters],
  details: () => [...karyawanKeys.all, 'detail'],
  detail: (id) => [...karyawanKeys.details(), id],
  dropdown: () => [...karyawanKeys.all, 'dropdown'],
  statistics: () => [...karyawanKeys.all, 'statistics'],
};

export const useKaryawans = (params = {}) => {
  const { search = '', jabatanId = '', perPage = 10, page = 1 } = params;

  return useQuery({
    queryKey: karyawanKeys.list({ search, jabatanId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/karyawans', {
        params: {
          search: search || undefined,
          jabatan_id: jabatanId || undefined,
          per_page: perPage,
          page,
        },
      });

      return {
        karyawans: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useKaryawansDropdown = () => {
  return useQuery({
    queryKey: karyawanKeys.dropdown(),
    queryFn: async () => {
      const response = await api.get('/karyawans/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useKaryawanStatistics = () => {
  return useQuery({
    queryKey: karyawanKeys.statistics(),
    queryFn: async () => {
      const response = await api.get('/karyawans/statistics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const forceInvalidateKaryawanCache = async (queryClient) => {
  await queryClient.cancelQueries({ 
    queryKey: karyawanKeys.all,
    exact: false,
  });

  queryClient.removeQueries({ 
    queryKey: karyawanKeys.all,
    exact: false,
  });

  await queryClient.resetQueries({
    queryKey: karyawanKeys.all,
    exact: false,
  });

  await queryClient.invalidateQueries({
    queryKey: karyawanKeys.all,
    exact: false,
    refetchType: 'all',
  });

  await queryClient.invalidateQueries({ 
    queryKey: ['jabatans'],
    exact: false,
    refetchType: 'all',
  });
};

export const useCreateKaryawan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/karyawans', data),
    onSuccess: async () => {
      await forceInvalidateKaryawanCache(queryClient);
    },
  });
};

export const useUpdateKaryawan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/karyawans/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(
        karyawanKeys.detail(variables.id),
        response.data.data
      );

      await forceInvalidateKaryawanCache(queryClient);
    },
  });
};

export const useDeleteKaryawan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/karyawans/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ 
        queryKey: karyawanKeys.lists(),
        exact: false,
      });

      const previousQueries = queryClient.getQueriesData({
        queryKey: karyawanKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: karyawanKeys.lists() },
        (old) => {
          if (!old?.karyawans) return old;
          return {
            ...old,
            karyawans: old.karyawans.filter((k) => k.id !== id),
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
      // Rollback jika error
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: async () => {
      await forceInvalidateKaryawanCache(queryClient);
    },
  });
};