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
// 1. MASTER DATA: JENIS (QueryKey: ['jenis'])
// ==========================================
export const useJenis = () => useQuery({
  queryKey: ['jenis'],
  queryFn: async () => {
    const response = await api.get('/jenis', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useCreateJenis = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: (data) => api.post('/jenis', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.refetchQueries({ queryKey: ['jenis'], type: 'all' })
      await success('Berhasil!', 'Jenis product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan jenis product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateJenis = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jenis/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.refetchQueries({ queryKey: ['jenis'], type: 'all' })
      await success('Berhasil!', 'Jenis product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui jenis product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteJenis = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: (id) => api.delete(`/jenis/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.refetchQueries({ queryKey: ['jenis'], type: 'all' })
      await success('Berhasil!', 'Jenis product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus jenis product')
    },
  })
}

// ==========================================
// 2. MASTER DATA: TYPE (QueryKey: ['types'])
// ==========================================
export const useTypes = () => useQuery({
  queryKey: ['types'],
  queryFn: async () => {
    const response = await api.get('/type', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useCreateType = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: (data) => api.post('/type', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await success('Berhasil!', 'Type product berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan type product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateType = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/type/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await success('Berhasil!', 'Type product berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui type product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteType = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()
  return useMutation({
    mutationFn: (id) => api.delete(`/type/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await success('Berhasil!', 'Type product berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus type product')
    },
  })
}

// ==========================================
// 3. MASTER DATA: BAHAN (QueryKey: ['bahans'])
// ==========================================
export const useBahans = () => useQuery({
  queryKey: ['bahans'],
  queryFn: async () => {
    const response = await api.get('/bahan', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

// ==========================================
// 4. PRODUCTS
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

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (formData) => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      
      // ✅ PAKSA REFETCH agar dropdown di background langsung update
      await queryClient.refetchQueries({ queryKey: ['jenis'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['bahans'], type: 'all' })
      
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
      await queryClient.invalidateQueries({ queryKey: ['jenis'] })
      await queryClient.invalidateQueries({ queryKey: ['types'] })
      await queryClient.invalidateQueries({ queryKey: ['bahans'] })
      
      await queryClient.refetchQueries({ queryKey: ['jenis'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['types'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['bahans'], type: 'all' })
      
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
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'all' })
      await success('Berhasil!', 'Product berhasil dihapus')
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || 'Gagal menghapus product. Pastikan product tidak sedang digunakan di transaksi.'
      info('Gagal', errorMsg)
    },
  })
}