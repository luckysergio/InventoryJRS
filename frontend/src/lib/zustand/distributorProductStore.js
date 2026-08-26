import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useDistributorProductStore = create(
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
      selectedItem: null,

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
        set((state) => ({ modals: { ...state.modals, create: true, edit: false, detail: false }, selectedItem: null }), false, 'openCreateModal'),

      openEditModal: (item) =>
        set((state) => ({ modals: { ...state.modals, edit: true, create: false, detail: false }, selectedItem: item }), false, 'openEditModal'),

      openDetailModal: (item) =>
        set((state) => ({ modals: { ...state.modals, detail: true, create: false, edit: false }, selectedItem: item }), false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { create: false, edit: false, detail: false }, selectedItem: null }, false, 'closeAllModals'),

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
    { name: 'DistributorProductStore', enabled: import.meta.env.DEV }
  )
);

export const useDistributorProductFilters = () => {
  return useDistributorProductStore(
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

export const useDistributorProductModals = () => {
  return useDistributorProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedItem: state.selectedItem,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};