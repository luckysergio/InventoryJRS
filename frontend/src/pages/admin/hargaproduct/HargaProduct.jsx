import { useState, useEffect, useMemo } from "react";
import {
  Tag, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, User, Globe, Calendar, Eye,
  TrendingUp, DollarSign, Users,
} from "lucide-react";
import { useHargaProducts, useDeleteHargaProduct } from "../../../hooks/useHargaProducts";
import { useHargaProductFilters, useHargaProductModals } from "../../../lib/zustand/hargaProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import HargaProductForm from "./HargaProductForm";
import HargaProductDetail from "./HargaProductDetail";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(value || 0);

const formatTanggal = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const HargaCard = ({ item, onDetail, onEdit, onDelete }) => {
  const isCustomerSpecific = !!item.customer_id;
  const product = item.product;
  const harga = Number(item.harga) || 0;

  const productParts = [product?.jenis?.nama, product?.type?.nama, product?.ukuran].filter(Boolean);
  const productLabel = productParts.length > 0 ? productParts.join(" • ") : "-";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        "border-slate-200 hover:border-cyan-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div className="flex-1 p-4 sm:p-5">
        {/* Product Info */}
        <div>
          <h3 className="font-mono font-bold text-sm sm:text-base text-slate-900 leading-tight truncate">
            {product?.kode || "-"}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-snug min-h-[28px]">
            {productLabel}
          </p>
        </div>

        {/* Customer/Umum Badge */}
        <div className="mt-3">
          {isCustomerSpecific ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200 w-full">
              <div className="p-1 bg-purple-100 rounded-md flex-shrink-0">
                <User size={11} />
              </div>
              <span className="truncate">{item.customer?.name || "Customer"}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border bg-slate-50 text-slate-600 border-slate-200 w-full">
              <div className="p-1 bg-slate-100 rounded-md flex-shrink-0">
                <Globe size={11} />
              </div>
              <span>Harga Berlaku untuk Semua Customer</span>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* HARGA - Primary stat */}
        {/* ========================================== */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Harga Berlaku
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-600 to-sky-600 bg-clip-text text-transparent">
                  {formatRupiah(harga)}
                </span>
              </div>
            </div>

            {harga > 0 && (
              <div className="p-1.5 bg-cyan-100 rounded-lg">
                <DollarSign size={14} className="text-cyan-600" />
              </div>
            )}
          </div>

          {/* Tanggal Berlaku */}
          {item.tanggal_berlaku && (
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 mt-2">
              <Calendar size={12} className="text-slate-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                Berlaku sejak{" "}
                <span className="font-semibold text-slate-700">
                  {formatTanggal(item.tanggal_berlaku)}
                </span>
              </span>
            </div>
          )}
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
          title="Detail Harga"
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
          title="Edit Harga"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
            Edit
          </span>
        </button>

        {/* DELETE - Red */}
        <button
          onClick={onDelete}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-red-50 active:scale-95 transition-all duration-200"
          title="Hapus Harga"
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
const HargaProductPage = () => {
  const {
    filters, currentPage, setSearch, setCurrentPage,
    resetFilters, hasActiveFilters, getQueryParams,
  } = useHargaProductFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useHargaProductModals();
  const { danger, success, info } = useConfirmDialog();

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
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useHargaProducts(queryParams);
  const deleteMutation = useDeleteHargaProduct();
  const isFilterActive = hasActiveFilters();

  const handleResetFilters = () => {
    resetFilters();
    setSearchInput("");
  };

  const handleDelete = async (harga) => {
    const productName = harga.product?.kode || "produk ini";
    const target = harga.customer_id ? `untuk ${harga.customer?.name}` : "umum";

    const confirmed = await danger(
      "Hapus Harga?",
      `Apakah Anda yakin ingin menghapus harga ${target} untuk "${productName}" senilai ${formatRupiah(harga.harga)}?`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(harga.id);
      await success("Berhasil!", "Harga berhasil dihapus");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Gagal menghapus harga");
    }
  };

  const hargaList = data?.hargaProducts || [];
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Search Bar Only */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode product..."
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

        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : hargaList.length === 0 ? (
        <EmptyState
          isFilterActive={isFilterActive}
          onReset={handleResetFilters}
          onCreate={openCreateModal}
        />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {hargaList.map((item) => (
              <HargaCard
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
      {/* FLOATING ACTION BUTTON */}
      {/* ========================================== */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Harga"
        aria-label="Tambah harga baru"
      >
        <span className="absolute inset-0 rounded-full bg-cyan-500 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-sky-600 hover:from-cyan-600 hover:to-sky-700 text-white rounded-full shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Harga
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <HargaProductForm />
      <HargaProductDetail />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-16 bg-slate-200 rounded-full" />
          <div className="h-4 w-14 bg-slate-200 rounded-full" />
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-full" />
          </div>

          {/* Customer badge */}
          <div className="h-9 bg-slate-200 rounded-lg w-full mb-3" />

          {/* Harga */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-7 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2 mt-2" />
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
const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
      {isFilterActive ? (
        <X className="w-10 h-10 text-slate-400" />
      ) : (
        <Tag className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada harga yang cocok" : "Belum ada data harga"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah kata kunci pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan harga untuk produk Anda, baik harga umum maupun harga khusus customer"}
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
        Tambah Harga Pertama
      </button>
    )}
  </div>
);

export default HargaProductPage;