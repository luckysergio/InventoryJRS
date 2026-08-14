import { create } from 'zustand'

export const useDistributorStore = create((set) => ({
  isFormOpen: false,
  selectedDistributor: null,

  openCreateModal: () => set({ isFormOpen: true, selectedDistributor: null }),
  
  openEditModal: (distributor) => set({ isFormOpen: true, selectedDistributor: distributor }),
  
  closeModals: () => set({ isFormOpen: false, selectedDistributor: null }),
}))