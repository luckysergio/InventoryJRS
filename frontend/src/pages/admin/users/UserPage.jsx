import { useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  RefreshCw,
  Filter,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUsers, useDeleteUser } from "../../../hooks/useUsers";
import { useUserFilters, useUserModals } from "../../../lib/zustand/userStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";

import UserForm from "./UserForm";
import UserDetail from "./UserDetail";

const UserPage = () => {
  const {
    filters,
    currentPage,
    setSearch,
    setRoleFilter,
    setCurrentPage,
    resetFilters,
  } = useUserFilters();

  const { openCreateModal, openEditModal, openDetailModal } = useUserModals();

  // ✅ Gunakan useConfirmDialog
  const { danger, toast } = useConfirmDialog();

  const queryParams = {
    search: filters.search,
    page: currentPage,
    perPage: filters.perPage,
  };

  const { data, isLoading, isFetching, refetch } = useUsers(queryParams);
  const deleteUser = useDeleteUser();

  const isFilterActive = Boolean(filters.search || filters.role);

  const handleDelete = async (user) => {
    // ✅ Konfirmasi Hapus Modern
    const result = await danger(
      "Hapus User?",
      `Apakah Anda yakin ingin menghapus "${user.name}"? Data tidak bisa dikembalikan!`
    );

    if (!result) return;

    try {
      await deleteUser.mutateAsync(user.id);
      toast({
        icon: "success",
        title: "Berhasil!",
        text: "User berhasil dihapus",
      });
    } catch (err) {
      toast({
        icon: "error",
        title: err.response?.status === 403 ? "Ditolak" : "Gagal",
        text: err.response?.data?.message || "Gagal menghapus user",
      });
    }
  };

  const users = data?.data || [];
  const lastPage = data?.last_page || 1;
  const total = data?.total || 0;
  const from = data?.from || 0;
  const to = data?.to || 0;

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

  const getRoleBadge = (role) => {
    const colors = {
      admin: "bg-purple-100 text-purple-700 border-purple-200",
      admin_toko: "bg-blue-100 text-blue-700 border-blue-200",
      operator: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    const labels = {
      admin: "Administrator",
      admin_toko: "Admin Toko",
      operator: "Operator",
    };
    return (
      <span
        className={`inline-block px-2.5 py-1 text-xs rounded-md font-medium border ${
          colors[role] || "bg-slate-100 text-slate-700"
        }`}
      >
        {labels[role] || role}
      </span>
    );
  };

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
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
            </div>

            <div className="relative flex-shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.role}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer min-w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Semua Role</option>
                <option value="admin">Administrator</option>
                <option value="admin_toko">Admin Toko</option>
                <option value="operator">Operator</option>
              </select>
            </div>

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
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500 text-sm">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Dibuat</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium">
                            {isFilterActive ? "Tidak ada user yang cocok" : "Belum ada user"}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {isFilterActive ? "Coba ubah filter pencarian Anda" : "Klik tombol '+' untuk membuat user baru"}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="min-w-0 max-w-[180px]">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                        {new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openDetailModal(user)} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEditModal(user)} className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(user)} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
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

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-600 text-center sm:text-left">
                Menampilkan <span className="font-semibold text-slate-900">{from}</span> -{" "}
                <span className="font-semibold text-slate-900">{to}</span> dari{" "}
                <span className="font-semibold text-slate-900">{total}</span> user
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className="p-2 text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {paginationNumbers[0] > 1 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors">1</button>
                    {paginationNumbers[0] > 2 && <span className="px-2 text-slate-400">...</span>}
                  </>
                )}

                {paginationNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={isFetching}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all ${currentPage === page ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-white"}`}
                  >
                    {page}
                  </button>
                ))}

                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                  <>
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-2 text-slate-400">...</span>}
                    <button onClick={() => setCurrentPage(lastPage)} className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors">
                      {lastPage}
                    </button>
                  </>
                )}

                <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className="p-2 text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" title="Tambah User" aria-label="Tambah user baru">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500"></span>
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah User
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <UserForm />
      <UserDetail />
    </div>
  );
};

export default UserPage;