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

  // ✅ FIX: Tambahkan distributorProduct ke masterKeys
  distributorProduct: {
    all: ['distributor_products'],
    lists: () => [...masterKeys.distributorProduct.all, 'list'],
    list: (filters) => [...masterKeys.distributorProduct.lists(), filters],
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
    dropdown: () => [...masterKeys.customer.all, 'dropdown'],
  },
};

// ==========================================
// DROPDOWN HOOKS
// ==========================================

export const useJenisDropdown = () => {
  return useQuery({
    queryKey: masterKeys.jenis.dropdown(),
    queryFn: async () => {
      const response = await api.get('/jenis/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useTypesDropdown = (jenisId = null) => {
  return useQuery({
    queryKey: masterKeys.type.dropdown(jenisId || 'all'),
    queryFn: async () => {
      const response = await api.get('/type/dropdown', {
        params: { jenis_id: jenisId || undefined },
      });
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useBahansDropdown = () => {
  return useQuery({
    queryKey: masterKeys.bahan.dropdown(),
    queryFn: async () => {
      const response = await api.get('/bahan/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useProductsDropdown = () => {
  return useQuery({
    queryKey: masterKeys.product.dropdown(),
    queryFn: async () => {
      const response = await api.get('/products/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useCustomersDropdown = () => {
  return useQuery({
    queryKey: masterKeys.customer.dropdown(),
    queryFn: async () => {
      const response = await api.get('/customers/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useDistributorsDropdown = () => {
  return useQuery({
    queryKey: masterKeys.distributor.dropdown(),
    queryFn: async () => {
      const response = await api.get('/distributors/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

// ==========================================
// CROSS-INVALIDATION HELPER
// ==========================================

export const invalidateRelatedCaches = async (queryClient, changedEntity) => {
  const entityMap = {
    jenis: masterKeys.jenis.all,
    type: masterKeys.type.all,
    bahan: masterKeys.bahan.all,
    product: masterKeys.product.all,
    // ✅ FIX: Tambahkan distributorProduct ke entityMap
    distributorProduct: masterKeys.distributorProduct.all,
    harga: masterKeys.harga.all,
    customer: masterKeys.customer.all,
    distributor: masterKeys.distributor.all,
  };

  const keysToInvalidate = [entityMap[changedEntity]];

  // ✅ FIX: Cross-invalidation dua arah product ↔ distributorProduct
  const crossInvalidation = {
    jenis: [masterKeys.type.all, masterKeys.product.all, masterKeys.distributorProduct.all],
    type: [masterKeys.product.all, masterKeys.distributorProduct.all],
    bahan: [masterKeys.product.all, masterKeys.distributorProduct.all],
    product: [masterKeys.harga.all, masterKeys.distributorProduct.all],
    // ✅ FIX: distributorProduct berubah → product & harga ikut ter-invalidate
    distributorProduct: [masterKeys.product.all, masterKeys.harga.all],
    customer: [masterKeys.harga.all],
    distributor: [masterKeys.product.all, masterKeys.distributorProduct.all],
  };

  if (crossInvalidation[changedEntity]) {
    keysToInvalidate.push(...crossInvalidation[changedEntity]);
  }

  for (const key of keysToInvalidate) {
    await queryClient.cancelQueries({ queryKey: key, exact: false });
    queryClient.removeQueries({ queryKey: key, exact: false });
    await queryClient.invalidateQueries({
      queryKey: key,
      exact: false,
      refetchType: 'all',
    });
  }
};