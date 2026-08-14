import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'

export const useJabatans = () => {
  return useQuery({
    queryKey: ['jabatans'],
    queryFn: async () => {
      const response = await api.get('/jabatans')
      return response.data.data || []
    },
  })
}

export const useCreateJabatan = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/jabatans', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jabatans'] })
      await success('Berhasil!', 'Jabatan berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = error.response?.data?.errors?.nama?.[0] || 'Gagal menambahkan jabatan'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateJabatan = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jabatans/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jabatans'] })
      await success('Berhasil!', 'Jabatan berhasil diperbarui')
    },
    onError: (error) => {
      const msg = error.response?.data?.errors?.nama?.[0] || 'Gagal memperbarui jabatan'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteJabatan = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/jabatans/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jabatans'] })
      await success('Berhasil!', 'Jabatan berhasil dihapus')
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Gagal menghapus jabatan'
      info(error.response?.status === 422 ? 'Tidak Dapat Dihapus' : 'Gagal', msg)
    },
  })
}