import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

const extractArray = (response) => {
  const responseData = response?.data?.data
  if (Array.isArray(responseData)) return responseData
  if (responseData && Array.isArray(responseData.data)) return responseData.data
  return []
}

export const useJenis = () => useQuery({
  queryKey: ['jenis'],
  queryFn: async () => {
    const response = await api.get('/jenis', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
})

export const useTypes = () => useQuery({
  queryKey: ['types'],
  queryFn: async () => {
    const response = await api.get('/type', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
})

export const useBahans = () => useQuery({
  queryKey: ['bahans'],
  queryFn: async () => {
    const response = await api.get('/bahan', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
})

export const useProducts = (search = '', jenisId = null, typeId = null, page = 1, perPage = 15) => {
  return useQuery({
    queryKey: ['products', search, jenisId, typeId, page, perPage],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { search, jenis_id: jenisId, type_id: typeId, page, per_page: perPage }
      })
      return response.data
    },
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      await success('Berhasil!', 'Product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, formData }) => api.post(`/products/${id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      await success('Berhasil!', 'Product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui product'
      info('Validasi Gagal', msg)
    },
  })
}

// ✅ PERBAIKAN DI SINI: Aggressive Cache Clearing + Logging
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => {
      console.log("🗑️ Attempting to delete product ID:", id); // Debug frontend
      return api.delete(`/products/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' });
      
      await success('Berhasil!', 'Product berhasil dihapus');
    },
    onError: (error) => {
      console.error("❌ Delete failed:", error);
      const errorMsg = error.response?.data?.message || 'Gagal menghapus product. Pastikan product tidak sedang digunakan di transaksi.';
      info('Gagal', errorMsg);
    },
  })
}