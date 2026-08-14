import { create } from 'zustand'

export const useDistributorProductStore = create((set) => ({
  isFormOpen: false,
  isDetailOpen: false,
  selectedItem: null,

  openCreateModal: () => set({ isFormOpen: true, isDetailOpen: false, selectedItem: null }),
  
  openEditModal: (item) => set({ isFormOpen: true, isDetailOpen: false, selectedItem: item }),
  
  openDetailModal: (item) => set({ isDetailOpen: true, isFormOpen: false, selectedItem: item }),
  
  closeModals: () => set({ isFormOpen: false, isDetailOpen: false, selectedItem: null }),
}))