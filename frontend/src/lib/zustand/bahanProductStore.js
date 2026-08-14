import { create } from 'zustand'

export const useBahanProductStore = create((set) => ({
  isFormOpen: false,
  selectedBahan: null,

  openCreateModal: () => set({ isFormOpen: true, selectedBahan: null }),
  
  openEditModal: (bahan) => set({ isFormOpen: true, selectedBahan: bahan }),
  
  closeModals: () => set({ isFormOpen: false, selectedBahan: null }),
}))