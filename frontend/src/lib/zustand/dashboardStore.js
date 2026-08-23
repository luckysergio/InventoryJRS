import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

const MAX_LOGIN_LOGS = 50;

export const useDashboardStore = create(
  devtools(
    (set, get) => ({
      // ==========================================
      // PERIOD FILTERS (GLOBAL: stats + login logs)
      // ==========================================
      period: 'daily',
      customFrom: null,
      customTo: null,
      chartMonths: 6,
      realtime: true,

      // ==========================================
      // REAL-TIME STATE
      // ==========================================
      connectionStatus: 'disconnected',
      lastEvent: null,

      // ==========================================
      // LOGIN LOGS (realtime buffer)
      // ==========================================
      loginLogs: [],
      loginStats: {
        period: 'daily',
        range: null,
        summary: {
          total_attempts: 0,
          successful: 0,
          failed: 0,
          success_rate: 0,
          unique_ips: 0,
          unique_users: 0,
        },
        top_failed_ips: [],
        last_activity: null,
        cached_at: null,
      },

      // ==========================================
      // LOGIN LOGS FILTERS
      // ✅ TANPA period/from/to — period ikut PeriodSelector global
      // ==========================================
      loginLogsFilter: {
        page: 1,
        perPage: 10,
        search: '',
        success: '',
        ip: '',
      },

      // ==========================================
      // PERIOD ACTIONS (reset page login logs saat period berubah)
      // ==========================================
      setPeriod: (period) =>
        set(
          (state) => ({
            period,
            loginLogsFilter: { ...state.loginLogsFilter, page: 1 },
          }),
          false,
          'setPeriod'
        ),

      setCustomRange: (from, to) =>
        set(
          (state) => ({
            customFrom: from,
            customTo: to,
            loginLogsFilter: { ...state.loginLogsFilter, page: 1 },
          }),
          false,
          'setCustomRange'
        ),

      setChartMonths: (months) =>
        set({ chartMonths: months }, false, 'setChartMonths'),

      toggleRealtime: () =>
        set((state) => ({ realtime: !state.realtime }), false, 'toggleRealtime'),

      setRealtime: (value) =>
        set({ realtime: value }, false, 'setRealtime'),

      resetFilters: () =>
        set(
          (state) => ({
            period: 'daily',
            customFrom: null,
            customTo: null,
            chartMonths: 6,
            realtime: true,
            loginLogsFilter: { ...state.loginLogsFilter, page: 1 },
          }),
          false,
          'resetFilters'
        ),

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
      setLoginLogs: (logs) =>
        set({ loginLogs: Array.isArray(logs) ? logs : [] }, false, 'setLoginLogs'),

      addLoginLog: (log) =>
        set(
          (state) => ({
            loginLogs: [log, ...state.loginLogs].slice(0, MAX_LOGIN_LOGS),
          }),
          false,
          'addLoginLog'
        ),

      clearLoginLogs: () =>
        set({ loginLogs: [] }, false, 'clearLoginLogs'),

      setLoginStats: (stats) =>
        set({ loginStats: stats }, false, 'setLoginStats'),

      setLoginLogsFilter: (updates) =>
        set(
          (state) => ({
            loginLogsFilter: { ...state.loginLogsFilter, ...updates },
          }),
          false,
          'setLoginLogsFilter'
        ),

      setLoginLogsPage: (page) =>
        set(
          (state) => ({
            loginLogsFilter: { ...state.loginLogsFilter, page },
          }),
          false,
          'setLoginLogsPage'
        ),

      setLoginLogsSearch: (search) =>
        set(
          (state) => ({
            loginLogsFilter: { ...state.loginLogsFilter, search, page: 1 },
          }),
          false,
          'setLoginLogsSearch'
        ),

      setLoginLogsSuccessFilter: (success) =>
        set(
          (state) => ({
            loginLogsFilter: { ...state.loginLogsFilter, success, page: 1 },
          }),
          false,
          'setLoginLogsSuccessFilter'
        ),

      resetLoginLogsFilter: () =>
        set(
          {
            loginLogsFilter: { page: 1, perPage: 10, search: '', success: '', ip: '' },
          },
          false,
          'resetLoginLogsFilter'
        ),

      // ==========================================
      // HELPERS
      // ==========================================
      getQueryParams: () => {
        const { period, customFrom, customTo, chartMonths, realtime } = get();

        const params = { period, months: chartMonths };

        if (period === 'custom' && customFrom && customTo) {
          params.from = customFrom;
          params.to = customTo;
        }

        if (realtime) params.realtime = 1;

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

// ==========================================
// SELECTORS
// ==========================================

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

export const useDashboardRealtimeState = () =>
  useDashboardStore(useShallow((s) => ({
    connectionStatus: s.connectionStatus,
    lastEvent: s.lastEvent,
    setConnectionStatus: s.setConnectionStatus,
    setLastEvent: s.setLastEvent,
    clearLastEvent: s.clearLastEvent,
  })));

export const useDashboardLoginLogs = () =>
  useDashboardStore(useShallow((s) => ({
    loginLogs: s.loginLogs,
    loginStats: s.loginStats,
    loginLogsFilter: s.loginLogsFilter,
    setLoginLogs: s.setLoginLogs,
    addLoginLog: s.addLoginLog,
    clearLoginLogs: s.clearLoginLogs,
    setLoginStats: s.setLoginStats,
    setLoginLogsFilter: s.setLoginLogsFilter,
    setLoginLogsPage: s.setLoginLogsPage,
    setLoginLogsSearch: s.setLoginLogsSearch,
    setLoginLogsSuccessFilter: s.setLoginLogsSuccessFilter,
    resetLoginLogsFilter: s.resetLoginLogsFilter,
  })));