import { useState, useEffect, useMemo } from "react";
import {
  Tag,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  Boxes,
  ShieldAlert,
} from "lucide-react";
import {
  useJenisProducts,
  useDeleteJenisProduct,
} from "../../../hooks/useJenisProducts";
import {
  useJenisProductFilters,
  useJenisProductModals,
} from "../../../lib/zustand/jenisProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

import JenisProductForm from "./JenisProductForm";

const JenisProductPage = () => {
  const {
    filters,
    currentPage,
    setSearch,
    setCurrentPage,
    resetFilters,
    hasActiveSearch,
    getQueryParams,
  } = useJenisProductFilters();

  const { openCreateModal, openEditModal } = useJenisProductModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search (server-side)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        setSearch(searchInput);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, setSearch, filters.search]);

  // Sync searchInput
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } =
    useJenisProducts(queryParams);
  const deleteMutation = useDeleteJenisProduct();

  const isFilterActive = hasActiveSearch();

  const handleDelete = async (jenis) => {
    // ✅ Delete Protection: cek relasi products atau types
    const hasProducts = (jenis.products_count || 0) > 0;
    const hasTypes = (jenis.types_count || 0) > 0;

    if (hasProducts || hasTypes) {
      await warning(
        "Tidak Dapat Dihapus",
        `Jenis "${jenis.nama}" masih digunakan oleh ${jenis.products_count || 0} produk dan ${jenis.types_count || 0} tipe. Hapus atau pindahkan relasi terlebih dahulu.`
      );
      return;
    }

    const confirmed = await danger(
      "Hapus Jenis Product?",
      `Apakah Anda yakin ingin menghapus "${jenis.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(jenis.id);
      await success("Berhasil!", `Jenis "${jenis.nama}" berhasil dihapus`);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Gagal menghapus jenis product";
      await info(
        err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal",
        msg
      );
    }
  };

  const jenisProducts = data?.jenisProducts || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const from = meta.from || 0;
  const to = meta.to || 0;

  const paginationNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  return (
    <div className="space-y-4 pb-20">
      {/* ============================================
          STICKY SEARCH BAR
      ============================================ */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama jenis product..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>

            {/* Reset & Refresh */}
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw
                  className={cn("w-4 h-4", isFetching && "animate-spin")}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          CONTENT
      ============================================ */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div
          className={cn(
            "transition-opacity",
            isPlaceholderData && "opacity-60"
          )}
        >
          {jenisProducts.length === 0 ? (
            <EmptyState
              isFilterActive={isFilterActive}
              onReset={resetFilters}
              onCreate={openCreateModal}
            />
          ) : (
            <>
              {/* Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {jenisProducts.map((item) => (
                  <JenisProductCard
                    key={item.id}
                    item={item}
                    onEdit={() => openEditModal(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {lastPage > 1 && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 text-center sm:text-left order-2 sm:order-1">
                    Menampilkan{" "}
                    <span className="font-semibold text-slate-900">{from}</span> -{" "}
                    <span className="font-semibold text-slate-900">{to}</span> dari{" "}
                    <span className="font-semibold text-slate-900">{total}</span>{" "}
                    jenis product
                  </div>

                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || isFetching}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {paginationNumbers[0] > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={isFetching}
                          className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          1
                        </button>
                        {paginationNumbers[0] > 2 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                      </>
                    )}

                    {paginationNumbers.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        disabled={isFetching}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg transition-all",
                          currentPage === page
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {page}
                      </button>
                    ))}

                    {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                      <>
                        {paginationNumbers[paginationNumbers.length - 1] <
                          lastPage - 1 && (
                          <span className="px-2 text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(lastPage)}
                          disabled={isFetching}
                          className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          {lastPage}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === lastPage || isFetching}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Jenis Product"
        aria-label="Tambah jenis product baru"
      >
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Jenis
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <JenisProductForm />
    </div>
  );
};

// ============================================
// JENIS PRODUCT CARD COMPONENT
// ============================================
const JenisProductCard = ({ item, onEdit, onDelete }) => {
  const hasProducts = (item.products_count || 0) > 0;
  const hasTypes = (item.types_count || 0) > 0;
  const isProtected = hasProducts || hasTypes;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
      {/* Card Content */}
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-indigo-50 flex items-center justify-center mb-3 transition-all duration-300 ring-2 ring-slate-100 group-hover:ring-blue-200">
          <Tag className="w-7 h-7 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
        </div>

        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center mb-3">
          {item.nama}
        </h3>

        {/* Counts */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
              hasProducts
                ? "bg-blue-50 text-blue-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <Package className="w-3 h-3" />
            <span>{item.products_count || 0}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors",
              hasTypes
                ? "bg-purple-50 text-purple-700"
                : "bg-slate-100 text-slate-500"
            )}
          >
            <Boxes className="w-3 h-3" />
            <span>{item.types_count || 0}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={onEdit}
          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          disabled={isProtected}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isProtected
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-500 hover:text-red-600 hover:bg-red-50"
          )}
          title={isProtected ? "Tidak dapat dihapus (masih digunakan)" : "Hapus"}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Protected Overlay */}
      {isProtected && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
          <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-slate-700">
              Digunakan {item.products_count || 0} produk
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// LOADING SKELETON
// ============================================
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse"
      >
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-slate-200 mb-3" />
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
          <div className="flex gap-2">
            <div className="h-6 w-12 bg-slate-200 rounded-full" />
            <div className="h-6 w-12 bg-slate-200 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
        {isFilterActive ? (
          <X className="w-10 h-10 text-slate-400" />
        ) : (
          <Tag className="w-10 h-10 text-slate-400" />
        )}
      </div>
      <div>
        <p className="text-slate-900 font-semibold text-lg">
          {isFilterActive
            ? "Tidak ada jenis product yang cocok"
            : "Belum ada data jenis product"}
        </p>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          {isFilterActive
            ? "Coba ubah kata kunci pencarian Anda atau reset filter untuk melihat semua data"
            : "Mulai dengan menambahkan jenis product baru untuk mengkategorikan produk Anda"}
        </p>
        {isFilterActive ? (
          <button
            onClick={onReset}
            className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Reset Pencarian
          </button>
        ) : (
          <button
            onClick={onCreate}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tambah Jenis Pertama
          </button>
        )}
      </div>
    </div>
  </div>
);

export default JenisProductPage;