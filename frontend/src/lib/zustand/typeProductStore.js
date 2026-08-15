import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useTypeProductStore = create(
  devtools(
    (set, get) => ({
      filters: {
        search: '',
        jenisId: '',
        perPage: 20,
      },
      currentPage: 1,

      modals: {
        create: false,
        edit: false,
        detail: false,
      },
      selectedType: null,

      setSearch: (search) =>
        set(
          (state) => ({
            filters: { ...state.filters, search },
            currentPage: 1,
          }),
          false,
          'setSearch'
        ),

      setJenisFilter: (jenisId) =>
        set(
          (state) => ({
            filters: { ...state.filters, jenisId },
            currentPage: 1,
          }),
          false,
          'setJenisFilter'
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
            filters: { search: '', jenisId: '', perPage: 20 },
            currentPage: 1,
          },
          false,
          'resetFilters'
        ),

      openCreateModal: () =>
        set(
          (state) => ({
            modals: { ...state.modals, create: true, edit: false, detail: false },
            selectedType: null,
          }),
          false,
          'openCreateModal'
        ),

      openEditModal: (type) =>
        set(
          (state) => ({
            modals: { ...state.modals, edit: true, create: false, detail: false },
            selectedType: type,
          }),
          false,
          'openEditModal'
        ),

      openDetailModal: (type) =>
        set(
          (state) => ({
            modals: { ...state.modals, detail: true, create: false, edit: false },
            selectedType: type,
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
            selectedType: null,
          },
          false,
          'closeAllModals'
        ),

      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          jenisId: filters.jenisId || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return Boolean(filters.search || filters.jenisId);
      },
    }),
    {
      name: 'TypeProductStore',
      enabled: import.meta.env.DEV,
    }
  )
);

export const useTypeProductFilters = () => {
  return useTypeProductStore(
    useShallow((state) => ({
      filters: state.filters,
      currentPage: state.currentPage,
      setSearch: state.setSearch,
      setJenisFilter: state.setJenisFilter,
      setCurrentPage: state.setCurrentPage,
      setPerPage: state.setPerPage,
      resetFilters: state.resetFilters,
      hasActiveFilters: state.hasActiveFilters,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useTypeProductModals = () => {
  return useTypeProductStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedType: state.selectedType,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDetailModal: state.openDetailModal,
      closeAllModals: state.closeAllModals,
    }))
  );
};