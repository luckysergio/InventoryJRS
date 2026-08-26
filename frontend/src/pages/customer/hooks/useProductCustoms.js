import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/axios';
import useCustomerStore from '../store/customerStore';
import { normalizeListResponse } from './usePublicProducts';

export const useProductCustoms = (params = {}, options = {}) => {
  const setCustomProducts = useCustomerStore((s) => s.setCustomProducts);

  return useQuery({
    queryKey: ['product-customs', params],
    queryFn: async () => {
      const { data } = await api.get('/public/product-customs', {
        params: {
          search: params.search || undefined,
          customer_id: params.customerId || undefined,
          jenis_id: params.jenisId || undefined,
          type_id: params.typeId || undefined,
          per_page: params.perPage || 12,
          page: params.page || 1,
        },
      });

      if (data?.status && Array.isArray(data?.data) && typeof setCustomProducts === 'function') {
        setCustomProducts(data.data);
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

export const useAllProductCustoms = (params = {}, options = {}) => {
  const query = useProductCustoms(
    {
      search: params.search,
      customerId: params.customerId,
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

export const useCustomerProducts = (customerId, params = {}, options = {}) => {
  return useQuery({
    queryKey: ['customer-products', customerId, params],
    queryFn: async () => {
      const { data } = await api.get(`/public/customers/${customerId}/products`, {
        params: {
          search: params.search || undefined,
          jenis_id: params.jenisId || undefined,
          type_id: params.typeId || undefined,
          per_page: params.perPage || 12,
          page: params.page || 1,
        },
      });
      return data;
    },
    enabled: !!customerId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useProductCustomDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ['product-custom-detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/public/product-customs/${id}`);
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

export { normalizeListResponse };