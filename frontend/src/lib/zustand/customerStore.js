import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useCustomerStore = create(
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
        tagihan: false,
        bayar: false,
      },
      selectedItem: null,
      tagihanFilter: null,
      bayarDetail: null,

      setSearch: (search) =>
        set((state) => ({ filters: { ...state.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      openCreateModal: () =>
        set((state) => ({
          modals: { ...state.modals, create: true, edit: false, detail: false, tagihan: false, bayar: false },
          selectedItem: null,
          tagihanFilter: null,
          bayarDetail: null,
        }), false, 'openCreateModal'),

      openEditModal: (customer) =>
        set((state) => ({
          modals: { ...state.modals, edit: true, create: false, detail: false, tagihan: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          bayarDetail: null,
        }), false, 'openEditModal'),

      openDetailModal: (customer) =>
        set((state) => ({
          modals: { ...state.modals, detail: true, create: false, edit: false, tagihan: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          bayarDetail: null,
        }), false, 'openDetailModal'),

      openTagihanModal: (customer, filter = null) =>
        set((state) => ({
          modals: { ...state.modals, tagihan: true, create: false, edit: false, detail: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: filter,
          bayarDetail: null,
        }), false, 'openTagihanModal'),

      openBayarModal: (detail) =>
        set((state) => ({
          modals: { ...state.modals, bayar: true, create: false, edit: false, detail: false, tagihan: false },
          bayarDetail: detail,
        }), false, 'openBayarModal'),

      closeAllModals: () =>
        set({
          modals: { create: false, edit: false, detail: false, tagihan: false, bayar: false },
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

      hasActiveSearch: () => {
        const { filters } = get();
        return Boolean(filters.search);
      },
    }),
    { name: 'CustomerStore', enabled: import.meta.env.DEV }
  )
);

export const useCustomerFilters = () => {
  return useCustomerStore(
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

export const useCustomerModals = () => {
  return useCustomerStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedItem: state.selectedItem,
      tagihanFilter: state.tagihanFilter,
      bayarDetail: state.bayarDetail,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      openTagihanModal: state.openTagihanModal,
      openBayarModal: state.openBayarModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};