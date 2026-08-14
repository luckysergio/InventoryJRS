import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

// ==========================================
// 1. QUERIES
// ==========================================

// Untuk Halaman List Distributor (dengan pagination & search)
export const useDistributors = (search = '', page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['distributors', search, page, perPage],
    queryFn: async () => {
      const response = await api.get('/distributors', {
        params: { search, page, per_page: perPage }
      })
      return response.data.data
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    refetchOnWindowFocus: false,
  })
}

// Khusus untuk Dropdown (mengambil semua data tanpa pagination)
export const useDistributorsDropdown = () => {
  return useQuery({
    queryKey: ['distributors_dropdown'],
    queryFn: async () => {
      const response = await api.get('/distributors', { params: { per_page: 1000 } })
      return response.data.data || response.data.distributors || []
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// ==========================================
// 2. MUTATIONS (Dengan Cross-Invalidation)
// ==========================================

export const useCreateDistributor = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/distributors', data),
    onSuccess: async (response) => {
      // ✅ Sinkronisasi: Update list halaman DAN dropdown form
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      await queryClient.invalidateQueries({ queryKey: ['distributors_dropdown'] })
      
      await queryClient.refetchQueries({ queryKey: ['distributors_dropdown'], type: 'all' })
      
      await success('Berhasil!', 'Distributor berhasil ditambahkan')
      return response.data.data || response.data.distributor
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan distributor'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateDistributor = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/distributors/${id}`, data),
    onSuccess: async () => {
      // ✅ Sinkronisasi: Update list halaman DAN dropdown form
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      await queryClient.invalidateQueries({ queryKey: ['distributors_dropdown'] })
      
      await queryClient.refetchQueries({ queryKey: ['distributors_dropdown'], type: 'all' })
      
      await success('Berhasil!', 'Distributor berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui distributor'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteDistributor = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/distributors/${id}`),
    onSuccess: async () => {
      // ✅ Sinkronisasi: Update list halaman DAN dropdown form
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      await queryClient.invalidateQueries({ queryKey: ['distributors_dropdown'] })
      
      await queryClient.refetchQueries({ queryKey: ['distributors_dropdown'], type: 'all' })
      
      await success('Berhasil!', 'Distributor berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus distributor')
    },
  })
}