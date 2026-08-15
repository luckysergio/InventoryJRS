import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useJabatanStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // SEARCH & PAGINATION STATE
      // ============================================
      searchQuery: '',
      currentPage: 1,
      perPage: 10,

      // ============================================
      // UI / MODAL STATE
      // ============================================
      modals: {
        create: false,
        edit: false,
        delete: false,
      },
      selectedJabatan: null,

      // ============================================
      // ACTION: SEARCH & PAGINATION
      // ============================================
      setSearchQuery: (query) => 
        set({ searchQuery: query, currentPage: 1 }, false, 'setSearchQuery'),

      setCurrentPage: (page) => 
        set({ currentPage: page }, false, 'setCurrentPage'),

      setPerPage: (perPage) => 
        set({ perPage, currentPage: 1 }, false, 'setPerPage'),

      resetSearch: () => 
        set({ searchQuery: '', currentPage: 1 }, false, 'resetSearch'),

      // ============================================
      // ACTION: MODAL MANAGEMENT
      // ============================================
      openCreateModal: () =>
        set(
          (state) => ({
            modals: { ...state.modals, create: true },
            selectedJabatan: null,
          }),
          false,
          'openCreateModal'
        ),

      openEditModal: (jabatan) =>
        set(
          (state) => ({
            modals: { ...state.modals, edit: true },
            selectedJabatan: jabatan,
          }),
          false,
          'openEditModal'
        ),

      openDeleteModal: (jabatan) =>
        set(
          (state) => ({
            modals: { ...state.modals, delete: true },
            selectedJabatan: jabatan,
          }),
          false,
          'openDeleteModal'
        ),

      closeAllModals: () =>
        set(
          (state) => ({
            modals: {
              create: false,
              edit: false,
              delete: false,
            },
            selectedJabatan: null,
          }),
          false,
          'closeAllModals'
        ),

      closeModal: (modalName) =>
        set(
          (state) => ({
            modals: { ...state.modals, [modalName]: false },
            selectedJabatan: ['edit', 'delete'].includes(modalName)
              ? null
              : state.selectedJabatan,
          }),
          false,
          'closeModal'
        ),

      // ============================================
      // GETTERS
      // ============================================
      getQueryParams: () => {
        const { searchQuery, currentPage, perPage } = get();
        return {
          search: searchQuery || undefined,
          with_count: true,
          perPage,
          page: currentPage,
        };
      },

      hasActiveSearch: () => {
        const { searchQuery } = get();
        return Boolean(searchQuery);
      },
    }),
    {
      name: 'JabatanStore',
      enabled: import.meta.env.DEV,
    }
  )
);

export const useJabatanSearch = () => {
  return useJabatanStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      currentPage: state.currentPage,
      perPage: state.perPage,
      setSearchQuery: state.setSearchQuery,
      setCurrentPage: state.setCurrentPage,
      setPerPage: state.setPerPage,
      resetSearch: state.resetSearch,
      hasActiveSearch: state.hasActiveSearch,
      getQueryParams: state.getQueryParams,
    }))
  );
};

export const useJabatanModals = () => {
  return useJabatanStore(
    useShallow((state) => ({
      modals: state.modals,
      selectedJabatan: state.selectedJabatan,
      openCreateModal: state.openCreateModal,
      openEditModal: state.openEditModal,
      openDeleteModal: state.openDeleteModal,
      closeAllModals: state.closeAllModals,
      closeModal: state.closeModal,
    }))
  );
};