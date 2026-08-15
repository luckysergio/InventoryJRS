import { useState, useEffect, useMemo } from "react";
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
    Shield,
    User as UserIcon,
    Mail,
    Calendar,
    Loader2,
} from "lucide-react";
import { useUsers, useDeleteUser } from "../../../hooks/useUsers";
import { useUserFilters, useUserModals } from "../../../lib/zustand/userStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

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
        hasActiveFilters,
    } = useUserFilters();

    const { openCreateModal, openEditModal, openDetailModal } = useUserModals();
    const { danger, success, info } = useConfirmDialog();

    const [searchInput, setSearchInput] = useState(filters.search);

    // Debounced search
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchInput !== filters.search) {
                setSearch(searchInput);
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [searchInput, setSearch, filters.search, setCurrentPage]);

    // Sync searchInput dengan filter
    useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    const queryParams = {
        search: filters.search,
        role: filters.role,
        page: currentPage,
        perPage: filters.perPage,
    };

    const { data, isLoading, isFetching, isPlaceholderData, refetch } = useUsers(queryParams);
    const deleteUser = useDeleteUser();

    const isFilterActive = hasActiveFilters();

    const handleDelete = async (user) => {
        const result = await danger(
            "Hapus User?",
            `Apakah Anda yakin ingin menghapus "${user.name}"? Data tidak bisa dikembalikan!`
        );

        if (!result) return;

        try {
            await deleteUser.mutateAsync(user.id);
            await success("Berhasil!", "User berhasil dihapus");
        } catch (err) {
            await info(
                err.response?.status === 403 ? "Ditolak" : "Gagal",
                err.response?.data?.message || "Gagal menghapus user"
            );
        }
    };

    // Extract data dari response structure baru
    const users = data?.users || [];
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
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [currentPage, lastPage]);

    const getRoleBadge = (role) => {
        const config = {
            admin: {
                bg: "bg-purple-50",
                text: "text-purple-700",
                border: "border-purple-200",
                dot: "bg-purple-500",
                label: "Administrator",
            },
            admin_toko: {
                bg: "bg-blue-50",
                text: "text-blue-700",
                border: "border-blue-200",
                dot: "bg-blue-500",
                label: "Admin Toko",
            },
            operator: {
                bg: "bg-emerald-50",
                text: "text-emerald-700",
                border: "border-emerald-200",
                dot: "bg-emerald-500",
                label: "Operator",
            },
        };
        const c = config[role] || {
            bg: "bg-slate-50",
            text: "text-slate-700",
            border: "border-slate-200",
            dot: "bg-slate-500",
            label: role,
        };
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium border",
                    c.bg,
                    c.text,
                    c.border
                )}
            >
                <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
                {c.label}
            </span>
        );
    };

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarGradient = (role) => {
        const gradients = {
            admin: "from-purple-500 to-indigo-600",
            admin_toko: "from-blue-500 to-cyan-600",
            operator: "from-emerald-500 to-teal-600",
        };
        return gradients[role] || "from-slate-500 to-slate-600";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-4 pb-20">
            {/* ============================================
                STICKY FILTER BAR
            ============================================ */}
            <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari nama atau email..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
                            />
                        </div>

                        {/* Role Filter */}
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

                        {/* Reset + Refresh */}
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
                                <RefreshCw
                                    className={cn("w-4 h-4", isFetching && "animate-spin")}
                                />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================
                TABLE / CARD VIEW
            ============================================ */}
            {isLoading ? (
                <LoadingSkeleton />
            ) : (
                <div
                    className={cn(
                        "bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden transition-opacity",
                        isPlaceholderData && "opacity-60"
                    )}
                >
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Dibuat
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <EmptyState isFilterActive={isFilterActive} />
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={cn(
                                                            "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm",
                                                            getAvatarGradient(user.role)
                                                        )}
                                                    >
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center">
                                                {formatDate(user.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openDetailModal(user)}
                                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Detail"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        disabled={deleteUser.isPending}
                                                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <div className="px-6 py-16">
                                <EmptyState isFilterActive={isFilterActive} />
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className="p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm",
                                                getAvatarGradient(user.role)
                                            )}
                                        >
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                {getRoleBadge(user.role)}
                                            </div>
                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                                <p className="text-xs text-slate-500">
                                                    {formatDate(user.created_at)}
                                                </p>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openDetailModal(user)}
                                                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        disabled={deleteUser.isPending}
                                                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {lastPage > 1 && (
                        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-sm text-slate-600 text-center sm:text-left order-2 sm:order-1">
                                Menampilkan{" "}
                                <span className="font-semibold text-slate-900">{from}</span> -{" "}
                                <span className="font-semibold text-slate-900">{to}</span> dari{" "}
                                <span className="font-semibold text-slate-900">{total}</span>{" "}
                                user
                            </div>

                            <div className="flex items-center gap-1 order-1 sm:order-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1 || isFetching}
                                    className="p-2 text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {paginationNumbers[0] > 1 && (
                                    <>
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
                                        >
                                            1
                                        </button>
                                        {paginationNumbers[0] > 2 && (
                                            <span className="px-2 text-slate-400">...</span>
                                        )}
                                    </>
                                )}

                                {paginationNumbers.map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        disabled={isFetching}
                                        className={cn(
                                            "px-3 py-1.5 text-sm rounded-lg transition-all",
                                            currentPage === page
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-slate-700 hover:bg-white"
                                        )}
                                    >
                                        {page}
                                    </button>
                                ))}

                                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                                    <>
                                        {paginationNumbers[paginationNumbers.length - 1] <
                                            lastPage - 1 && (
                                            <span className="px-2 text-slate-400">...</span>
                                        )}
                                        <button
                                            onClick={() => setCurrentPage(lastPage)}
                                            className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white rounded-lg transition-colors"
                                        >
                                            {lastPage}
                                        </button>
                                    </>
                                )}

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
            )}

            {/* Floating Action Button */}
            <button
                onClick={openCreateModal}
                className="fixed bottom-6 right-6 z-40 group"
                title="Tambah User"
                aria-label="Tambah user baru"
            >
                <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
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

// ============================================
// LOADING SKELETON COMPONENT
// ============================================
const LoadingSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="hidden md:block">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <div className="grid grid-cols-4 gap-4">
                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                </div>
            </div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-slate-100">
                    <div className="grid grid-cols-4 gap-4 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-200 rounded animate-pulse w-32" />
                                <div className="h-2 bg-slate-200 rounded animate-pulse w-40" />
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
                        </div>
                        <div className="flex justify-center">
                            <div className="h-3 bg-slate-200 rounded animate-pulse w-20" />
                        </div>
                        <div className="flex justify-center gap-1">
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="md:hidden divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-full animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <div className="space-y-1 flex-1">
                                    <div className="h-3 bg-slate-200 rounded animate-pulse w-32" />
                                    <div className="h-2 bg-slate-200 rounded animate-pulse w-40" />
                                </div>
                                <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-100">
                                <div className="h-3 bg-slate-200 rounded animate-pulse w-20" />
                                <div className="flex gap-1">
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ============================================
// EMPTY STATE COMPONENT
// ============================================
const EmptyState = ({ isFilterActive }) => (
    <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
        </div>
        <div>
            <p className="text-slate-900 font-medium">
                {isFilterActive ? "Tidak ada user yang cocok" : "Belum ada user"}
            </p>
            <p className="text-sm text-slate-500 mt-1">
                {isFilterActive
                    ? "Coba ubah filter pencarian Anda"
                    : "Klik tombol '+' untuk membuat user baru"}
            </p>
        </div>
    </div>
);

export default UserPage;