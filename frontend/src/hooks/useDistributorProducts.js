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
// 1. DROPDOWN DATA (Master Data)
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

export const useTypes = () => useQuery({
  queryKey: ['types'],
  queryFn: async () => {
    const response = await api.get('/type', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useBahans = () => useQuery({
  queryKey: ['bahans'],
  queryFn: async () => {
    const response = await api.get('/bahan', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

export const useDistributors = () => useQuery({
  queryKey: ['distributors_dropdown'],
  queryFn: async () => {
    const response = await api.get('/distributors', { params: { per_page: 1000 } })
    return extractArray(response)
  },
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
})

// ==========================================
// 2. DISTRIBUTOR PRODUCT LIST
// ==========================================
export const useDistributorProducts = (search = '', jenisId = null, typeId = null, page = 1, perPage = 15) => {
  return useQuery({
    queryKey: ['distributor_products', search, jenisId, typeId, page, perPage],
    queryFn: async () => {
      const response = await api.get('/product-distributors', {
        params: { search, jenis_id: jenisId, type_id: typeId, page, per_page: perPage }
      })
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })
}

// ==========================================
// 3. MUTATIONS (✅ FIXED: Cross-Invalidation)
// ==========================================
const invalidateAllRelated = async (queryClient) => {
  await queryClient.invalidateQueries({ queryKey: ['distributor_products'] })
  
  // ✅ PENTING: Invalidate juga cache halaman Product utama agar data baru langsung muncul
  await queryClient.invalidateQueries({ queryKey: ['products'] })
  
  await queryClient.invalidateQueries({ queryKey: ['distributors_dropdown'] })
  await queryClient.invalidateQueries({ queryKey: ['distributors'] })
  await queryClient.invalidateQueries({ queryKey: ['jenis'] })
  await queryClient.invalidateQueries({ queryKey: ['types'] })
  await queryClient.invalidateQueries({ queryKey: ['bahans'] })
  
  // ✅ Paksa refetch segera (type: 'all')
  await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'all' })
  await queryClient.refetchQueries({ queryKey: ['products'], type: 'all' }) // ✅ Refetch halaman Product
  await queryClient.refetchQueries({ queryKey: ['distributors_dropdown'], type: 'all' })
}

export const useCreateDistributorProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (formData) => api.post('/product-distributors', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await invalidateAllRelated(queryClient)
      await success('Berhasil!', 'Product distributor berhasil ditambahkan')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useUpdateDistributorProduct = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: ({ id, formData }) => api.post(`/product-distributors/${id}?_method=PUT`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async () => {
      await invalidateAllRelated(queryClient)
      await success('Berhasil!', 'Product distributor berhasil diperbarui')
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal memperbarui product'
      info('Validasi Gagal', msg)
    },
  })
}

export const useDeleteDistributorProduct = () => {
  const queryClient = useQueryClient()
  const { danger, success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (id) => api.delete(`/product-distributors/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['distributor_products'] })
      await queryClient.invalidateQueries({ queryKey: ['products'] }) // ✅ Sync dengan halaman Product
      
      await queryClient.refetchQueries({ queryKey: ['distributor_products'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['products'], type: 'all' }) // ✅ Sync dengan halaman Product
      
      await success('Berhasil!', 'Product distributor berhasil dihapus')
    },
    onError: (error) => {
      info('Gagal', error.response?.data?.message || 'Gagal menghapus product')
    },
  })
}

export const useCreateDistributor = () => {
  const queryClient = useQueryClient()
  const { success, info } = useConfirmDialog()

  return useMutation({
    mutationFn: (data) => api.post('/distributors', data),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['distributors_dropdown'] })
      await queryClient.invalidateQueries({ queryKey: ['distributors'] })
      
      await queryClient.refetchQueries({ queryKey: ['distributors_dropdown'], type: 'all' })
      await queryClient.refetchQueries({ queryKey: ['distributors'], type: 'all' })
      
      await success('Berhasil!', 'Distributor baru berhasil ditambahkan')
      return response.data.data || response.data.distributor
    },
    onError: (error) => {
      const msg = Object.values(error.response?.data?.errors || {}).flat().join('<br>') || 'Gagal menambahkan distributor'
      info('Validasi Gagal', msg)
      throw error
    },
  })
}