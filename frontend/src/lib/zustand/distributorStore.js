import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useDistributorStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        perPage: 20,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
        detail: false,
      },
      selectedDistributor: null,

      setSearch: (search) =>
        set((state) => ({ filters: { ...state.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set((state) => ({ modals: { ...state.modals, create: true, edit: false, detail: false }, selectedDistributor: null }), false, 'openCreateModal'),

      openEditModal: (distributor) =>
        set((state) => ({ modals: { ...state.modals, edit: true, create: false, detail: false }, selectedDistributor: distributor }), false, 'openEditModal'),

      openDetailModal: (distributor) =>
        set((state) => ({ modals: { ...state.modals, detail: true, create: false, edit: false }, selectedDistributor: distributor }), false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { create: false, edit: false, detail: false }, selectedDistributor: null }, false, 'closeAllModals'),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveSearch: () => {
        const { filters } = get();
        return Boolean(filters.search);
      },
    }),
    { name: 'DistributorStore', enabled: import.meta.env.DEV }
  )
);

export const useDistributorFilters = () => {
  return useDistributorStore(
    useShallow((state) => ({
      filters: state.filters,
      currentPage: state.currentPage,
      setSearch: state.setSearch,
      setCurrentPage: state.setCurrentPage,
      resetFilters: state.resetFilters,
      hasActiveSearch: state.hasActiveSearch,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useDistributorModals = () => {
  return useDistributorStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedDistributor: state.selectedDistributor,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};