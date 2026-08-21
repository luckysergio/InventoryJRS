import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useCustomers = (params = {}) => {
  const { search = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.customer.list({ search, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/customers', {
        params: {
          search: search || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        customers: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCustomerTagihan = (customerId, jenis = null, enabled = true) => {
  return useQuery({
    queryKey: ['customer_tagihan', customerId, jenis],
    queryFn: async () => {
      const response = await api.get(`/customers/${customerId}/tagihan`, {
        params: { jenis: jenis || undefined },
      });
      return {
        details: response.data.data || [],
        summary: response.data.summary || {},
      };
    },
    enabled: enabled && !!customerId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'customer');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/customers/${id}`, data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'customer');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/customers/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.customer.all, exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.customer.all });
      queryClient.setQueriesData({ queryKey: masterKeys.customer.all }, (old) => {
        if (!old?.customers) return old;
        return {
          ...old,
          customers: old.customers.filter((c) => c.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'customer');
    },
  });
};