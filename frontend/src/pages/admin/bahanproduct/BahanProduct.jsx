import { useState, useEffect, useMemo } from "react";
import { Package, Pencil, Trash2, Plus, Search, X, RefreshCw } from "lucide-react";
import { useBahanProducts, useDeleteBahanProduct } from "../../../hooks/useBahanProducts";
import { useBahanProductStore } from "../../../lib/zustand/bahanProductStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import BahanProductForm from "./BahanProductForm";

const BahanProductPage = () => {
  const { openCreateModal, openEditModal } = useBahanProductStore();
  const { danger, info } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: bahanData = [], isLoading, isError, refetch, isFetching } = useBahanProducts();
  const deleteMutation = useDeleteBahanProduct();

  // ✅ Debounce Search (500ms)
  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // ✅ Client-side filtering (data master kecil, lebih cepat dari API call)
  const filteredBahan = useMemo(() => {
    if (!searchQuery.trim()) return bahanData;
    const query = searchQuery.toLowerCase();
    return bahanData.filter((item) => item.nama.toLowerCase().includes(query));
  }, [bahanData, searchQuery]);

  const handleDelete = async (bahan) => {
    const result = await danger(
      "Hapus Bahan Product?",
      `Apakah Anda yakin ingin menghapus "${bahan.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (result) {
      deleteMutation.mutate(bahan.id);
    }
  };

  const handleResetSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat data bahan product...</p>
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
          STICKY SEARCH BAR
      ============================================ */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama bahan product..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {searchQuery && (
                <button
                  onClick={handleResetSearch}
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
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredBahan.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              {searchQuery ? <X className="w-8 h-8 text-slate-400" /> : <Package className="w-8 h-8 text-slate-400" />}
            </div>
            <div>
              <p className="text-slate-900 font-medium text-lg">
                {searchQuery ? "Tidak ada bahan product yang cocok" : "Belum ada data bahan product"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery ? "Coba ubah kata kunci pencarian Anda" : "Klik tombol '+' untuk membuat bahan product baru"}
              </p>
              {searchQuery && (
                <button onClick={handleResetSearch} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Reset pencarian
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredBahan.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors duration-300">
                  <Package className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                  {item.nama}
                </h3>
                
                {/* Optional: Show product count if backend returns it (products_count) */}
                {item.products_count > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-emerald-50 rounded-full">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      {item.products_count} Product
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons (Visible on Hover) */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================
          FLOATING ACTION BUTTON (FAB)
      ============================================ */}
      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Bahan Product"
        aria-label="Tambah bahan product baru"
      >
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Bahan
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      {/* Modal Form */}
      <BahanProductForm />
    </div>
  );
};

export default BahanProductPage;