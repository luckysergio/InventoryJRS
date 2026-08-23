import { useEffect } from "react";
import {
  X, Calendar, Wallet, Package, Loader2, AlertCircle, ListOrdered,
} from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import { useCustomerTagihan } from "../../../hooks/useCustomers";
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
} from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";

const CustomerTagihanModal = () => {
  const {
    modals,
    selectedItem,
    tagihanFilter,
    openTagihanDetailModal,
    closeAllModals,
  } = useCustomerModals();

  const isOpen = modals.tagihan && !!selectedItem;

  const { data, isLoading, error, refetch } = useCustomerTagihan(
    selectedItem?.id,
    tagihanFilter,
    isOpen
  );

  const details = data?.details || [];
  const summary = data?.summary || {};

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

  if (!isOpen || !selectedItem) return null;

  const isDaily = tagihanFilter === "daily";
  const title =
    tagihanFilter === "daily"
      ? "Tagihan Harian"
      : tagihanFilter === "pesanan"
      ? "Tagihan Pesanan"
      : "Semua Tagihan";

  const accentGradient = isDaily
    ? "from-orange-500 to-red-500"
    : "from-purple-500 to-indigo-500";

  const accentSoft = isDaily ? "bg-orange-50" : "bg-purple-50";
  const accentText = isDaily ? "text-orange-700" : "text-purple-700";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tagihan-modal-title"
    >
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* ========================================== */}
        {/* HEADER - Sticky */}
        {/* ========================================== */}
        <div
          className={cn(
            "sticky top-0 z-10 px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-gradient-to-r text-white",
            accentGradient
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/15 backdrop-blur-sm rounded-lg shadow-sm flex-shrink-0">
              <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="tagihan-modal-title"
                className="text-base sm:text-lg font-bold truncate"
              >
                {title}
              </h2>
              <p className="text-[11px] sm:text-xs text-white/80 truncate mt-0.5">
                {selectedItem.name}
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
        {/* SUMMARY BAR - Sticky */}
        {/* ========================================== */}
        <div className="sticky top-[73px] z-10 px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm flex-shrink-0">
          <div className="grid grid-cols-3 gap-3">
            <SummaryItem
              label="Total Tagihan"
              value={
                isLoading ? "..." : `Rp ${formatRupiah(summary.total_tagihan || 0)}`
              }
              color="red"
            />
            <SummaryItem
              label="Sudah Dibayar"
              value={
                isLoading ? "..." : `Rp ${formatRupiah(summary.total_sudah_bayar || 0)}`
              }
              color="emerald"
            />
            <SummaryItem
              label="Jumlah Item"
              value={isLoading ? "..." : summary.jumlah_item || 0}
              color="blue"
            />
          </div>
        </div>

        {/* ========================================== */}
        {/* SCROLLABLE CONTENT */}
        {/* ========================================== */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState
              message={error.response?.data?.message}
              onRetry={refetch}
            />
          ) : details.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2.5">
              {details.map((d) => (
                <TagihanCard
                  key={d.id}
                  item={d}
                  onClick={() => openTagihanDetailModal(d)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* FOOTER - Sticky */}
        {/* ========================================== */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm flex-shrink-0 px-5 sm:px-6 py-3.5">
          <button
            onClick={closeAllModals}
            className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

/* ========================================== */
/* SUMMARY ITEM */
/* ========================================== */
const SummaryItem = ({ label, value, color }) => {
  const colorMap = {
    red: "text-red-700",
    emerald: "text-emerald-700",
    blue: "text-blue-700",
  };

  return (
    <div className="text-center">
      <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">
        {label}
      </p>
      <p className={cn("text-sm sm:text-base font-bold", colorMap[color])}>
        {value}
      </p>
    </div>
  );
};

/* ========================================== */
/* TAGIHAN CARD */
/* ========================================== */
const TagihanCard = ({ item, onClick }) => {
  const d = item;
  const sisa = Number(d.sisa_tagihan) || 0;
  const sudahBayar = Number(d.total_bayar) || 0;
  const subtotal = Number(d.subtotal) || 0;
  const progress = subtotal > 0 ? (sudahBayar / subtotal) * 100 : 0;
  const isDaily = d.transaksi?.jenis_transaksi === "daily";

  return (
    <div
      onClick={onClick}
      className="group border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all active:scale-[0.99] bg-white"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                isDaily
                  ? "bg-orange-100 text-orange-700"
                  : "bg-purple-100 text-purple-700"
              )}
            >
              {isDaily ? "Harian" : "Pesanan"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {d.product?.kode || "-"}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
            {formatProductName(d.product)}
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
          <Calendar size={10} />
          {formatTanggal(d.transaksi?.tanggal, "short")}
        </div>
      </div>

      {/* Bottom row: numbers */}
      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-medium">
              Subtotal
            </p>
            <p className="font-semibold text-slate-700">
              Rp {formatRupiah(subtotal)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-medium">
              Dibayar
            </p>
            <p className="font-semibold text-emerald-600">
              Rp {formatRupiah(sudahBayar)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-slate-500 uppercase font-medium">Sisa</p>
          <p className="font-bold text-red-600 text-sm">
            Rp {formatRupiah(sisa)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="mt-2.5">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[9px] text-slate-400 mt-1 text-right">
            {Math.round(progress)}% terbayar
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
        <Wallet size={11} />
        <span>Klik untuk lihat detail & bayar</span>
      </div>
    </div>
  );
};

/* ========================================== */
/* LOADING STATE */
/* ========================================== */
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
    <p className="text-sm text-slate-500 font-medium">Memuat data tagihan...</p>
  </div>
);

/* ========================================== */
/* ERROR STATE */
/* ========================================== */
const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-3">
      <AlertCircle className="w-8 h-8 text-rose-600" />
    </div>
    <p className="text-slate-900 font-semibold text-sm">Gagal Memuat Data</p>
    <p className="text-xs text-slate-500 mt-1 max-w-xs">
      {message || "Terjadi kesalahan saat memuat tagihan"}
    </p>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
    >
      Coba Lagi
    </button>
  </div>
);

/* ========================================== */
/* EMPTY STATE */
/* ========================================== */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="relative">
      <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-60 scale-125" />
      <Package className="relative w-14 h-14 text-emerald-400" />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-700">
      Semua Tagihan Lunas! 🎉
    </p>
    <p className="text-xs text-slate-500 mt-1 max-w-xs">
      Tidak ada tagihan yang belum dibayar untuk periode ini
    </p>
  </div>
);

export default CustomerTagihanModal;