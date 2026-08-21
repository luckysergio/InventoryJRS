import { useEffect } from "react";
import { X, Calendar, Wallet, Receipt, CheckCircle2, Package } from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import { formatRupiah, formatTanggal, formatProductName } from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";

const CustomerTagihanDetailModal = () => {
  const { modals, tagihanDetail, selectedItem, openBayarModal, closeAllModals, openTagihanModal } = useCustomerModals();

  const isOpen = modals.tagihanDetail && !!tagihanDetail;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) closeAllModals();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeAllModals]);

  if (!isOpen || !tagihanDetail) return null;

  const d = tagihanDetail;
  const subtotal = Number(d.subtotal) || 0;
  const sudahBayar = Number(d.total_bayar) || 0;
  const sisa = Number(d.sisa_tagihan) || Math.max(subtotal - sudahBayar, 0);
  const lunas = sisa <= 0;
  const progress = subtotal > 0 ? (sudahBayar / subtotal) * 100 : 0;
  const isDaily = d.transaksi?.jenis_transaksi === "daily";

  const handleBayar = () => {
    openBayarModal(d);
  };

  const handleKembali = () => {
    // Kembali ke list tagihan (jika masih ada filter)
    if (selectedItem) {
      openTagihanModal(selectedItem, isDaily ? "daily" : "pesanan");
    } else {
      closeAllModals();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && closeAllModals()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={cn(
          "px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-gradient-to-r text-white",
          isDaily ? "from-orange-500 to-red-500" : "from-purple-500 to-indigo-500"
        )}>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold">Detail Tagihan</h2>
            <p className="text-xs text-white/80 truncate mt-0.5">
              {isDaily ? "Transaksi Harian" : "Transaksi Pesanan"}
            </p>
          </div>
          <button
            onClick={closeAllModals}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors group flex-shrink-0"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg flex-shrink-0",
                isDaily ? "bg-orange-100" : "bg-purple-100"
              )}>
                <Package className={cn("w-4 h-4", isDaily ? "text-orange-600" : "text-purple-600")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-xs text-indigo-700 mb-0.5">
                  {d.product?.kode || "-"}
                </p>
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {formatProductName(d.product)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                  <Calendar size={10} />
                  <span>{formatTanggal(d.transaksi?.tanggal, "long")}</span>
                </div>
                {d.catatan && (
                  <p className="text-[10px] italic text-slate-500 mt-2 line-clamp-2">
                    📝 {d.catatan}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl p-4 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
              <Receipt size={14} className="text-amber-700" />
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Ringkasan Tagihan
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-800">Qty × Harga</span>
                <span className="text-xs text-slate-600">
                  {d.qty} × Rp {formatRupiah(d.harga)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-800">Total Tagihan</span>
                <span className="text-sm font-semibold text-slate-900">
                  Rp {formatRupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-amber-800">Sudah Dibayar</span>
                <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Rp {formatRupiah(sudahBayar)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-amber-200/60">
                <span className="text-sm font-bold text-amber-900">Sisa Tagihan</span>
                <span className="text-lg font-bold text-red-600">
                  {lunas ? "LUNAS ✓" : `Rp ${formatRupiah(sisa)}`}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            {!lunas && progress > 0 && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-amber-700 font-medium">Progress</span>
                  <span className="text-[10px] font-bold text-amber-900">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Riwayat Pembayaran */}
          {d.pembayarans && d.pembayarans.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-slate-200 rounded-lg">
                  <Receipt size={12} className="text-slate-600" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Riwayat Pembayaran
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                    {d.pembayarans.length} transaksi
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {d.pembayarans.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          Rp {formatRupiah(p.jumlah_bayar)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatTanggal(p.tanggal_bayar, "short")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0 p-4 sm:p-5 flex gap-2">
          <button
            onClick={handleKembali}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Kembali
          </button>
          {!lunas && (
            <button
              onClick={handleBayar}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <Wallet size={16} />
              <span>Bayar Rp {formatRupiah(sisa)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTagihanDetailModal;