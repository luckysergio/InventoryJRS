import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useDashboardStore = create(
  devtools(
    (set, get) => ({
      period: 'daily',
      customFrom: null,
      customTo: null,
      chartMonths: 6,
      realtime: true, // ✅ Default TRUE - real-time always active

      setPeriod: (period) =>
        set({ period }, false, 'setPeriod'),

      setCustomRange: (from, to) =>
        set({ customFrom: from, customTo: to }, false, 'setCustomRange'),

      setChartMonths: (months) =>
        set({ chartMonths: months }, false, 'setChartMonths'),

      toggleRealtime: () =>
        set((state) => ({ realtime: !state.realtime }), false, 'toggleRealtime'),

      setRealtime: (value) =>
        set({ realtime: value }, false, 'setRealtime'),

      resetFilters: () =>
        set({
          period: 'daily',
          customFrom: null,
          customTo: null,
          chartMonths: 6,
          realtime: true, // ✅ Reset juga ke true
        }, false, 'resetFilters'),

      getQueryParams: () => {
        const { period, customFrom, customTo, chartMonths, realtime } = get();
        
        const params = {
          period,
          months: chartMonths,
        };

        if (period === 'custom' && customFrom && customTo) {
          params.from = customFrom;
          params.to = customTo;
        }

        if (realtime) {
          params.realtime = 1;
        }

        return params;
      },

      getPeriodLabel: () => {
        const { period } = get();
        const labels = {
          daily: 'Harian',
          weekly: 'Mingguan',
          monthly: 'Bulanan',
          yearly: 'Tahunan',
          custom: 'Custom Range',
          all: 'Semua Waktu',
        };
        return labels[period] || 'Harian';
      },
    }),
    { name: 'DashboardStore', enabled: import.meta.env.DEV }
  )
);

export const useDashboardFilters = () =>
  useDashboardStore(useShallow((s) => ({
    period: s.period,
    customFrom: s.customFrom,
    customTo: s.customTo,
    chartMonths: s.chartMonths,
    realtime: s.realtime,
    setPeriod: s.setPeriod,
    setCustomRange: s.setCustomRange,
    setChartMonths: s.setChartMonths,
    toggleRealtime: s.toggleRealtime,
    setRealtime: s.setRealtime,
    resetFilters: s.resetFilters,
    getQueryParams: s.getQueryParams,
    getPeriodLabel: s.getPeriodLabel,
  })));