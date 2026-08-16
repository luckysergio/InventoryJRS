import { useState, useEffect, useMemo } from "react";
import {
  Tag, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, User, Globe, Calendar, Eye, Filter
} from "lucide-react";
// ✅ FIX: Import dropdown dari useMasterData, list/delete dari useHargaProducts
import { useProductsDropdown } from "../../../hooks/useMasterData";
import { useHargaProducts, useDeleteHargaProduct } from "../../../hooks/useHargaProducts";
import { useHargaProductFilters, useHargaProductModals } from "../../../lib/zustand/hargaProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import HargaProductForm from "./HargaProductForm";
import HargaProductDetail from "./HargaProductDetail";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID").format(value);

const HargaProductPage = () => {
  const { filters, currentPage, setSearch, setProductFilter, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useHargaProductFilters();
  const { openCreateModal, openEditModal, openDetailModal } = useHargaProductModals();
  const { danger, success, info } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  // ✅ FIX: Import dari useMasterData
  const { data: productsOptions = [] } = useProductsDropdown();

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

  const handleDelete = async (harga) => {
    const productName = harga.product?.kode || "produk ini";
    const target = harga.customer_id ? `untuk ${harga.customer?.name}` : "umum";

    const confirmed = await danger(
      "Hapus Harga?",
      `Apakah Anda yakin ingin menghapus harga ${target} untuk "${productName}" senilai Rp ${formatRupiah(harga.harga)}?`
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
  const from = meta.from || 0;
  const to = meta.to || 0;

  const paginationNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
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
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode atau nama product..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>

            <div className="relative flex-shrink-0 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.productId}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Semua Product</option>
                {productsOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50" title="Refresh">
                <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {hargaList.length === 0 ? (
            <EmptyState isFilterActive={isFilterActive} onReset={resetFilters} onCreate={openCreateModal} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

              {/* PAGINATION */}
              {lastPage > 1 && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 text-center sm:text-left order-2 sm:order-1">
                    Menampilkan <span className="font-semibold text-slate-900">{from}</span> - <span className="font-semibold text-slate-900">{to}</span> dari <span className="font-semibold text-slate-900">{total}</span> harga
                  </div>
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    {paginationNumbers[0] > 1 && <><button onClick={() => setCurrentPage(1)} disabled={isFetching} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">1</button>{paginationNumbers[0] > 2 && <span className="px-2 text-slate-400">...</span>}</>}
                    {paginationNumbers.map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)} disabled={isFetching} className={cn("px-3 py-1.5 text-sm rounded-lg transition-all", currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50")}>{page}</button>
                    ))}
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage && <>{paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-2 text-slate-400">...</span>}<button onClick={() => setCurrentPage(lastPage)} disabled={isFetching} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">{lastPage}</button></>}
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" title="Tambah Harga" aria-label="Tambah harga baru">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
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

// ============================================
// HARGA CARD COMPONENT
// ============================================
const HargaCard = ({ item, onDetail, onEdit, onDelete }) => {
  const isCustomerSpecific = !!item.customer_id;
  const product = item.product;

  const productParts = [product?.jenis?.nama, product?.type?.nama, product?.ukuran].filter(Boolean);
  const productLabel = productParts.length > 0 ? productParts.join(" • ") : product?.kode || "-";

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
      {/* Top Section: Product Info */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-0.5">{product?.kode || "-"}</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{productLabel}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onDetail} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail"><Eye size={14} /></button>
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil size={14} /></button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Price & Target */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Harga</span>
          <span className="text-lg font-bold text-emerald-600 leading-tight">Rp {formatRupiah(item.harga)}</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
            isCustomerSpecific
              ? "bg-purple-50 text-purple-700 border border-purple-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          )}>
            {isCustomerSpecific ? <User className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {isCustomerSpecific ? item.customer?.name || "Customer" : "Umum"}
          </span>

          {item.tanggal_berlaku && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(item.tanggal_berlaku).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// LOADING SKELETON
// ============================================
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
        </div>
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="space-y-1"><div className="h-2 bg-slate-200 rounded w-8" /><div className="h-5 bg-slate-200 rounded w-24" /></div>
          <div className="space-y-1"><div className="h-4 bg-slate-200 rounded-full w-16" /><div className="h-3 bg-slate-200 rounded w-20" /></div>
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
        {isFilterActive ? <X className="w-10 h-10 text-slate-400" /> : <Tag className="w-10 h-10 text-slate-400" />}
      </div>
      <div>
        <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada harga yang cocok" : "Belum ada data harga"}</p>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          {isFilterActive ? "Coba ubah filter pencarian atau reset filter" : "Mulai dengan menambahkan harga untuk produk Anda"}
        </p>
        {isFilterActive ? (
          <button onClick={onReset} className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Reset Filter</button>
        ) : (
          <button onClick={onCreate} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Harga Pertama</button>
        )}
      </div>
    </div>
  </div>
);

export default HargaProductPage;