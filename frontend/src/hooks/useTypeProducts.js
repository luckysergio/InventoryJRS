import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

// ==========================================
// READ HOOKS
// ==========================================

export const useTypeProducts = (params = {}) => {
  const { search = '', jenisId = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.type.list({ search, jenisId, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/type', {
        params: {
          search: search || undefined,
          jenis_id: jenisId || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        typeProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useTypeProductsByJenis = (jenisId) => {
  return useQuery({
    queryKey: masterKeys.type.byJenis(jenisId),
    queryFn: async () => {
      const response = await api.get(`/type/by-jenis/${jenisId}`);
      return response.data.data || [];
    },
    enabled: !!jenisId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useTypeProductStatistics = () => {
  return useQuery({
    queryKey: masterKeys.type.statistics(),
    queryFn: async () => {
      const response = await api.get('/type/statistics');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

// ==========================================
// MUTATION HOOKS
// ==========================================

export const useCreateTypeProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/type', data),
    onSuccess: async (response, variables) => {
      const newType = response.data.data;

      // Optimistic: tambahkan ke list cache
      queryClient.setQueriesData(
        { queryKey: masterKeys.type.lists() },
        (old) => {
          if (!old?.typeProducts) return old;
          return {
            ...old,
            typeProducts: [...old.typeProducts, newType],
            meta: { ...old.meta, total: (old.meta.total || 0) + 1 },
          };
        }
      );

      // Optimistic: tambahkan ke byJenis cache
      const jenisId = variables?.jenis_id;
      if (jenisId) {
        queryClient.setQueryData(
          masterKeys.type.byJenis(jenisId),
          (old) => (Array.isArray(old) ? [...old, newType] : [newType])
        );
      }

      // Optimistic: tambahkan ke dropdown (all & specific jenis)
      const dropdownItem = {
        value: newType.id,
        label: newType.nama,
        ...newType,
      };

      queryClient.setQueryData(
        masterKeys.type.dropdown('all'),
        (old) => (Array.isArray(old) ? [...old, dropdownItem] : [dropdownItem])
      );

      if (jenisId) {
        queryClient.setQueryData(
          masterKeys.type.dropdown(jenisId),
          (old) => (Array.isArray(old) ? [...old, dropdownItem] : [dropdownItem])
        );
      }

      // Full cross-invalidation (jenis stats + product cache)
      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};

export const useUpdateTypeProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/type/${id}`, data),
    onSuccess: async (response, variables) => {
      const updatedType = response.data.data;

      // Optimistic: update detail
      queryClient.setQueryData(masterKeys.type.detail(variables.id), updatedType);

      // Optimistic: update di semua list
      queryClient.setQueriesData(
        { queryKey: masterKeys.type.lists() },
        (old) => {
          if (!old?.typeProducts) return old;
          return {
            ...old,
            typeProducts: old.typeProducts.map((t) =>
              t.id === variables.id ? updatedType : t
            ),
          };
        }
      );

      // Optimistic: update di byJenis
      queryClient.setQueriesData(
        { queryKey: masterKeys.type.all.concat(['by_jenis']) },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((t) => (t.id === variables.id ? updatedType : t));
        }
      );

      // Optimistic: update dropdown
      const updateDropdown = (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) =>
          item.value === variables.id
            ? { ...item, label: updatedType.nama, ...updatedType }
            : item
        );
      };

      queryClient.setQueryData(masterKeys.type.dropdown('all'), updateDropdown);
      if (updatedType.jenis_id) {
        queryClient.setQueryData(
          masterKeys.type.dropdown(updatedType.jenis_id),
          updateDropdown
        );
      }

      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};

export const useDeleteTypeProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => api.delete(`/type/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.type.all, exact: false });

      const previousList = queryClient.getQueriesData({ queryKey: masterKeys.type.lists() });
      const previousByJenis = queryClient.getQueriesData({
        queryKey: masterKeys.type.all.concat(['by_jenis']),
      });
      const previousDropdownAll = queryClient.getQueryData(masterKeys.type.dropdown('all'));

      const detail = queryClient.getQueryData(masterKeys.type.detail(id));
      const previousDropdownSpecific = detail?.jenis_id
        ? queryClient.getQueryData(masterKeys.type.dropdown(detail.jenis_id))
        : null;

      // Optimistic: remove dari list
      queryClient.setQueriesData(
        { queryKey: masterKeys.type.lists() },
        (old) => {
          if (!old?.typeProducts) return old;
          return {
            ...old,
            typeProducts: old.typeProducts.filter((t) => t.id !== id),
            meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
          };
        }
      );

      // Optimistic: remove dari byJenis
      queryClient.setQueriesData(
        { queryKey: masterKeys.type.all.concat(['by_jenis']) },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.filter((t) => t.id !== id);
        }
      );

      // Optimistic: remove dari dropdown
      const removeFromDropdown = (old) => {
        if (!Array.isArray(old)) return old;
        return old.filter((item) => item.value !== id);
      };

      queryClient.setQueryData(masterKeys.type.dropdown('all'), removeFromDropdown);
      if (detail?.jenis_id) {
        queryClient.setQueryData(
          masterKeys.type.dropdown(detail.jenis_id),
          removeFromDropdown
        );
      }

      queryClient.removeQueries({ queryKey: masterKeys.type.detail(id) });

      return {
        previousList,
        previousByJenis,
        previousDropdownAll,
        previousDropdownSpecific,
        jenisId: detail?.jenis_id,
      };
    },
    onError: (err, id, context) => {
      context?.previousList?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousByJenis?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousDropdownAll) {
        queryClient.setQueryData(masterKeys.type.dropdown('all'), context.previousDropdownAll);
      }
      if (context?.previousDropdownSpecific && context.jenisId) {
        queryClient.setQueryData(
          masterKeys.type.dropdown(context.jenisId),
          context.previousDropdownSpecific
        );
      }
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'type');
    },
  });
};