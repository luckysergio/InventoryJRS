import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Pencil,
  Trash2,
  Plus,
  Users,
  Search,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  UserX,
  TrendingUp,
} from "lucide-react";
import {
  useJabatans,
  useDeleteJabatan,
} from "../../../hooks/useJabatans";
import {
  useJabatanSearch,
  useJabatanModals,
} from "../../../lib/zustand/jabatanStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import JabatanForm from "./JabatanForm";

const getKaryawanLevel = (count) => {
  if (count === 0) return { level: "empty", color: "slate", label: "Belum Ada" };
  if (count <= 3) return { level: "small", color: "blue", label: "Tim Kecil" };
  if (count <= 10) return { level: "medium", color: "indigo", label: "Tim Sedang" };
  return { level: "large", color: "emerald", label: "Tim Besar" };
};

const getKaryawanPercentage = (count, max = 20) => Math.min(100, (count / max) * 100);

const JabatanCard = ({ jabatan, onEdit, onDelete }) => {
  const karyawanCount = Number(jabatan.karyawans_count) || 0;
  const karyawanInfo = getKaryawanLevel(karyawanCount);
  const karyawanPercent = getKaryawanPercentage(karyawanCount);
  const hasKaryawans = karyawanCount > 0;

  const qtyGradient =
    karyawanInfo.color === "emerald" ? "from-emerald-600 to-teal-600" :
    karyawanInfo.color === "indigo" ? "from-indigo-600 to-purple-600" :
    karyawanInfo.color === "blue" ? "from-blue-600 to-sky-600" :
    "from-slate-500 to-slate-600";

  const barGradient =
    karyawanInfo.color === "emerald" ? "from-emerald-400 to-teal-500" :
    karyawanInfo.color === "indigo" ? "from-indigo-400 to-purple-500" :
    karyawanInfo.color === "blue" ? "from-blue-400 to-sky-500" :
    "from-slate-300 to-slate-400";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        "border-slate-200 hover:border-indigo-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >

      <div className="flex-1 p-4 sm:p-5">
        <div className="text-left">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight line-clamp-2 min-h-[3rem]">
            {jabatan.nama}
          </h3>
          {jabatan.keterangan && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-2 line-clamp-2 leading-snug">
              {jabatan.keterangan}
            </p>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Jumlah Karyawan
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={cn(
                  "text-3xl sm:text-4xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                  qtyGradient
                )}>
                  {karyawanCount}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-medium">orang</span>
              </div>
            </div>

            {karyawanCount > 10 && (
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
            )}
            {karyawanCount > 0 && karyawanCount <= 3 && (
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Users size={14} className="text-blue-600" />
              </div>
            )}
            {karyawanCount === 0 && (
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <UserX size={14} className="text-slate-500" />
              </div>
            )}
          </div>

          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                barGradient
              )}
              style={{ width: `${karyawanPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className={cn(
        "grid grid-cols-2 border-t-2 border-slate-100",
        "bg-gradient-to-b from-slate-50/50 to-white"
      )}>
        <button
          onClick={onEdit}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Edit Jabatan"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
            Edit
          </span>
        </button>

        <button
          onClick={onDelete}
          disabled={hasKaryawans}
          className={cn(
            "group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 transition-all duration-200",
            hasKaryawans
              ? "cursor-not-allowed opacity-60"
              : "hover:bg-red-50 active:scale-95"
          )}
          title={hasKaryawans ? `Tidak dapat dihapus (${karyawanCount} karyawan aktif)` : "Hapus Jabatan"}
        >
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
            hasKaryawans
              ? "bg-slate-100"
              : "bg-red-100 group-hover/btn:bg-red-500 group-hover/btn:shadow-md group-hover/btn:scale-110"
          )}>
            {hasKaryawans ? (
              <AlertTriangle size={16} className="text-amber-500" strokeWidth={2.5} />
            ) : (
              <Trash2 size={16} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>
          <span className={cn(
            "text-[9px] sm:text-[10px] font-bold uppercase tracking-wide",
            hasKaryawans ? "text-amber-600" : "text-red-700 group-hover/btn:text-red-800"
          )}>
            {hasKaryawans ? "Terkunci" : "Hapus"}
          </span>
        </button>
      </div>
    </div>
  );
};

const JabatanPage = () => {
  const {
    searchQuery,
    currentPage,
    setSearchQuery,
    setCurrentPage,
    resetSearch,
    hasActiveSearch,
    getQueryParams,
  } = useJabatanSearch();

  const { openCreateModal, openEditModal } = useJabatanModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchQuery(searchInput);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, setSearchQuery, searchQuery]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useJabatans(queryParams);
  const deleteMutation = useDeleteJabatan();

  const isFilterActive = hasActiveSearch();

  const handleResetFilters = () => {
    resetSearch();
    setSearchInput("");
  };

  const handleDelete = async (jabatan) => {
    if (jabatan.karyawans_count > 0) {
      await warning(
        "Tidak Dapat Dihapus",
        `Jabatan "${jabatan.nama}" masih digunakan oleh ${jabatan.karyawans_count} karyawan. Pindahkan karyawan terlebih dahulu.`
      );
      return;
    }

    const confirmed = await danger(
      "Hapus Jabatan?",
      `Apakah Anda yakin ingin menghapus jabatan "${jabatan.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(jabatan.id);
      await success("Berhasil!", `Jabatan "${jabatan.nama}" berhasil dihapus.`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus jabatan";
      await info(err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg);
    }
  };

  const jabatans = data?.jabatans || [];
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
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama jabatan..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm transition-all bg-white hover:border-slate-300"
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
      ) : jabatans.length === 0 ? (
        <EmptyState
          isFilterActive={isFilterActive}
          onReset={handleResetFilters}
          onCreate={openCreateModal}
        />
      ) : (
        <div className={cn(
          "transition-opacity",
          isPlaceholderData && "opacity-60"
        )}>
          {/* Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {jabatans.map((item) => (
              <JabatanCard
                key={item.id}
                jabatan={item}
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
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30"
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

      <button
        onClick={openCreateModal}
        className="fixed bottom-6 right-6 z-40 group"
        title="Tambah Jabatan"
        aria-label="Tambah jabatan baru"
      >
        <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Jabatan
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <JabatanForm />
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="h-6 w-20 bg-slate-200 rounded-full" />
          <div className="h-4 w-16 bg-slate-200 rounded-full" />
        </div>

        {/* Body skeleton */}
        <div className="p-4 sm:p-5">
          <div className="space-y-2 mb-4">
            <div className="h-5 bg-slate-200 rounded w-3/4" />
            <div className="h-5 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-10 bg-slate-200 rounded w-1/4" />
            <div className="h-2 bg-slate-200 rounded-full w-full" />
          </div>
        </div>

        {/* Footer skeleton */}
        <div className="grid grid-cols-2 border-t-2 border-slate-100">
          <div className="h-16 bg-slate-50 border-r border-slate-100" />
          <div className="h-16 bg-slate-50" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = ({ isFilterActive, onReset, onCreate }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
      {isFilterActive ? (
        <X className="w-10 h-10 text-slate-400" />
      ) : (
        <Briefcase className="w-10 h-10 text-slate-400" />
      )}
    </div>
    <p className="text-slate-900 font-bold text-lg">
      {isFilterActive ? "Tidak ada jabatan yang cocok" : "Belum ada data jabatan"}
    </p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Coba ubah kata kunci pencarian atau reset filter untuk melihat semua data"
        : "Mulai dengan menambahkan jabatan baru untuk mengelola struktur organisasi perusahaan Anda"}
    </p>
    {isFilterActive ? (
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <X size={14} />
        Reset Filter
      </button>
    ) : (
      <button
        onClick={onCreate}
        className="mt-4 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg"
      >
        <Plus size={16} strokeWidth={2.5} />
        Tambah Jabatan Pertama
      </button>
    )}
  </div>
);

export default JabatanPage;