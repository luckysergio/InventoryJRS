import { create } from 'zustand'

export const useHargaProductStore = create((set) => ({
  isFormOpen: false,
  isDetailOpen: false,
  selectedHarga: null,

  openCreateModal: () => set({ isFormOpen: true, isDetailOpen: false, selectedHarga: null }),
  
  openEditModal: (harga) => set({ isFormOpen: true, isDetailOpen: false, selectedHarga: harga }),
  
  openDetailModal: (harga) => set({ isDetailOpen: true, isFormOpen: false, selectedHarga: harga }),
  
  closeModals: () => set({ isFormOpen: false, isDetailOpen: false, selectedHarga: null }),
}))