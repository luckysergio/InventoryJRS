import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

// ✅ FIX: Gunakan masterKeys.productCustomer, bukan local keys
export const useProductCustomers = (params = {}) => {
  const { search = '', customerId = '', perPage = 15, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.productCustomer.list({ search, customerId, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/product-customers', {
        params: {
          search: search || undefined,
          customer_id: customerId || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        products: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

const invalidateProductCustomerCache = async (qc) => {
  // ✅ FIX: Gunakan masterKeys.productCustomer.all
  await qc.cancelQueries({ queryKey: masterKeys.productCustomer.all, exact: false });
  qc.removeQueries({ queryKey: masterKeys.productCustomer.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.productCustomer.all,
    exact: false,
    refetchType: 'all',
  });
  // Cross-invalidate via centralized helper
  await invalidateRelatedCaches(qc, 'productCustomer');
};

export const useCreateProductCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData) =>
      api.post('/product-customers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => await invalidateProductCustomerCache(qc),
  });
};

export const useUpdateProductCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) =>
      api.post(`/product-customers/${id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => await invalidateProductCustomerCache(qc),
  });
};

export const useDeleteProductCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/product-customers/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: masterKeys.productCustomer.all, exact: false });
      const prev = qc.getQueriesData({ queryKey: masterKeys.productCustomer.all });
      qc.setQueriesData({ queryKey: masterKeys.productCustomer.all }, (old) => {
        if (!old?.products) return old;
        return {
          ...old,
          products: old.products.filter((p) => p.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([k, d]) => qc.setQueryData(k, d));
    },
    onSettled: async () => await invalidateProductCustomerCache(qc),
  });
};