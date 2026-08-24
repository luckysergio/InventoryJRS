import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useTransaksiStore = create(
  devtools(
    (set, get) => ({
      aktifFilters: {
        search: '',
        perPage: 20,
      },
      aktifCurrentPage: 1,

      riwayatFilters: {
        search: '',
        jenis: 'all',
        status: 'all',
        customer_id: '',
        dari: '',
        sampai: '',
        perPage: 20,
      },
      riwayatCurrentPage: 1,

      modals: {
        form: false,
        detail: false,
        pembayaran: false,
      },
      selectedTransaksi: null,
      selectedDetail: null,

      setAktifSearch: (search) =>
        set((s) => ({
          aktifFilters: { ...s.aktifFilters, search },
          aktifCurrentPage: 1,
        }), false, 'setAktifSearch'),

      setAktifCurrentPage: (page) =>
        set({ aktifCurrentPage: page }, false, 'setAktifCurrentPage'),

      resetAktifFilters: () =>
        set({
          aktifFilters: { search: '', perPage: 20 },
          aktifCurrentPage: 1,
        }, false, 'resetAktifFilters'),

      setRiwayatSearch: (search) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, search },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatSearch'),

      setRiwayatJenis: (jenis) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, jenis },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatJenis'),

      setRiwayatStatus: (status) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, status },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatStatus'),

      setRiwayatCustomerId: (customer_id) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, customer_id },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatCustomerId'),

      setRiwayatDari: (dari) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, dari },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatDari'),

      setRiwayatSampai: (sampai) =>
        set((s) => ({
          riwayatFilters: { ...s.riwayatFilters, sampai },
          riwayatCurrentPage: 1,
        }), false, 'setRiwayatSampai'),

      setRiwayatCurrentPage: (page) =>
        set({ riwayatCurrentPage: page }, false, 'setRiwayatCurrentPage'),

      resetRiwayatFilters: () =>
        set({
          riwayatFilters: {
            search: '',
            jenis: 'all',
            status: 'all',
            customer_id: '',
            dari: '',
            sampai: '',
            perPage: 20,
          },
          riwayatCurrentPage: 1,
        }, false, 'resetRiwayatFilters'),

      openFormModal: (transaksi = null) =>
        set({
          modals: { form: true, detail: false, pembayaran: false },
          selectedTransaksi: transaksi,
          selectedDetail: null,
        }, false, 'openFormModal'),

      openDetailModal: (transaksi) =>
        set({
          modals: { form: false, detail: true, pembayaran: false },
          selectedTransaksi: transaksi,
          selectedDetail: null,
        }, false, 'openDetailModal'),

      openPembayaranModal: (detail) =>
        set((s) => ({
          modals: { ...s.modals, pembayaran: true },
          selectedDetail: detail,
        }), false, 'openPembayaranModal'),

      closeAllModals: () =>
        set({
          modals: { form: false, detail: false, pembayaran: false },
          selectedTransaksi: null,
          selectedDetail: null,
        }, false, 'closeAllModals'),

      closePembayaranModal: () =>
        set((s) => ({
          modals: { ...s.modals, pembayaran: false },
          selectedDetail: null,
        }), false, 'closePembayaranModal'),

      getAktifQueryParams: () => {
        const { aktifFilters, aktifCurrentPage } = get();
        return {
          mode: 'aktif',
          search: aktifFilters.search || undefined,
          perPage: aktifFilters.perPage,
          page: aktifCurrentPage,
        };
      },

      getRiwayatQueryParams: () => {
        const { riwayatFilters, riwayatCurrentPage } = get();
        const params = {
          mode: 'riwayat_all',
          perPage: riwayatFilters.perPage,
          page: riwayatCurrentPage,
        };

        if (riwayatFilters.search) params.search = riwayatFilters.search;
        if (riwayatFilters.jenis && riwayatFilters.jenis !== 'all') params.jenis = riwayatFilters.jenis;
        if (riwayatFilters.customer_id) params.customer_id = riwayatFilters.customer_id;
        if (riwayatFilters.dari) params.dari = riwayatFilters.dari;
        if (riwayatFilters.sampai) params.sampai = riwayatFilters.sampai;

        return params;
      },

      hasAktiveActiveFilters: () => Boolean(get().aktifFilters.search),
      hasRiwayatActiveFilters: () => {
        const f = get().riwayatFilters;
        return Boolean(
          f.search ||
          (f.jenis && f.jenis !== 'all') ||
          (f.status && f.status !== 'all') ||
          f.customer_id ||
          f.dari ||
          f.sampai
        );
      },
    }),
    { name: 'TransaksiStore', enabled: import.meta.env.DEV }
  )
);

export const useTransaksiAktifFilters = () =>
  useTransaksiStore(useShallow((s) => ({
    filters: s.aktifFilters,
    currentPage: s.aktifCurrentPage,
    setSearch: s.setAktifSearch,
    setCurrentPage: s.setAktifCurrentPage,
    resetFilters: s.resetAktifFilters,
    hasActiveFilters: s.hasAktiveActiveFilters,
    getQueryParams: s.getAktifQueryParams,
  })));

export const useTransaksiRiwayatFilters = () =>
  useTransaksiStore(useShallow((s) => ({
    filters: s.riwayatFilters,
    currentPage: s.riwayatCurrentPage,
    setSearch: s.setRiwayatSearch,
    setJenis: s.setRiwayatJenis,
    setStatus: s.setRiwayatStatus,
    setCustomerId: s.setRiwayatCustomerId,
    setDari: s.setRiwayatDari,
    setSampai: s.setRiwayatSampai,
    setCurrentPage: s.setRiwayatCurrentPage,
    resetFilters: s.resetRiwayatFilters,
    hasActiveFilters: s.hasRiwayatActiveFilters,
    getQueryParams: s.getRiwayatQueryParams,
  })));

export const useTransaksiModals = () =>
  useTransaksiStore(useShallow((s) => ({
    modals: s.modals,
    selectedTransaksi: s.selectedTransaksi,
    selectedDetail: s.selectedDetail,
    openFormModal: s.openFormModal,
    openDetailModal: s.openDetailModal,
    openPembayaranModal: s.openPembayaranModal,
    closeAllModals: s.closeAllModals,
    closePembayaranModal: s.closePembayaranModal,
  })));