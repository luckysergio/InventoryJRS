import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export {
  useProductsDropdown as useProductsForHarga,
  useCustomersDropdown as useCustomersForHarga,
} from './useMasterData';

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
    staleTime: 2 * 60 * 1000,
  });
};

// ✅ FIXED: Invalidate harga sendiri + cross-invalidate
const invalidateHargaCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.harga.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.harga.all,
    exact: false,
    refetchType: 'all',
  });
  await invalidateRelatedCaches(qc, 'harga');
};

export const useCreateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/harga', data),
    onSuccess: async () => {
      await invalidateHargaCache(queryClient);
    },
  });
};

export const useUpdateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/harga/${id}`, data),
    onSuccess: async () => {
      await invalidateHargaCache(queryClient);
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
      await invalidateHargaCache(queryClient);
    },
  });
};