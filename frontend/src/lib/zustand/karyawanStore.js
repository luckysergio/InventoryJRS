import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useKaryawanStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        jabatanId: '',
        perPage: 10,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
        detail: false,
      },
      selectedKaryawan: null,

      setSearch: (search) =>
        set(
          (state) => ({
            filters: { ...state.filters, search },
            currentPage: 1,
          }),
          false,
          'setSearch'
        ),

      setJabatanFilter: (jabatanId) =>
        set(
          (state) => ({
            filters: { ...state.filters, jabatanId },
            currentPage: 1,
          }),
          false,
          'setJabatanFilter'
        ),

      setCurrentPage: (page) =>
        set({ currentPage: page }, false, 'setCurrentPage'),

      setPerPage: (perPage) =>
        set(
          (state) => ({
            filters: { ...state.filters, perPage },
            currentPage: 1,
          }),
          false,
          'setPerPage'
        ),

      resetFilters: () =>
        set(
          {
            filters: {
              search: '',
              jabatanId: '',
              perPage: 10,
            },
            currentPage: 1,
          },
          false,
          'resetFilters'
        ),

      openCreateModal: () =>
        set(
          (state) => ({
            modals: { ...state.modals, create: true, edit: false, detail: false },
            selectedKaryawan: null,
          }),
          false,
          'openCreateModal'
        ),

      openEditModal: (karyawan) =>
        set(
          (state) => ({
            modals: { ...state.modals, edit: true, create: false, detail: false },
            selectedKaryawan: karyawan,
          }),
          false,
          'openEditModal'
        ),

      openDetailModal: (karyawan) =>
        set(
          (state) => ({
            modals: { ...state.modals, detail: true, create: false, edit: false },
            selectedKaryawan: karyawan,
          }),
          false,
          'openDetailModal'
        ),

      closeAllModals: () =>
        set(
          {
            modals: {
              create: false,
              edit: false,
              detail: false,
            },
            selectedKaryawan: null,
          },
          false,
          'closeAllModals'
        ),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          jabatanId: filters.jabatanId || undefined,
          page: currentPage,
          perPage: filters.perPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.jabatanId);
      },
    }),
    {
      name: 'KaryawanStore',
      enabled: import.meta.env.DEV,
    }
  )
);

export const useKaryawanFilters = () => {
  return useKaryawanStore(
    useShallow((state) => ({
      filters: state.filters,
      currentPage: state.currentPage,
      setSearch: state.setSearch,
      setJabatanFilter: state.setJabatanFilter,
      setCurrentPage: state.setCurrentPage,
      setPerPage: state.setPerPage,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useKaryawanModals = () => {
  return useKaryawanStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedKaryawan: state.selectedKaryawan,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};