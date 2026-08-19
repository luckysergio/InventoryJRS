import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useProductMovementStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        tipe: '',
        dari: '',
        sampai: '',
        perPage: 20,
      },
      currentPage: 1,

      modals: {
        detail: false,
      },
      selectedItem: null,

      // Filter & Pagination
      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setTipeFilter: (tipe) =>
        set((s) => ({ filters: { ...s.filters, tipe }, currentPage: 1 }), false, 'setTipeFilter'),

      setDariFilter: (dari) =>
        set((s) => ({ filters: { ...s.filters, dari }, currentPage: 1 }), false, 'setDariFilter'),

      setSampaiFilter: (sampai) =>
        set((s) => ({ filters: { ...s.filters, sampai }, currentPage: 1 }), false, 'setSampaiFilter'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({
          filters: { search: '', tipe: '', dari: '', sampai: '', perPage: 20 },
          currentPage: 1,
        }, false, 'resetFilters'),

      // Modals
      openDetailModal: (item) =>
        set({ modals: { detail: true }, selectedItem: item }, false, 'openDetailModal'),

      closeAllModals: () =>
        set({ modals: { detail: false }, selectedItem: null }, false, 'closeAllModals'),

      // Getters
      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          tipe: filters.tipe || undefined,
          dari: filters.dari || undefined,
          sampai: filters.sampai || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.tipe || filters.dari || filters.sampai);
      },
    }),
    { name: 'ProductMovementStore', enabled: import.meta.env.DEV }
  )
);

export const useProductMovementFilters = () =>
  useProductMovementStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    setSearch: s.setSearch,
    setTipeFilter: s.setTipeFilter,
    setDariFilter: s.setDariFilter,
    setSampaiFilter: s.setSampaiFilter,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveFilters: s.hasActiveFilters,
    getQueryParams: s.getQueryParams,
  })));

export const useProductMovementModals = () =>
  useProductMovementStore(useShallow((s) => ({
    modals: s.modals,
    selectedItem: s.selectedItem,
    openDetailModal: s.openDetailModal,
    closeAllModals: s.closeAllModals,
  })));