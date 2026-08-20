import { useEffect, useCallback, useMemo, useRef } from "react";
import {
  X, Printer, CheckCircle, XCircle, Loader2, Wallet,
  Package, Calendar, User, Receipt,
} from "lucide-react";
import { useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import {
  useUpdateDetailStatus,
  useCancelDetailTransaksi,
} from "../../../hooks/useTransaksi";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
  getInvoiceNumber,
  getStatusConfig,
  STATUS_MAP,
  normalizeDetails,
} from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";
import InvoiceSimplePrint from "../../../components/InvoiceSimplePrint";
import { useReactToPrint } from "react-to-print";

const TransaksiDetail = () => {
  const { modals, selectedTransaksi, closeAllModals, openPembayaranModal } = useTransaksiModals();
  const updateStatusMut = useUpdateDetailStatus();
  const cancelMut = useCancelDetailTransaksi();
  const { success, danger, info } = useConfirmDialog();
  const isAdmin = useIsAdmin();

  const isOpen = modals.detail && !!selectedTransaksi;
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedTransaksi ? getInvoiceNumber(selectedTransaksi).replace(/\//g, "-") : "Invoice",
  });

  const handleEscKey = useCallback((e) => {
    if (e.key === "Escape" && isOpen) closeAllModals();
  }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscKey]);

  const details = useMemo(
    () => normalizeDetails(selectedTransaksi?.details || []),
    [selectedTransaksi?.details]
  );

  const totalTagihan = Number(selectedTransaksi?.total) || 0;
  const totalBayar = Number(selectedTransaksi?.total_bayar) || 0;
  const sisaTagihan = Number(selectedTransaksi?.sisa_tagihan) || 0;
  const isLunas = sisaTagihan <= 0;

  const handleSelesai = async (detail) => {
    const sisa = Number(detail.sisa_tagihan) || 0;
    if (sisa > 0) {
      await info("Peringatan", "Selesaikan pembayaran terlebih dahulu!");
      return;
    }

    const confirmed = await danger(
      "Selesaikan Detail?",
      `Status "${formatProductName(detail.product)}" akan diubah menjadi Selesai.`,
      "Ya, Selesaikan",
      "Batal"
    );
    if (!confirmed) return;

    try {
      await updateStatusMut.mutateAsync({
        detailId: detail.id,
        status_transaksi_id: STATUS_MAP.SELESAI,
      });
      await success("Berhasil!", "Detail transaksi diselesaikan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleBatal = async (detail) => {
    if (detail.pembayarans && detail.pembayarans.length > 0) {
      await info("Tidak bisa dibatalkan", "Detail ini sudah memiliki pembayaran");
      return;
    }

    const confirmed = await danger(
      "Batalkan Detail?",
      `Stok "${formatProductName(detail.product)}" akan dikembalikan.`,
      "Ya, Batalkan",
      "Tidak"
    );
    if (!confirmed) return;

    try {
      await cancelMut.mutateAsync(detail.id);
      await success("Dibatalkan", "Detail transaksi berhasil dibatalkan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  };

  if (!isOpen || !selectedTransaksi) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate font-mono">
                  {getInvoiceNumber(selectedTransaksi)}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatTanggal(selectedTransaksi.tanggal)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {selectedTransaksi.customer?.name || "Customer Umum"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeAllModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group flex-shrink-0">
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
            </button>
          </div>

          {/* Summary */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 flex-shrink-0">
            <div>
              <p className="text-xs text-slate-500">Total Tagihan</p>
              <p className="text-base font-bold text-slate-900">Rp {formatRupiah(totalTagihan)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Bayar</p>
              <p className="text-base font-bold text-green-600">Rp {formatRupiah(totalBayar)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sisa Tagihan</p>
              <p className={cn("text-base font-bold", isLunas ? "text-green-700" : "text-red-600")}>
                {isLunas ? "✅ LUNAS" : `Rp ${formatRupiah(sisaTagihan)}`}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 overflow-y-auto p-6">
            {details.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Tidak ada detail</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {details.map((d) => {
                  const statusCfg = getStatusConfig(d.status_transaksi_id);
                  const isDibatalkan = d.status_transaksi_id === STATUS_MAP.DIBATALKAN;
                  const sisa = Number(d.sisa_tagihan) || 0;
                  const sudahBayar = Number(d.total_bayar) || 0;
                  const detailLunas = sisa <= 0;

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        "border rounded-xl p-4 transition-all",
                        isDibatalkan ? "bg-red-50/50 border-red-200 opacity-70" : "bg-white border-slate-200"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-xs text-indigo-700 mb-0.5">
                            {d.product?.kode || "-"}
                          </p>
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">
                            {formatProductName(d.product)}
                          </p>
                        </div>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2",
                          statusCfg.bg, statusCfg.text
                        )}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>

                      {!isDibatalkan ? (
                        <>
                          <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Qty × Harga</span>
                              <span className="font-medium">{d.qty} × Rp {formatRupiah(d.harga)}</span>
                            </div>
                            {d.discount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Diskon</span>
                                <span>- Rp {formatRupiah(d.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-sm pt-1 border-t border-slate-100">
                              <span>Tagihan</span>
                              <span>Rp {formatRupiah(d.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Sudah Dibayar</span>
                              <span className="font-medium text-green-600">Rp {formatRupiah(sudahBayar)}</span>
                            </div>
                            <div className={cn(
                              "flex justify-between font-semibold pt-1 border-t border-slate-100",
                              detailLunas ? "text-green-700" : "text-red-600"
                            )}>
                              <span>Sisa</span>
                              <span>{detailLunas ? "✅ Lunas" : `Rp ${formatRupiah(sisa)}`}</span>
                            </div>
                          </div>

                          {d.catatan && (
                            <p className="text-[10px] text-slate-500 italic mt-2 p-2 bg-slate-50 rounded">
                              "{d.catatan}"
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 mt-3">
                            {!detailLunas && d.status_transaksi_id !== STATUS_MAP.SELESAI && (
                              <button
                                onClick={() => openPembayaranModal(d)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition"
                              >
                                <Wallet size={12} /> Bayar
                              </button>
                            )}
                            {detailLunas && d.status_transaksi_id !== STATUS_MAP.SELESAI && (
                              <button
                                onClick={() => handleSelesai(d)}
                                disabled={updateStatusMut.isPending}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
                              >
                                {updateStatusMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                Selesai
                              </button>
                            )}
                            {isAdmin && d.status_transaksi_id !== STATUS_MAP.SELESAI && (
                              <button
                                onClick={() => handleBatal(d)}
                                disabled={cancelMut.isPending}
                                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                              >
                                {cancelMut.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                Batal
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-center text-slate-500 italic py-2">
                          Transaksi ini telah dibatalkan
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-2 bg-white flex-shrink-0 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <div className="flex-1" />
            <button
              onClick={closeAllModals}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Component */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", padding: "20mm", boxSizing: "border-box" }}>
        <InvoiceSimplePrint ref={printRef} transaksi={selectedTransaksi} />
      </div>
    </>
  );
};

export default TransaksiDetail;