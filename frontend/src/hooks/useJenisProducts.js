import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches, forceFreshCache } from './useMasterData';

export const useJenisProducts = (params = {}) => {
  const { search = '', with_count = true, perPage = 12, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.jenis.list({ search, with_count, perPage, page }),
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
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useJenisProductStatistics = () => {
  return useQuery({
    queryKey: masterKeys.jenis.statistics(),
    queryFn: async () => {
      const response = await api.get('/jenis/statistics');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * ✅ Create Jenis Product dengan cross-invalidation yang agresif.
 * Trigger: jenis, type, product cache (backend juga invalid ini)
 */
export const useCreateJenisProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/jenis', data),
    onSuccess: async (response) => {
      // ✅ Optimistic: tambahkan data baru ke list cache
      queryClient.setQueriesData(
        { queryKey: masterKeys.jenis.lists() },
        (old) => {
          if (!old?.jenisProducts) return old;
          return {
            ...old,
            jenisProducts: [...old.jenisProducts, response.data.data],
            meta: { ...old.meta, total: (old.meta.total || 0) + 1 },
          };
        }
      );

      // ✅ Full cross-invalidation (async, non-blocking)
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
    onError: (error) => {
      console.error('[useCreateJenisProduct] Error:', error);
    },
  });
};

/**
 * ✅ Update Jenis Product dengan cross-invalidation.
 * Karena jenis.nama di-embed di cache type & product, harus force refresh semua.
 */
export const useUpdateJenisProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jenis/${id}`, data),
    onSuccess: async (response, variables) => {
      // ✅ Optimistic update: update detail cache
      queryClient.setQueryData(
        masterKeys.jenis.detail(variables.id),
        response.data.data
      );

      // ✅ Optimistic update: update di semua list cache
      queryClient.setQueriesData(
        { queryKey: masterKeys.jenis.lists() },
        (old) => {
          if (!old?.jenisProducts) return old;
          return {
            ...old,
            jenisProducts: old.jenisProducts.map((j) =>
              j.id === variables.id ? response.data.data : j
            ),
          };
        }
      );

      // ✅ Optimistic update: update di dropdown cache
      queryClient.setQueryData(
        masterKeys.jenis.dropdown(),
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item.value === variables.id
              ? { ...item, label: response.data.data.nama }
              : item
          );
        }
      );

      // ✅ CRITICAL: Force refresh type & product cache karena embed jenis.nama
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
  });
};

/**
 * ✅ Delete Jenis Product dengan optimistic update + rollback.
 */
export const useDeleteJenisProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/jenis/${id}`),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: masterKeys.jenis.all, exact: false });

      // Snapshot previous values
      const previousList = queryClient.getQueriesData({ queryKey: masterKeys.jenis.lists() });
      const previousDropdown = queryClient.getQueryData(masterKeys.jenis.dropdown());
      const previousDetail = queryClient.getQueryData(masterKeys.jenis.detail(id));

      // Optimistic update: remove dari list
      queryClient.setQueriesData(
        { queryKey: masterKeys.jenis.lists() },
        (old) => {
          if (!old?.jenisProducts) return old;
          return {
            ...old,
            jenisProducts: old.jenisProducts.filter((j) => j.id !== id),
            meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
          };
        }
      );

      // Optimistic update: remove dari dropdown
      queryClient.setQueryData(
        masterKeys.jenis.dropdown(),
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item) => item.value !== id);
        }
      );

      // Remove detail cache
      queryClient.removeQueries({ queryKey: masterKeys.jenis.detail(id) });

      return { previousList, previousDropdown, previousDetail };
    },
    onError: (err, id, context) => {
      // Rollback ke state sebelumnya
      context?.previousList?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousDropdown) {
        queryClient.setQueryData(masterKeys.jenis.dropdown(), context.previousDropdown);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(masterKeys.jenis.detail(id), context.previousDetail);
      }
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
  });
};