import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/axios';
import useCustomerStore from '../store/customerStore';

export const normalizeListResponse = (response, fallbackPerPage = 12) => {
  const list = Array.isArray(response?.data) ? response.data : [];
  const meta = response?.meta || {};

  return {
    data: list,
    total: meta.total ?? list.length,
    currentPage: meta.current_page ?? 1,
    lastPage: meta.last_page ?? 1,
    perPage: meta.per_page ?? fallbackPerPage,
    from: meta.from ?? null,
    to: meta.to ?? null,
  };
};

export const usePublicProducts = (params = {}, options = {}) => {
  const setPublicProducts = useCustomerStore((s) => s.setPublicProducts);

  return useQuery({
    queryKey: ['public-products', params],
    queryFn: async () => {
      const { data } = await api.get('/public/products', {
        params: {
          search: params.search || undefined,
          jenis_id: params.jenisId || undefined,
          type_id: params.typeId || undefined,
          per_page: params.perPage || 12,
          page: params.page || 1,
        },
      });

      if (data?.status && Array.isArray(data?.data) && typeof setPublicProducts === 'function') {
        setPublicProducts(data.data);
      }

      return data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAllProducts = (params = {}, options = {}) => {
  const query = usePublicProducts(
    {
      search: params.search,
      jenisId: params.jenisId,
      typeId: params.typeId,
      perPage: params.pageSize || params.perPage || 12,
      page: params.page || 1,
    },
    options
  );

  const data = useMemo(() => normalizeListResponse(query.data), [query.data]);

  return { ...query, data };
};

export const useBestSellerProducts = (limit = 6, options = {}) => {
  return useQuery({
    queryKey: ['best-seller-products', limit],
    queryFn: async () => {
      const { data } = await api.get('/public/products/best-seller', {
        params: { limit },
      });
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useAvailableProducts = (options = {}) => {
  return useQuery({
    queryKey: ['available-products'],
    queryFn: async () => {
      const { data } = await api.get('/public/products/available');
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useProductDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/public/products/${id}`);
      return data?.data ?? null;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useJenisProducts = (options = {}) => {
  return useQuery({
    queryKey: ['public-jenis-products'],
    queryFn: async () => {
      const { data } = await api.get('/public/jenis-products');
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useTypeProducts = (jenisId = null, options = {}) => {
  return useQuery({
    queryKey: ['public-type-products', jenisId ?? 'all'],
    queryFn: async () => {
      const { data } = await api.get('/public/type-products', {
        params: jenisId ? { jenis_id: jenisId } : {},
      });
      return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};