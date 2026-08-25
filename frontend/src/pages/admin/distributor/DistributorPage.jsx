import { useState, useEffect, useMemo } from "react";
import {
  User, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, Phone, Mail, Package, Eye,
  AlertTriangle, TrendingUp, Layers, Building2,
} from "lucide-react";
import { useDistributors, useDeleteDistributor } from "../../../hooks/useDistributors";
import { useDistributorFilters, useDistributorModals } from "../../../lib/zustand/distributorStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import DistributorForm from "./DistributorForm";
import DistributorDetail from "./DistributorDetail";

// ==========================================
// HELPERS
// ==========================================
const getProductsLevel = (count) => {
  if (count === 0) return { level: "empty", color: "slate", label: "Belum Ada" };
  if (count <= 5) return { level: "few", color: "amber", label: "Sedikit" };
  if (count <= 20) return { level: "medium", color: "orange", label: "Sedang" };
  return { level: "many", color: "emerald", label: "Banyak" };
};

const getProductsPercentage = (count, max = 50) => Math.min(100, (count / max) * 100);

// ==========================================
// DISTRIBUTOR CARD
// ==========================================
const DistributorCard = ({ item, onDetail, onEdit, onDelete }) => {
  const productsCount = Number(item.products_count) || 0;
  const productsInfo = getProductsLevel(productsCount);
  const productsPercent = getProductsPercentage(productsCount);
  const isProtected = productsCount > 0;

  // Gradient untuk angka produk
  const qtyGradient =
    productsInfo.color === "emerald" ? "from-emerald-600 to-teal-600" :
    productsInfo.color === "orange" ? "from-orange-600 to-amber-600" :
    productsInfo.color === "amber" ? "from-amber-600 to-yellow-600" :
    "from-slate-500 to-slate-600";

  const barGradient =
    productsInfo.color === "emerald" ? "from-emerald-400 to-teal-500" :
    productsInfo.color === "orange" ? "from-orange-400 to-amber-500" :
    productsInfo.color === "amber" ? "from-amber-400 to-yellow-500" :
    "from-slate-300 to-slate-400";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        "border-slate-200 hover:border-amber-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div className="flex-1 p-4 sm:p-5">
        {/* Nama Distributor */}
        <div className="text-left">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight line-clamp-2 min-h-[3rem]">
            {item.nama}
          </h3>

          {/* Contact Badges */}
          <div className="mt-2 space-y-1">
            {item.no_hp ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border bg-sky-50 text-sky-700 border-sky-200">
                <Phone size={11} />
                <span className="truncate max-w-[140px]">{item.no_hp}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium border bg-slate-50 text-slate-400 border-slate-200">
                <Phone size={11} />
                <span>Tidak ada HP</span>
              </div>
            )}
            
            {item.email && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200 ml-1 sm:ml-0">
                <Mail size={11} />
                <span className="truncate max-w-[140px]">{item.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* PRODUK VISUAL - Primary stat */}
        {/* ========================================== */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Jumlah Produk
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-3xl sm:text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                  qtyGradient
                )}>
                  {productsCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">produk</span>
              </div>
            </div>

            {/* Icon indikator */}
            {productsCount > 20 && (
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
            )}
            {productsCount > 0 && productsCount <= 5 && (
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Package size={14} className="text-amber-600" />
              </div>
            )}
            {productsCount === 0 && (
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Layers size={14} className="text-slate-500" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                barGradient
              )}
              style={{ width: `${productsPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ACTION BUTTONS - 3 columns */}
      {/* ========================================== */}
      <div className={cn(
        "grid grid-cols-3 border-t-2 border-slate-100",
        "bg-gradient-to-b from-slate-50/50 to-white"
      )}>
        {/* DETAIL - Blue */}
        <button
          onClick={onDetail}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-blue-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Detail Distributor"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 group-hover/btn:bg-blue-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Eye size={16} className="text-blue-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 group-hover/btn:text-blue-800 uppercase tracking-wide">
            Detail
          </span>
        </button>

        {/* EDIT - Indigo */}
        <button
          onClick={onEdit}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Edit Distributor"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
            Edit
          </span>
        </button>

        {/* DELETE - Red (with disabled state) */}
        <button
          onClick={onDelete}
          disabled={isProtected}
          className={cn(
            "group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 transition-all duration-200",
            isProtected
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-red-50 active:scale-95"
          )}
          title={isProtected
            ? `Tidak dapat dihapus (${productsCount} produk aktif)`
            : "Hapus Distributor"
          }
        >
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
            isProtected
              ? "bg-slate-100"
              : "bg-red-100 group-hover/btn:bg-red-500 group-hover/btn:shadow-md group-hover/btn:scale-110"
          )}>
            {isProtected ? (
              <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
            ) : (
              <Trash2 size={16} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>
          <span className={cn(
            "text-[9px] sm:text-[10px] font-bold uppercase tracking-wide",
            isProtected ? "text-amber-600" : "text-red-700 group-hover/btn:text-red-800"
          )}>
            {isProtected ? "Terkunci" : "Hapus"}
          </span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const DistributorPage = () => {
  const {
    filters, currentPage, setSearch, setCurrentPage,
    resetFilters, hasActiveSearch, getQueryParams,
  } = useDistributorFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useDistributorModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) setSearch(searchInput);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, setSearch, filters.search]);

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useDistributors(queryParams);
  const deleteMutation = useDeleteDistributor();

  const isFilterActive = hasActiveSearch();

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  const handleDelete = async (distributor) => {
    const hasProducts = (distributor.products_count || 0) > 0;

    if (hasProducts) {
      await warning(
        "Tidak Dapat Dihapus",
        `Distributor "${distributor.nama}" masih memiliki ${distributor.products_count} produk. Hapus atau pindahkan produk terlebih dahulu.`
      );
      return;
    }

    const confirmed = await danger(
      "Hapus Distributor?",
      `Apakah Anda yakin ingin menghapus "${distributor.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(distributor.id);
      await success("Berhasil!", `Distributor "${distributor.nama}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus distributor";
      await (err.response?.status === 422 ? warning : info)(
        err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg
      );
    }
  };

  const distributors = data?.distributors || [];
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
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama, no HP, atau email..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 text-sm transition-all bg-white hover:border-slate-300"
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
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : distributors.length === 0 ? (
        <EmptyState
          isFilterActive={isFilterActive}
          onReset={handleResetFilters}
          onCreate={openCreateModal}
        />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {distributors.map((item) => (
              <DistributorCard
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
                        ? "bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/30"
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
        title="Tambah Distributor"
        aria-label="Tambah distributor baru"
      >
        <span className="absolute inset-0 rounded-full bg-amber-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-full shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Distributor
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <DistributorForm />
      <DistributorDetail />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-24 bg-slate-200 rounded-full" />
          <div className="h-4 w-14 bg-slate-200 rounded-full" />
        </div>

        {/* Body skeleton */}
        <div className="p-4 sm:p-5">
          <div className="space-y-2 mb-4">
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-5 bg-slate-200 rounded w-1/2" />
            <div className="flex gap-1 mt-2">
              <div className="h-5 w-24 bg-slate-200 rounded-full" />
              <div className="h-5 w-28 bg-slate-200 rounded-full" />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-10 bg-slate-200 rounded w-1/4" />
            <div className="h-2 bg-slate-200 rounded-full w-full" />
          </div>
        </div>

        {/* Footer skeleton - 3 columns */}
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
        <Building2 className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada distributor yang cocok" : "Belum ada data distributor"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah kata kunci pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan distributor baru untuk mengelola supplier produk Anda"}
    </p>
    {isFilterActive ? (
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <X size={14} />
        Reset Filter
      </button>
    ) : (
      <button
        onClick={onCreate}
        className="mt-4 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-lg transition-all inline-flex items-center gap-2 shadow-md shadow-amber-500/20 hover:shadow-lg"
      >
        <Plus size={16} strokeWidth={2.5} />
        Tambah Distributor Pertama
      </button>
    )}
  </div>
);

export default DistributorPage;