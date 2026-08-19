import { useState, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, X, RefreshCw,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Tag, Image as ImageIcon, Eye, User, Truck, Filter,
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
const formatRupiah = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(v) || 0);

// ==========================================
// SEARCHABLE CUSTOMER FILTER DROPDOWN
// ==========================================
const CustomerFilterDropdown = ({ customers, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const sorted = [...customers].sort((a, b) =>
      (a.label || "").toLowerCase().localeCompare((b.label || "").toLowerCase())
    );
    if (!search.trim()) return sorted;
    const s = search.toLowerCase();
    return sorted.filter((c) => c.label?.toLowerCase().includes(s));
  }, [customers, search]);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg bg-white text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
      >
        <span className="truncate">
          {selectedValue
            ? customers.find((c) => String(c.value) === String(selectedValue))?.label || "Customer"
            : "Semua Customer"}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 ml-2" /> : <ChevronDown size={16} className="text-slate-400 ml-2" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cari customer..."
                  className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>
                )}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 max-h-40">
              <button
                type="button"
                onClick={() => { onSelect(""); setIsOpen(false); setSearch(""); }}
                className={cn("w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between", !selectedValue ? "bg-blue-100 text-blue-800" : "")}
              >
                <span>Semua Customer</span>
                {!selectedValue && <span className="text-blue-600">✓</span>}
              </button>
              {filtered.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => { onSelect(c.value); setIsOpen(false); setSearch(""); }}
                  className={cn("w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between", String(c.value) === String(selectedValue) ? "bg-blue-100 text-blue-800" : "")}
                >
                  <span className="truncate">{c.label}</span>
                  {String(c.value) === String(selectedValue) && <span className="text-blue-600">✓</span>}
                </button>
              ))}
              {filtered.length === 0 && <div className="p-3 text-sm text-slate-500 text-center">Tidak ditemukan</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// PRODUCT CUSTOMER CARD
// ==========================================
const ProductCustomerCard = ({ item, isAdmin, onDetail, onEdit, onDelete }) => {
  const harga = item.harga ?? 0;
  const fotoUrl = item.foto_depan_url || (item.foto_depan ? `${ASSET_URL}/storage/${item.foto_depan}` : null);
  const customerName = item.customer?.name || "—";

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="flex justify-center gap-2 mb-3 pt-4 px-4">
        {fotoUrl ? (
          <img src={fotoUrl} alt={item.kode} className="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition" onClick={onDetail} />
        ) : (
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><ImageIcon className="text-slate-400" size={18} /></div>
        )}
      </div>

      {/* Kode + Customer */}
      <div className="px-4 text-center mb-2">
        <h3 className="font-mono font-bold text-xs text-indigo-700 break-words whitespace-normal leading-snug">{item.kode}</h3>
      </div>
      <div className="text-center mb-2 flex items-center justify-center gap-1 text-xs text-blue-600 bg-blue-50 py-1 px-2 mx-4 rounded">
        <User size={12} className="flex-shrink-0" />
        <span className="truncate max-w-[120px]">{customerName}</span>
      </div>

      {/* Jenis • Type • Ukuran */}
      <div className="text-center mb-2 min-h-[32px]">
        <p className="text-xs text-slate-600 leading-tight">
          {[item.jenis?.nama, item.type?.nama, item.ukuran].filter(Boolean).join(" • ") || "-"}
        </p>
      </div>

      {/* Harga */}
      <div className="text-center mb-3 flex items-center justify-center gap-1 text-sm">
        <Tag size={14} className="text-emerald-600 flex-shrink-0" />
        <span className="font-bold text-emerald-700 truncate">{formatRupiah(harga)}</span>
      </div>

      {/* Keterangan */}
      {item.keterangan && (
        <div className="text-center mb-3 flex-1 px-4">
          <p className="text-xs italic text-slate-500 line-clamp-2">"{item.keterangan}"</p>
        </div>
      )}

      <div className="flex-1" />

      {/* Action Buttons - hover reveal */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button onClick={onDetail} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail"><Eye size={14} /></button>
        {isAdmin && <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil size={14} /></button>}
        {isAdmin && <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const ProductCustomerPage = () => {
  const { filters, currentPage, setSearch, setCustomerFilter, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useProductCustomerFilters();
  const { openCreateModal, openEditModal, openDetailModal } = useProductCustomerModals();
  const { danger, success, info, warning } = useConfirmDialog();
  const role = useUserRole();
  const isAdmin = useIsAdmin();
  const canCreate = ["admin", "admin_toko", "operator"].includes(role);

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data: customersOptions = [] } = useCustomersDropdown();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useProductCustomers(getQueryParams());
  const deleteMut = useDeleteProductCustomer();

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const products = data?.products || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const from = meta.from || 0;
  const to = meta.to || 0;
  const isFilterActive = hasActiveFilters();

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  const handleDelete = async (item) => {
    const confirmed = await danger("Hapus Produk Customer?", `Apakah Anda yakin ingin menghapus "${item.kode}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;
    try {
      await deleteMut.mutateAsync(item.id);
      await success("Berhasil!", `Produk "${item.kode}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus produk";
      await (err.response?.status === 422 ? warning : info)(err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari kode atau nama produk..." className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white" />
            </div>
            <div className="relative flex-shrink-0 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
              <CustomerFilterDropdown
                customers={customersOptions}
                selectedValue={filters.customerId}
                onSelect={setCustomerFilter}
              />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="flex justify-center gap-2 pt-4 px-4 mb-3"><div className="w-12 h-12 bg-slate-200 rounded-lg" /></div>
              <div className="px-4 space-y-2 mb-3">
                <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto" />
                <div className="h-5 bg-slate-200 rounded w-1/3 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><Search className="w-10 h-10 text-slate-400" /></div>
          <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada produk yang cocok" : "Belum ada produk customer"}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{isFilterActive ? "Coba ubah kata kunci pencarian atau reset filter" : "Mulai dengan menambahkan produk customer baru"}</p>
          {isFilterActive && <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Reset Filter</button>}
        </div>
      ) : (
        <>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* FAB */}
      {canCreate && (
        <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" aria-label="Tambah Produk Customer" title="Tambah Produk Customer">
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110"><Plus className="w-6 h-6" strokeWidth={2.5} /></div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Tambah Produk<div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" /></div>
        </button>
      )}

      <ProductCustomerForm />
      <ProductCustomerDetail />
    </div>
  );
};

export default ProductCustomerPage;