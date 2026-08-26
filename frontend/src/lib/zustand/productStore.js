import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useProductStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        jenisId: '',
        typeId: '',
        perPage: 20,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
        detail: false,
      },
      selectedProduct: null,

      setSearch: (search) =>
        set((state) => ({ filters: { ...state.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setJenisFilter: (jenisId) =>
        set((state) => ({ filters: { ...state.filters, jenisId, typeId: '' }, currentPage: 1 }), false, 'setJenisFilter'),

      setTypeFilter: (typeId) =>
        set((state) => ({ filters: { ...state.filters, typeId }, currentPage: 1 }), false, 'setTypeFilter'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', jenisId: '', typeId: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set((state) => ({ modals: { ...state.modals, create: true, edit: false, detail: false }, selectedProduct: null }), false, 'openCreateModal'),

      openEditModal: (product) =>
        set((state) => ({ modals: { ...state.modals, edit: true, create: false, detail: false }, selectedProduct: product }), false, 'openEditModal'),

      openDetailModal: (product) =>
        set((state) => ({ modals: { ...state.modals, detail: true, create: false, edit: false }, selectedProduct: product }), false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { create: false, edit: false, detail: false }, selectedProduct: null }, false, 'closeAllModals'),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          jenisId: filters.jenisId || undefined,
          typeId: filters.typeId || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.jenisId || filters.typeId);
      },
    }),
    { name: 'ProductStore', enabled: import.meta.env.DEV }
  )
);

export const useProductFilters = () => {
  return useProductStore(
    useShallow((state) => ({
      filters: state.filters,
      currentPage: state.currentPage,
      setSearch: state.setSearch,
      setJenisFilter: state.setJenisFilter,
      setTypeFilter: state.setTypeFilter,
      setCurrentPage: state.setCurrentPage,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useProductModals = () => {
  return useProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedProduct: state.selectedProduct,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};