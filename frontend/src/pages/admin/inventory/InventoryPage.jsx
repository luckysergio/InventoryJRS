import { useState, useMemo, useCallback } from "react";
import {
  Search, Plus, Minus, RefreshCw, X, ChevronLeft, ChevronRight,
  Warehouse, Package, Filter, TrendingUp, AlertTriangle,
  ArrowRightLeft, SortAsc, ChevronDown,
} from "lucide-react";
import { useInventories } from "../../../hooks/useInventory";
import { useInventoryFilters, useInventoryModals } from "../../../lib/zustand/inventoryStore";
import { usePlacesDropdown } from "../../../hooks/useMasterData";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import { cn } from "../../../lib/utils";
import InventoryMovementModal from "./InventoryMovementModal";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(" • ") || "-";
};

const getStokLevel = (qty) => {
  if (qty <= 0) return { level: "empty", color: "red", label: "Habis" };
  if (qty <= 5) return { level: "critical", color: "red", label: "Kritis" };
  if (qty <= 10) return { level: "low", color: "amber", label: "Rendah" };
  if (qty <= 30) return { level: "medium", color: "blue", label: "Sedang" };
  return { level: "high", color: "emerald", label: "Aman" };
};

const getStokPercentage = (qty, max = 50) => Math.min(100, (qty / max) * 100);

