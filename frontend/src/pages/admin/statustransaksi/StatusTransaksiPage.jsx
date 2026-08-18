import { useMemo } from "react";
import { Plus, Pencil, Trash2, Tag, ShieldAlert, Search } from "lucide-react";
import { useStatusTransaksiList, useDeleteStatusTransaksi } from "../../../hooks/useStatusTransaksi";
import { useStatusTransaksiModals } from "../../../lib/zustand/statusTransaksiStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";
import StatusTransaksiForm from "./StatusTransaksiForm";

const StatusTransaksiPage = () => {
  const { openCreateModal, openEditModal } = useStatusTransaksiModals();
  const { danger, success, info, warning } = useConfirmDialog();
  const { data: statuses = [], isLoading, isFetching } = useStatusTransaksiList();
  const deleteMut = useDeleteStatusTransaksi();

  const handleDelete = async (item) => {
    const confirmed = await danger(
      "Hapus Status?",
      `Apakah Anda yakin ingin menghapus status "${item.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMut.mutateAsync(item.id);
      await success("Berhasil!", `Status "${item.nama}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus status";
      await (err.response?.status === 422 ? warning : info)(
        err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal",
        msg
      );
    }
  };

  // Color mapping untuk badge berdasarkan nama status
  const getBadgeColor = (nama) => {
    const n = (nama || "").toLowerCase();
    if (n.includes("selesai") || n.includes("lunas")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (n.includes("batal") || n.includes("cancel")) return "bg-red-50 text-red-700 border-red-200";
    if (n.includes("pending") || n.includes("proses")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (n.includes("draft")) return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-4 pb-20">

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-slate-200 rounded-lg flex-1" />
                <div className="h-8 bg-slate-200 rounded-lg flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : statuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">Belum ada status transaksi</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Mulai dengan menambahkan status transaksi baru seperti Selesai, Pending, atau Dibatalkan
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Status Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {statuses.map((item) => {
            const badgeColor = getBadgeColor(item.nama);
            const isProtected = (item.nama || "").toLowerCase().includes("selesai") ||
                                (item.nama || "").toLowerCase().includes("batal");

            return (
              <div
                key={item.id}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors", badgeColor.split(" ")[0])}>
                    <Tag className={cn("w-5 h-5", badgeColor.split(" ")[1])} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate" title={item.nama}>
                      {item.nama}
                    </h3>
                  </div>
                </div>

                {/* Badge Preview */}
                <div className="mb-4">
                  <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", badgeColor)}>
                    <Tag className="w-3 h-3" />
                    {item.nama}
                  </span>
                </div>

                <div className="flex-1" />

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-xs font-medium transition active:scale-95"
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={isProtected}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition active:scale-95",
                      isProtected
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    )}
                    title={isProtected ? "Status sistem tidak dapat dihapus" : "Hapus status"}
                  >
                    {isProtected ? <ShieldAlert size={14} /> : <Trash2 size={14} />}
                    {isProtected ? "Dilindungi" : "Hapus"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" aria-label="Tambah Status">
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
        <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </div>
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Tambah Status
          <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </div>
      </button>

      <StatusTransaksiForm />
    </div>
  );
};

export default StatusTransaksiPage;