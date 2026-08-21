import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useBestSellerStore = create(
  devtools(
    (set, get) => ({
      // ==================== FILTERS ====================
      filters: {
        dari: '',
        sampai: '',
        jenis: 'all',     // all | daily | pesanan
        limit: 20,
      },

      // ==================== FILTERS ACTIONS ====================
      setDari: (dari) =>
        set((s) => ({
          filters: { ...s.filters, dari },
        }), false, 'setDari'),

      setSampai: (sampai) =>
        set((s) => ({
          filters: { ...s.filters, sampai },
        }), false, 'setSampai'),

      setJenis: (jenis) =>
        set((s) => ({
          filters: { ...s.filters, jenis },
        }), false, 'setJenis'),

      setLimit: (limit) =>
        set((s) => ({
          filters: { ...s.filters, limit: Math.max(1, Math.min(100, limit)) },
        }), false, 'setLimit'),

      setFilterRange: (dari, sampai) =>
        set((s) => ({
          filters: { ...s.filters, dari, sampai },
        }), false, 'setFilterRange'),

      resetFilters: () =>
        set({
          filters: {
            dari: '',
            sampai: '',
            jenis: 'all',
            limit: 20,
          },
        }, false, 'resetFilters'),

      // ==================== GETTERS ====================
      getQueryParams: () => {
        const { filters } = get();
        return {
          dari: filters.dari || undefined,
          sampai: filters.sampai || undefined,
          jenis: filters.jenis && filters.jenis !== 'all' ? filters.jenis : undefined,
          limit: filters.limit,
        };
      },

      hasActiveFilters: () => {
        const f = get().filters;
        return Boolean(
          f.dari ||
          f.sampai ||
          (f.jenis && f.jenis !== 'all')
        );
      },

      getPeriodeLabel: () => {
        const { dari, sampai } = get().filters;
        if (dari && sampai) {
          const d = new Date(dari).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          const s = new Date(sampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          return `${d} - ${s}`;
        }
        if (dari) {
          return `Mulai ${new Date(dari).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        if (sampai) {
          return `Sampai ${new Date(sampai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        }
        return 'Semua Waktu';
      },
    }),
    { name: 'BestSellerStore', enabled: import.meta.env.DEV }
  )
);

// ==================== EXPORTED SELECTORS ====================
export const useBestSellerFilters = () =>
  useBestSellerStore(useShallow((s) => ({
    filters: s.filters,
    setDari: s.setDari,
    setSampai: s.setSampai,
    setJenis: s.setJenis,
    setLimit: s.setLimit,
    setFilterRange: s.setFilterRange,
    resetFilters: s.resetFilters,
    hasActiveFilters: s.hasActiveFilters,
    getQueryParams: s.getQueryParams,
    getPeriodeLabel: s.getPeriodeLabel,
  })));