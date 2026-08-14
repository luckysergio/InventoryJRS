import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useTypeProducts = (search = '', jenisId = null) => {
  return useQuery({
    queryKey: ['type_products', search, jenisId],
    queryFn: async () => {
      const response = await api.get('/type', {
        params: { search, jenis_id: jenisId }
      })
      return response.data.data || []
    },
  })
}

export const useJenisProducts = () => {
  return useQuery({
    queryKey: ['jenis_products'],
    queryFn: async () => {
      const response = await api.get('/jenis')
      return response.data.data || []
    },
  })
}

export const useCreateTypeProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/type', data),
    onSuccess: async () => {
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
      await queryClient.invalidateQueries({ queryKey: ['type_products'] })
      await success('Berhasil!', 'Type product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus type product')
    },
  })
}