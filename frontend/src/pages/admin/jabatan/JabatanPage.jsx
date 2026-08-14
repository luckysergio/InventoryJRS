import { useState, useEffect, useMemo } from "react";
import { 
  Briefcase, 
  Pencil, 
  Trash2, 
  Plus, 
  Users, 
  Search, 
  X, 
  RefreshCw 
} from "lucide-react";
import { useJabatans, useDeleteJabatan } from "../../../hooks/useJabatans";
import { useJabatanStore } from "../../../lib/zustand/jabatanStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import JabatanForm from "./JabatanForm";

const JabatanPage = () => {
  const { openCreateModal, openEditModal } = useJabatanStore();
  const { danger, info } = useConfirmDialog();

  const { 
    data: jabatans = [], 
    isLoading, 
    isError, 
    refetch, 
    isFetching 
  } = useJabatans();
  
  const deleteMutation = useDeleteJabatan();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const filteredJabatans = useMemo(() => {
    if (!searchQuery.trim()) return jabatans;

    const query = searchQuery.toLowerCase();
    return jabatans.filter((item) =>
      item.nama.toLowerCase().includes(query)
    );
  }, [jabatans, searchQuery]);

  const handleDelete = async (jabatan) => {
    const result = await danger(
      "Hapus Jabatan?",
      `Apakah Anda yakin ingin menghapus jabatan "${jabatan.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (result) {
      deleteMutation.mutate(jabatan.id);
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
          <p className="text-sm text-slate-500 font-medium">Memuat data jabatan...</p>
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
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama jabatan..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>

            {/* Reset + Refresh */}
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

      {filteredJabatans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              {searchQuery ? (
                <X className="w-8 h-8 text-slate-400" />
              ) : (
                <Briefcase className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-slate-900 font-medium text-lg">
                {searchQuery ? "Tidak ada jabatan yang cocok" : "Belum ada data jabatan"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchQuery
                  ? "Coba ubah kata kunci pencarian Anda"
                  : "Klik tombol '+' untuk membuat jabatan baru"}
              </p>
              {searchQuery && (
                <button
                  onClick={handleResetSearch}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset pencarian
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredJabatans.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
            >
              {/* Card Content */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center mb-3 transition-colors duration-300">
                  <Briefcase className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                  {item.nama}
                </h3>

                {/* Employee Count Badge */}
                {item.karyawans_count > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-slate-100 rounded-full">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">
                      {item.karyawans_count} Karyawan
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

      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Jabatan"
        aria-label="Tambah jabatan baru"
      >
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        {/* Tooltip */}
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Jabatan
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      {/* Modal Form */}
      <JabatanForm />
    </div>
  );
};

export default JabatanPage;