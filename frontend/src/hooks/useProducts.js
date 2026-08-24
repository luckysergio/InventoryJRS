import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';
import { useJenisDropdown, useTypesDropdown, useBahansDropdown } from './useMasterData';

export { useJenisDropdown, useTypesDropdown, useBahansDropdown };

export const useProducts = (params = {}) => {
  const { search = '', jenisId = '', typeId = '', perPage = 15, page = 1 } = params;
  
  return useQuery({
    queryKey: masterKeys.product.list({ search, jenisId, typeId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/products', {
        params: {
          search: search || undefined,
          jenis_id: jenisId || undefined,
          type_id: typeId || undefined,
          per_page: perPage,
          page,
        },
      });
      return { products: response.data.data || [], meta: response.data.meta || {} };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

const invalidateProductCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.product.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.product.all,
    exact: false,
    refetchType: 'all',
  });
  await invalidateRelatedCaches(qc, 'product');
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData) =>
      api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async (response) => {
      const newProduct = response.data.data;

      queryClient.setQueriesData(
        { queryKey: masterKeys.product.lists() },
        (old) => {
          if (!old?.products) return old;
          return {
            ...old,
            products: [newProduct, ...old.products],
            meta: { ...old.meta, total: (old.meta.total || 0) + 1 },
          };
        }
      );

      queryClient.setQueryData(
        masterKeys.product.dropdown(),
        (old) => {
          if (!Array.isArray(old)) return old;
          return [
            { value: newProduct.id, label: newProduct.kode, ...newProduct },
            ...old,
          ];
        }
      );

      await invalidateProductCache(queryClient);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, formData }) =>
      api.post(`/products/${id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async (response, variables) => {
      const updatedProduct = response.data.data;

      queryClient.setQueryData(
        masterKeys.product.detail(variables.id),
        updatedProduct
      );

      queryClient.setQueriesData(
        { queryKey: masterKeys.product.lists() },
        (old) => {
          if (!old?.products) return old;
          return {
            ...old,
            products: old.products.map((p) =>
              p.id === variables.id ? updatedProduct : p
            ),
          };
        }
      );

      // ✅ Optimistic: update dropdown
      queryClient.setQueryData(
        masterKeys.product.dropdown(),
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((item) =>
            item.value === variables.id
              ? { ...item, label: updatedProduct.kode, ...updatedProduct }
              : item
          );
        }
      );

      // ✅ Full cross-invalidation
      await invalidateProductCache(queryClient);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.product.all, exact: false });

      const previousList = queryClient.getQueriesData({ queryKey: masterKeys.product.all });
      const previousDropdown = queryClient.getQueryData(masterKeys.product.dropdown());
      const previousDetail = queryClient.getQueryData(masterKeys.product.detail(id));

      queryClient.setQueriesData(
        { queryKey: masterKeys.product.lists() },
        (old) => {
          if (!old?.products) return old;
          return {
            ...old,
            products: old.products.filter((p) => p.id !== id),
            meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
          };
        }
      );

      queryClient.setQueryData(
        masterKeys.product.dropdown(),
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((item) => item.value !== id);
        }
      );

      queryClient.setQueryData(masterKeys.product.full(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((p) => p.id !== id);
      });

      queryClient.setQueryData(masterKeys.product.allFull(), (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((p) => p.id !== id);
      });

      queryClient.removeQueries({ queryKey: masterKeys.product.detail(id) });

      return { previousList, previousDropdown, previousDetail };
    },
    onError: (err, id, context) => {
      context?.previousList?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousDropdown) {
        queryClient.setQueryData(masterKeys.product.dropdown(), context.previousDropdown);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(masterKeys.product.detail(id), context.previousDetail);
      }
    },
    onSettled: async () => {
      await invalidateProductCache(queryClient);
    },
  });
};