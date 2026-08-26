import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/axios'; // ✅ Pakai axios yang sudah ada
import useCustomerStore from '../store/customerStore';

/**
 * Produk custom (harga khusus customer)
 */
export const useProductCustoms = (params = {}, options = {}) => {
  const setCustomProducts = useCustomerStore((s) => s.setCustomProducts);

  return useQuery({
    queryKey: ['product-customs', params],
    queryFn: async () => {
      const { data } = await api.get('/public/product-customs', {
        params: {
          search: params.search || '',
          customer_id: params.customerId,
          per_page: params.perPage || 15,
          page: params.page || 1,
        },
      });

      if (data.status && data.data) {
        setCustomProducts(data.data);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/**
 * Produk khusus customer tertentu (COMPRO use case)
 */
export const useCustomerProducts = (customerId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ['customer-products', customerId, params],
    queryFn: async () => {
      const { data } = await api.get(`/public/customers/${customerId}/products`, {
        params: {
          search: params.search || '',
          per_page: params.perPage || 15,
          page: params.page || 1,
        },
      });
      return data;
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};