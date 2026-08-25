import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const usePesanans = (params = {}) => {
  const {
    mode = 'aktif',
    search = '',
    customer_id = '',
    dari = '',
    sampai = '',
    perPage = 20,
    page = 1,
  } = params;

  return useQuery({
    queryKey: masterKeys.pesanan.list({
      mode, search, customer_id, dari, sampai, perPage, page,
    }),
    queryFn: async () => {
      const res = await api.get('/pesanan', {
        params: {
          mode: mode || undefined,
          search: search || undefined,
          customer_id: customer_id || undefined,
          dari: dari || undefined,
          sampai: sampai || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        data: res.data?.data || [],
        meta: res.data?.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePesananAktif = (params = {}) => {
  return usePesanans({ ...params, mode: 'aktif' });
};

export const usePesanan = (id) => {
  return useQuery({
    queryKey: masterKeys.pesanan.detail(id),
    queryFn: async () => {
      const res = await api.get(`/pesanan/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

const invalidatePesananCache = async (qc) => {
  await qc.invalidateQueries({
    queryKey: masterKeys.pesanan.all,
    exact: false,
    refetchType: 'active',
  });
  await invalidateRelatedCaches(qc, 'pesanan');
};

const invalidatePembayaranPesananCache = async (qc) => {
  await qc.invalidateQueries({
    queryKey: masterKeys.pesanan.all,
    exact: false,
    refetchType: 'active',
  });

  await qc.invalidateQueries({
    queryKey: masterKeys.transaksi.all,
    exact: false,
    refetchType: 'active',
  });

  await qc.invalidateQueries({
    queryKey: masterKeys.pembayaran.all,
    exact: false,
    refetchType: 'active',
  });

  await invalidateRelatedCaches(qc, 'pembayaran');
};

export const useCreatePesanan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/pesanan', payload),
    onSuccess: async () => await invalidatePesananCache(qc),
  });
};

export const useUpdatePesanan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/pesanan/${id}`, data),
    onSuccess: async (_, variables) => {
      await invalidatePesananCache(qc);
      await qc.invalidateQueries({ queryKey: masterKeys.pesanan.detail(variables.id) });
    },
  });
};

export const useDeletePesanan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/pesanan/${id}`),
    onSuccess: async () => await invalidatePesananCache(qc),
  });
};

export const useCancelPesananDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (detailId) => api.post(`/pesanan/detail/${detailId}/cancel`),
    onSuccess: async () => await invalidatePesananCache(qc),
  });
};

export const useUpdatePesananDetailStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ detailId, status_transaksi_id }) =>
      api.put(`/pesanan/detail/${detailId}/status`, { status_transaksi_id }),
    onSuccess: async () => await invalidatePesananCache(qc),
  });
};

export const useCompletePesananDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (detailId) => api.patch(`/pesanan/detail/${detailId}/selesai`),
    onSuccess: async () => await invalidatePembayaranPesananCache(qc),
  });
};

export const useCreatePembayaranPesanan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/pembayaran', payload),
    onSuccess: async () => await invalidatePembayaranPesananCache(qc),
  });
};