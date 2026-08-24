import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useInventories = (params = {}) => {
  const { search = '', place_id = '', perPage = 20, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.inventory.list({ search, place_id, perPage, page }),
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: {
          search: search || undefined,
          place_id: place_id || undefined,
          per_page: perPage,
          page,
        },
      });
      return {
        inventories: res.data.data || [],
        meta: res.data.meta || {},
      };
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};

export const useStokMap = (place = 'TOKO') => {
  return useQuery({
    queryKey: masterKeys.inventory.stokMap(place),
    queryFn: async () => {
      const res = await api.get('/inventory/stok-map', {
        params: { place },
      });
      return res.data.data || {};
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const invalidateInventoryCache = async (qc) => {
  await qc.cancelQueries({ queryKey: masterKeys.inventory.all, exact: false });
  await qc.invalidateQueries({
    queryKey: masterKeys.inventory.all,
    exact: false,
    refetchType: 'all',
  });
  await invalidateRelatedCaches(qc, 'inventory');
};

export const useCreateProductMovement = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/product-movements', data),

    onMutate: async (movementData) => {
      await qc.cancelQueries({ queryKey: masterKeys.inventory.all, exact: false });
      const previousData = qc.getQueriesData({ queryKey: masterKeys.inventory.all });

      const sourceId = Number(movementData.inventory_id);
      const destPlaceId = movementData.to_place_id ? Number(movementData.to_place_id) : null;
      const qty = Number(movementData.qty);

      qc.setQueriesData({ queryKey: masterKeys.inventory.all }, (old) => {
        if (!old?.inventories) return old;

        const newInventories = old.inventories.map((inv) => {
          if (Number(inv.id) === sourceId) {
            const newQty = ['in', 'produksi'].includes(movementData.tipe)
              ? Number(inv.qty) + qty
              : ['out', 'transfer'].includes(movementData.tipe)
              ? Math.max(0, Number(inv.qty) - qty)
              : Number(inv.qty);

            return { ...inv, qty: newQty };
          }

          if (movementData.tipe === 'transfer' && destPlaceId) {
            const sourceInv = old.inventories.find(i => Number(i.id) === sourceId);
            if (sourceInv && Number(inv.product_id) === Number(sourceInv.product_id)
                && Number(inv.place_id) === destPlaceId) {
              return { ...inv, qty: Number(inv.qty) + qty };
            }
          }

          return inv;
        });

        if (movementData.tipe === 'transfer' && destPlaceId) {
          const sourceInv = old.inventories.find(i => Number(i.id) === sourceId);
          if (sourceInv) {
            const destExists = newInventories.some(
              i => Number(i.product_id) === Number(sourceInv.product_id) && Number(i.place_id) === destPlaceId
            );

            if (!destExists) {
              newInventories.push({
                ...sourceInv,
                id: `temp-${Date.now()}`,
                place_id: destPlaceId,
                qty: qty,
                place: { id: destPlaceId, nama: 'Loading...', kode: 'LOADING' },
              });
            }
          }
        }

        return { ...old, inventories: newInventories };
      });

      qc.setQueriesData(
        { queryKey: masterKeys.inventory.all.concat(['stok_map']) },
        (old) => {
          if (!old || typeof old !== 'object') return old;
          const newMap = { ...old };
          return newMap;
        }
      );

      return { previousData };
    },

    onError: (_err, _movementData, context) => {
      context?.previousData?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },

    onSettled: async (_data, error) => {
      if (error) return;

      await new Promise(resolve => setTimeout(resolve, 1000));

      await invalidateInventoryCache(qc);
    },
  });
};