import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useBahanProducts = () => {
  return useQuery({
    queryKey: ['bahan_products'],
    queryFn: async () => {
      const response = await api.get('/bahan')
      return response.data.data || []
    },
  })
}

export const useCreateBahanProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/bahan', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bahan_products'] })
      await success('Berhasil!', 'Bahan product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal menambahkan bahan product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateBahanProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/bahan/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bahan_products'] })
      await success('Berhasil!', 'Bahan product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal memperbarui bahan product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteBahanProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/bahan/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bahan_products'] })
      await success('Berhasil!', 'Bahan product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus bahan product')
    },
  })
}