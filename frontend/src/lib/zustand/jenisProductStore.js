import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useJenisProductStore = create(
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
      selectedJenis: null,

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
            selectedJenis: null,
          }),
          false,
          'openCreateModal'
        ),

      openEditModal: (jenis) =>
        set(
          (state) => ({
            modals: { ...state.modals, edit: true, create: false },
            selectedJenis: jenis,
          }),
          false,
          'openEditModal'
        ),

      closeAllModals: () =>
        set(
          {
            modals: {
              create: false,
              edit: false,
            },
            selectedJenis: null,
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
      name: 'JenisProductStore',
      enabled: import.meta.env.DEV,
    }
  )
);

export const useJenisProductFilters = () => {
  return useJenisProductStore(
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

export const useJenisProductModals = () => {
  return useJenisProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedJenis: state.selectedJenis,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};