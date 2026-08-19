import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useInventories = (params = {}) => {
  const { search = '', place_id = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.inventory.list({ search, place_id, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: {
          search: search || undefined,
          place_id: place_id || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        inventories: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 detik (sebelumnya 2 menit)
    refetchOnWindowFocus: true,
  });
};

const invalidateInventoryCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.inventory.all, exact: false });
  await qc.resetQueries({
    queryKey: masterKeys.inventory.all,
    exact: false,
  });
  await invalidateRelatedCaches(qc, 'inventory');
};

export const useCreateProductMovement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/product-movements', data),
    onSuccess: async () => await invalidateInventoryCache(qc),
  });
};