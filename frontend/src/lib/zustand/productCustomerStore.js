import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useProductCustomerStore = create(
  devtools(
    (set, get) => ({
      filters: { search: '', customerId: '', perPage: 20 },
      currentPage: 1,

      modals: {
        form: false,
        detail: false,
      },
      selectedItem: null,

      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCustomerFilter: (customerId) =>
        set((s) => ({ filters: { ...s.filters, customerId }, currentPage: 1 }), false, 'setCustomerFilter'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', customerId: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

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
          customerId: filters.customerId || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.customerId);
      },
    }),
    { name: 'ProductCustomerStore', enabled: import.meta.env.DEV }
  )
);

export const useProductCustomerFilters = () =>
  useProductCustomerStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    setSearch: s.setSearch,
    setCustomerFilter: s.setCustomerFilter,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveFilters: s.hasActiveFilters,
    getQueryParams: s.getQueryParams,
  })));

export const useProductCustomerModals = () =>
  useProductCustomerStore(useShallow((s) => ({
    modals: s.modals,
    selectedItem: s.selectedItem,
    openCreateModal: s.openCreateModal,
    openEditModal: s.openEditModal,
    openDetailModal: s.openDetailModal,
    closeAllModals: s.closeAllModals,
  })));