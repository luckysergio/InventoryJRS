import { useState, useMemo, useCallback } from "react";
import {
  Search, Plus, Minus, RefreshCw, X, ChevronLeft, ChevronRight,
  Warehouse, Package, Filter,
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

// ==========================================
// INVENTORY CARD
// ==========================================
const InventoryCard = ({ item, isAdmin, onMovement }) => {
  const product = item.product;
  const placeName = item.place?.nama || "-";
  const placeCode = item.place?.kode || "";
  const isToko = placeCode === "TOKO";
  const isBengkel = placeCode === "BENGKEL";
  const qty = Number(item.qty) || 0;
  const isLowStock = qty <= 10;

  const borderColor = isToko ? "border-green-200 hover:border-green-400" : isBengkel ? "border-blue-200 hover:border-blue-400" : "border-slate-200 hover:border-indigo-300";
  const bgColor = isToko ? "bg-green-50/50" : isBengkel ? "bg-blue-50/50" : "bg-white";
  const qtyColor = isToko ? "text-green-700" : isBengkel ? "text-blue-700" : "text-indigo-700";
  const labelColor = isToko ? "text-green-800 bg-green-100" : isBengkel ? "text-blue-800 bg-blue-100" : "text-indigo-800 bg-indigo-100";

  return (
    <div className={cn("group relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden", borderColor, bgColor)}>
      <div className="absolute top-3 left-3">
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", labelColor)}>
          <Warehouse size={10} />
          {placeName}
        </span>
      </div>

      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => onMovement(item, "in")} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors" title="Stok Masuk"><Plus size={12} /></button>
          <button onClick={() => onMovement(item, "out")} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors" title="Stok Keluar"><Minus size={12} /></button>
          <button onClick={() => onMovement(item, "transfer")} className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors" title="Transfer"><RefreshCw size={12} /></button>
        </div>
      )}

      <div className="flex flex-col items-center text-center pt-10 px-4 pb-4 flex-1">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md mb-3">
          {product?.kode?.slice(0, 2) || "?"}
        </div>
        <p className="font-mono font-bold text-xs text-indigo-700 truncate w-full">{product?.kode || "-"}</p>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 min-h-[32px] leading-tight">{formatProductName(product)}</p>

        <div className="mt-auto pt-3 w-full">
          <div className={cn("text-2xl font-bold", qtyColor)}>{qty}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">unit tersedia</p>
          {isLowStock && <p className="text-[10px] text-red-500 font-medium mt-1">⚠ Stok Rendah</p>}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const InventoryPage = () => {
  const { filters, currentPage, sortBy, setSearch, setPlaceFilter, setSortBy, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useInventoryFilters();
  const { openMovementModal } = useInventoryModals();
  const isAdmin = useIsAdmin();

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data: placesOptions = [] } = usePlacesDropdown();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useInventories(getQueryParams());

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const inventories = data?.inventories || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  // Client-side sorting
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
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari kode atau nama produk..." className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all bg-white" />
            </div>
            <div className="relative flex-shrink-0 min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <select value={filters.placeId} onChange={(e) => setPlaceFilter(e.target.value)} className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="">Semua Tempat</option>
                {placesOptions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="relative flex-shrink-0 min-w-[140px]">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                <option value="stok-desc">📦 Stok ↓</option>
                <option value="stok-asc">📦 Stok ↑</option>
                <option value="nama-asc">🔤 A-Z</option>
                <option value="nama-desc">🔤 Z-A</option>
              </select>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-slate-200 rounded-lg mb-3" />
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-8 bg-slate-200 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedInventories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><Warehouse className="w-10 h-10 text-slate-400" /></div>
          <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada inventory yang cocok" : "Belum ada data inventory"}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{isFilterActive ? "Coba ubah kata kunci pencarian atau reset filter" : "Data inventory akan muncul setelah ada produk yang terdaftar"}</p>
          {isFilterActive && <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">Reset Filter</button>}
        </div>
      ) : (
        <>
          {/* ✅ 5 CARD PER ROW di desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {sortedInventories.map((item) => (
              <InventoryCard key={item.id} item={item} isAdmin={isAdmin} onMovement={openMovementModal} />
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

      <InventoryMovementModal />
    </div>
  );
};

export default InventoryPage;