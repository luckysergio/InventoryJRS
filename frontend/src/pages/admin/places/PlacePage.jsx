import { useState, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, Eye, MapPin, ShieldAlert,
} from "lucide-react";
import { usePlaces, useDeletePlace } from "../../../hooks/usePlaces";
import { usePlaceFilters, usePlaceModals } from "../../../lib/zustand/placeStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import { cn } from "../../../lib/utils";
import PlaceForm from "./PlaceForm";
import PlaceDetail from "./PlaceDetail";

// ==========================================
// PLACE CARD
// ==========================================
const PlaceCard = ({ item, isAdmin, onDetail, onEdit, onDelete }) => {
  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full">
      <div className="flex flex-col items-center text-center pt-5 px-4 pb-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white mb-3 group-hover:scale-105 transition-transform duration-300">
          {item.kode?.slice(0, 2) || "?"}
        </div>

        <h3 className="text-sm font-bold text-slate-900 truncate w-full" title={item.nama}>
          {item.nama}
        </h3>

        <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full">
          <MapPin size={12} className="text-slate-500" />
          <span className="text-[11px] font-mono font-semibold text-slate-600">{item.kode}</span>
        </div>
      </div>

      {item.keterangan && (
        <div className="px-4 pb-3 flex-1">
          <p className="text-xs text-slate-500 text-center line-clamp-2 italic">"{item.keterangan}"</p>
        </div>
      )}

      {!item.keterangan && <div className="flex-1" />}

      {/* Action Buttons - hover reveal */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onDetail} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail"><Eye size={14} /></button>
        {isAdmin && <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil size={14} /></button>}
        {isAdmin && <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const PlacePage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = usePlaceFilters();
  const { openCreateModal, openEditModal, openDetailModal } = usePlaceModals();
  const { danger, success, info, warning } = useConfirmDialog();
  const isAdmin = useIsAdmin();

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = usePlaces(getQueryParams());
  const deleteMut = useDeletePlace();

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const places = data?.places || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const from = meta.from || 0;
  const to = meta.to || 0;
  const isFilterActive = hasActiveFilters();

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  const handleDelete = async (item) => {
    const confirmed = await danger("Hapus Tempat?", `Apakah Anda yakin ingin menghapus "${item.nama}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;
    try {
      await deleteMut.mutateAsync(item.id);
      await success("Berhasil!", `Tempat "${item.nama}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus tempat";
      await (err.response?.status === 422 ? warning : info)(err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari nama atau kode tempat..." className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all bg-white" />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"><X className="w-4 h-4" /> Reset</button>}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50" title="Refresh">
                <span className={cn("transition-transform", isFetching && "animate-spin")}><RefreshCw className="w-4 h-4" /></span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-200 rounded-full mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-5 bg-slate-200 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><MapPin className="w-10 h-10 text-slate-400" /></div>
          <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada tempat yang cocok" : "Belum ada data tempat"}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{isFilterActive ? "Coba ubah kata kunci pencarian atau reset filter" : "Mulai dengan menambahkan tempat baru untuk mengelola lokasi stok"}</p>
          {isFilterActive && <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Reset Filter</button>}
        </div>
      ) : (
        <>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {places.map((item) => (
              <PlaceCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onDetail={() => openDetailModal(item)}
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pb-4 flex-wrap">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}>← Prev</button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && <><button onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">1</button>{paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}</>}
                {paginationNumbers.map((p) => <button key={p} onClick={() => setCurrentPage(p)} disabled={isFetching} className={cn("w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === p ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50")}>{p}</button>)}
                {paginationNumbers[paginationNumbers.length - 1] < lastPage && <>{paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-1 text-slate-400">…</span>}<button onClick={() => setCurrentPage(lastPage)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">{lastPage}</button></>}
              </div>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === lastPage ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      {isAdmin && (
        <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" aria-label="Tambah Tempat" title="Tambah Tempat">
          <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 active:scale-95 hover:scale-110"><Plus className="w-6 h-6" strokeWidth={2.5} /></div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Tambah Tempat<div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" /></div>
        </button>
      )}

      <PlaceForm />
      <PlaceDetail />
    </div>
  );
};

export default PlacePage;