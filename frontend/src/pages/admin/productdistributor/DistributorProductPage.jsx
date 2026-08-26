import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Truck, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Tag, Image as ImageIcon, Eye, Filter, Package, Warehouse,
  TrendingUp, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useDistributorProducts, useDeleteDistributorProduct } from "../../../hooks/useDistributorProducts";
import { useDistributorsDropdown } from "../../../hooks/useMasterData";
import { useDistributorProductFilters, useDistributorProductModals } from "../../../lib/zustand/distributorProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import DistributorProductForm from "./DistributorProductForm";
import DistributorProductDetail from "./DistributorProductDetail";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(value || 0);

// ==========================================
// HELPERS
// ==========================================
const getStockLevel = (totalQty) => {
  if (totalQty === 0) return { level: "empty", color: "red", label: "Habis" };
  if (totalQty <= 5) return { level: "critical", color: "red", label: "Kritis" };
  if (totalQty <= 20) return { level: "low", color: "amber", label: "Rendah" };
  if (totalQty <= 50) return { level: "medium", color: "cyan", label: "Sedang" };
  return { level: "high", color: "emerald", label: "Aman" };
};

const getStockPercentage = (qty, max = 100) => Math.min(100, (qty / max) * 100);

// ==========================================
// DROPDOWN POSITIONING (Fixed + Portal)
// ==========================================
const useDropdownPosition = (open) => {
  const triggerRef = useRef(null);
  const [style, setStyle] = useState(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const MAX_H = 340;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    if (spaceBelow >= 240 || spaceBelow >= spaceAbove) {
      setStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(200, Math.min(MAX_H, spaceBelow)),
      });
    } else {
      setStyle({
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(200, Math.min(MAX_H, spaceAbove)),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return { triggerRef, style };
};

// ==========================================
// SEARCHABLE SELECT (Portal-based, Anti-Clip)
// ==========================================
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  icon: Icon = Truck,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  allLabel = "Semua",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const { triggerRef, style } = useDropdownPosition(isOpen);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearch("");
    setIsSearchFocused(false);
  }, []);

  const filtered = useMemo(() => {
    const sorted = [...options].sort((a, b) =>
      (a.label || "").toLowerCase().localeCompare((b.label || "").toLowerCase())
    );
    if (!search.trim()) return sorted;
    const s = search.toLowerCase();
    return sorted.filter((opt) => opt.label?.toLowerCase().includes(s));
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inPanel = panelRef.current?.contains(event.target);
      if (!inTrigger && !inPanel) close();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, close]);

  const selected = options.find((opt) => String(opt.value) === String(value));
  const isAll = !value;

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) close();
    else setIsOpen(true);
  };

  const handlePick = (val) => {
    onChange(val);
    close();
  };

  if (disabled) {
    return (
      <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm flex items-center gap-2">
        <Icon size={14} className="text-slate-400 flex-shrink-0" />
        <span className="truncate">{selected ? selected.label : allLabel}</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative w-full" ref={triggerRef}>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "w-full flex items-center justify-between pl-10 pr-10 py-2.5 border rounded-lg bg-white text-left text-sm",
            "outline-none focus:outline-none focus:ring-2 transition-all duration-200",
            isOpen
              ? "border-cyan-400 ring-2 ring-cyan-200"
              : "border-slate-200 focus:ring-cyan-200 focus:border-cyan-400 hover:border-slate-300"
          )}
        >
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <span className={cn(
            "truncate",
            !isAll ? "text-slate-900 font-semibold" : "text-slate-500"
          )}>
            {selected ? selected.label : allLabel}
          </span>
          {isOpen ? (
            <ChevronUp size={16} className="text-slate-400 ml-2 flex-shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-slate-400 ml-2 flex-shrink-0" />
          )}
        </button>
      </div>

      {isOpen && style && createPortal(
        <div
          ref={panelRef}
          style={style}
          className="fixed z-[90] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
        >
          <div className="p-2 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-9 pr-8 py-2 text-sm border rounded-lg transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400",
                  isSearchFocused
                    ? "border-cyan-400 bg-white"
                    : "border-slate-200 bg-slate-50 hover:bg-white"
                )}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => handlePick("")}
              className={cn(
                "w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors border-b border-slate-100",
                isAll
                  ? "bg-cyan-50 text-cyan-700 font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  isAll ? "bg-cyan-100" : "bg-slate-100"
                )}>
                  <Filter size={13} className={isAll ? "text-cyan-600" : "text-slate-500"} />
                </div>
                <span>{allLabel}</span>
              </span>
              {isAll && (
                <CheckCircle2 size={16} className="text-cyan-600 flex-shrink-0 ml-2" />
              )}
            </button>

            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <Truck size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {search ? "Distributor tidak ditemukan" : "Belum ada distributor"}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      inputRef.current?.focus();
                    }}
                    className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const initials = (opt.label || "?")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 3)
                  .toUpperCase();
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePick(opt.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-cyan-50 text-cyan-700 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate min-w-0">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-[9px]",
                        isSelected
                          ? "bg-cyan-100 text-cyan-700"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {initials}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-cyan-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const DistributorProductCard = ({ item, onDetail, onEdit, onDelete }) => {
  const qtyToko = Number(item.qty_toko) || 0;
  const qtyBengkel = Number(item.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;
  const harga = Number(item.harga_umum) || 0;
  const stockInfo = getStockLevel(totalQty);
  const stockPercent = getStockPercentage(totalQty);
  const fotoUrl = item.foto_depan_url || (item.foto_depan ? `${ASSET_URL}/storage/${item.foto_depan}` : null);
  const distributorName = item.distributor?.nama || "—";

  const barGradient =
    stockInfo.color === "emerald" ? "from-emerald-400 to-teal-500" :
    stockInfo.color === "cyan" ? "from-cyan-400 to-sky-500" :
    stockInfo.color === "amber" ? "from-amber-400 to-orange-500" :
    "from-red-400 to-rose-500";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        "border-slate-200 hover:border-cyan-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >

      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            onClick={onDetail}
            className={cn(
              "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md ring-2 ring-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
              fotoUrl ? "bg-white" : "bg-gradient-to-br from-cyan-100 to-sky-100"
            )}
            title="Klik untuk detail"
          >
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={item.kode}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
              {item.kode}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug min-h-[28px]">
              {[item.jenis?.nama, item.type?.nama, item.ukuran].filter(Boolean).join(" • ") || "-"}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200 w-full">
            <div className="p-1 bg-purple-100 rounded-md flex-shrink-0">
              <Truck size={11} />
            </div>
            <span className="truncate">{distributorName}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Harga Umum
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                  {formatRupiah(harga)}
                </span>
              </div>
            </div>

            {harga > 0 && (
              <div className="p-1.5 bg-cyan-100 rounded-lg">
                <TrendingUp size={14} className="text-cyan-600" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">
            Ketersediaan Stok
          </p>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="p-1 bg-emerald-100 rounded-md">
                <Package size={11} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-emerald-600 font-medium uppercase">Toko</p>
                <p className={cn(
                  "text-sm font-bold",
                  qtyToko > 0 ? "text-emerald-700" : "text-red-500"
                )}>
                  {qtyToko}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
              <div className="p-1 bg-blue-100 rounded-md">
                <Warehouse size={11} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-blue-600 font-medium uppercase">Bengkel</p>
                <p className={cn(
                  "text-sm font-bold",
                  qtyBengkel > 0 ? "text-blue-700" : "text-red-500"
                )}>
                  {qtyBengkel}
                </p>
              </div>
            </div>
          </div>

          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                barGradient
              )}
              style={{ width: `${stockPercent}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-1 text-right">
            Total: <span className="font-bold text-slate-600">{totalQty}</span> unit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        <button
          onClick={onDetail}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-blue-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Detail Product"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 group-hover/btn:bg-blue-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Eye size={16} className="text-blue-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 group-hover/btn:text-blue-800 uppercase tracking-wide">
            Detail
          </span>
        </button>

        <button
          onClick={onEdit}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Edit Product"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
            Edit
          </span>
        </button>

        <button
          onClick={onDelete}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-red-50 active:scale-95 transition-all duration-200"
          title="Hapus Product"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 group-hover/btn:bg-red-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Trash2 size={16} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-red-700 group-hover/btn:text-red-800 uppercase tracking-wide">
            Hapus
          </span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const DistributorProductPage = () => {
  const {
    filters, currentPage, setSearch, setDistributorFilter,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useDistributorProductFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useDistributorProductModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  const { data: distributorsOptions = [], isLoading: loadingDistributors } = useDistributorsDropdown();

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) setSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, setSearch, filters.search]);

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useDistributorProducts(queryParams);
  const deleteMutation = useDeleteDistributorProduct();
  const isFilterActive = hasActiveFilters();

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  const handleDelete = async (item) => {
    const confirmed = await danger(
      "Hapus Product?",
      `Apakah Anda yakin ingin menghapus "${item.kode}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(item.id);
      await success("Berhasil!", `Product "${item.kode}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus product";
      await (err.response?.status === 422 ? warning : info)(
        err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg
      );
    }
  };

  const products = data?.products || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;

  const stats = useMemo(() => {
    const uniqueDistributors = new Set(
      products.map((p) => p.distributor?.id).filter(Boolean)
    ).size;
    const lowStock = products.filter(p => {
      const t = (Number(p.qty_toko) || 0) + (Number(p.qty_bengkel) || 0);
      return t > 0 && t <= 20;
    }).length;
    const outStock = products.filter(p => {
      const t = (Number(p.qty_toko) || 0) + (Number(p.qty_bengkel) || 0);
      return t === 0;
    }).length;
    return { uniqueDistributors, lowStock, outStock };
  }, [products]);

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
          {/* Row 1: Search + Refresh */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode atau nama product..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 text-sm transition-all bg-white hover:border-slate-300"
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
              title="Refresh data"
            >
              <span className={cn("transition-transform", isFetching && "animate-spin")}>
                <RefreshCw className="w-4 h-4" />
              </span>
              <span>Refresh</span>
            </button>
          </div>

          {/* Row 2: Distributor Filter (Searchable) */}
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="relative w-full sm:w-[280px] sm:flex-shrink-0">
              {loadingDistributors ? (
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-cyan-600" />
                  Memuat distributor...
                </div>
              ) : (
                <SearchableSelect
                  options={distributorsOptions}
                  value={filters.distributorId}
                  onChange={setDistributorFilter}
                  icon={Truck}
                  placeholder="Semua Distributor"
                  allLabel="Semua Distributor"
                  searchPlaceholder="Cari nama distributor..."
                />
              )}
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
        <LoadingSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          isFilterActive={isFilterActive}
          onReset={handleResetFilters}
          onCreate={openCreateModal}
        />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((item) => (
              <DistributorProductCard
                key={item.id}
                item={item}
                onDetail={() => openDetailModal(item)}
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
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
                      disabled={isFetching}
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
                        ? "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-md shadow-cyan-500/30"
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
                      disabled={isFetching}
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
        </div>
      )}

      {/* ========================================== */}
      {/* FLOATING ACTION BUTTON */}
      {/* ========================================== */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Product Distributor"
        aria-label="Tambah product distributor baru"
      >
        <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Product
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <DistributorProductForm />
      <DistributorProductDetail />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          </div>

          <div className="h-8 bg-slate-200 rounded-lg w-full mb-3" />

          <div className="pt-3 border-t border-slate-100 space-y-2 mb-3">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-7 bg-slate-200 rounded w-2/3" />
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-2 bg-slate-200 rounded-full w-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 border-t-2 border-slate-100">
          <div className="h-16 bg-slate-50 border-r border-slate-100" />
          <div className="h-16 bg-slate-50 border-r border-slate-100" />
          <div className="h-16 bg-slate-50" />
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// EMPTY STATE
// ==========================================
const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
      {isFilterActive ? (
        <X className="w-10 h-10 text-slate-400" />
      ) : (
        <Truck className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada product yang cocok" : "Belum ada data product distributor"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah filter pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan product distributor baru untuk katalog supplier"}
    </p>
    {isFilterActive ? (
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 text-sm font-medium text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <X size={14} />
        Reset Filter
      </button>
    ) : (
      <button
        onClick={onCreate}
        className="mt-4 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 rounded-lg transition-all inline-flex items-center gap-2 shadow-md shadow-cyan-500/20 hover:shadow-lg"
      >
        <Plus size={16} strokeWidth={2.5} />
        Tambah Product Pertama
      </button>
    )}
  </div>
);

export default DistributorProductPage;