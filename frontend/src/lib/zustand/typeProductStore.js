import { create } from 'zustand'

export const useTypeProductStore = create((set) => ({
  isFormOpen: false,
  isDetailOpen: false,
  selectedType: null, // null = mode create, object = mode edit/detail

  openCreateModal: () => set({ isFormOpen: true, isDetailOpen: false, selectedType: null }),
  
  openEditModal: (type) => set({ isFormOpen: true, isDetailOpen: false, selectedType: type }),
  
  openDetailModal: (type) => set({ isDetailOpen: true, isFormOpen: false, selectedType: type }),
  
  closeModals: () => set({ isFormOpen: false, isDetailOpen: false, selectedType: null }),
}))