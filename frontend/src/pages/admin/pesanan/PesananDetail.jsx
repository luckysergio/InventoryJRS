import { useState } from "react";
import {
  X, Package, Calendar, User, Printer, Pencil, Trash2, Wallet,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, DollarSign,
} from "lucide-react";
import { usePesananModals } from "../../../lib/zustand/pesananStore";
import { useDeletePesanan, useCancelPesananDetail, useUpdatePesananDetailStatus, useCompletePesananDetail } from "../../../hooks/usePesanan";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import {
  formatRupiah, formatTanggal, formatProductName, getInvoiceNumber,
  normalizeDetails, PESANAN_STATUS_INFO, getOverallPesananStatus,
  PESANAN_STATUS_MAP,
} from "./utils/pesananUtils";
import { cn } from "../../../lib/utils";

const PesananDetail = () => {
  const { modals, selectedPesanan, closeDetailModal, openFormModal, openPembayaranModal } = usePesananModals();
  const { danger, success, info } = useConfirmDialog();
  const isAdmin = useIsAdmin();

  const deleteMut = useDeletePesanan();
  const cancelMut = useCancelPesananDetail();
  const updateStatusMut = useUpdatePesananDetailStatus();
  const completeMut = useCompletePesananDetail();

  const isSubmitting = deleteMut.isPending || cancelMut.isPending || updateStatusMut.isPending || completeMut.isPending;

  const handleDelete = async () => {
    const confirmed = await danger("Hapus Pesanan?", "Tindakan ini tidak dapat dibatalkan.");
    if (!confirmed) return;
    try {
      await deleteMut.mutateAsync(selectedPesanan.id);
      await success("Berhasil!", "Pesanan berhasil dihapus");
      closeDetailModal();
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleCancelDetail = async (detailId) => {
    const confirmed = await danger("Batalkan Item?", "Item akan dibatalkan dan tidak dapat dipulihkan.");
    if (!confirmed) return;
    try {
      await cancelMut.mutateAsync(detailId);
      await success("Berhasil!", "Item dibatalkan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleAdvanceStatus = async (detail) => {
    const statusInfo = PESANAN_STATUS_INFO[detail.status_transaksi_id];
    if (!statusInfo?.nextStatus) return;

    try {
      if (statusInfo.nextStatus === PESANAN_STATUS_MAP.SELESAI) {
        await completeMut.mutateAsync(detail.id);
        await success("Berhasil!", "Item diselesaikan");
      } else {
        await updateStatusMut.mutateAsync({
          detailId: detail.id,
          status_transaksi_id: statusInfo.nextStatus,
        });
        await success("Berhasil!", `Status diubah ke ${PESANAN_STATUS_INFO[statusInfo.nextStatus].label}`);
      }
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  if (!modals.detail || !selectedPesanan) return null;

  const details = normalizeDetails(selectedPesanan.details || []);
  const overallStatus = getOverallPesananStatus(details);
  const statusInfo = PESANAN_STATUS_INFO[overallStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={cn("px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r", `${statusInfo.bg} via-white to-white`)}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("p-2.5 rounded-xl shadow-sm", statusInfo.bg)}>
              <Package className="w-5 h-5 text-slate-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{getInvoiceNumber(selectedPesanan)}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusInfo.bg, statusInfo.text)}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={closeDetailModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200 grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg"><User size={14} className="text-indigo-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Customer</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedPesanan.customer?.name || "Umum"}</p>
                  {selectedPesanan.customer?.phone && <p className="text-xs text-slate-500">{selectedPesanan.customer.phone}</p>}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg"><Calendar size={14} className="text-indigo-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Tanggal</p>
                  <p className="text-sm font-semibold text-slate-900">{formatTanggal(selectedPesanan.tanggal, "short")}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg"><DollarSign size={14} className="text-green-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total</p>
                  <p className="text-sm font-bold text-green-700">Rp {formatRupiah(selectedPesanan.total)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="p-1.5 bg-red-100 rounded-lg"><Wallet size={14} className="text-red-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Sisa</p>
                  <p className="text-sm font-bold text-red-700">Rp {formatRupiah(selectedPesanan.sisa_tagihan ?? 0)}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Package size={14} className="text-indigo-600" />
                Detail Pesanan
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{details.length} item</span>
              </h3>
              <div className="space-y-2">
                {details.map((d) => {
                  const sisa = Number(d.sisa_tagihan) || 0;
                  const sudahBayar = Number(d.total_bayar) || 0;
                  const dStatus = PESANAN_STATUS_INFO[d.status_transaksi_id] || PESANAN_STATUS_INFO[1];
                  const isCancelled = d.status_transaksi_id === PESANAN_STATUS_MAP.DIBATALKAN;
                  const isCompleted = d.status_transaksi_id === PESANAN_STATUS_MAP.SELESAI;

                  return (
                    <div key={d.id} className={cn("border rounded-xl p-3 transition-all", isCancelled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200")}>
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg flex-shrink-0", dStatus.bg)}>
                          <Package size={16} className={dStatus.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono font-bold text-xs text-indigo-700">{d.product?.kode || "-"}</p>
                              <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatProductName(d.product)}</p>
                            </div>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0", dStatus.bg, dStatus.text)}>
                              {dStatus.icon} {dStatus.label}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-500 text-[10px] uppercase">Qty</p>
                              <p className="font-bold text-slate-900">{d.qty} unit</p>
                            </div>
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-500 text-[10px] uppercase">Harga</p>
                              <p className="font-bold text-slate-900">Rp {formatRupiah(d.harga)}</p>
                            </div>
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-500 text-[10px] uppercase">Dibayar</p>
                              <p className="font-bold text-green-700">Rp {formatRupiah(sudahBayar)}</p>
                            </div>
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-slate-500 text-[10px] uppercase">Sisa</p>
                              <p className="font-bold text-red-700">Rp {formatRupiah(sisa)}</p>
                            </div>
                          </div>

                          {d.catatan && (
                            <p className="text-[11px] italic text-slate-500 mb-2">"{d.catatan}"</p>
                          )}

                          {/* Actions */}
                          {!isCancelled && !isCompleted && isAdmin && (
                            <div className="flex gap-2 pt-2 border-t border-slate-200">
                              {sisa > 0 && (
                                <button onClick={() => openPembayaranModal(d)} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1.5 rounded text-[11px] font-semibold">
                                  <Wallet size={12} /> Bayar
                                </button>
                              )}
                              {dStatus.nextStatus && (
                                <button onClick={() => handleAdvanceStatus(d)} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1.5 rounded text-[11px] font-semibold">
                                  {dStatus.nextLabel} <ChevronRight size={12} />
                                </button>
                              )}
                              <button onClick={() => handleCancelDetail(d.id)} disabled={isSubmitting} className="flex items-center justify-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1.5 rounded text-[11px] font-semibold">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0 p-4 flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => openFormModal(selectedPesanan)} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={handleDelete} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition">
                <Trash2 size={14} /> Hapus
              </button>
            </>
          )}
          <button onClick={closeDetailModal} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default PesananDetail;