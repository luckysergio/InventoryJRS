import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/axios'; // ✅ Pakai axios yang sudah ada
import useCustomerStore from '../store/customerStore';

/**
 * Hook untuk fetch produk umum (public catalog)
 * URL: /api/public/products
 * SKIP_AUTH: otomatis karena url mengandung '/public/'
 */
export const usePublicProducts = (params = {}, options = {}) => {
  const setPublicProducts = useCustomerStore((s) => s.setPublicProducts);

  return useQuery({
    queryKey: ['public-products', params],
    queryFn: async () => {
      const { data } = await api.get('/public/products', {
        params: {
          search: params.search || '',
          jenis_id: params.jenisId,
          type_id: params.typeId,
          per_page: params.perPage || 12,
          page: params.page || 1,
        },
      });

      if (data.status && data.data) {
        setPublicProducts(data.data);
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
 * Best seller products
 */
export const useBestSellerProducts = (limit = 6) => {
  return useQuery({
    queryKey: ['best-seller-products', limit],
    queryFn: async () => {
      const { data } = await api.get('/public/products/best-seller', {
        params: { limit },
      });
      return data.data || [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Available products (stok > 0)
 */
export const useAvailableProducts = () => {
  return useQuery({
    queryKey: ['available-products'],
    queryFn: async () => {
      const { data } = await api.get('/public/products/available');
      return data.data || [];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Detail product
 */
export const useProductDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/public/products/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    ...options,
  });
};