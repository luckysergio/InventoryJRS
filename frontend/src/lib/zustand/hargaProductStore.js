import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useHargaProductStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        productId: '',
        perPage: 20,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
        detail: false,
      },
      selectedHarga: null,

      setSearch: (search) =>
        set((state) => ({ filters: { ...state.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setProductFilter: (productId) =>
        set((state) => ({ filters: { ...state.filters, productId }, currentPage: 1 }), false, 'setProductFilter'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', productId: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set((state) => ({ modals: { ...state.modals, create: true, edit: false, detail: false }, selectedHarga: null }), false, 'openCreateModal'),

      openEditModal: (harga) =>
        set((state) => ({ modals: { ...state.modals, edit: true, create: false, detail: false }, selectedHarga: harga }), false, 'openEditModal'),

      openDetailModal: (harga) =>
        set((state) => ({ modals: { ...state.modals, detail: true, create: false, edit: false }, selectedHarga: harga }), false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { create: false, edit: false, detail: false }, selectedHarga: null }, false, 'closeAllModals'),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          productId: filters.productId || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.productId);
      },
    }),
    { name: 'HargaProductStore', enabled: import.meta.env.DEV }
  )
);

export const useHargaProductFilters = () => {
  return useHargaProductStore(
    useShallow((state) => ({
      filters: state.filters,
      currentPage: state.currentPage,
      setSearch: state.setSearch,
      setProductFilter: state.setProductFilter,
      setCurrentPage: state.setCurrentPage,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useHargaProductModals = () => {
  return useHargaProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedHarga: state.selectedHarga,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};