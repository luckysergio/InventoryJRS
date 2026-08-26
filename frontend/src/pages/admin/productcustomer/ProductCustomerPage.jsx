import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus, Pencil, Trash2, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Tag, Image as ImageIcon, Eye, User, Filter,
  Quote, Sparkles, CheckCircle2,
} from "lucide-react";
import { useProductCustomers, useDeleteProductCustomer } from "../../../hooks/useProductCustomers";
import { useCustomersDropdown } from "../../../hooks/useMasterData";
import { useProductCustomerFilters, useProductCustomerModals } from "../../../lib/zustand/productCustomerStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin, useUserRole } from "../../../lib/zustand/authStore";
import { cn } from "../../../lib/utils";
import ProductCustomerForm from "./ProductCustomerForm";
import ProductCustomerDetail from "./ProductCustomerDetail";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(Number(v) || 0);

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
  icon: Icon = User,
  placeholder = "Pilih...",
  searchPlaceholder = "Klik untuk mencari...",
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

  // Filter & sort options
  const filtered = useMemo(() => {
    const sorted = [...options].sort((a, b) =>
      (a.label || "").toLowerCase().localeCompare((b.label || "").toLowerCase())
    );
    if (!search.trim()) return sorted;
    const s = search.toLowerCase();
    return sorted.filter((opt) => opt.label?.toLowerCase().includes(s));
  }, [options, search]);

  // Close on click outside (trigger + panel)
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

  // Close on Escape
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

  // Disabled state
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
      {/* Trigger Button */}
      <div className="relative w-full" ref={triggerRef}>
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            "w-full flex items-center justify-between pl-10 pr-10 py-2.5 border rounded-lg bg-white text-left text-sm",
            "outline-none focus:outline-none focus:ring-2 transition-all duration-200",
            isOpen
              ? "border-sky-400 ring-2 ring-sky-200"
              : "border-slate-200 focus:ring-sky-200 focus:border-sky-400 hover:border-slate-300"
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

      {/* ✅ Dropdown Panel - Render via PORTAL (tidak ter-clip) */}
      {isOpen && style && createPortal(
        <div
          ref={panelRef}
          style={style}
          className="fixed z-[90] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-white flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-9 pr-8 py-2 text-sm border rounded-lg transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400",
                  isSearchFocused
                    ? "border-sky-400 bg-white"
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

          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {/* "Semua Customer" option */}
            <button
              type="button"
              onClick={() => handlePick("")}
              className={cn(
                "w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors border-b border-slate-100",
                isAll
                  ? "bg-sky-50 text-sky-700 font-semibold"
                  : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  isAll ? "bg-sky-100" : "bg-slate-100"
                )}>
                  <Filter size={13} className={isAll ? "text-sky-600" : "text-slate-500"} />
                </div>
                <span>{allLabel}</span>
              </span>
              {isAll && (
                <CheckCircle2 size={16} className="text-sky-600 flex-shrink-0 ml-2" />
              )}
            </button>

            {filtered.length === 0 ? (
              <div className="p-6 text-center">
                <User size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {search ? "Customer tidak ditemukan" : "Belum ada customer"}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      inputRef.current?.focus();
                    }}
                    className="mt-2 text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handlePick(opt.value)}
                    className={cn(
                      "w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-sky-50 text-sky-700 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate min-w-0">
                      <span className="truncate">{opt.label}</span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-sky-600 flex-shrink-0 ml-2" />
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

const ProductCustomerCard = ({ item, isAdmin, onDetail, onEdit, onDelete }) => {
  const harga = Number(item.harga) || 0;
  const fotoUrl = item.foto_depan_url || (item.foto_depan ? `${ASSET_URL}/storage/${item.foto_depan}` : null);
  const customerName = item.customer?.name || "—";
  const hasKeterangan = !!item.keterangan;

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        "border-slate-200 hover:border-sky-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div
            onClick={onDetail}
            className={cn(
              "flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-md ring-2 ring-white cursor-pointer transition-all hover:scale-105 hover:shadow-lg",
              fotoUrl ? "bg-white" : "bg-gradient-to-br from-sky-100 to-cyan-100"
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
                <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-xs sm:text-sm text-slate-900 leading-tight break-words line-clamp-2">
              {item.kode}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug min-h-[28px]">
              {[item.jenis?.nama, item.type?.nama, item.ukuran].filter(Boolean).join(" • ") || "-"}
            </p>
          </div>
        </div>

        {/* Customer Badge */}
        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border bg-cyan-50 text-cyan-700 border-cyan-200 w-full">
            <div className="p-1 bg-cyan-100 rounded-md flex-shrink-0">
              <User size={11} />
            </div>
            <span className="truncate">{customerName}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between mb-1">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Harga Khusus
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
                  {formatRupiah(harga)}
                </span>
              </div>
            </div>

            {harga > 0 && (
              <div className="p-1.5 bg-sky-100 rounded-lg">
                <Tag size={14} className="text-sky-600" />
              </div>
            )}
          </div>
        </div>

        {hasKeterangan && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="relative px-3 py-2 rounded-lg bg-purple-50 border border-purple-100">
              <Quote size={12} className="absolute -top-1.5 left-2 text-purple-400 bg-white px-0.5" />
              <p className="text-[11px] sm:text-xs italic text-purple-700 line-clamp-2 leading-snug">
                {item.keterangan}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={cn(
        "grid border-t-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white",
        isAdmin ? "grid-cols-3" : "grid-cols-1"
      )}>
        {/* DETAIL - Blue */}
        <button
          onClick={onDetail}
          className={cn(
            "group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-blue-50 active:scale-95 transition-all duration-200",
            isAdmin && "border-r border-slate-100"
          )}
          title="Detail Produk Customer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 group-hover/btn:bg-blue-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Eye size={16} className="text-blue-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 group-hover/btn:text-blue-800 uppercase tracking-wide">
            Detail
          </span>
        </button>

        {/* EDIT - Indigo (admin only) */}
        {isAdmin && (
          <button
            onClick={onEdit}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
            title="Edit Produk Customer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
              Edit
            </span>
          </button>
        )}

        {/* DELETE - Red (admin only) */}
        {isAdmin && (
          <button
            onClick={onDelete}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-red-50 active:scale-95 transition-all duration-200"
            title="Hapus Produk Customer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 group-hover/btn:bg-red-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Trash2 size={16} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-700 group-hover/btn:text-red-800 uppercase tracking-wide">
              Hapus
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const ProductCustomerPage = () => {
  const {
    filters, currentPage, setSearch, setCustomerFilter,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useProductCustomerFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useProductCustomerModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const role = useUserRole();
  const isAdmin = useIsAdmin();
  const canCreate = ["admin", "admin_toko", "operator"].includes(role);

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data: customersOptions = [], isLoading: loadingCustomers } = useCustomersDropdown();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useProductCustomers(getQueryParams());
  const deleteMut = useDeleteProductCustomer();

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

  const products = data?.products || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  const stats = useMemo(() => {
    const uniqueCustomers = new Set(
      products.map((p) => p.customer?.id).filter(Boolean)
    ).size;
    const withKeterangan = products.filter((p) => p.keterangan).length;
    return { uniqueCustomers, withKeterangan };
  }, [products]);

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  const handleDelete = async (item) => {
    const confirmed = await danger(
      "Hapus Produk Customer?",
      `Apakah Anda yakin ingin menghapus "${item.kode}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMut.mutateAsync(item.id);
      await success("Berhasil!", `Produk "${item.kode}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus produk";
      await (err.response?.status === 422 ? warning : info)(
        err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg
      );
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* ========================================== */}
      {/* STICKY FILTER BAR */}
      {/* ========================================== */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200/80 p-3 shadow-md">
          {/* Row 1: Search + Refresh */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari kode atau nama produk..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 text-sm transition-all bg-white hover:border-slate-300"
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

          <div className="flex flex-wrap gap-2 mt-2">
            <div className="relative w-full sm:w-[260px] sm:flex-shrink-0">
              {loadingCustomers ? (
                <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-sky-600" />
                  Memuat customer...
                </div>
              ) : (
                <SearchableSelect
                  options={customersOptions}
                  value={filters.customerId}
                  onChange={setCustomerFilter}
                  icon={User}
                  placeholder="Semua Customer"
                  allLabel="Semua Customer"
                  searchPlaceholder="Cari nama customer..."
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
          canCreate={canCreate}
        />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((item) => (
              <ProductCustomerCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onDetail={() => openDetailModal(item)}
                onEdit={() => openEditModal(item)}
                onDelete={() => handleDelete(item)}
              />
            ))}
          </div>

          {/* Pagination */}
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
                        ? "bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-md shadow-sky-500/30"
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
      {canCreate && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 z-40 group"
          aria-label="Tambah Produk Customer"
          title="Tambah Produk Customer"
        >
          <span className="absolute inset-0 rounded-full bg-sky-500 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white rounded-full shadow-2xl shadow-sky-500/40 hover:shadow-sky-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Tambah Produk
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
          </div>
        </button>
      )}

      <ProductCustomerForm />
      <ProductCustomerDetail />
    </div>
  );
};

// ==========================================
// LOADING SKELETON
// ==========================================
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-14 bg-slate-200 rounded-full" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {/* Photo + Info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          </div>

          {/* Customer badge */}
          <div className="h-8 bg-slate-200 rounded-lg w-full mb-3" />

          {/* Harga */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-7 bg-slate-200 rounded w-2/3" />
          </div>
        </div>

        {/* Footer */}
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
const EmptyState = ({ isFilterActive, onReset, onCreate, canCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
      {isFilterActive ? (
        <Filter className="w-10 h-10 text-slate-400" />
      ) : (
        <Sparkles className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada produk yang cocok" : "Belum ada produk customer"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah kata kunci pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan produk customer baru untuk harga khusus pesanan"}
    </p>
    {isFilterActive ? (
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <X size={14} />
        Reset Filter
      </button>
    ) : (
      canCreate && (
        <button
          onClick={onCreate}
          className="mt-4 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 rounded-lg transition-all inline-flex items-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-lg"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Produk Pertama
        </button>
      )
    )}
  </div>
);

export default ProductCustomerPage;