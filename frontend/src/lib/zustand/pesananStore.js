import { create } from 'zustand';

export const usePesananFilters = create((set, get) => ({
  filters: {
    mode: 'aktif',
    search: '',
    customer_id: null,
    dari: '',
    sampai: '',
  },
  currentPage: 1,

  setMode: (mode) => set((s) => ({ filters: { ...s.filters, mode }, currentPage: 1 })),
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 })),
  setCustomerId: (customer_id) => set((s) => ({ filters: { ...s.filters, customer_id }, currentPage: 1 })),
  setDateRange: (dari, sampai) => set((s) => ({ filters: { ...s.filters, dari, sampai }, currentPage: 1 })),
  setCurrentPage: (currentPage) => set({ currentPage }),

  resetFilters: () => set({
    filters: { mode: 'aktif', search: '', customer_id: null, dari: '', sampai: '' },
    currentPage: 1,
  }),

  hasActiveFilters: () => {
    const f = get().filters;
    return Boolean(f.search || f.customer_id || f.dari || f.sampai);
  },

  getQueryParams: () => {
    const { filters, currentPage } = get();
    const params = { page: currentPage, per_page: 20 };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params[k] = v;
    });
    return params;
  },
}));

export const usePesananModals = create((set) => ({
  modals: {
    form: false,
    detail: false,
    pembayaran: false,
  },
  selectedPesanan: null,
  selectedDetail: null,

  openFormModal: (pesanan = null) => set({
    modals: { form: true, detail: false, pembayaran: false },
    selectedPesanan: pesanan,
  }),
  closeFormModal: () => set((s) => ({
    modals: { ...s.modals, form: false },
    selectedPesanan: null,
  })),

  openDetailModal: (pesanan) => set({
    modals: { form: false, detail: true, pembayaran: false },
    selectedPesanan: pesanan,
  }),
  closeDetailModal: () => set((s) => ({
    modals: { ...s.modals, detail: false },
    selectedPesanan: null,
  })),

  openPembayaranModal: (detail) => set({
    modals: { form: false, detail: false, pembayaran: true },
    selectedDetail: detail,
  }),
  closePembayaranModal: () => set((s) => ({
    modals: { ...s.modals, pembayaran: false },
    selectedDetail: null,
  })),

  closeAllModals: () => set({
    modals: { form: false, detail: false, pembayaran: false },
    selectedPesanan: null,
    selectedDetail: null,
  }),
}));