import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const masterKeys = {
  jenis: {
    all: ['jenis_products'],
    lists: () => [...masterKeys.jenis.all, 'list'],
    list: (filters) => [...masterKeys.jenis.lists(), filters],
    detail: (id) => [...masterKeys.jenis.all, 'detail', id],
    dropdown: () => [...masterKeys.jenis.all, 'dropdown'],
    statistics: () => [...masterKeys.jenis.all, 'statistics'],
  },
  type: {
    all: ['type_products'],
    lists: () => [...masterKeys.type.all, 'list'],
    list: (filters) => [...masterKeys.type.lists(), filters],
    detail: (id) => [...masterKeys.type.all, 'detail', id],
    dropdown: (jenisId = 'all') => [...masterKeys.type.all, 'dropdown', jenisId],
    byJenis: (jenisId) => [...masterKeys.type.all, 'by_jenis', jenisId],
    statistics: () => [...masterKeys.type.all, 'statistics'],
  },
  bahan: {
    all: ['bahan_products'],
    lists: () => [...masterKeys.bahan.all, 'list'],
    list: (filters) => [...masterKeys.bahan.lists(), filters],
    detail: (id) => [...masterKeys.bahan.all, 'detail', id],
    dropdown: () => [...masterKeys.bahan.all, 'dropdown'],
    statistics: () => [...masterKeys.bahan.all, 'statistics'],
  },
  distributor: {
    all: ['distributors'],
    lists: () => [...masterKeys.distributor.all, 'list'],
    list: (filters) => [...masterKeys.distributor.lists(), filters],
    detail: (id) => [...masterKeys.distributor.all, 'detail', id],
    dropdown: () => [...masterKeys.distributor.all, 'dropdown'],
  },
  product: {
    all: ['products'],
    lists: () => [...masterKeys.product.all, 'list'],
    list: (filters) => [...masterKeys.product.lists(), filters],
    detail: (id) => [...masterKeys.product.all, 'detail', id],
    dropdown: () => [...masterKeys.product.all, 'dropdown'],
    available: (filters = {}) => [...masterKeys.product.all, 'available', filters],
    lowStock: () => [...masterKeys.product.all, 'low_stock'],
    bestSeller: (params) => [...masterKeys.product.all, 'best_seller', params],
    full: () => [...masterKeys.product.all, 'full'],
    allFull: () => [...masterKeys.product.all, 'all_full'],
  },
  distributorProduct: {
    all: ['distributor_products'],
    lists: () => [...masterKeys.distributorProduct.all, 'list'],
    list: (filters) => [...masterKeys.distributorProduct.lists(), filters],
  },
  productCustomer: {
    all: ['product_customers'],
    lists: () => [...masterKeys.productCustomer.all, 'list'],
    list: (filters) => [...masterKeys.productCustomer.lists(), filters],
  },
  harga: {
    all: ['harga_products'],
    lists: () => [...masterKeys.harga.all, 'list'],
    list: (filters) => [...masterKeys.harga.lists(), filters],
    detail: (id) => [...masterKeys.harga.all, 'detail', id],
    byProductBase: () => [...masterKeys.harga.all, 'by_product'],
    byProduct: (productId, customerId = null) => [
      ...masterKeys.harga.all, 'by_product', productId, customerId ?? 'all',
    ],
  },
  customer: {
    all: ['customers'],
    lists: () => [...masterKeys.customer.all, 'list'],
    list: (filters) => [...masterKeys.customer.lists(), filters],
    dropdown: () => [...masterKeys.customer.all, 'dropdown'],
    full: () => [...masterKeys.customer.all, 'full'],
  },
  productMovement: {
    all: ['product_movements'],
    lists: () => [...masterKeys.productMovement.all, 'list'],
    list: (filters) => [...masterKeys.productMovement.lists(), filters],
  },
  place: {
    all: ['places'],
    lists: () => [...masterKeys.place.all, 'list'],
    list: (filters) => [...masterKeys.place.lists(), filters],
    dropdown: () => [...masterKeys.place.all, 'dropdown'],
  },
  inventory: {
    all: ['inventory'],
    lists: () => [...masterKeys.inventory.all, 'list'],
    list: (filters) => [...masterKeys.inventory.lists(), filters],
  },
stokOpname: {
  all: ['stok_opname'],
  lists: () => [...masterKeys.stokOpname.all, 'list'],
  list: (filters) => [...masterKeys.stokOpname.lists(), filters],
  detail: (id) => [...masterKeys.stokOpname.all, 'detail', id],
  availableInventories: (places) => [...masterKeys.stokOpname.all, 'available', places?.sort().join(',') || 'all'],
},
  transaksi: {
    all: ['transaksi'],
    lists: () => [...masterKeys.transaksi.all, 'list'],
    list: (filters) => [...masterKeys.transaksi.lists(), filters],
    detail: (id) => [...masterKeys.transaksi.all, 'detail', id],
  },
  pesanan: {
    all: ['pesanan'],
    lists: () => [...masterKeys.pesanan.all, 'list'],
    list: (filters) => [...masterKeys.pesanan.lists(), filters],
    detail: (id) => [...masterKeys.pesanan.all, 'detail', id],
  },
  pembayaran: {
    all: ['pembayaran'],
    lists: () => [...masterKeys.pembayaran.all, 'list'],
    list: (filters) => [...masterKeys.pembayaran.lists(), filters],
    detail: (id) => [...masterKeys.pembayaran.all, 'detail', id],
  },
  statusTransaksi: {
    all: ['status_transaksi'],
    lists: () => [...masterKeys.statusTransaksi.all, 'list'],
    dropdown: () => [...masterKeys.statusTransaksi.all, 'dropdown'],
  },
};

