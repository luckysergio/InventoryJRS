import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

const STATUS_KEYS = {
  all: ['status_transaksi'],
  list: () => [...STATUS_KEYS.all, 'list'],
};

export const useStatusTransaksiList = () =>
  useQuery({
    queryKey: STATUS_KEYS.list(),
    queryFn: async () => {
      const res = await api.get('/status-transaksi');
      return res.data.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

const invalidateStatusCache = async (qc) => {
  await qc.cancelQueries({ queryKey: STATUS_KEYS.all, exact: false });
  qc.removeQueries({ queryKey: STATUS_KEYS.all, exact: false });
  await qc.invalidateQueries({ queryKey: STATUS_KEYS.all, exact: false, refetchType: 'all' });
};

export const useCreateStatusTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/status-transaksi', data),
    onSuccess: async () => await invalidateStatusCache(qc),
  });
};

export const useUpdateStatusTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/status-transaksi/${id}`, data),
    onSuccess: async () => await invalidateStatusCache(qc),
  });
};

export const useDeleteStatusTransaksi = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/status-transaksi/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: STATUS_KEYS.all, exact: false });
      const prev = qc.getQueriesData({ queryKey: STATUS_KEYS.all });
      qc.setQueriesData({ queryKey: STATUS_KEYS.all }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((s) => s.id !== id);
      });
      return { prev };
    },
    onError: (_err, _id, ctx) =>
      ctx?.prev?.forEach(([k, d]) => qc.setQueryData(k, d)),
    onSettled: async () => await invalidateStatusCache(qc),
  });
};