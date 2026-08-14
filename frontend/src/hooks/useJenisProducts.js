import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useJenisProducts = () => {
  return useQuery({
    queryKey: ['jenis_products'],
    queryFn: async () => {
      const response = await api.get('/jenis')
      return response.data.data || []
    },
  })
}

export const useCreateJenisProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/jenis', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis_products'] })
      await success('Berhasil!', 'Jenis product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal menambahkan jenis product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateJenisProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jenis/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis_products'] })
      await success('Berhasil!', 'Jenis product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || error.response?.data?.message || 'Gagal memperbarui jenis product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteJenisProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/jenis/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis_products'] })
      await success('Berhasil!', 'Jenis product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus jenis product')
    },
  })
}