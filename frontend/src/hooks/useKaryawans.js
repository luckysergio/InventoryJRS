import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api/axios'
import { useConfirmDialog } from './useConfirmDialog'
import { useJabatans } from './useJabatans' // Re-use hook jabatan yang sudah optimal

export const useKaryawans = (search = '', jabatanId = null, page = 1, perPage = 10) => {
  return useQuery({
    queryKey: ['karyawans', search, jabatanId, page, perPage],
    queryFn: async () => {
      const response = await api.get('/karyawans', {
        params: { search, jabatan_id: jabatanId, page, per_page: perPage }
      })
      return response.data
    },
  })
}

// Kita export juga useJabatans agar bisa dipakai di Form
export { useJabatans }

export const useCreateKaryawan = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/karyawans', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['karyawans'] })
      await success('Berhasil!', 'Karyawan berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan karyawan'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateKaryawan = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/karyawans/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['karyawans'] })
      await success('Berhasil!', 'Karyawan berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui karyawan'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteKaryawan = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/karyawans/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['karyawans'] })
      await success('Berhasil!', 'Karyawan berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus karyawan')
    },
  })
}