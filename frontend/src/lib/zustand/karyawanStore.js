import { create } from 'zustand'

export const useKaryawanStore = create((set) => ({
  isFormOpen: false,
  isDetailOpen: false,
  selectedKaryawan: null,

  openCreateModal: () => set({ isFormOpen: true, isDetailOpen: false, selectedKaryawan: null }),
  
  openEditModal: (karyawan) => set({ isFormOpen: true, isDetailOpen: false, selectedKaryawan: karyawan }),
  
  openDetailModal: (karyawan) => set({ isDetailOpen: true, isFormOpen: false, selectedKaryawan: karyawan }),
  
  closeModals: () => set({ isFormOpen: false, isDetailOpen: false, selectedKaryawan: null }),
}))