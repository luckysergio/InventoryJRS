import { useState, useEffect, useMemo, useRef } from "react";
import { Package, Pencil, Trash2, Plus, Search, X, RefreshCw, ChevronLeft, ChevronRight, Tag, Warehouse, Image as ImageIcon } from "lucide-react";
import { useProducts, useDeleteProduct, useJenis, useTypes } from "../../../hooks/useProducts";
import { useProductStore } from "../../../lib/zustand/productStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import ProductForm from "./ProductForm";
import ProductDetail from "./ProductDetail";

const STORAGE_KEY = 'product_page_filters';

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : p.kode;
};

// ✅ Helper: Load filter dari localStorage dengan aman
const loadSavedFilters = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        search: parsed.search || "",
        jenisFilter: parsed.jenisFilter || "",
        typeFilter: parsed.typeFilter || "",
      };
    }
  } catch (err) {
    console.warn("Failed to load filters from localStorage:", err);
  }
  return { search: "", jenisFilter: "", typeFilter: "" };
};

const ProductPage = () => {
  const { openCreateModal, openEditModal, openDetailModal } = useProductStore();
  const { danger } = useConfirmDialog();

  // ✅ Ref untuk auto-focus input setelah reload
  const searchInputRef = useRef(null);

  // ✅ Initialize state dari localStorage (persist saat reload)
  const savedFilters = useMemo(() => loadSavedFilters(), []);
  
  const [searchInput, setSearchInput] = useState(savedFilters.search);
  const [searchQuery, setSearchQuery] = useState(savedFilters.search);
  const [jenisFilter, setJenisFilter] = useState(savedFilters.jenisFilter);
  const [typeFilter, setTypeFilter] = useState(savedFilters.typeFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  const { data: jenisData } = useJenis();
  const { data: typesData } = useTypes();
  
  // ✅ SAFEGUARD: Pastikan data selalu berupa array
  const safeJenis = Array.isArray(jenisData) ? jenisData : [];
  const safeTypes = Array.isArray(typesData) ? typesData : [];

  const { data, isLoading, isError, refetch, isFetching } = useProducts(
    searchQuery, jenisFilter || null, typeFilter || null, currentPage, perPage
  );
  const deleteMutation = useDeleteProduct();

  // ✅ Debounce Search (500ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // ✅ Reset page saat filter berubah
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchQuery, jenisFilter, typeFilter]);

  // ✅ PERSIST: Simpan filter ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      search: searchQuery,
      jenisFilter,
      typeFilter,
    }));
  }, [searchQuery, jenisFilter, typeFilter]);

  // ✅ AUTO-FOCUS: Set focus ke search input setelah mount, cursor di akhir
  useEffect(() => {
    if (searchInputRef.current && savedFilters.search) {
      searchInputRef.current.focus();
      const len = savedFilters.search.length;
      searchInputRef.current.setSelectionRange(len, len);
    }
  }, []); // Hanya jalankan sekali saat mount

  const products = data?.data || [];
  const lastPage = data?.meta?.last_page || 1;
  const total = data?.meta?.total || 0;
  const from = data?.meta?.from || 0;
  const to = data?.meta?.to || 0;

  const handleDelete = async (product) => {
    const result = await danger("Hapus Product?", `Apakah Anda yakin ingin menghapus "${product.kode}"? Tindakan ini tidak dapat dibatalkan.`);
    if (result) deleteMutation.mutate(product.id);
  };

  const handleResetFilters = () => {
    setSearchInput(""); 
    setSearchQuery(""); 
    setJenisFilter(""); 
    setTypeFilter("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const isFilterActive = Boolean(searchQuery || jenisFilter || typeFilter);

  // ✅ FIXED: Filter types dengan perbandingan Number yang robust
  const filteredTypesForFilter = useMemo(() => {
    if (!jenisFilter) return [];
    return safeTypes.filter((t) => Number(t.jenis_id) === Number(jenisFilter));
  }, [jenisFilter, safeTypes]);

  // ✅ Auto-reset typeFilter saat jenisFilter berubah (jika type tidak valid lagi)
  useEffect(() => {
    if (jenisFilter && typeFilter) {
      const isTypeValid = filteredTypesForFilter.some((t) => Number(t.id) === Number(typeFilter));
      if (!isTypeValid) {
        setTypeFilter("");
      }
    }
  }, [jenisFilter, typeFilter, filteredTypesForFilter]);

  const paginationNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages = [];
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat data product...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-red-600">
        Gagal memuat data. Silakan refresh halaman.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* ============================================
          STICKY SEARCH & FILTER BAR
      ============================================ */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* ✅ Search dengan ref untuk auto-focus */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
                placeholder="Cari kode atau nama product..." 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white" 
              />
            </div>
            
            {/* ✅ Filter Jenis */}
            <div className="relative flex-shrink-0 min-w-[160px]">
              <select 
                value={jenisFilter} 
                onChange={(e) => { 
                  setJenisFilter(e.target.value); 
                  setTypeFilter(""); 
                }} 
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Semua Jenis</option>
                {safeJenis.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
              </select>
            </div>

            {/* ✅ Filter Type (FIXED) */}
            <div className="relative flex-shrink-0 min-w-[160px]">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)} 
                disabled={!jenisFilter} 
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                <option value="">
                  {jenisFilter 
                    ? `Semua Tipe (${filteredTypesForFilter.length})` 
                    : "Pilih Jenis dulu"}
                </option>
                {filteredTypesForFilter.map((t) => (
                  <option key={t.id} value={t.id}>{t.nama}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button onClick={handleResetFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50" title="Refresh data">
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* ============================================
          CONTENT GRID
      ============================================ */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-900 font-medium text-lg">{isFilterActive ? "Tidak ada product yang cocok" : "Belum ada data product"}</p>
              <p className="text-sm text-slate-500 mt-1">{isFilterActive ? "Coba ubah filter pencarian Anda" : "Klik tombol '+' untuk membuat product baru"}</p>
              {isFilterActive && <button onClick={handleResetFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">Reset filter</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((item) => {
            const qtyToko = Number(item.qty_toko) || 0;
            const qtyBengkel = Number(item.qty_bengkel) || 0;
            const totalQty = qtyToko + qtyBengkel;

            return (
              <div key={item.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
                <div className="flex justify-center gap-2 mb-3">
                  {[item.foto_depan, item.foto_samping, item.foto_atas].filter(Boolean).slice(0, 3).map((foto, idx) => (
                    <img key={idx} src={`${import.meta.env.VITE_ASSET_URL}/storage/${foto}`} alt="Foto" className="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition" onClick={() => openDetailModal(item)} />
                  ))}
                  {!item.foto_depan && !item.foto_samping && !item.foto_atas && (
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center"><ImageIcon className="text-slate-400" size={18} /></div>
                  )}
                </div>

                <div className="text-center mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{item.kode}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">{formatProductName(item)}</p>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">{formatRupiah(item.harga_umum)}</span>
                </div>

                <div className="space-y-1 mb-3 text-xs text-slate-600">
                  <div className="flex items-center justify-center gap-1.5"><Warehouse className="w-3.5 h-3.5 text-slate-400" /><span>TOKO: <strong className="text-slate-900">{qtyToko}</strong></span></div>
                  <div className="flex items-center justify-center gap-1.5"><Warehouse className="w-3.5 h-3.5 text-slate-400" /><span>BENGKEL: <strong className="text-slate-900">{qtyBengkel}</strong></span></div>
                  <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-slate-100"><Warehouse className="w-3.5 h-3.5 text-blue-500" /><span>TOTAL: <strong className="text-blue-700">{totalQty}</strong></span></div>
                </div>

                {item.keterangan && <p className="text-[10px] italic text-slate-500 text-center line-clamp-2 mb-3 flex-1">"{item.keterangan}"</p>}

                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={() => openDetailModal(item)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail"><Search size={14} /></button>
                  <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================
          PAGINATION
      ============================================ */}
      {lastPage > 1 && (
        <div className="px-6 py-4 bg-white border border-slate-200/60 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600 text-center sm:text-left">Menampilkan <span className="font-semibold text-slate-900">{from}</span> - <span className="font-semibold text-slate-900">{to}</span> dari <span className="font-semibold text-slate-900">{total}</span> product</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
            {paginationNumbers.map((page) => (
              <button key={page} onClick={() => setCurrentPage(page)} disabled={isFetching} className={`px-3 py-1.5 text-sm rounded-lg transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className="p-2 text-slate-600 hover:bg-slate-50 hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* ============================================
          FLOATING ACTION BUTTON (FAB)
      ============================================ */}
      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" title="Tambah Product" aria-label="Tambah product baru">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
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

export default ProductPage;