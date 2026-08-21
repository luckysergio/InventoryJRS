import { useState, useMemo, useCallback } from "react";
import {
  Search, X, RefreshCw, Calendar, ArrowDown, ArrowUp,
  Repeat, Factory, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useProductMovements } from "../../../hooks/useProductMovements";
import { useProductMovementFilters, useProductMovementModals } from "../../../lib/zustand/productMovementStore";
import { cn } from "../../../lib/utils";
import ProductMovementDetail from "./ProductMovementDetail";

const MOVEMENT_TYPES = [
  { value: "in", label: "IN", icon: ArrowDown, color: "text-green-700 bg-green-50 border-green-200" },
  { value: "out", label: "OUT", icon: ArrowUp, color: "text-red-700 bg-red-50 border-red-200" },
  { value: "transfer", label: "TRANSFER", icon: Repeat, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "produksi", label: "PRODUKSI", icon: Factory, color: "text-purple-700 bg-purple-50 border-purple-200" },
];

const getBadge = (tipe) => MOVEMENT_TYPES.find((t) => t.value === tipe) || {
  label: tipe?.toUpperCase() || "–",
  icon: null,
  color: "text-gray-700 bg-gray-50 border-gray-200",
};

const formatProductName = (product) => {
  if (!product) return "-";
  return [product.jenis?.nama, product.type?.nama, product.bahan?.nama, product.ukuran].filter(Boolean).join(" • ") || "-";
};

// ==========================================
// MOVEMENT CARD
// ==========================================
const MovementCard = ({ item, onClick }) => {
  const badge = getBadge(item.tipe);
  const BadgeIcon = badge.icon;
  const product = item.product || null;
  const place = item.place?.nama || "–";
  const isOut = item.tipe === "out" || item.tipe === "transfer";

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Badge & Date */}
      <div className="flex justify-between items-start mb-2">
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", badge.color)}>
          {BadgeIcon && <BadgeIcon size={12} />}
          {badge.label}
        </span>
        <span className="text-[9px] text-slate-400 group-hover:text-slate-600 transition whitespace-nowrap">
          {new Date(item.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}
        </span>
      </div>

      {/* Product Name */}
      <p className="text-[10px] font-medium text-slate-800 line-clamp-2 min-h-[28px] text-center leading-tight mb-1">
        {formatProductName(product)}
      </p>

      {/* Place */}
      <p className="text-[10px] text-slate-500 text-center truncate mb-2">📍 {place}</p>

      {/* Qty */}
      <p className={cn("text-lg font-bold text-center mt-auto", isOut ? "text-red-600" : "text-green-600")}>
        {isOut ? "−" : "+"}{item.qty}
      </p>

      {/* Keterangan */}
      {item.keterangan && (
        <p className="text-[9px] italic text-slate-400 mt-2 line-clamp-2 text-center border-t border-slate-100 pt-2">
          "{item.keterangan}"
        </p>
      )}
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const ProductMovementPage = () => {
  const {
    filters, currentPage, setSearch, setTipeFilter, setDariFilter, setSampaiFilter,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useProductMovementFilters();
  const { openDetailModal } = useProductMovementModals();

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useProductMovements(getQueryParams());

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const movements = data?.movements || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
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
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari kode produk..." className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all bg-white" />
            </div>

            {/* Date From */}
            <div className="relative flex-shrink-0 min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="date" value={filters.dari} onChange={(e) => setDariFilter(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            {/* Date To */}
            <div className="relative flex-shrink-0 min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="date" value={filters.sampai} onChange={(e) => setSampaiFilter(e.target.value)} min={filters.dari || undefined} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>

            {/* Type Filter */}
            <div className="relative flex-shrink-0 min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={filters.tipe} onChange={(e) => setTipeFilter(e.target.value)} className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="">Semua Tipe</option>
                {MOVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Actions */}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
              <div className="flex justify-between mb-2"><div className="h-5 w-16 bg-slate-200 rounded-full" /><div className="h-4 w-10 bg-slate-200 rounded" /></div>
              <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto mb-2" />
              <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto mt-4" />
            </div>
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><Search className="w-10 h-10 text-slate-400" /></div>
          <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada data mutasi yang cocok" : "Belum ada riwayat mutasi produk"}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{isFilterActive ? "Coba ubah filter pencarian atau reset filter" : "Riwayat mutasi akan muncul setelah ada aktivitas stok"}</p>
          {isFilterActive && <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Reset Filter</button>}
        </div>
      ) : (
        <>
          {/* ✅ 5 CARD PER ROW di desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {movements.map((item) => (
              <MovementCard key={item.id} item={item} onClick={() => openDetailModal(item)} />
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

      <ProductMovementDetail />
    </div>
  );
};

export default ProductMovementPage;