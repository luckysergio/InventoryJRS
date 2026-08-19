import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const usePlaceStore = create(
  devtools(
    (set, get) => ({
      filters: { search: '', perPage: 20 },
      currentPage: 1,

      modals: {
        form: false,
        detail: false,
      },
      selectedItem: null,

      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set({ modals: { form: true, detail: false }, selectedItem: null }, false, 'openCreateModal'),

      openEditModal: (item) =>
        set({ modals: { form: true, detail: false }, selectedItem: item }, false, 'openEditModal'),

      openDetailModal: (item) =>
        set({ modals: { form: false, detail: true }, selectedItem: item }, false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { form: false, detail: false }, selectedItem: null }, false, 'closeAllModals'),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => Boolean(get().filters.search),
    }),
    { name: 'PlaceStore', enabled: import.meta.env.DEV }
  )
);

export const usePlaceFilters = () =>
  usePlaceStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    setSearch: s.setSearch,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveFilters: s.hasActiveFilters,
    getQueryParams: s.getQueryParams,
  })));

export const usePlaceModals = () =>
  usePlaceStore(useShallow((s) => ({
    modals: s.modals,
    selectedItem: s.selectedItem,
    openCreateModal: s.openCreateModal,
    openEditModal: s.openEditModal,
    openDetailModal: s.openDetailModal,
    closeAllModals: s.closeAllModals,
  })));