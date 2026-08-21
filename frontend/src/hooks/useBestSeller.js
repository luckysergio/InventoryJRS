import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

// Query key factory untuk best seller
export const bestSellerKeys = {
  all: ['best_seller'],
  list: (params) => ['best_seller', 'list', params],
};

/**
 * Hook untuk fetch data produk terlaris
 * 
 * @param {Object} params - { dari, sampai, jenis, limit }
 * @returns {Object} { data, isLoading, isFetching, error, refetch }
 */
export const useBestSellers = (params = {}) => {
  const {
    dari = '',
    sampai = '',
    jenis = '',
    limit = 20,
  } = params;

  return useQuery({
    queryKey: bestSellerKeys.list({ dari, sampai, jenis, limit }),
    queryFn: async () => {
      const res = await api.get('/products/best-seller', {
        params: {
          dari: dari || undefined,
          sampai: sampai || undefined,
          jenis: jenis || undefined,
          limit,
        },
      });
      return {
        products: res.data?.data || [],
        meta: res.data?.meta || {},
      };
    },
    staleTime: 5 * 60 * 1000, // 5 menit (sama dengan backend TTL)
    refetchOnWindowFocus: false,
  });
};

export const useInvalidateBestSeller = () => {
  const queryClient = useQueryClient();
  
  return async () => {
    await queryClient.invalidateQueries({
      queryKey: bestSellerKeys.all,
      exact: false,
      refetchType: 'active',
    });
  };
};