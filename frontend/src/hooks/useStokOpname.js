import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useStokOpnames = (params = {}) => {
  const { status = '', search = '', dari = '', sampai = '', exclude_draft = false, perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.stokOpname.list({ status, search, dari, sampai, exclude_draft, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/stok-opname', {
        params: {
          status: status || undefined,
          search: search || undefined,
          dari: dari || undefined,
          sampai: sampai || undefined,
          exclude_draft: exclude_draft ? 1 : undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        opnames: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useStokOpnameDetail = (id) => {
  return useQuery({
    queryKey: masterKeys.stokOpname.detail(id),
    queryFn: async () => {
      const res = await api.get(`/stok-opname/${id}`);
      return res.data.data || res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAvailableInventories = (placeKodes = ['TOKO', 'BENGKEL'], search = '') => {
  return useQuery({
    queryKey: masterKeys.stokOpname.availableInventories([...placeKodes].sort()),
    queryFn: async () => {
      const res = await api.get('/stok-opname/available-inventories', {
        params: {
          'places[]': placeKodes,
          search: search || undefined,
        },
      });
      return {
        items: res.data.data || [],
        summary: res.data.summary || { total_items: 0, by_place: [] },
      };
    },
    enabled: placeKodes.length > 0,
    staleTime: 2 * 60 * 1000,
  });
};

const invalidateStokOpnameCache = async (qc, alsoInvalidateInventory = false) => {
  await qc.cancelQueries({ queryKey: masterKeys.stokOpname.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.stokOpname.all,
    exact: false,
    refetchType: 'all',
  });
  await invalidateRelatedCaches(qc, 'stokOpname');

  if (alsoInvalidateInventory) {
    await qc.cancelQueries({ queryKey: masterKeys.inventory.all, exact: false });
    await qc.invalidateQueries({
      queryKey: masterKeys.inventory.all,
      exact: false,
      refetchType: 'all',
    });
    await qc.cancelQueries({ queryKey: masterKeys.productMovement.all, exact: false });
    await qc.invalidateQueries({
      queryKey: masterKeys.productMovement.all,
      exact: false,
      refetchType: 'all',
    });
  }
};

export const useCreateStokOpname = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/stok-opname', data),
    onSuccess: async () => await invalidateStokOpnameCache(qc, false),
  });
};

export const useCreateForPlacesStokOpname = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/stok-opname/create-for-places', data),
    onSuccess: async () => await invalidateStokOpnameCache(qc, false),
  });
};

export const useUpdateDetailStokOpname = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ opnameId, data }) => api.post(`/stok-opname/${opnameId}/detail`, data),
    onSuccess: async () => await invalidateStokOpnameCache(qc, false),
  });
};

export const useSelesaiStokOpname = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/stok-opname/${id}/selesai`),
    onSuccess: async () => await invalidateStokOpnameCache(qc, true),
  });
};

export const useBatalkanStokOpname = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/stok-opname/${id}/batalkan`),
    onSuccess: async () => await invalidateStokOpnameCache(qc, false),
  });
};