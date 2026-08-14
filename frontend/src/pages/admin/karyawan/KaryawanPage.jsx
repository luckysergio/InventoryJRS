import { useState, useEffect, useMemo } from "react";
import { 
  User, 
  Pencil, 
  Trash2, 
  Plus, 
  Search, 
  X, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Filter
} from "lucide-react";
import { useKaryawans, useDeleteKaryawan, useJabatans } from "../../../hooks/useKaryawans";
import { useKaryawanStore } from "../../../lib/zustand/karyawanStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import KaryawanForm from "./KaryawanForm";
import KaryawanDetail from "./KaryawanDetail";

const KaryawanPage = () => {
  const { openCreateModal, openEditModal, openDetailModal } = useKaryawanStore();
  const { danger, info } = useConfirmDialog();

  // ✅ States untuk Filter & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [jabatanFilter, setJabatanFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // ✅ Ambil data jabatan untuk opsi dropdown filter
  const { data: jabatansData } = useJabatans();
  const jabatans = jabatansData?.data || [];

  // ✅ Debounce Search (500ms)
  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // ✅ Reset page ke 1 saat search atau filter jabatan berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, jabatanFilter]);

  // ✅ Fetch data dengan semua parameter filter
  const { data, isLoading, isFetching, refetch } = useKaryawans(
    searchQuery, 
    jabatanFilter || null, 
    currentPage, 
    perPage
  );
  
  const deleteMutation = useDeleteKaryawan();

  const karyawans = data?.data?.data || [];
  const lastPage = data?.data?.last_page || 1;
  const total = data?.data?.total || 0;
  const from = data?.data?.from || 0;
  const to = data?.data?.to || 0;

  const handleDelete = async (karyawan) => {
    const result = await danger(
      "Hapus Karyawan?", 
      `Apakah Anda yakin ingin menghapus "${karyawan.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (result) {
      deleteMutation.mutate(karyawan.id);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setJabatanFilter("");
  };

  const isFilterActive = Boolean(searchQuery || jabatanFilter);

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
          <p className="text-sm text-slate-500 font-medium">Memuat data karyawan...</p>
        </div>
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
            
            {/* 1. Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama, no hp, atau email..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>

            {/* 2. Filter Jabatan Dropdown */}
            <div className="relative flex-shrink-0 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={jabatanFilter}
                onChange={(e) => setJabatanFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Semua Jabatan</option>
                {jabatans.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>

            {/* 3. Reset & Refresh Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
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

      {/* ============================================
          TABLE
      ============================================ */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">No HP</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Jabatan</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {karyawans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium text-lg">
                          {isFilterActive ? "Tidak ada karyawan yang cocok" : "Belum ada data karyawan"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {isFilterActive ? "Coba ubah filter pencarian Anda" : "Klik tombol '+' untuk membuat karyawan baru"}
                        </p>
                        {isFilterActive && (
                          <button onClick={handleResetFilters} className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Reset filter
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                karyawans.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <p className="text-sm font-semibold text-slate-900">{k.nama}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{k.no_hp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">{k.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-block px-2.5 py-1 text-xs rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {k.jabatan?.nama || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openDetailModal(k)} 
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(k)} 
                          className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(k)} 
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ============================================
            PAGINATION
        ============================================ */}
        {lastPage > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-600 text-center sm:text-left">
              Menampilkan <span className="font-semibold text-slate-900">{from}</span> - <span className="font-semibold text-slate-900">{to}</span> dari <span className="font-semibold text-slate-900">{total}</span> karyawan
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(currentPage - 1)} 
                disabled={currentPage === 1 || isFetching} 
                className="p-2 text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {paginationNumbers.map((page) => (
                <button 
                  key={page} 
                  onClick={() => setCurrentPage(page)} 
                  disabled={isFetching} 
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-white"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(currentPage + 1)} 
                disabled={currentPage === lastPage || isFetching} 
                className="p-2 text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          FLOATING ACTION BUTTON (FAB)
      ============================================ */}
      <button 
        onClick={openCreateModal} 
        className="fixed bottom-6 right-6 z-40 group" 
        title="Tambah Karyawan" 
        aria-label="Tambah karyawan baru"
      >
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Karyawan
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      {/* Modals */}
      <KaryawanForm />
      <KaryawanDetail />
    </div>
  );
};

export default KaryawanPage;