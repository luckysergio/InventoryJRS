import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export { useJenisDropdown, useTypesDropdown, useBahansDropdown } from './useMasterData';

export const useProducts = (params = {}) => {
  const { search = '', jenisId = '', typeId = '', perPage = 15, page = 1 } = params;
  return useQuery({
    queryKey: masterKeys.product.list({ search, jenisId, typeId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/products', {
        params: {
          search: search || undefined,
          jenis_id: jenisId || undefined,
          type_id: typeId || undefined,
          per_page: perPage,
          page,
        },
      });
      return { products: response.data.data || [], meta: response.data.meta || {} };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

// ✅ FIXED: Invalidate product sendiri + cross-invalidate
const invalidateProductCache = async (qc) => {
  // Step 1: Invalidate product sendiri
  await qc.cancelQueries({ queryKey: masterKeys.product.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.product.all,
    exact: false,
    refetchType: 'all',
  });
  // Step 2: Cross-invalidate entity lain
  await invalidateRelatedCaches(qc, 'product');
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await invalidateProductCache(queryClient);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) => api.post(`/products/${id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async (response, variables) => {
      // Update detail query cache
      queryClient.setQueryData(masterKeys.product.detail(variables.id), response.data.data);
      await invalidateProductCache(queryClient);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.product.all, exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.product.all });
      queryClient.setQueriesData({ queryKey: masterKeys.product.all }, (old) => {
        if (!old?.products) return old;
        return { ...old, products: old.products.filter((p) => p.id !== id), meta: { ...old.meta, total: (old.meta.total || 0) - 1 } };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateProductCache(queryClient);
    },
  });
};