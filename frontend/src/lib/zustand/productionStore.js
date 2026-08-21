import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useProductionStore = create(
  devtools(
    (set, get) => ({
      // ==================== FILTERS (Riwayat) ====================
      riwayatFilters: {
        dari: '',
        sampai: '',
      },

      setRiwayatDari: (dari) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, dari },
        }), false, 'setRiwayatDari'),

      setRiwayatSampai: (sampai) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, sampai },
        }), false, 'setRiwayatSampai'),

      resetRiwayatFilters: () =>
        set({ riwayatFilters: { dari: '', sampai: '' } }, false, 'resetRiwayatFilters'),

      getRiwayatQueryParams: () => {
        const f = get().riwayatFilters;
        return {
          dari: f.dari || undefined,
          sampai: f.sampai || undefined,
        };
      },

      hasRiwayatActiveFilters: () => {
        const f = get().riwayatFilters;
        return Boolean(f.dari || f.sampai);
      },

      getRiwayatPeriodeLabel: () => {
        const { dari, sampai } = get().riwayatFilters;
        const fmt = (d) => new Date(d).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
        });
        if (dari && sampai) return `${fmt(dari)} - ${fmt(sampai)}`;
        if (dari) return `Mulai ${fmt(dari)}`;
        if (sampai) return `Sampai ${fmt(sampai)}`;
        return 'Semua Waktu';
      },

      // ==================== MODALS ====================
      modals: {
        create: false,
        uploadFoto: false,
      },

      selectedProduction: null,
      selectedProductId: null,

      openCreateModal: () =>
        set((s) => ({
          modals: { ...s.modals, create: true },
        }), false, 'openCreateModal'),

      closeCreateModal: () =>
        set((s) => ({
          modals: { ...s.modals, create: false },
        }), false, 'closeCreateModal'),

      openUploadFotoModal: (productionId, productId) =>
        set((s) => ({
          modals: { ...s.modals, uploadFoto: true },
          selectedProduction: productionId,
          selectedProductId: productId,
        }), false, 'openUploadFotoModal'),

      closeUploadFotoModal: () =>
        set((s) => ({
          modals: { ...s.modals, uploadFoto: false },
          selectedProduction: null,
          selectedProductId: null,
        }), false, 'closeUploadFotoModal'),

      closeAllModals: () =>
        set({
          modals: { create: false, uploadFoto: false },
          selectedProduction: null,
          selectedProductId: null,
        }, false, 'closeAllModals'),
    }),
    { name: 'ProductionStore', enabled: import.meta.env.DEV }
  )
);

// ==================== EXPORTED SELECTORS ====================
export const useProductionFilters = () =>
  useProductionStore(useShallow((s) => ({
    riwayatFilters: s.riwayatFilters,
    setRiwayatDari: s.setRiwayatDari,
    setRiwayatSampai: s.setRiwayatSampai,
    resetRiwayatFilters: s.resetRiwayatFilters,
    getRiwayatQueryParams: s.getRiwayatQueryParams,
    hasRiwayatActiveFilters: s.hasRiwayatActiveFilters,
    getRiwayatPeriodeLabel: s.getRiwayatPeriodeLabel,
  })));

export const useProductionModals = () =>
  useProductionStore(useShallow((s) => ({
    modals: s.modals,
    selectedProduction: s.selectedProduction,
    selectedProductId: s.selectedProductId,
    openCreateModal: s.openCreateModal,
    closeCreateModal: s.closeCreateModal,
    openUploadFotoModal: s.openUploadFotoModal,
    closeUploadFotoModal: s.closeUploadFotoModal,
    closeAllModals: s.closeAllModals,
  })));