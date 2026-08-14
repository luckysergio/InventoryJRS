import { useState, useEffect, useMemo } from "react";
import { Layers, Pencil, Trash2, Plus, Search, X, RefreshCw, Tag, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useTypeProducts, useDeleteTypeProduct, useJenisProducts } from "../../../hooks/useTypeProducts";
import { useTypeProductStore } from "../../../lib/zustand/typeProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import TypeProductForm from "./TypeProductForm";
import TypeProductDetail from "./TypeProductDetail";

const TypeProductPage = () => {
  const { openCreateModal, openEditModal, openDetailModal } = useTypeProductStore();
  const { danger } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [jenisFilter, setJenisFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  const { data: jenisData = [] } = useJenisProducts();
  const { data, isLoading, isError, refetch, isFetching } = useTypeProducts(
    searchQuery, 
    jenisFilter || null, 
    currentPage, 
    perPage
  );
  const deleteMutation = useDeleteTypeProduct();

  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, jenisFilter]);

  // ✅ Ekstraksi data dari objek paginator dengan aman
  const typeData = data?.data || [];
  const lastPage = data?.last_page || 1;
  const total = data?.total || 0;
  const from = data?.from || 0;
  const to = data?.to || 0;

  const handleDelete = async (type) => {
    const result = await danger(
      "Hapus Type Product?",
      `Apakah Anda yakin ingin menghapus "${type.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (result) {
      deleteMutation.mutate(type.id);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setJenisFilter("");
  };

  const isFilterActive = Boolean(searchQuery || jenisFilter);

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
          <p className="text-sm text-slate-500 font-medium">Memuat data type product...</p>
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
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama type product..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>
            <div className="relative flex-shrink-0 min-w-[200px]">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Semua Jenis</option>
                {jenisData.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
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

      {typeData.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-900 font-medium text-lg">
                {isFilterActive ? "Tidak ada type product yang cocok" : "Belum ada data type product"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {isFilterActive ? "Coba ubah filter pencarian Anda" : "Klik tombol '+' untuk membuat type product baru"}
              </p>
              {isFilterActive && (
                <button onClick={handleResetFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Reset filter
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {typeData.map((item) => (
            <div key={item.id} className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors duration-300">
                  <Layers className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                  {item.nama}
                </h3>
                
                <div className="flex flex-col items-center gap-1.5 mt-3 w-full">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 rounded-full w-full justify-center">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 truncate">
                      {item.jenis?.nama || "Tanpa Jenis"}
                    </span>
                  </div>
                  {item.products_count > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full w-full justify-center">
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">
                        {item.products_count} Product
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => openDetailModal(item)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
                  <Search size={14} />
                </button>
                <button onClick={() => openEditModal(item)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(item)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastPage > 1 && (
        <div className="px-6 py-4 bg-white border border-slate-200/60 rounded-xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-slate-600 text-center sm:text-left">
            Menampilkan <span className="font-semibold text-slate-900">{from}</span> - <span className="font-semibold text-slate-900">{to}</span> dari <span className="font-semibold text-slate-900">{total}</span> type product
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(currentPage - 1)} 
              disabled={currentPage === 1 || isFetching} 
              className="p-2 text-slate-600 hover:bg-slate-50 hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {paginationNumbers.map((page) => (
              <button 
                key={page} 
                onClick={() => setCurrentPage(page)} 
                disabled={isFetching} 
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            
            <button 
              onClick={() => setCurrentPage(currentPage + 1)} 
              disabled={currentPage === lastPage || isFetching} 
              className="p-2 text-slate-600 hover:bg-slate-50 hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" title="Tambah Type Product" aria-label="Tambah type product baru">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Type
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <TypeProductForm />
      <TypeProductDetail />
    </div>
  );
};

export default TypeProductPage;