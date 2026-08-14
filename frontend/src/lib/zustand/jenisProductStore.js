import { create } from 'zustand'

export const useJenisProductStore = create((set) => ({
  isFormOpen: false,
  selectedJenis: null,

  openCreateModal: () => set({ isFormOpen: true, selectedJenis: null }),
  
  openEditModal: (jenis) => set({ isFormOpen: true, selectedJenis: jenis }),
  
  closeModals: () => set({ isFormOpen: false, selectedJenis: null }),
}))