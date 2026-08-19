import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const usePlaces = (params = {}) => {
  const { search = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.place.list({ search, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/places', {
        params: {
          search: search || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        places: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePlacesDropdown = () => useQuery({
  queryKey: masterKeys.place.dropdown(),
  queryFn: async () => (await api.get('/places/dropdown')).data.data || [],
  staleTime: 15 * 60 * 1000,
});

const invalidatePlaceCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.place.all, exact: false });
  qc.removeQueries({ queryKey: masterKeys.place.all, exact: false });
  await qc.invalidateQueries({ queryKey: masterKeys.place.all, exact: false, refetchType: 'all' });
  await invalidateRelatedCaches(qc, 'place');
};

export const useCreatePlace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/places', data),
    onSuccess: async () => await invalidatePlaceCache(qc),
  });
};

export const useUpdatePlace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/places/${id}`, data),
    onSuccess: async () => await invalidatePlaceCache(qc),
  });
};

export const useDeletePlace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/places/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: masterKeys.place.all, exact: false });
      const prev = qc.getQueriesData({ queryKey: masterKeys.place.all });
      qc.setQueriesData({ queryKey: masterKeys.place.all }, (old) => {
        if (!old?.places) return old;
        return {
          ...old,
          places: old.places.filter((p) => p.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev?.forEach(([k, d]) => qc.setQueryData(k, d));
    },
    onSettled: async () => await invalidatePlaceCache(qc),
  });
};