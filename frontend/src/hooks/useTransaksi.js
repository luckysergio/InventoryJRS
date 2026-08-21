import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useTransaksis = (params = {}) => {
  const {
    mode = 'all',
    jenis = '',
    search = '',
    customer_id = '',
    dari = '',
    sampai = '',
    perPage = 20,
    page = 1,
  } = params;

  return useQuery({
    queryKey: masterKeys.transaksi.list({
      mode, jenis, search, customer_id, dari, sampai, perPage, page,
    }),
    queryFn: async () => {
      const res = await api.get('/transaksi', {
        params: {
          mode: mode || undefined,
          jenis: jenis || undefined,
          search: search || undefined,
          customer_id: customer_id || undefined,
          dari: dari || undefined,
          sampai: sampai || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        transaksis: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useTransaksiDetail = (id) => {
  return useQuery({
    queryKey: masterKeys.transaksi.detail(id),
    queryFn: async () => {
      const res = await api.get(`/transaksi/${id}`);
      return res.data.data || res.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

const invalidateTransaksiCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.transaksi.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.transaksi.all,
    exact: false,
    refetchType: 'all',
  });
  await invalidateRelatedCaches(qc, 'transaksi');

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
};

export const useCreateTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/transaksi', data),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useUpdateTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/transaksi/${id}`, data),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useDeleteTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/transaksi/${id}`),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useUpdateDetailStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ detailId, status_transaksi_id }) =>
      api.put(`/transaksi/detail/${detailId}/status`, { status_transaksi_id }),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useCancelDetailTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (detailId) => api.post(`/transaksi/detail/${detailId}/cancel`),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useCreatePembayaran = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/pembayaran', data),
    onSuccess: async () => await invalidateTransaksiCache(qc),
  });
};

export const useStatusTransaksiList = () => {
  return useQuery({
    queryKey: ['status_transaksi_list'],
    queryFn: async () => {
      const res = await api.get('/status-transaksi');
      return res.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};