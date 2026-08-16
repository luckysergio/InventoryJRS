import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useBahanProductStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        perPage: 12,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
      },
      selectedBahan: null,

      setSearch: (search) =>
        set(
          (state) => ({
            filters: { ...state.filters, search },
            currentPage: 1,
          }),
          false,
          'setSearch'
        ),

      setCurrentPage: (page) =>
        set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set(
          {
            filters: { search: '', perPage: 12 },
            currentPage: 1,
          },
          false,
          'resetFilters'
        ),

      openCreateModal: () =>
        set(
          (state) => ({
            modals: { ...state.modals, create: true, edit: false },
            selectedBahan: null,
          }),
          false,
          'openCreateModal'
        ),

      openEditModal: (bahan) =>
        set(
          (state) => ({
            modals: { ...state.modals, edit: true, create: false },
            selectedBahan: bahan,
          }),
          false,
          'openEditModal'
        ),

      closeAllModals: () =>
        set(
          {
            modals: { create: false, edit: false },
            selectedBahan: null,
          },
          false,
          'closeAllModals'
        ),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          with_count: true,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveSearch: () => {
        const { filters } = get();
        return Boolean(filters.search);
      },
    }),
    {
      name: 'BahanProductStore',
      enabled: import.meta.env.DEV,
    }
  )
);

export const useBahanProductFilters = () => {
  return useBahanProductStore(
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

export const useBahanProductModals = () => {
  return useBahanProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedBahan: state.selectedBahan,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};