const extractArray = (response) => {
  if (!response) return [];
  const raw = response.data ?? response;

  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;

  return [];
};

const extractObject = (response) => {
  if (!response) return null;
  const raw = response.data ?? response;
  if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  return null;
};

const extractDropdown = (response) => {
  const arr = extractArray(response);
  return arr.map((item) => {
    if (item.value !== undefined && item.label !== undefined) return item;
    if (item.id !== undefined) {
      return {
        value: item.id,
        label: item.name || item.nama || item.label || String(item.id),
        ...item,
      };
    }
    return { value: item, label: String(item) };
  });
};

const forceFreshCache = async (queryClient, queryKey) => {
  await queryClient.cancelQueries({ queryKey, exact: false });
  
  queryClient.removeQueries({ queryKey, exact: false });
  
  await queryClient.invalidateQueries({
    queryKey,
    exact: false,
    refetchType: 'active',
  });
};

export const useJenisDropdown = () => useQuery({
  queryKey: masterKeys.jenis.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/jenis/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const useTypesDropdown = (jenisId = null) => useQuery({
  queryKey: masterKeys.type.dropdown(jenisId || 'all'),
  queryFn: async () => extractDropdown(
    await api.get('/type/dropdown', { params: { jenis_id: jenisId || undefined } })
  ),
  staleTime: 15 * 60 * 1000,
});

export const useBahansDropdown = () => useQuery({
  queryKey: masterKeys.bahan.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/bahan/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const useProductsDropdown = () => useQuery({
  queryKey: masterKeys.product.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/products/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const useCustomersDropdown = () => useQuery({
  queryKey: masterKeys.customer.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/customers/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const useDistributorsDropdown = () => useQuery({
  queryKey: masterKeys.distributor.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/distributors/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const usePlacesDropdown = () => useQuery({
  queryKey: masterKeys.place.dropdown(),
  queryFn: async () => extractDropdown(await api.get('/places/dropdown')),
  staleTime: 15 * 60 * 1000,
});

export const useStatusTransaksiDropdown = () => useQuery({
  queryKey: masterKeys.statusTransaksi.dropdown(),
  queryFn: async () => {
    const res = await api.get('/status-transaksi');
    return extractArray(res);
  },
  staleTime: 15 * 60 * 1000,
});

export const useStatusTransaksiList = useStatusTransaksiDropdown;

export const useCustomersFull = () => useQuery({
  queryKey: masterKeys.customer.full(),
  queryFn: async () => {
    const res = await api.get('/customers', { params: { per_page: 1000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useProductsFull = () => useQuery({
  queryKey: masterKeys.product.full(),
  queryFn: async () => {
    const res = await api.get('/products/available', { params: { per_page: 5000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useProductsAll = () => useQuery({
  queryKey: masterKeys.product.allFull(),
  queryFn: async () => {
    const res = await api.get('/products', { params: { per_page: 5000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});

export const useHargaByProduct = (productId, customerId = null) => useQuery({
  queryKey: masterKeys.harga.byProduct(productId, customerId),
  queryFn: async () => {
    const params = customerId ? { customer_id: customerId } : {};
    const res = await api.get(`/harga/by-product/${productId}`, { params });
    return extractArray(res);
  },
  enabled: !!productId,
  staleTime: 15 * 1000,
  gcTime: 60 * 1000,
  refetchOnMount: 'always',
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});

export const useCreateHarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/harga', data);
      return extractObject(res);
    },
    onSuccess: async (newHarga, variables) => {
      await forceFreshCache(queryClient, masterKeys.harga.all);
      
      if (variables?.product_id) {
        await forceFreshCache(
          queryClient, 
          [...masterKeys.harga.byProductBase(), variables.product_id]
        );
      }
      
      await forceFreshCache(queryClient, masterKeys.product.all);
      
      console.log('[useCreateHarga] Cache FORCE FRESH for product:', variables?.product_id);
    },
  });
};

export const useUpdateHarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/harga/${id}`, data);
      return extractObject(res);
    },
    onSuccess: async () => {
      await forceFreshCache(queryClient, masterKeys.harga.all);
      await forceFreshCache(queryClient, masterKeys.product.all);
      console.log('[useUpdateHarga] Cache FORCE FRESH');
    },
  });
};

export const useDeleteHarga = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/harga/${id}`);
      return extractObject(res);
    },
    onSuccess: async () => {
      await forceFreshCache(queryClient, masterKeys.harga.all);
      await forceFreshCache(queryClient, masterKeys.product.all);
      console.log('[useDeleteHarga] Cache FORCE FRESH');
    },
  });
};

export const useInvalidateHarga = () => {
  const queryClient = useQueryClient();
  
  return useCallback(async (productId = null) => {
    if (productId) {
      await forceFreshCache(
        queryClient, 
        [...masterKeys.harga.byProductBase(), productId]
      );
    } else {
      await forceFreshCache(queryClient, masterKeys.harga.all);
    }
    console.log('[useInvalidateHarga] Manual fresh cache', { productId });
  }, [queryClient]);
};

export const invalidateRelatedCaches = async (queryClient, changedEntity) => {
  const crossInvalidation = {
    jenis: [masterKeys.type.all, masterKeys.product.all, masterKeys.harga.all, masterKeys.transaksi.all, masterKeys.pesanan.all],
    type: [masterKeys.product.all, masterKeys.harga.all, masterKeys.transaksi.all, masterKeys.pesanan.all],
    bahan: [masterKeys.product.all, masterKeys.harga.all, masterKeys.transaksi.all, masterKeys.pesanan.all],
    product: [masterKeys.harga.all, masterKeys.inventory.all, masterKeys.transaksi.all, masterKeys.pesanan.all],
    harga: [masterKeys.product.all, masterKeys.transaksi.all, masterKeys.pesanan.all],
    customer: [masterKeys.harga.all, masterKeys.transaksi.all, masterKeys.pesanan.all, masterKeys.pembayaran.all],
    transaksi: [masterKeys.inventory.all, masterKeys.pembayaran.all, masterKeys.customer.all],
    pesanan: [masterKeys.transaksi.all, masterKeys.pembayaran.all, masterKeys.product.all],
    pembayaran: [masterKeys.transaksi.all, masterKeys.pesanan.all],
  };

  const relatedKeys = crossInvalidation[changedEntity] || [];

  for (const key of relatedKeys) {
    await forceFreshCache(queryClient, key);
  }
};