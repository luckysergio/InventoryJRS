import { useEffect } from "react";
import {
  X,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  Package,
  Hash,
  FileText,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
} from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";

const CustomerTagihanDetailModal = () => {
  const {
    modals,
    tagihanDetail,
    selectedItem,
    openBayarModal,
    closeAllModals,
    openTagihanModal,
  } = useCustomerModals();

  const isOpen = modals.tagihanDetail && !!tagihanDetail;

  // ESC key handler + body scroll lock
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
    if (selectedItem) {
      openTagihanModal(selectedItem, isDaily ? "daily" : "pesanan");
    } else {
      closeAllModals();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tagihan-detail-title"
    >
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* ========================================== */}
        {/* HEADER - Sticky */}
        {/* ========================================== */}
        <div
          className={cn(
            "sticky top-0 z-10 px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-gradient-to-r text-white",
            isDaily
              ? "from-orange-500 to-red-500"
              : "from-purple-500 to-indigo-500"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleKembali}
              className="p-2 hover:bg-white/15 rounded-lg transition-colors flex-shrink-0"
              aria-label="Kembali ke list"
              title="Kembali"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-lg shadow-sm flex-shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="tagihan-detail-title"
                className="text-base sm:text-lg font-bold truncate"
              >
                Detail Tagihan
              </h2>
              <p className="text-[11px] sm:text-xs text-white/80 truncate mt-0.5">
                {isDaily ? "Transaksi Harian" : "Transaksi Pesanan"}
              </p>
            </div>
          </div>
          <button
            onClick={closeAllModals}
            className="p-2 hover:bg-white/15 rounded-lg transition-colors flex-shrink-0 group"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* ========================================== */}
        {/* SCROLLABLE CONTENT */}
        {/* ========================================== */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4">
          {/* ========================================== */}
          {/* PRODUCT INFO */}
          {/* ========================================== */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2.5 rounded-lg flex-shrink-0",
                  isDaily ? "bg-orange-100" : "bg-purple-100"
                )}
              >
                <Package
                  className={cn(
                    "w-4 h-4",
                    isDaily ? "text-orange-600" : "text-purple-600"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-[11px] text-indigo-700 mb-1 tracking-wide">
                  {d.product?.kode || "-"}
                </p>
                <p className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
                  {formatProductName(d.product)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                  <Calendar size={11} />
                  <span>{formatTanggal(d.transaksi?.tanggal, "long")}</span>
                </div>
              </div>
            </div>
            {d.catatan && (
              <div className="mt-3 pt-3 border-t border-slate-200/70">
                <p className="text-[11px] italic text-slate-600 leading-relaxed">
                  <span className="font-semibold not-italic">📝 Catatan:</span>{" "}
                  {d.catatan}
                </p>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* DETAIL INFO (InfoItem Pattern - seragam dengan modal lain) */}
          {/* ========================================== */}
          <div className="space-y-2">
            <InfoItem
              icon={Hash}
              iconBg="bg-slate-100"
              iconColor="text-slate-600"
              label="ID Detail"
              value={`#${d.id}`}
            />
            <InfoItem
              icon={Package}
              iconBg={isDaily ? "bg-orange-100" : "bg-purple-100"}
              iconColor={isDaily ? "text-orange-600" : "text-purple-600"}
              label="Qty × Harga"
              value={`${d.qty} × Rp ${formatRupiah(d.harga)}`}
            />
            <InfoItem
              icon={Receipt}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Total Tagihan"
              value={`Rp ${formatRupiah(subtotal)}`}
            />
            <InfoItem
              icon={CheckCircle2}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              label="Sudah Dibayar"
              value={`Rp ${formatRupiah(sudahBayar)}`}
            />
            <InfoItem
              icon={CreditCard}
              iconBg={lunas ? "bg-emerald-100" : "bg-rose-100"}
              iconColor={lunas ? "text-emerald-600" : "text-rose-600"}
              label="Sisa Tagihan"
              value={lunas ? "LUNAS ✓" : `Rp ${formatRupiah(sisa)}`}
              highlight={!lunas}
            />
          </div>

          {/* ========================================== */}
          {/* PROGRESS BAR */}
          {/* ========================================== */}
          {!lunas && progress > 0 && (
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl p-4 border border-amber-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-amber-700 font-semibold uppercase tracking-wide">
                  Progress Pembayaran
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* RIWAYAT PEMBAYARAN */}
          {/* ========================================== */}
          {d.pembayarans && d.pembayarans.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-200 rounded-lg">
                    <FileText size={12} className="text-slate-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Riwayat Pembayaran
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                  {d.pembayarans.length} transaksi
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {d.pembayarans.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900">
                          Rp {formatRupiah(p.jumlah_bayar)}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatTanggal(p.tanggal_bayar, "short")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 flex-shrink-0 ml-2">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* FOOTER - Sticky */}
        {/* ========================================== */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm flex-shrink-0 px-5 sm:px-6 py-3.5 flex gap-2">
          <button
            onClick={handleKembali}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-[0.98]"
          >
            Kembali
          </button>
          {!lunas ? (
            <button
              onClick={handleBayar}
              className="flex-[2] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
            >
              <Wallet size={15} />
              <span>Bayar Rp {formatRupiah(sisa)}</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-[2] flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl cursor-not-allowed"
            >
              <CheckCircle2 size={15} />
              <span>Sudah Lunas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========================================== */
/* INFO ITEM (seragam dengan UserDetail, LoginLogDetailModal) */
/* ========================================== */
const InfoItem = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  highlight = false,
}) => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl transition-colors group">
    <div
      className={cn(
        "p-2 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform",
        iconBg
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", iconColor)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-semibold truncate",
          highlight ? "text-rose-600" : "text-slate-900"
        )}
      >
        {value}
      </p>
    </div>
  </div>
);

export default CustomerTagihanDetailModal;