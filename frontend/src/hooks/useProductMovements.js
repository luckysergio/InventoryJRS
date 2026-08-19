import { useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

const PRODUCT_MOVEMENT_KEYS = {
  all: ['product_movements'],
  lists: () => [...PRODUCT_MOVEMENT_KEYS.all, 'list'],
  list: (filters) => [...PRODUCT_MOVEMENT_KEYS.lists(), filters],
};

export const useProductMovements = (params = {}) => {
  const { search = '', tipe = '', dari = '', sampai = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: PRODUCT_MOVEMENT_KEYS.list({ search, tipe, dari, sampai, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/product-movements', {
        params: {
          search: search || undefined,
          tipe: tipe || undefined,
          dari: dari || undefined,
          sampai: sampai || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        movements: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};