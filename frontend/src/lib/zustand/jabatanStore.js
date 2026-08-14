import { create } from 'zustand'

export const useJabatanStore = create((set) => ({
  isModalOpen: false,
  selectedJabatan: null,

  openCreateModal: () => set({ isModalOpen: true, selectedJabatan: null }),
  
  openEditModal: (jabatan) => set({ isModalOpen: true, selectedJabatan: jabatan }),
  
  closeModal: () => set({ isModalOpen: false, selectedJabatan: null }),
}))