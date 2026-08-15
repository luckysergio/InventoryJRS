import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

const extractArray = (response) => {
  const responseData = response?.data?.data
  if (Array.isArray(responseData)) return responseData
  if (responseData && Array.isArray(responseData.data)) return responseData.data
  return []
}

// ==========================================
// 1. MASTER DATA
// ==========================================
export const useJenis = () => useQuery({
  queryKey: ['jenis'],
  queryFn: async () => extractArray(await api.get('/jenis', { params: { per_page: 1000 } })),
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useTypes = () => useQuery({
  queryKey: ['types'],
  queryFn: async () => extractArray(await api.get('/type', { params: { per_page: 1000 } })),
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useBahans = () => useQuery({
  queryKey: ['bahans'],
  queryFn: async () => extractArray(await api.get('/bahan', { params: { per_page: 1000 } })),
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

// ==========================================
// 2. PRODUCTS LIST
// ==========================================
export const useProducts = (search = '', jenisId = null, typeId = null, page = 1, perPage = 15) => {
  return useQuery({
    queryKey: ['products', search, jenisId, typeId, page, perPage],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { search, jenis_id: jenisId, type_id: typeId, page, per_page: perPage }
      })
      return response.data
    },
    refetchOnWindowFocus: false,
  })
}

// ==========================================
// 3. MUTATIONS (✅ FIXED: Segitiga Sinkronisasi)
// ==========================================
export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] }) // ✅ Sinkron ke Distributor
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] }) // ✅ Sinkron ke Harga
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['harga_products'], type: 'active' })
      
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
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] }) // ✅ Sinkron ke Distributor
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] }) // ✅ Sinkron ke Harga
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['harga_products'], type: 'active' })
      
      await success('Berhasil!', 'Product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] }) // ✅ Sinkron ke Distributor
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] }) // ✅ Sinkron ke Harga
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['harga_products'], type: 'active' })
      
      await success('Berhasil!', 'Product berhasil dihapus')
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Gagal menghapus product. Pastikan product tidak sedang digunakan di transaksi.'
      info('Gagal', errorMsg)
    },
  })
}