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

  distributor: {
    all: ['distributors'],
    dropdown: () => [...masterKeys.distributor.all, 'dropdown'],
  },
};

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

export const invalidateRelatedCaches = async (queryClient, changedEntity) => {
  const entityMap = {
    jenis: masterKeys.jenis.all,
    type: masterKeys.type.all,
    bahan: masterKeys.bahan.all,
    product: masterKeys.product.all,
    harga: masterKeys.harga.all,
    customer: masterKeys.customer.all,
    distributor: masterKeys.distributor.all,
  };

  const keysToInvalidate = [entityMap[changedEntity]];

  const crossInvalidation = {
    jenis: [masterKeys.type.all, masterKeys.product.all],     // Jenis berubah → Type & Product terpengaruh
    type: [masterKeys.product.all],                           // Type berubah → Product terpengaruh
    bahan: [masterKeys.product.all],                          // Bahan berubah → Product terpengaruh
    product: [masterKeys.harga.all],                          // Product berubah → Harga terpengaruh
    customer: [masterKeys.harga.all],                         // Customer berubah → Harga terpengaruh
  };

  if (crossInvalidation[changedEntity]) {
    keysToInvalidate.push(...crossInvalidation[changedEntity]);
  }

  for (const key of keysToInvalidate) {
    await queryClient.cancelQueries({ queryKey: key, exact: false });
    queryClient.removeQueries({ queryKey: key, exact: false });
    await queryClient.invalidateQueries({ queryKey: key, exact: false, refetchType: 'all' });
  }
};