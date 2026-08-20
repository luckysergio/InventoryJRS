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

/**
 * Robust data extractor untuk berbagai format response Laravel:
 * - { data: [...] }              → array langsung
 * - { data: { data: [...] } }    → nested (paginated)
 * - { status: true, data: [...] } → wrapped
 * - [...]                        → raw array
 */
const extractArray = (response) => {
  if (!response) return [];
  const raw = response.data ?? response;

  // Case 1: response.data.data (nested - common Laravel pattern)
  if (raw?.data && Array.isArray(raw.data)) {
    return raw.data;
  }

  // Case 2: response.data (array langsung)
  if (Array.isArray(raw)) {
    return raw;
  }

  // Case 3: response.data.data.data (paginated nested)
  if (raw?.data?.data && Array.isArray(raw.data.data)) {
    return raw.data.data;
  }

  return [];
};

/**
 * Extract single object dari response (untuk mutation result)
 */
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

/**
 * Extract dropdown data dan pastikan format { value, label }
 */
const extractDropdown = (response) => {
  const arr = extractArray(response);
  return arr.map((item) => {
    // Already { value, label } format
    if (item.value !== undefined && item.label !== undefined) {
      return item;
    }
    // Object with id & name/nama
    if (item.id !== undefined) {
      return {
        value: item.id,
        label: item.name || item.nama || item.label || String(item.id),
        ...item,
      };
    }
    // Primitive
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
    // Status transaksi return full object, bukan {value, label}
    return extractArray(res);
  },
  staleTime: 15 * 60 * 1000,
});

// Alias untuk backward compatibility
export const useStatusTransaksiList = useStatusTransaksiDropdown;

// ==========================================
// FULL DATA HOOKS (full object untuk form)
// ==========================================

/**
 * Fetch customers dengan full data (id, name, no_hp, email, dll)
 * Berbeda dengan useCustomersDropdown yang return {value, label}
 * Digunakan di TransaksiForm yang butuh akses field lengkap
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
 * Fetch products dengan full data (termasuk inventories untuk cek stok TOKO)
 * Digunakan di TransaksiForm untuk filter jenis/type & cek stok
 */
export const useProductsFull = () => useQuery({
  queryKey: masterKeys.product.full(),
  queryFn: async () => {
    const res = await api.get('/products/available', { params: { per_page: 5000 } });
    return extractArray(res);
  },
  staleTime: 5 * 60 * 1000,
});

// ==========================================
// HARGA HOOKS (untuk TransaksiForm)
// ==========================================

/**
 * Fetch daftar harga untuk product tertentu (umum + khusus customer)
 *
 * Digunakan di HargaSelector component untuk menampilkan:
 * - Harga Umum (customer_id = null)
 * - Harga Khusus Customer (customer_id sesuai dengan customer yang dipilih)
 *
 * @param {number|string} productId - ID produk (required)
 * @param {number|string|null} customerId - ID customer (opsional, untuk filter harga khusus)
 * @returns {Query} data: array of harga objects
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
 *
 * Digunakan saat user memilih "Buat Harga Khusus Customer Baru" di TransaksiForm.
 * Backend akan auto-create harga_products baru dari payload transaksi,
 * tapi hook ini bisa dipakai untuk create harga manual jika diperlukan.
 */
export const useCreateHarga = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/harga', data);
      return extractObject(res);
    },
    onSuccess: async () => {
      // Invalidate semua query harga
      await queryClient.cancelQueries({
        queryKey: masterKeys.harga.all,
        exact: false,
      });
      await queryClient.invalidateQueries({
        queryKey: masterKeys.harga.all,
        exact: false,
        refetchType: 'all',
      });
      // Cross-invalidation ke entity terkait
      await invalidateRelatedCaches(queryClient, 'harga');
    },
  });
};

// ==========================================
// CROSS-INVALIDATION HELPER
// ==========================================

/**
 * Invalidate cache dari entity yang berubah + entity terkait
 *
 * PRINSIP:
 * - Entity utama di-handle TERPISAH oleh caller (useInventory.js, useCustomers.js, dll)
 * - Cross-invalidation HANYA untuk entity LAIN yang terdampak
 * - Jangan pernah memasukkan entity itu sendiri ke dalam array cross-invalidation
 *
 * @param {QueryClient} queryClient - React Query client
 * @param {string} changedEntity - Nama entity yang berubah (key dari crossInvalidation)
 */
export const invalidateRelatedCaches = async (queryClient, changedEntity) => {
  const entityMap = {
    jenis: masterKeys.jenis.all,
    type: masterKeys.type.all,
    bahan: masterKeys.bahan.all,
    product: masterKeys.product.all,
    distributorProduct: masterKeys.distributorProduct.all,
    productCustomer: masterKeys.productCustomer.all,
    harga: masterKeys.harga.all,
    customer: masterKeys.customer.all,
    distributor: masterKeys.distributor.all,
    productMovement: masterKeys.productMovement.all,
    place: masterKeys.place.all,
    inventory: masterKeys.inventory.all,
    stokOpname: masterKeys.stokOpname.all,
    transaksi: masterKeys.transaksi.all,
    pembayaran: masterKeys.pembayaran.all,
    statusTransaksi: masterKeys.statusTransaksi.all,
  };

  // Cross-invalidation map: entity berubah → entity lain yang perlu di-refresh
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
    ],
    type: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
    ],
    bahan: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
    ],
    product: [
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.productMovement.all,
      masterKeys.inventory.all,
      masterKeys.transaksi.all,
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
    ],

    // ---------- MASTER ENTITIES ----------
    customer: [
      masterKeys.harga.all,
      masterKeys.productCustomer.all,
      masterKeys.transaksi.all,
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
    ],

    // ---------- PEMBAYARAN ----------
    pembayaran: [
      masterKeys.transaksi.all,
    ],
  };

  const relatedKeys = crossInvalidation[changedEntity] || [];

  // Deduplicate untuk menghindari invalidasi ganda
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