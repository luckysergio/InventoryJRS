import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useStatusTransaksiStore = create(
  devtools(
    (set) => ({
      // ============================================
      // UI / MODAL STATE
      // ============================================
      modals: {
        form: false,
      },
      selectedItem: null,

      // ============================================
      // ACTIONS
      // ============================================
      openCreateModal: () =>
        set({ modals: { form: true }, selectedItem: null }, false, 'openCreateModal'),

      openEditModal: (item) =>
        set({ modals: { form: true }, selectedItem: item }, false, 'openEditModal'),

      closeAllModals: () =>
        set({ modals: { form: false }, selectedItem: null }, false, 'closeAllModals'),
    }),
    { name: 'StatusTransaksiStore', enabled: import.meta.env.DEV }
  )
);

// ============================================
// SELECTORS (useShallow mencegah infinite loop)
// ============================================
export const useStatusTransaksiModals = () =>
  useStatusTransaksiStore(
    useShallow((s) => ({
      modals: s.modals,
      selectedItem: s.selectedItem,
      openCreateModal: s.openCreateModal,
      openEditModal: s.openEditModal,
      closeAllModals: s.closeAllModals,
    }))
  );