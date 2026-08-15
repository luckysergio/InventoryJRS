import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useUserStore = create(
    devtools(
        (set, get) => ({
            filters: {
                search: '',
                role: '',
                perPage: 10,
            },
            currentPage: 1,

            modals: {
                create: false,
                edit: false,
                delete: false,
                detail: false,
            },
            selectedUser: null,

            setSearch: (search) => set((state) => ({
                filters: { ...state.filters, search },
                currentPage: 1,
            }), false, 'setSearch'),

            setRoleFilter: (role) => set((state) => ({
                filters: { ...state.filters, role },
                currentPage: 1,
            }), false, 'setRoleFilter'),

            setPerPage: (perPage) => set((state) => ({
                filters: { ...state.filters, perPage },
                currentPage: 1,
            }), false, 'setPerPage'),

            setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

            resetFilters: () => set({
                filters: {
                    search: '',
                    role: '',
                    perPage: 10,
                },
                currentPage: 1,
            }, false, 'resetFilters'),

            openCreateModal: () => set((state) => ({
                modals: { ...state.modals, create: true },
                selectedUser: null,
            }), false, 'openCreateModal'),

            openEditModal: (user) => set((state) => ({
                modals: { ...state.modals, edit: true },
                selectedUser: user,
            }), false, 'openEditModal'),

            openDeleteModal: (user) => set((state) => ({
                modals: { ...state.modals, delete: true },
                selectedUser: user,
            }), false, 'openDeleteModal'),

            openDetailModal: (user) => set((state) => ({
                modals: { ...state.modals, detail: true },
                selectedUser: user,
            }), false, 'openDetailModal'),

            closeAllModals: () => set((state) => ({
                modals: {
                    create: false,
                    edit: false,
                    delete: false,
                    detail: false,
                },
                selectedUser: null,
            }), false, 'closeAllModals'),

            closeModal: (modalName) => set((state) => ({
                modals: { ...state.modals, [modalName]: false },
                selectedUser: ['edit', 'delete', 'detail'].includes(modalName)
                    ? null
                    : state.selectedUser,
            }), false, 'closeModal'),

            getQueryParams: () => {
                const { filters, currentPage } = get();
                return {
                    search: filters.search || undefined,
                    role: filters.role || undefined,
                    page: currentPage,
                    perPage: filters.perPage,
                };
            },

            hasActiveFilters: () => {
                const { filters } = get();
                return Boolean(filters.search || filters.role);
            },
        }),
        {
            name: 'UserStore',
            enabled: import.meta.env.DEV,
        }
    )
);

export const useUserFilters = () => {
    return useUserStore(
        useShallow((state) => ({
            filters: state.filters,
            currentPage: state.currentPage,
            setSearch: state.setSearch,
            setRoleFilter: state.setRoleFilter,
            setPerPage: state.setPerPage,
            setCurrentPage: state.setCurrentPage,
            resetFilters: state.resetFilters,
            hasActiveFilters: state.hasActiveFilters,
            getQueryParams: state.getQueryParams,
        }))
    );
};

export const useUserModals = () => {
    return useUserStore(
        useShallow((state) => ({
            modals: state.modals,
            selectedUser: state.selectedUser,
            openCreateModal: state.openCreateModal,
            openEditModal: state.openEditModal,
            openDeleteModal: state.openDeleteModal,
            openDetailModal: state.openDetailModal,
            closeAllModals: state.closeAllModals,
            closeModal: state.closeModal,
        }))
    );
};