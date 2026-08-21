import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useCustomerStore = create(
  devtools(
    (set, get) => ({
      // ==================== FILTERS ====================
      filters: { search: '', perPage: 20 },
      currentPage: 1,

      // ==================== MODALS ====================
      modals: {
        form: false,           // Create / Edit customer
        tagihan: false,        // List tagihan (daily/pesanan)
        tagihanDetail: false,  // ✅ BARU: Detail 1 tagihan
        detail: false,         // Detail customer (untuk CustomerDetail.jsx)
        bayar: false,          // Form pembayaran
      },
      selectedItem: null,      // Customer (untuk form, detail, tagihan list)
      tagihanFilter: null,     // 'daily' | 'pesanan'
      tagihanDetail: null,     // ✅ BARU: TransaksiDetail yang dilihat detailnya
      bayarDetail: null,       // TransaksiDetail yang akan dibayar

      // ==================== FILTERS ACTIONS ====================
      setSearch: (search) =>
        set((s) => ({ filters: { ...s.filters, search }, currentPage: 1 }), false, 'setSearch'),

      setCurrentPage: (page) => set({ currentPage: page }, false, 'setCurrentPage'),

      resetFilters: () =>
        set({ filters: { search: '', perPage: 20 }, currentPage: 1 }, false, 'resetFilters'),

      // ==================== MODAL ACTIONS ====================
      openCreateModal: () =>
        set({
          modals: { form: true, tagihan: false, tagihanDetail: false, detail: false, bayar: false },
          selectedItem: null,
          tagihanFilter: null,
          tagihanDetail: null,
          bayarDetail: null,
        }, false, 'openCreateModal'),

      openEditModal: (customer) =>
        set({
          modals: { form: true, tagihan: false, tagihanDetail: false, detail: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          tagihanDetail: null,
          bayarDetail: null,
        }, false, 'openEditModal'),

      openDetailModal: (customer) =>
        set({
          modals: { form: false, tagihan: false, tagihanDetail: false, detail: true, bayar: false },
          selectedItem: customer,
          tagihanFilter: null,
          tagihanDetail: null,
          bayarDetail: null,
        }, false, 'openDetailModal'),

      // ✅ List tagihan (dari klik "Harian: Rp xxx" atau "Pesanan: Rp xxx")
      openTagihanModal: (customer, filter = null) =>
        set({
          modals: { form: false, tagihan: true, tagihanDetail: false, detail: false, bayar: false },
          selectedItem: customer,
          tagihanFilter: filter,
          tagihanDetail: null,
          bayarDetail: null,
        }, false, 'openTagihanModal'),

      // ✅ BARU: Detail 1 tagihan (dari klik card di TagihanModal)
      openTagihanDetailModal: (detail) =>
        set({
          modals: { form: false, tagihan: false, tagihanDetail: true, detail: false, bayar: false },
          tagihanDetail: detail,
          bayarDetail: null,
        }, false, 'openTagihanDetailModal'),

      // ✅ Buka modal bayar (dari TagihanDetailModal)
      openBayarModal: (detail) =>
        set({
          modals: { form: false, tagihan: false, tagihanDetail: false, detail: false, bayar: true },
          bayarDetail: detail,
        }, false, 'openBayarModal'),

      // ✅ Close pembayaran saja (kembali ke detail)
      closePembayaranModal: () =>
        set((s) => ({
          modals: { ...s.modals, bayar: false },
          bayarDetail: null,
        }), false, 'closePembayaranModal'),

      closeAllModals: () =>
        set({
          modals: { form: false, tagihan: false, tagihanDetail: false, detail: false, bayar: false },
          selectedItem: null,
          tagihanFilter: null,
          tagihanDetail: null,
          bayarDetail: null,
        }, false, 'closeAllModals'),

      // ==================== GETTERS ====================
      getQueryParams: () => {
        const { filters, currentPage } = get();
        return {
          search: filters.search || undefined,
          perPage: filters.perPage,
          page: currentPage,
        };
      },

      hasActiveSearch: () => Boolean(get().filters.search),
    }),
    { name: 'CustomerStore', enabled: import.meta.env.DEV }
  )
);

// ==================== EXPORTED SELECTORS ====================
export const useCustomerFilters = () =>
  useCustomerStore(useShallow((s) => ({
    filters: s.filters,
    currentPage: s.currentPage,
    setSearch: s.setSearch,
    setCurrentPage: s.setCurrentPage,
    resetFilters: s.resetFilters,
    hasActiveSearch: s.hasActiveSearch,
    getQueryParams: s.getQueryParams,
  })));

export const useCustomerModals = () =>
  useCustomerStore(useShallow((s) => ({
    modals: s.modals,
    selectedItem: s.selectedItem,
    tagihanFilter: s.tagihanFilter,
    tagihanDetail: s.tagihanDetail,   // ✅ BARU
    bayarDetail: s.bayarDetail,
    openCreateModal: s.openCreateModal,
    openEditModal: s.openEditModal,
    openDetailModal: s.openDetailModal,
    openTagihanModal: s.openTagihanModal,
    openTagihanDetailModal: s.openTagihanDetailModal,  // ✅ BARU
    openBayarModal: s.openBayarModal,
    closePembayaranModal: s.closePembayaranModal,       // ✅ BARU
    closeAllModals: s.closeAllModals,
  })));