// ==========================================
// INVENTORY CARD (Clean - No Avatar)
// ==========================================
const InventoryCard = ({ item, isAdmin, onMovement }) => {
  const product = item.product;
  const placeName = item.place?.nama || "-";
  const placeCode = item.place?.kode || "";
  const isToko = placeCode === "TOKO";
  const isBengkel = placeCode === "BENGKEL";
  const qty = Number(item.qty) || 0;
  const stokInfo = getStokLevel(qty);
  const stokPercent = getStokPercentage(qty);

  const placeConfig = isToko
    ? {
        border: "border-emerald-200 hover:border-emerald-400",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Warehouse size={12} />,
        qtyGradient: "from-emerald-600 to-teal-600",
        barGradient: "from-emerald-400 to-teal-500",
      }
    : isBengkel
    ? {
        border: "border-blue-200 hover:border-blue-400",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <Package size={12} />,
        qtyGradient: "from-blue-600 to-indigo-600",
        barGradient: "from-blue-400 to-indigo-500",
      }
    : {
        border: "border-slate-200 hover:border-slate-400",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        icon: <Warehouse size={12} />,
        qtyGradient: "from-slate-600 to-slate-700",
        barGradient: "from-slate-400 to-slate-500",
      };

  const stokBarGradient =
    stokInfo.color === "emerald" ? "from-emerald-400 to-teal-500" :
    stokInfo.color === "blue" ? "from-blue-400 to-indigo-500" :
    stokInfo.color === "amber" ? "from-amber-400 to-orange-500" :
    "from-red-400 to-rose-500";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        placeConfig.border,
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      {/* ========================================== */}
      {/* HEADER - Place Badge + Status */}
      {/* ========================================== */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-sm",
          placeConfig.badge
        )}>
          {placeConfig.icon}
          <span className="uppercase tracking-wide">{placeName}</span>
        </div>

        {stokInfo.level === "critical" || stokInfo.level === "empty" ? (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-600 uppercase">
              {stokInfo.label}
            </span>
          </div>
        ) : (
          <span className={cn(
            "text-[9px] sm:text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full",
            stokInfo.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
            stokInfo.color === "blue" ? "bg-blue-100 text-blue-700" :
            "bg-amber-100 text-amber-700"
          )}>
            {stokInfo.label}
          </span>
        )}
      </div>

      {/* ========================================== */}
      {/* BODY - Cleaner without avatar */}
      {/* ========================================== */}
      <div className="flex-1 p-4 sm:p-5">
        {/* Product Info - Full width */}
        <div className="text-left">
          <p className="font-mono font-bold text-sm sm:text-base text-slate-900 truncate">
            {product?.kode || "-"}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-snug min-h-[32px]">
            {formatProductName(product)}
          </p>
        </div>

        {/* ========================================== */}
        {/* STOK VISUAL */}
        {/* ========================================== */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Stok Tersedia
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-3xl sm:text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                  placeConfig.qtyGradient
                )}>
                  {qty}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">unit</span>
              </div>
            </div>

            {qty > 30 && (
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
            )}
            {qty > 0 && qty <= 10 && (
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <AlertTriangle size={14} className="text-amber-600" />
              </div>
            )}
            {qty === 0 && (
              <div className="p-1.5 bg-red-100 rounded-lg">
                <X size={14} className="text-red-600" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                stokBarGradient
              )}
              style={{ width: `${stokPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ACTION BUTTONS */}
      {/* ========================================== */}
      {isAdmin ? (
        <div className="grid grid-cols-3 border-t-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
          <button
            onClick={() => onMovement(item, "in")}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-emerald-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
            title="Stok Masuk"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 group-hover/btn:bg-emerald-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Plus size={18} className="text-emerald-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 group-hover/btn:text-emerald-800 uppercase tracking-wide">
              Masuk
            </span>
          </button>

          <button
            onClick={() => onMovement(item, "transfer")}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
            title="Transfer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <ArrowRightLeft size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
              Transfer
            </span>
          </button>

          <button
            onClick={() => onMovement(item, "out")}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-red-50 active:scale-95 transition-all duration-200"
            title="Stok Keluar"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 group-hover/btn:bg-red-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Minus size={18} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-700 group-hover/btn:text-red-800 uppercase tracking-wide">
              Keluar
            </span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-500 italic">
            Hanya admin yang dapat mengubah stok
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CUSTOM SELECT WRAPPER - No Blue Ring
// ==========================================
const CustomSelect = ({ icon: Icon, value, onChange, children, className }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white",
        "appearance-none cursor-pointer",
        "outline-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400",
        "transition-all duration-200",
        "hover:border-slate-300",
        className
      )}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

const InventoryPage = () => {
  const {
    filters, currentPage, sortBy, setSearch, setPlaceFilter, setSortBy,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useInventoryFilters();
  const { openMovementModal } = useInventoryModals();
  const isAdmin = useIsAdmin();

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data: placesOptions = [] } = usePlacesDropdown();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useInventories(getQueryParams());

  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setSearchInput("");
    if (debounceTimer) clearTimeout(debounceTimer);
  }, [resetFilters, debounceTimer]);

  const inventories = data?.inventories || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  const sortedInventories = useMemo(() => {
    const result = [...inventories];
    result.sort((a, b) => {
      const qtyA = Number(a.qty) || 0;
      const qtyB = Number(b.qty) || 0;
      const namaA = formatProductName(a.product)?.toLowerCase() || "";
      const namaB = formatProductName(b.product)?.toLowerCase() || "";
      switch (sortBy) {
        case "stok-desc": return qtyB - qtyA;
        case "stok-asc": return qtyA - qtyB;
        case "nama-asc": return namaA.localeCompare(namaB);
        case "nama-desc": return namaB.localeCompare(namaA);
        default: return qtyB - qtyA;
      }
    });
    return result;
  }, [inventories, sortBy]);

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
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200/80 p-3 shadow-md">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kode atau nama produk..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm transition-all bg-white hover:border-slate-300"
              />
              {searchInput && (
                <button
                  onClick={handleResetFilters}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 sm:flex-shrink-0 hover:border-slate-300"
              title="Refresh"
            >
              <span className={cn("transition-transform", isFetching && "animate-spin")}>
                <RefreshCw className="w-4 h-4" />
              </span>
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="relative flex-shrink-0 min-w-[150px] sm:min-w-[160px] flex-1 sm:flex-none">
              <CustomSelect
                icon={Filter}
                value={filters.placeId}
                onChange={(e) => setPlaceFilter(e.target.value)}
              >
                <option value="">Semua Tempat</option>
                {placesOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="relative flex-shrink-0 min-w-[160px] sm:min-w-[180px] flex-1 sm:flex-none">
              <CustomSelect
                icon={SortAsc}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="stok-desc">Stok Terbanyak</option>
                <option value="stok-asc">Stok Terendah</option>
                <option value="nama-asc">Nama A-Z</option>
                <option value="nama-desc">Nama Z-A</option>
              </CustomSelect>
            </div>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                <div className="h-4 w-12 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-full" />
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="h-10 bg-slate-200 rounded w-1/3" />
                <div className="h-2 bg-slate-200 rounded-full w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedInventories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
            <Warehouse className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-bold text-lg">
            {isFilterActive ? "Tidak ada inventory yang cocok" : "Belum ada data inventory"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? "Coba ubah kata kunci pencarian atau reset filter"
              : "Data inventory akan muncul setelah ada produk yang terdaftar"}
          </p>
          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <X size={14} />
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={cn(
            "grid gap-3 sm:gap-4 transition-opacity",
            isPlaceholderData && "opacity-60",
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {sortedInventories.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onMovement={openMovementModal}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-6 pb-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn(
                  "px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition active:scale-95",
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                )}
              >
                <ChevronLeft size={16} className="inline sm:hidden" />
                <span className="hidden sm:inline">← Prev</span>
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-95"
                    >
                      1
                    </button>
                    {paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                  </>
                )}

                {paginationNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={cn(
                      "w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-bold transition active:scale-95",
                      currentPage === p
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                    )}
                  >
                    {p}
                  </button>
                ))}

                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                  <>
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(lastPage)}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-95"
                    >
                      {lastPage}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === lastPage || isFetching}
                className={cn(
                  "px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition active:scale-95",
                  currentPage === lastPage
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                )}
              >
                <ChevronRight size={16} className="inline sm:hidden" />
                <span className="hidden sm:inline">Next →</span>
              </button>
            </div>
          )}
        </>
      )}

      <InventoryMovementModal />
    </div>
  );
};

export default InventoryPage;