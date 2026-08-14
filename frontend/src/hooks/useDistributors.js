import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useDistributors = (search = '', page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['distributors', search, page, perPage],
    queryFn: async () => {
      const response = await api.get('/distributors', {
        params: { search, page, per_page: perPage }
      })
      return response.data.data
    },
  })
}

export const useCreateDistributor = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/distributors', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      await success('Berhasil!', 'Distributor berhasil ditambahkan')
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
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
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
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      await success('Berhasil!', 'Distributor berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus distributor')
    },
  })
}