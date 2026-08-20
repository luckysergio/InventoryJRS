import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useStokOpnameStore = create(
  devtools(
    (set, get) => ({
      // Filter untuk halaman Draft (StokOpnamePage)
      draftFilters: {
        search: '',
        perPage: 20,
      },
      draftCurrentPage: 1,

      // Filter untuk halaman Riwayat (RiwayatSOPage)
      riwayatFilters: {
        status: '',
        dari: '',
        sampai: '',
        perPage: 20,
      },
      riwayatCurrentPage: 1,

      // Modals
      modals: {
        create: false,
        detail: false,
        inputStok: false,
      },
      selectedOpname: null,
      selectedDetail: null,

      // Draft Filters
      setDraftSearch: (search) =>
        set((s) => ({ draftFilters: { ...s.draftFilters, search }, draftCurrentPage: 1 }), false, 'setDraftSearch'),

      setDraftCurrentPage: (page) => set({ draftCurrentPage: page }, false, 'setDraftCurrentPage'),

      resetDraftFilters: () =>
        set({ draftFilters: { search: '', perPage: 20 }, draftCurrentPage: 1 }, false, 'resetDraftFilters'),

      // Riwayat Filters
      setRiwayatStatus: (status) =>
        set((s) => ({ riwayatFilters: { ...s.riwayatFilters, status }, riwayatCurrentPage: 1 }), false, 'setRiwayatStatus'),

      setRiwayatDari: (dari) =>
        set((s) => ({ riwayatFilters: { ...s.riwayatFilters, dari }, riwayatCurrentPage: 1 }), false, 'setRiwayatDari'),

      setRiwayatSampai: (sampai) =>
        set((s) => ({ riwayatFilters: { ...s.riwayatFilters, sampai }, riwayatCurrentPage: 1 }), false, 'setRiwayatSampai'),

      setRiwayatCurrentPage: (page) => set({ riwayatCurrentPage: page }, false, 'setRiwayatCurrentPage'),

      resetRiwayatFilters: () =>
        set({
          riwayatFilters: { status: '', dari: '', sampai: '', perPage: 20 },
          riwayatCurrentPage: 1,
        }, false, 'resetRiwayatFilters'),

      // Modals
      openCreateModal: () =>
        set({ modals: { create: true, detail: false, inputStok: false }, selectedOpname: null, selectedDetail: null }, false, 'openCreateModal'),

      openDetailModal: (opname) =>
        set({ modals: { create: false, detail: true, inputStok: false }, selectedOpname: opname, selectedDetail: null }, false, 'openDetailModal'),

      openInputStokModal: (detail) =>
        set((s) => ({ modals: { ...s.modals, inputStok: true }, selectedDetail: detail }), false, 'openInputStokModal'),

      closeAllModals: () =>
        set({ modals: { create: false, detail: false, inputStok: false }, selectedOpname: null, selectedDetail: null }, false, 'closeAllModals'),

      closeInputStokModal: () =>
        set((s) => ({ modals: { ...s.modals, inputStok: false }, selectedDetail: null }), false, 'closeInputStokModal'),

      // Getters
      getDraftQueryParams: () => {
        const { draftFilters, draftCurrentPage } = get();
        return {
          status: 'draft',
          search: draftFilters.search || undefined,
          perPage: draftFilters.perPage,
          page: draftCurrentPage,
        };
      },

      getRiwayatQueryParams: () => {
        const { riwayatFilters, riwayatCurrentPage } = get();
        return {
          status: riwayatFilters.status || undefined,
          dari: riwayatFilters.dari || undefined,
          sampai: riwayatFilters.sampai || undefined,
          perPage: riwayatFilters.perPage,
          page: riwayatCurrentPage,
          exclude_draft: true,
        };
      },

      hasActiveDraftFilters: () => Boolean(get().draftFilters.search),
      hasActiveRiwayatFilters: () => {
        const f = get().riwayatFilters;
        return Boolean(f.status || f.dari || f.sampai);
      },
    }),
    { name: 'StokOpnameStore', enabled: import.meta.env.DEV }
  )
);

export const useStokOpnameDraftFilters = () =>
  useStokOpnameStore(useShallow((s) => ({
    filters: s.draftFilters,
    currentPage: s.draftCurrentPage,
    setSearch: s.setDraftSearch,
    setCurrentPage: s.setDraftCurrentPage,
    resetFilters: s.resetDraftFilters,
    hasActiveFilters: s.hasActiveDraftFilters,
    getQueryParams: s.getDraftQueryParams,
  })));

export const useStokOpnameRiwayatFilters = () =>
  useStokOpnameStore(useShallow((s) => ({
    filters: s.riwayatFilters,
    currentPage: s.riwayatCurrentPage,
    setStatus: s.setRiwayatStatus,
    setDari: s.setRiwayatDari,
    setSampai: s.setRiwayatSampai,
    setCurrentPage: s.setRiwayatCurrentPage,
    resetFilters: s.resetRiwayatFilters,
    hasActiveFilters: s.hasActiveRiwayatFilters,
    getQueryParams: s.getRiwayatQueryParams,
  })));

export const useStokOpnameModals = () =>
  useStokOpnameStore(useShallow((s) => ({
    modals: s.modals,
    selectedOpname: s.selectedOpname,
    selectedDetail: s.selectedDetail,
    openCreateModal: s.openCreateModal,
    openDetailModal: s.openDetailModal,
    openInputStokModal: s.openInputStokModal,
    closeAllModals: s.closeAllModals,
    closeInputStokModal: s.closeInputStokModal,
  })));