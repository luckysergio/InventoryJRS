import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

// Query key factory
export const productionKeys = {
  all: ['productions'],
  list: () => [...productionKeys.all, 'list'],
  pesanan: () => [...productionKeys.all, 'pesanan'],
  detail: (id) => [...productionKeys.all, 'detail', id],
};

/**
 * GET /api/productions - List semua production
 */
export const useProductions = () => {
  return useQuery({
    queryKey: productionKeys.list(),
    queryFn: async () => {
      const res = await api.get('/productions');
      return {
        productions: res.data?.data || [],
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * GET /api/productions/pesanan/dipesan - Pesanan siap produksi
 */
export const usePesananProduksi = () => {
  return useQuery({
    queryKey: productionKeys.pesanan(),
    queryFn: async () => {
      const res = await api.get('/productions/pesanan/dipesan');
      return {
        pesanan: res.data?.data || [],
      };
    },
    staleTime: 60 * 1000, // 1 menit
  });
};

/**
 * Helper: invalidate semua production cache
 */
const invalidateProductionCache = async (qc) => {
  await qc.invalidateQueries({
    queryKey: productionKeys.all,
    exact: false,
    refetchType: 'active',
  });
};

/**
 * POST /api/productions - Create production
 */
export const useCreateProduction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/productions', data),
    onSuccess: async () => {
      await invalidateProductionCache(qc);
    },
  });
};

/**
 * PUT /api/productions/{id} - Update status
 */
export const useUpdateProductionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/productions/${id}`, data),
    onSuccess: async () => {
      await invalidateProductionCache(qc);
    },
  });
};

/**
 * DELETE /api/productions/{id} - Delete production (only antri)
 */
export const useDeleteProduction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/productions/${id}`),
    onSuccess: async () => {
      await invalidateProductionCache(qc);
    },
  });
};

/**
 * POST /api/products/{id}/upload-foto - Upload foto produk
 */
export const useUploadProductPhotos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, formData }) =>
      api.post(`/products/${productId}/upload-foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async () => {
      await invalidateProductionCache(qc);
      await qc.invalidateQueries({
        queryKey: ['products'],
        exact: false,
      });
    },
  });
};

/**
 * GET /api/karyawans - Dropdown karyawan
 */
export const useKaryawansDropdown = () => {
  return useQuery({
    queryKey: ['karyawans', 'dropdown'],
    queryFn: async () => {
      const res = await api.get('/karyawans');
      return res.data?.karyawans?.data || res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * GET /api/products - Dropdown produk
 */
export const useProductsDropdown = () => {
  return useQuery({
    queryKey: ['products', 'dropdown'],
    queryFn: async () => {
      const res = await api.get('/products?per_page=1000');
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};