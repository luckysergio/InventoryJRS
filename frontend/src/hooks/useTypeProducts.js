import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useTypeProducts = (search = '', jenisId = null, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['types', search, jenisId, page, perPage], 
    queryFn: async () => {
      const response = await api.get('/type', {
        params: { search, jenis_id: jenisId, page, per_page: perPage }
      })
      // ✅ Kembalikan objek paginator langsung agar komponen bisa membaca .data, .last_page, dll
      return response.data.data 
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    refetchOnWindowFocus: false,
  })
}

export const useJenisProducts = () => {
  return useQuery({
    queryKey: ['jenis'], 
    queryFn: async () => {
      const response = await api.get('/jenis', { params: { per_page: 1000 } })
      return response.data.data || []
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

export const useCreateTypeProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/type', data),
    onSuccess: async () => {
      // ✅ Invalidate & Refetch unified keys agar ProductPage langsung update
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      
      // Juga invalidate key spesifik halaman TypeProduct jika ada
      await queryClient.invalidateQueries({ queryKey: ['type_products'] })
      
      await success('Berhasil!', 'Type product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal menambahkan type product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateTypeProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/type/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await queryClient.invalidateQueries({ queryKey: ['type_products'] })
      
      await success('Berhasil!', 'Type product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal memperbarui type product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteTypeProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/type/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await queryClient.invalidateQueries({ queryKey: ['type_products'] })
      
      await success('Berhasil!', 'Type product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus type product')
    },
  })
}