import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

// Re-export dropdown hooks dari useMasterData
export {
  useJenisDropdown as useJenis,
  useTypesDropdown as useTypes,
  useBahansDropdown as useBahans,
  useDistributorsDropdown as useDistributors,
} from './useMasterData';

/**
 * ✅ FIX: Gunakan masterKeys.distributorProduct (bukan key lokal)
 */
export const useDistributorProducts = (params = {}) => {
  const { search = '', jenisId = '', typeId = '', perPage = 15, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.distributorProduct.list({ search, jenisId, typeId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/product-distributors', {
        params: {
          search: search || undefined,
          jenis_id: jenisId || undefined,
          type_id: typeId || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        products: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateDistributorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      api.post('/product-distributors', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      // ✅ Invalidate distributorProduct + cross-invalidate product & harga
      await invalidateRelatedCaches(queryClient, 'distributorProduct');
    },
  });
};

export const useUpdateDistributorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) =>
      api.post(`/product-distributors/${id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'distributorProduct');
    },
  });
};

export const useDeleteDistributorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/product-distributors/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.distributorProduct.all, exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.distributorProduct.all });
      queryClient.setQueriesData({ queryKey: masterKeys.distributorProduct.all }, (old) => {
        if (!old?.products) return old;
        return {
          ...old,
          products: old.products.filter((p) => p.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'distributorProduct');
    },
  });
};

export const useCreateDistributor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/distributors', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'distributor');
    },
  });
};