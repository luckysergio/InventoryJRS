import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

const MAX_LOGIN_LOGS = 20;

export const useDashboardStore = create(
  devtools(
    (set, get) => ({
      // ==========================================
      // PERIOD FILTERS
      // ==========================================
      period: 'daily',
      customFrom: null,
      customTo: null,
      chartMonths: 6,
      realtime: true,

      // ==========================================
      // REAL-TIME STATE
      // ==========================================
      connectionStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected' | 'error'
      lastEvent: null,

      // ==========================================
      // LOGIN LOGS
      // ==========================================
      loginLogs: [], // Array of login log objects
      loginStats: {
        today: {
          total_attempts: 0,
          successful: 0,
          failed: 0,
          success_rate: 0,
          unique_ips: 0,
          unique_users: 0,
        },
        last_activity: null,
        cached_at: null,
      },

      // ==========================================
      // PERIOD ACTIONS
      // ==========================================
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
          realtime: true,
        }, false, 'resetFilters'),

      // ==========================================
      // REAL-TIME ACTIONS
      // ==========================================
      setConnectionStatus: (status) =>
        set({ connectionStatus: status }, false, 'setConnectionStatus'),

      setLastEvent: (event) =>
        set({ lastEvent: event }, false, 'setLastEvent'),

      clearLastEvent: () =>
        set({ lastEvent: null }, false, 'clearLastEvent'),

      // ==========================================
      // LOGIN LOGS ACTIONS
      // ==========================================
      
      /**
       * Set initial login logs dari API response
       * @param {Array} logs - Array of login logs
       */
      setLoginLogs: (logs) =>
        set({ loginLogs: Array.isArray(logs) ? logs : [] }, false, 'setLoginLogs'),

      /**
       * Prepend new login log ke array (untuk real-time event)
       * @param {Object} log - New login log object
       */
      addLoginLog: (log) =>
        set(
          (state) => ({
            loginLogs: [log, ...state.loginLogs].slice(0, MAX_LOGIN_LOGS),
          }),
          false,
          'addLoginLog'
        ),

      /**
       * Clear semua login logs
       */
      clearLoginLogs: () =>
        set({ loginLogs: [] }, false, 'clearLoginLogs'),

      /**
       * Update login stats summary
       * @param {Object} stats - New stats object
       */
      setLoginStats: (stats) =>
        set({ loginStats: stats }, false, 'setLoginStats'),

      /**
       * Get formatted query params untuk API
       */
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

      /**
       * Get period label dalam bahasa Indonesia
       */
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

// ==========================================
// SELECTORS (Optimized with useShallow)
// ==========================================

/**
 * Selector untuk period filters
 */
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

/**
 * Selector untuk real-time state
 */
export const useDashboardRealtimeState = () =>
  useDashboardStore(useShallow((s) => ({
    connectionStatus: s.connectionStatus,
    lastEvent: s.lastEvent,
    setConnectionStatus: s.setConnectionStatus,
    setLastEvent: s.setLastEvent,
    clearLastEvent: s.clearLastEvent,
  })));

/**
 * Selector untuk login logs
 */
export const useDashboardLoginLogs = () =>
  useDashboardStore(useShallow((s) => ({
    loginLogs: s.loginLogs,
    loginStats: s.loginStats,
    setLoginLogs: s.setLoginLogs,
    addLoginLog: s.addLoginLog,
    clearLoginLogs: s.clearLoginLogs,
    setLoginStats: s.setLoginStats,
  })));