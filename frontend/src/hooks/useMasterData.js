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
    available: () => [...masterKeys.product.all, 'available'],
    lowStock: () => [...masterKeys.product.all, 'low_stock'],
    bestSeller: (params) => [...masterKeys.product.all, 'best_seller', params],
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
    byProduct: (productId) => [...masterKeys.harga.all, 'by_product', productId],
  },
  customer: {
    all: ['customers'],
    lists: () => [...masterKeys.customer.all, 'list'],
    list: (filters) => [...masterKeys.customer.lists(), filters],
    dropdown: () => [...masterKeys.customer.all, 'dropdown'],
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
  // ✅ Inventory master keys (LENGKAP)
  inventory: {
    all: ['inventory'],
    lists: () => [...masterKeys.inventory.all, 'list'],
    list: (filters) => [...masterKeys.inventory.lists(), filters],
  },
};

// ==========================================
// DROPDOWN HOOKS
// ==========================================
export const useJenisDropdown = () => useQuery({
  queryKey: masterKeys.jenis.dropdown(),
  queryFn: async () => (await api.get('/jenis/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const useTypesDropdown = (jenisId = null) => useQuery({
  queryKey: masterKeys.type.dropdown(jenisId || 'all'),
  queryFn: async () => (await api.get('/type/dropdown', { params: { jenis_id: jenisId || undefined } })).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const useBahansDropdown = () => useQuery({
  queryKey: masterKeys.bahan.dropdown(),
  queryFn: async () => (await api.get('/bahan/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const useProductsDropdown = () => useQuery({
  queryKey: masterKeys.product.dropdown(),
  queryFn: async () => (await api.get('/products/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const useCustomersDropdown = () => useQuery({
  queryKey: masterKeys.customer.dropdown(),
  queryFn: async () => (await api.get('/customers/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const useDistributorsDropdown = () => useQuery({
  queryKey: masterKeys.distributor.dropdown(),
  queryFn: async () => (await api.get('/distributors/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

export const usePlacesDropdown = () => useQuery({
  queryKey: masterKeys.place.dropdown(),
  queryFn: async () => (await api.get('/places/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

// ==========================================
// CROSS-INVALIDATION HELPER
// ✅ PRINSIP: Cross-invalidation HANYA untuk entity LAIN
// Entity utama di-handle TERPISAH oleh caller (useInventory.js, useCustomers.js, dll)
// Jangan pernah memasukkan entity itu sendiri ke dalam array cross-invalidation
// ==========================================
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
  };

  // ✅ Cross-invalidation: HANYA entity LAIN yang terdampak
  // Entity utama TIDAK dimasukkan di sini (di-handle terpisah oleh caller)
  const crossInvalidation = {
    jenis: [
      masterKeys.type.all,
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
    ],
    type: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
    ],
    bahan: [
      masterKeys.product.all,
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.inventory.all,
    ],
    product: [
      masterKeys.distributorProduct.all,
      masterKeys.productCustomer.all,
      masterKeys.harga.all,
      masterKeys.productMovement.all,
      masterKeys.inventory.all,
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
    ],
    customer: [
      masterKeys.harga.all,
      masterKeys.productCustomer.all,
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
    // ✅ Inventory cross-invalidate HANYA entity lain
    // Inventory sendiri di-handle oleh invalidateInventoryCache() di useInventory.js
    inventory: [
      masterKeys.product.all,
      masterKeys.productMovement.all,
    ],
  };

  const relatedKeys = crossInvalidation[changedEntity] || [];

  // Deduplicate
  const uniqueKeys = [...new Set(relatedKeys.map((k) => JSON.stringify(k)))].map((k) => JSON.parse(k));

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