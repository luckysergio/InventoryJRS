import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useHargaProducts = (search = '', productId = null, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['harga_products', search, productId, page, perPage],
    queryFn: async () => {
      const response = await api.get('/harga', {
        params: { search, product_id: productId, page, per_page: perPage }
      })
      return response.data.data
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export const useProductsDropdown = () => {
  return useQuery({
    queryKey: ['products_dropdown'],
    queryFn: async () => {
      const response = await api.get('/products', { params: { per_page: 1000 } })
      return response.data.data || response.data || []
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// ✅ Tetap dipertahankan karena dibutuhkan oleh HargaProductForm
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers_dropdown'],
    queryFn: async () => {
      const response = await api.get('/customers', { params: { per_page: 1000 } })
      return response.data.data || response.data || []
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// ==========================================
// MUTATIONS DENGAN SINKRONISASI PENUH
// ==========================================
export const useCreateHargaProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/harga', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] })
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      
      await success('Berhasil!', 'Harga product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal menambahkan harga'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateHargaProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/harga/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] })
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      
      await success('Berhasil!', 'Harga product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal memperbarui harga'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteHargaProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/harga/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['harga_products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] })
      
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'active' })
      
      await success('Berhasil!', 'Harga product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus harga')
    },
  })
}