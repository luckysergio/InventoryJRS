import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useCustomerStore = create(
  devtools(
    (set, get) => ({
      filters: { search: '', perPage: 20 },
      currentPage: 1,

      modals: {
        form: false,
        tagihan: false,
        detail: false,
        bayar: false,
      },
      selectedItem: null,
      tagihanFilter: null,
      bayarDetail: null,

      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set({
          modals: { form: true, tagihan: false, detail: false, bayar: false },
          selectedItem: null,
          tagihanFilter: null,
          bayarDetail: null,
        }, false, 'openCreateModal'),

      openEditModal: (customer) =>
        set({
          modals: { form: true, tagihan: false, detail: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          bayarDetail: null,
        }, false, 'openEditModal'),

      openDetailModal: (customer) =>
        set({
          modals: { form: false, tagihan: false, detail: true, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          bayarDetail: null,
        }, false, 'openDetailModal'),

      openTagihanModal: (customer, filter = null) =>
        set({
          modals: { form: false, tagihan: true, detail: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: filter,
          bayarDetail: null,
        }, false, 'openTagihanModal'),

      openBayarModal: (detail) =>
        set({
          modals: { form: false, tagihan: false, detail: false, bayar: true },
          bayarDetail: detail,
        }, false, 'openBayarModal'),

      closeAllModals: () =>
        set({
          modals: { form: false, tagihan: false, detail: false, bayar: false },
          selectedItem: null,
          tagihanFilter: null,
          bayarDetail: null,
        }, false, 'closeAllModals'),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveSearch: () => Boolean(get().filters.search),
    }),
    { name: 'CustomerStore', enabled: import.meta.env.DEV }
  )
);

export const useCustomerFilters = () =>
  useCustomerStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    setSearch: s.setSearch,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveSearch: s.hasActiveSearch,
    getQueryParams: s.getQueryParams,
  })));

export const useCustomerModals = () =>
  useCustomerStore(useShallow((s) => ({
    modals: s.modals,
    selectedItem: s.selectedItem,
    tagihanFilter: s.tagihanFilter,
    bayarDetail: s.bayarDetail,
    openCreateModal: s.openCreateModal,
    openEditModal: s.openEditModal,
    openDetailModal: s.openDetailModal,
    openTagihanModal: s.openTagihanModal,
    openBayarModal: s.openBayarModal,
    closeAllModals: s.closeAllModals,
  })));