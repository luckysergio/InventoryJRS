import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const hargaProductKeys = {
  all: ['harga_products'],
  lists: () => [...hargaProductKeys.all, 'list'],
  list: (filters) => [...hargaProductKeys.lists(), filters],
  details: () => [...hargaProductKeys.all, 'detail'],
  detail: (id) => [...hargaProductKeys.details(), id],
  byProduct: (productId) => [...hargaProductKeys.all, 'by_product', productId],
  productsDropdown: () => ['products_dropdown'],
  customersDropdown: () => ['customers_dropdown'],
};

export const useHargaProducts = (params = {}) => {
  const { search = '', productId = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: hargaProductKeys.list({ search, productId, perPage, page }),
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

export const useProductsDropdown = () => {
  return useQuery({
    queryKey: hargaProductKeys.productsDropdown(),
    queryFn: async () => {
      const response = await api.get('/products/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useCustomersDropdown = () => {
  return useQuery({
    queryKey: hargaProductKeys.customersDropdown(),
    queryFn: async () => {
      const response = await api.get('/customers/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

const forceInvalidateHargaCache = async (queryClient) => {
  await queryClient.cancelQueries({ queryKey: hargaProductKeys.all, exact: false });
  queryClient.removeQueries({ queryKey: hargaProductKeys.all, exact: false });
  await queryClient.invalidateQueries({ queryKey: hargaProductKeys.all, exact: false, refetchType: 'all' });
};

export const useCreateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/harga', data),
    onSuccess: async () => {
      await forceInvalidateHargaCache(queryClient);
    },
  });
};

export const useUpdateHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/harga/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(hargaProductKeys.detail(variables.id), response.data.data);
      await forceInvalidateHargaCache(queryClient);
    },
  });
};

export const useDeleteHargaProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/harga/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: hargaProductKeys.lists(), exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: hargaProductKeys.lists() });
      queryClient.setQueriesData({ queryKey: hargaProductKeys.lists() }, (old) => {
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
      await forceInvalidateHargaCache(queryClient);
    },
  });
};