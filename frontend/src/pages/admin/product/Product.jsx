import { useState, useEffect, useMemo } from "react";
import {
  Package, Pencil, Trash2, Plus, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, Tag, Image as ImageIcon, Filter
} from "lucide-react";
// ✅ FIX: Import dari useMasterData (single source of truth)
import { useJenisDropdown, useTypesDropdown } from "../../../hooks/useMasterData";
import { useProducts, useDeleteProduct } from "../../../hooks/useProducts";
import { useProductFilters, useProductModals } from "../../../lib/zustand/productStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import ProductForm from "./ProductForm";
import ProductDetail from "./ProductDetail";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

const ProductPage = () => {
  const {
    filters, currentPage, setSearch, setJenisFilter, setTypeFilter,
    setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useProductFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useProductModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(filters.search);

  // ✅ FIX: Import dari useMasterData + pass jenisId untuk server-side filtering
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

  // ✅ Type options sudah difilter server-side oleh useTypesDropdown(jenisId)
  // Tidak perlu client-side filtering lagi, tapi tetap normalisasi untuk safety
  const filteredTypesForFilter = useMemo(() => {
    if (!filters.jenisId) return [];
    return typesOptions;
  }, [filters.jenisId, typesOptions]);

  // Auto-reset type filter ketika jenis berubah
  useEffect(() => {
    if (filters.jenisId && filters.typeId) {
      const isValid = filteredTypesForFilter.some(
        (t) => String(t.value) === String(filters.typeId)
      );
      if (!isValid) {
        setTypeFilter('');
      }
    }
  }, [filters.jenisId, filters.typeId, filteredTypesForFilter, setTypeFilter]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useProducts(queryParams);
  const deleteMutation = useDeleteProduct();

  const isFilterActive = hasActiveFilters();

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
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
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

            {/* Jenis Filter */}
            <div className="relative flex-shrink-0 min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.jenisId}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Semua Jenis</option>
                {jenisOptions.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            {/* ✅ Type Filter (Cascade - Server-side filtered) */}
            <div className="relative flex-shrink-0 min-w-[160px]">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.typeId}
                onChange={(e) => setTypeFilter(e.target.value)}
                disabled={!filters.jenisId}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {filters.jenisId
                    ? `Semua Tipe (${filteredTypesForFilter.length})`
                    : "Pilih Jenis dulu"}
                </option>
                {filteredTypesForFilter.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
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
          {products.length === 0 ? (
            <EmptyState isFilterActive={isFilterActive} onReset={resetFilters} onCreate={openCreateModal} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

              {/* PAGINATION */}
              {lastPage > 1 && (
                <div className="mt-6 bg-white rounded-xl border border-slate-200/60 shadow-sm px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-slate-600 text-center sm:text-left order-2 sm:order-1">
                    Menampilkan <span className="font-semibold text-slate-900">{from}</span> - <span className="font-semibold text-slate-900">{to}</span> dari <span className="font-semibold text-slate-900">{total}</span> product
                  </div>
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    {paginationNumbers[0] > 1 && <><button onClick={() => setCurrentPage(1)} disabled={isFetching} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">1</button>{paginationNumbers[0] > 2 && <span className="px-2 text-slate-400">...</span>}</>}
                    {paginationNumbers.map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)} disabled={isFetching} className={cn("px-3 py-1.5 text-sm rounded-lg transition-all", currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50")}>{page}</button>
                    ))}
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage && <>{paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-2 text-slate-400">...</span>}<button onClick={() => setCurrentPage(lastPage)} disabled={isFetching} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">{lastPage}</button></>}
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FAB */}
      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" title="Tambah Product" aria-label="Tambah product baru">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
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

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
const ProductCard = ({ item, onDetail, onEdit, onDelete }) => {
  const qtyToko = Number(item.qty_toko) || 0;
  const qtyBengkel = Number(item.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;
  const isLowStock = totalQty < 20;

  const fotoUrl = item.foto_depan_url || (item.foto_depan ? `${ASSET_URL}/storage/${item.foto_depan}` : null);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
      <div className="relative aspect-square bg-slate-50 flex items-center justify-center cursor-pointer" onClick={onDetail}>
        {fotoUrl ? (
          <img src={fotoUrl} alt={item.kode} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <ImageIcon className="w-10 h-10 text-slate-300" />
        )}
        {isLowStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">STOK RENDAH</div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="text-center mb-2">
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{item.kode}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
            {[item.jenis?.nama, item.type?.nama, item.ukuran].filter(Boolean).join(" • ")}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 mb-2">
          <Tag className="w-3 h-3 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">{formatRupiah(item.harga_umum)}</span>
        </div>

        <div className="grid grid-cols-2 gap-1 mb-2">
          <div className="text-center py-1 bg-slate-50 rounded text-[10px]">
            <span className="text-slate-400 block">Toko</span>
            <span className={cn("font-bold", qtyToko > 0 ? "text-slate-900" : "text-red-500")}>{qtyToko}</span>
          </div>
          <div className="text-center py-1 bg-slate-50 rounded text-[10px]">
            <span className="text-slate-400 block">Bengkel</span>
            <span className={cn("font-bold", qtyBengkel > 0 ? "text-slate-900" : "text-red-500")}>{qtyBengkel}</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button onClick={onDetail} className="flex-1 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Detail</button>
          <button onClick={onEdit} className="flex-1 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">Edit</button>
          <button onClick={onDelete} className="flex-1 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">Hapus</button>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
    {[...Array(10)].map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
        <div className="aspect-square bg-slate-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
          <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto" />
          <div className="h-5 bg-slate-200 rounded w-1/3 mx-auto" />
          <div className="grid grid-cols-2 gap-1"><div className="h-8 bg-slate-200 rounded" /><div className="h-8 bg-slate-200 rounded" /></div>
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
        {isFilterActive ? <X className="w-10 h-10 text-slate-400" /> : <Package className="w-10 h-10 text-slate-400" />}
      </div>
      <div>
        <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada product yang cocok" : "Belum ada data product"}</p>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          {isFilterActive ? "Coba ubah filter pencarian atau reset filter" : "Mulai dengan menambahkan product baru ke inventaris Anda"}
        </p>
        {isFilterActive ? (
          <button onClick={onReset} className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Reset Filter</button>
        ) : (
          <button onClick={onCreate} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Tambah Product Pertama</button>
        )}
      </div>
    </div>
  </div>
);

export default ProductPage;