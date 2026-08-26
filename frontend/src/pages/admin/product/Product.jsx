import { useState, useEffect, useMemo } from "react";
import {
  Package, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, Tag, Image as ImageIcon, Filter, Eye,
  AlertTriangle, TrendingUp, ChevronDown, Warehouse,
} from "lucide-react";
import { useJenisDropdown, useTypesDropdown } from "../../../hooks/useMasterData";
import { useProducts, useDeleteProduct } from "../../../hooks/useProducts";
import { useProductFilters, useProductModals } from "../../../lib/zustand/productStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import ProductForm from "./ProductForm";
import ProductDetail from "./ProductDetail";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(value || 0);

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

// ==========================================
// HELPERS
// ==========================================
const getStockLevel = (totalQty) => {
  if (totalQty === 0) return { level: "empty", color: "red", label: "Habis" };
  if (totalQty <= 5) return { level: "critical", color: "red", label: "Kritis" };
  if (totalQty <= 20) return { level: "low", color: "amber", label: "Rendah" };
  if (totalQty <= 50) return { level: "medium", color: "cyan", label: "Sedang" }; // cyan untuk "Sedang"
  return { level: "high", color: "emerald", label: "Aman" };
};

const getStockPercentage = (qty, max = 100) => Math.min(100, (qty / max) * 100);

// Custom Select - Cyan Theme
const CustomSelect = ({ icon: Icon, value, onChange, children, disabled = false, className }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        "w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm bg-white",
        "appearance-none cursor-pointer",
        "outline-none focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400",
        "transition-all duration-200",
        "hover:border-slate-300",
        disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
        className
      )}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
  </div>
);

// ==========================================
// PRODUCT CARD (Cyan Theme)
// ==========================================
const ProductCard = ({ item, onDetail, onEdit, onDelete }) => {
  const qtyToko = Number(item.qty_toko) || 0;
  const qtyBengkel = Number(item.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;
  const harga = Number(item.harga_umum) || 0;
  const stockInfo = getStockLevel(totalQty);
  const stockPercent = getStockPercentage(totalQty);
  const fotoUrl = item.foto_depan_url || (item.foto_depan ? `${ASSET_URL}/storage/${item.foto_depan}` : null);

  // Status badge color
  const statusBadge =
    stockInfo.color === "emerald" ? "bg-emerald-100 text-emerald-700" :
    stockInfo.color === "cyan" ? "bg-cyan-100 text-cyan-700" :
    stockInfo.color === "amber" ? "bg-amber-100 text-amber-700" :
    "bg-red-100 text-red-700";

  // Progress bar gradient
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
        {/* Photo + Info - Horizontal layout */}
        <div className="flex items-start gap-3">
          {/* Product Photo / Avatar */}
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
              {item.kode}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug min-h-[28px]">
              {[item.jenis?.nama, item.type?.nama, item.ukuran].filter(Boolean).join(" • ") || "-"}
            </p>

            {/* Bahan badge */}
            {item.bahan?.nama && (
              <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                <Tag size={9} />
                <span>{item.bahan.nama}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* HARGA - Primary stat (Cyan gradient) */}
        {/* ========================================== */}
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

        {/* ========================================== */}
        {/* STOK INFO - Secondary stats */}
        {/* ========================================== */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">
            Ketersediaan Stok
          </p>

          {/* Stok Grid - 2 columns */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Toko */}
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

            {/* Bengkel */}
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

          {/* Progress Bar - Total Stock */}
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

      {/* ========================================== */}
      {/* ACTION BUTTONS - 3 columns */}
      {/* ========================================== */}
      <div className="grid grid-cols-3 border-t-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white">
        {/* DETAIL - Blue */}
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

        {/* EDIT - Cyan */}
        <button
          onClick={onEdit}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-cyan-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Edit Product"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-100 group-hover/btn:bg-cyan-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Pencil size={16} className="text-cyan-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-cyan-700 group-hover/btn:text-cyan-800 uppercase tracking-wide">
            Edit
          </span>
        </button>

        {/* DELETE - Red */}
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
const ProductPage = () => {
  const {
    filters, currentPage, setSearch, setJenisFilter, setTypeFilter,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useProductFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useProductModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  const { data: jenisOptions = [] } = useJenisDropdown();
  const { data: typesOptions = [] } = useTypesDropdown(filters.jenisId || null);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) setSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, setSearch, filters.search]);

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const filteredTypesForFilter = useMemo(() => {
    if (!filters.jenisId) return [];
    return typesOptions;
  }, [filters.jenisId, typesOptions]);

  // Reset type filter jika jenis berubah dan type tidak valid
  useEffect(() => {
    if (filters.jenisId && filters.typeId) {
      const isValid = filteredTypesForFilter.some((t) => String(t.value) === String(filters.typeId));
      if (!isValid) setTypeFilter('');
    }
  }, [filters.jenisId, filters.typeId, filteredTypesForFilter, setTypeFilter]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useProducts(queryParams);
  const deleteMutation = useDeleteProduct();
  const isFilterActive = hasActiveFilters();

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  const handleDelete = async (product) => {
    const confirmed = await danger(
      "Hapus Product?",
      `Apakah Anda yakin ingin menghapus "${product.kode}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(product.id);
      await success("Berhasil!", `Product "${product.kode}" berhasil dihapus`);
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

          {/* Row 2: Filters */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            <div className="relative flex-shrink-0 min-w-[160px] sm:min-w-[180px] flex-1 sm:flex-none">
              <CustomSelect
                icon={Filter}
                value={filters.jenisId}
                onChange={(e) => setJenisFilter(e.target.value)}
              >
                <option value="">Semua Jenis</option>
                {jenisOptions.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </CustomSelect>
            </div>

            <div className="relative flex-shrink-0 min-w-[160px] sm:min-w-[180px] flex-1 sm:flex-none">
              <CustomSelect
                icon={Tag}
                value={filters.typeId}
                onChange={(e) => setTypeFilter(e.target.value)}
                disabled={!filters.jenisId}
              >
                <option value="">
                  {filters.jenisId ? `Semua Tipe (${filteredTypesForFilter.length})` : "Pilih Jenis dulu"}
                </option>
                {filteredTypesForFilter.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
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
        <LoadingSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          isFilterActive={isFilterActive}
          onReset={handleResetFilters}
          onCreate={openCreateModal}
        />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
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
      {/* FLOATING ACTION BUTTON (Cyan Theme) */}
      {/* ========================================== */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Product"
        aria-label="Tambah product baru"
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

      <ProductForm />
      <ProductDetail />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          {/* Photo + Info */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 bg-slate-200 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-4 w-16 bg-slate-200 rounded-full mt-1" />
            </div>
          </div>

          {/* Harga */}
          <div className="pt-3 border-t border-slate-100 space-y-2 mb-3">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-7 bg-slate-200 rounded w-2/3" />
          </div>

          {/* Stok */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-slate-200 rounded-lg" />
              <div className="h-12 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-2 bg-slate-200 rounded-full w-full" />
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
// EMPTY STATE (Cyan Theme)
// ==========================================
const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
      {isFilterActive ? (
        <X className="w-10 h-10 text-slate-400" />
      ) : (
        <Package className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada product yang cocok" : "Belum ada data product"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah filter pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan product baru ke inventaris Anda"}
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

export default ProductPage;