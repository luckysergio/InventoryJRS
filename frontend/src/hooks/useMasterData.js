import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

// ==========================================
// MASTER KEYS - Query Key Factories
// ==========================================
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
    // ✅ NEW: Semua produk tanpa filter stok (untuk Pesanan)
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
    byProduct: (productId, customerId = 'all') => [
      ...masterKeys.harga.all, 'by_product', productId, customerId,
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

// ==========================================
// HELPER: Extract data dari berbagai format response
// ==========================================

const extractArray = (response) => {
  if (!response) return [];
  const raw = response.data ?? response;

  if (raw?.data && Array.isArray(raw.data)) {
    return raw.data;
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw?.data?.data && Array.isArray(raw.data.data)) {
    return raw.data.data;
  }

  return [];
};

const extractObject = (response) => {
  if (!response) return null;
  const raw = response.data ?? response;
  if (raw?.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    return raw.data;
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw;
  }
  return null;
};

const extractDropdown = (response) => {
  const arr = extractArray(response);
  return arr.map((item) => {
    if (item.value !== undefined && item.label !== undefined) {
      return item;
    }
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

// ==========================================
// DROPDOWN HOOKS (format { value, label })
// ==========================================

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

// ==========================================
// FULL DATA HOOKS
// ==========================================

/**
 * Fetch customers dengan full data (untuk form)
 */
export const useCustomersFull = () => useQuery({
  queryKey: masterKeys.customer.full(),
  queryFn: async () => {
    const res = await api.get('/customers', { params: { per_page: 1000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
});

/**
 * Fetch products AVAILABLE (stok > 0) untuk TransaksiForm.
 * Digunakan saat transaksi memotong stok TOKO.
 */
export const useProductsFull = () => useQuery({
  queryKey: masterKeys.product.full(),
  queryFn: async () => {
    const res = await api.get('/products/available', { params: { per_page: 5000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
});

/**
 * ✅ NEW: Fetch SEMUA products tanpa filter stok.
 * Digunakan di PesananForm karena pesanan TIDAK memotong stok,
 * jadi semua produk (termasuk stok 0) harus bisa dipilih.
 */
export const useProductsAll = () => useQuery({
  queryKey: masterKeys.product.allFull(),
  queryFn: async () => {
    const res = await api.get('/products', { params: { per_page: 5000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
});

// ==========================================
// HARGA HOOKS
// ==========================================

/**
 * Fetch daftar harga untuk product tertentu (umum + khusus customer)
 */
export const useHargaByProduct = (productId, customerId = null) => useQuery({
  queryKey: masterKeys.harga.byProduct(productId, customerId || 'all'),
  queryFn: async () => {
    const params = customerId ? { customer_id: customerId } : {};
    const res = await api.get(`/harga/by-product/${productId}`, { params });
    return extractArray(res);
  },
  enabled: !!productId,
  staleTime: 5 * 60 * 1000,
});

/**
 * Mutation untuk create harga baru
 */
export const useCreateHarga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/harga', data);
      return extractObject(res);
    },
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: masterKeys.harga.all, exact: false });
      await queryClient.invalidateQueries({
        queryKey: masterKeys.harga.all,
        exact: false,
        refetchType: 'all',
      });
      await invalidateRelatedCaches(queryClient, 'harga');
    },
  });
};

// ==========================================
// CROSS-INVALIDATION HELPER
// ==========================================

export const invalidateRelatedCaches = async (queryClient, changedEntity) => {
  const crossInvalidation = {
    // ---------- MASTER DATA ----------
    jenis: [
      masterKeys.type.all,
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],
    type: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],
    bahan: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],
    product: [
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.productMovement.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],
    distributorProduct: [
      masterKeys.product.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
    ],
    productCustomer: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.harga.all,
      masterKeys.customer.all,
      masterKeys.inventory.all,
    ],
    harga: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],

    // ---------- MASTER ENTITIES ----------
    customer: [
      masterKeys.harga.all,
      masterKeys.productCustomer.all,
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
      masterKeys.pembayaran.all,
    ],
    distributor: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.distributor.all,
      masterKeys.inventory.all,
    ],
    productMovement: [
      masterKeys.product.all,
      masterKeys.place.all,
      masterKeys.inventory.all,
    ],
    place: [
      masterKeys.productMovement.all,
      masterKeys.inventory.all,
    ],
    inventory: [
      masterKeys.product.all,
      masterKeys.productMovement.all,
    ],

    // ---------- STOK OPNAME ----------
    stokOpname: [
      masterKeys.inventory.all,
      masterKeys.productMovement.all,
    ],

    // ---------- TRANSAKSI ----------
    transaksi: [
      masterKeys.inventory.all,
      masterKeys.productMovement.all,
      masterKeys.pembayaran.all,
      masterKeys.customer.all,
      masterKeys.harga.all,
      masterKeys.pesanan.all,
    ],

    // ---------- PESANAN ----------
    pesanan: [
      masterKeys.transaksi.all,
      masterKeys.pembayaran.all,
      masterKeys.customer.all,
      masterKeys.harga.all,
      masterKeys.product.all,
      masterKeys.inventory.all,
    ],

    // ---------- PEMBAYARAN ----------
    pembayaran: [
      masterKeys.transaksi.all,
      masterKeys.pesanan.all,
    ],
  };

  const relatedKeys = crossInvalidation[changedEntity] || [];

  // Deduplicate
  const uniqueKeys = [
    ...new Set(relatedKeys.map((k) => JSON.stringify(k))),
  ].map((k) => JSON.parse(k));

  for (const key of uniqueKeys) {
    await queryClient.cancelQueries({ queryKey: key, exact: false });
    queryClient.removeQueries({ queryKey: key, exact: false });
    await queryClient.invalidateQueries({
      queryKey: key,
      exact: false,
      refetchType: 'all',
    });
  }
};