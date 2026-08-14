import { create } from 'zustand'

export const useProductStore = create((set) => ({
  isFormOpen: false,
  isDetailOpen: false,
  selectedProduct: null,

  openCreateModal: () => set({ isFormOpen: true, isDetailOpen: false, selectedProduct: null }),
  
  openEditModal: (product) => set({ isFormOpen: true, isDetailOpen: false, selectedProduct: product }),
  
  openDetailModal: (product) => set({ isDetailOpen: true, isFormOpen: false, selectedProduct: product }),
  
  closeModals: () => set({ isFormOpen: false, isDetailOpen: false, selectedProduct: null }),
}))