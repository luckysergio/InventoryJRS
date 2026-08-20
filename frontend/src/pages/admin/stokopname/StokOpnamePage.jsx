import { useState, useMemo, useCallback } from "react";
import {
  Search, X, RefreshCw, Plus, Package, Calendar, User,
  Printer, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useStokOpnames } from "../../../hooks/useStokOpname";
import { useStokOpnameDraftFilters, useStokOpnameModals } from "../../../lib/zustand/stokOpnameStore";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import { printStokOpname } from "./utils/printStokOpname";
import {
  normalizeDetails,
  getOpnameLabel,
  getFilledCount,
  formatProductName,
} from "./utils/stokOpnameUtils";
import { cn } from "../../../lib/utils";
import StokOpnameForm from "./StokOpnameForm";
import StokOpnameDetail from "./StokOpnameDetail";

// ==========================================
// OPNAME CARD (Draft)
// ==========================================
const OpnameCard = ({ opname, isAdmin, onOpenDetail, onPrint }) => {
  // ✅ NORMALIZE details agar d.product & d.place tersedia (flat)
  const details = normalizeDetails(opname.details || []);
  const totalItems = details.length;
  const filledItems = getFilledCount(details);
  const unfilledItems = totalItems - filledItems;
  const progress = totalItems > 0 ? (filledItems / totalItems) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {getOpnameLabel(opname)}
            </h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(opname.tgl_opname).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <User size={11} />
                {opname.user?.name || "-"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onPrint(opname)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs rounded-lg transition-colors"
              title="Cetak"
            >
              <Printer size={14} /> Cetak
            </button>
            <button
              onClick={() => onOpenDetail(opname)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
            >
              Buka Detail
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="font-medium">{filledItems}/{totalItems}</span> item terisi
            </span>
            {unfilledItems > 0 && (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle size={12} />
                {unfilledItems} belum
              </span>
            )}
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-green-500" : "bg-indigo-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Preview Items */}
      {details.length > 0 && (
        <div className="p-4 bg-slate-50/50">
          <div className="flex flex-wrap gap-1.5">
            {details.slice(0, 5).map((d) => {
              const hasStok = d.stok_real !== null && d.stok_real !== undefined;
              const selisih = Number(d.selisih) || 0;
              // ✅ Gunakan d.product?.kode (hasil normalize), BUKAN d.inventory?.product?.kode
              const productCode = d.product?.kode || "?";
              const productName = formatProductName(d.product);
              return (
                <span
                  key={d.id}
                  title={productName}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                    !hasStok ? "bg-slate-200 text-slate-600" :
                    selisih === 0 ? "bg-slate-200 text-slate-700" :
                    selisih > 0 ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}
                >
                  {productCode}
                </span>
              );
            })}
            {details.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                +{details.length - 5} lainnya
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const StokOpnamePage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useStokOpnameDraftFilters();
  const { openCreateModal, openDetailModal } = useStokOpnameModals();
  const isAdmin = useIsAdmin();

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data, isLoading, isFetching, refetch } = useStokOpnames(getQueryParams());

  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const opnames = data?.opnames || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  return (
    <div className="space-y-4 pb-20">
      {/* Sticky Filter Bar */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari keterangan opname..."
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50">
                <span className={cn("transition-transform", isFetching && "animate-spin")}>
                  <RefreshCw className="w-4 h-4" />
                </span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-2 bg-slate-200 rounded w-full mb-3" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded-full w-12" />
                <div className="h-6 bg-slate-200 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : opnames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-indigo-600" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            {isFilterActive ? "Tidak ada opname yang cocok" : "Belum Ada Opname Aktif"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? "Coba ubah kata kunci pencarian atau reset filter"
              : "Buat stok opname baru untuk memulai proses pencocokan stok fisik dengan sistem"}
          </p>
          {!isFilterActive && isAdmin && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Plus size={16} /> Buat Opname Sekarang
            </button>
          )}
        </div>
      ) : (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opnames.map((op) => (
              <OpnameCard
                key={op.id}
                opname={op}
                isAdmin={isAdmin}
                onOpenDetail={openDetailModal}
                onPrint={(o) => printStokOpname(o, "draft")}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pb-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">1</button>
                    {paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                  </>
                )}
                {paginationNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={cn("w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === p ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50")}
                  >
                    {p}
                  </button>
                ))}
                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                  <>
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-1 text-slate-400">…</span>}
                    <button onClick={() => setCurrentPage(lastPage)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">{lastPage}</button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === lastPage || isFetching}
                className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === lastPage ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      {isAdmin && (
        <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" aria-label="Buat Stok Opname" title="Buat Stok Opname">
          <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Buat Opname
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
          </div>
        </button>
      )}

      <StokOpnameForm />
      <StokOpnameDetail />
    </div>
  );
};

export default StokOpnamePage;