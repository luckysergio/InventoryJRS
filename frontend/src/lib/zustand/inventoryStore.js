import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useInventoryStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        placeId: '',
        perPage: 20,
      },
      currentPage: 1,
      sortBy: 'stok-desc',

      modals: {
        movement: false,
      },
      selectedInventory: null,
      movementType: null, // 'in' | 'out' | 'transfer'

      // Filter & Pagination
      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setPlaceFilter: (placeId) =>
        set((s) => ({ filters: { ...s.filters, placeId }, currentPage: 1 }), false, 'setPlaceFilter'),

      setSortBy: (sortBy) => set({ sortBy }, false, 'setSortBy'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({
          filters: { search: '', placeId: '', perPage: 20 },
          currentPage: 1,
          sortBy: 'stok-desc',
        }, false, 'resetFilters'),

      // Modals
      openMovementModal: (inventory, type) =>
        set({
          modals: { movement: true },
          selectedInventory: inventory,
          movementType: type,
        }, false, 'openMovementModal'),

      closeAllModals: () =>
        set({
          modals: { movement: false },
          selectedInventory: null,
          movementType: null,
        }, false, 'closeAllModals'),

      // Getters
      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          place_id: filters.placeId || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.placeId);
      },
    }),
    { name: 'InventoryStore', enabled: import.meta.env.DEV }
  )
);

export const useInventoryFilters = () =>
  useInventoryStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    sortBy: s.sortBy,
    setSearch: s.setSearch,
    setPlaceFilter: s.setPlaceFilter,
    setSortBy: s.setSortBy,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveFilters: s.hasActiveFilters,
    getQueryParams: s.getQueryParams,
  })));

export const useInventoryModals = () =>
  useInventoryStore(useShallow((s) => ({
    modals: s.modals,
    selectedInventory: s.selectedInventory,
    movementType: s.movementType,
    openMovementModal: s.openMovementModal,
    closeAllModals: s.closeAllModals,
  })));