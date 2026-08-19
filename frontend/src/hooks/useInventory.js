import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
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
      
      // ✅ FIX #1: Normalisasi semua ID ke Number untuk comparison yang konsisten
      const sourceId = Number(movementData.inventory_id);
      const destPlaceId = movementData.to_place_id ? Number(movementData.to_place_id) : null;
      const qty = Number(movementData.qty);
      
      qc.setQueriesData({ queryKey: masterKeys.inventory.all }, (old) => {
        if (!old?.inventories) return old;
        
        const newInventories = old.inventories.map((inv) => {
          // ✅ FIX #1: Gunakan Number() untuk comparison
          if (Number(inv.id) === sourceId) {
            const newQty = ['in', 'produksi'].includes(movementData.tipe)
              ? Number(inv.qty) + qty
              : ['out', 'transfer'].includes(movementData.tipe)
              ? Math.max(0, Number(inv.qty) - qty) // Prevent negative
              : Number(inv.qty);
            
            return { ...inv, qty: newQty };
          }
          
          // Transfer: update inventory tujuan
          if (movementData.tipe === 'transfer' && destPlaceId) {
            const sourceInv = old.inventories.find(i => Number(i.id) === sourceId);
            if (sourceInv && Number(inv.product_id) === Number(sourceInv.product_id) 
                && Number(inv.place_id) === destPlaceId) {
              return { ...inv, qty: Number(inv.qty) + qty };
            }
          }
          
          return inv;
        });
        
        // Transfer: buat placeholder jika inventory tujuan belum ada di page ini
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
      
      return { previousData };
    },
    
    onError: (_err, _movementData, context) => {
      context?.previousData?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
    
    // ✅ FIX #2: HAPUS onSuccess — hanya gunakan onSettled
    // onSuccess dan onSettled DIPANGGIL BERURUTAN, menyebabkan double refetch
    // yang overwrite optimistic update dengan data lama dari backend
    
    onSettled: async (_data, error) => {
      // Jika error, rollback sudah ditangani onError — jangan refetch
      if (error) return;
      
      // ✅ FIX #2: Delay 500ms sebelum refetch
      // Beri waktu backend untuk menyelesaikan cache version bump
      // Tanpa delay ini, refetch bisa mengambil data LAMA dari backend cache
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await invalidateInventoryCache(qc);
    },
  });
};