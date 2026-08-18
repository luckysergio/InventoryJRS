import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

// ✅ Re-export dari useMasterData (single source of truth)
export {
  useProductsDropdown as useProductsForHarga,
  useCustomersDropdown as useCustomersForHarga,
} from './useMasterData';

/**
 * ✅ FIX: Gunakan masterKeys.harga (BUKAN key lokal)
 */
export const useHargaProducts = (params = {}) => {
  const { search = '', productId = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.harga.list({ search, productId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/harga', {
        params: {
          search: search || undefined,
          product_id: productId || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        hargaProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/harga', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'harga');
    },
  });
};

export const useUpdateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/harga/${id}`, data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'harga');
    },
  });
};

export const useDeleteHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/harga/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.harga.all, exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.harga.all });
      queryClient.setQueriesData({ queryKey: masterKeys.harga.all }, (old) => {
        if (!old?.hargaProducts) return old;
        return {
          ...old,
          hargaProducts: old.hargaProducts.filter((h) => h.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'harga');
    },
  });
};