import { useEffect } from "react";
import { X, Calendar, Wallet, Package, Loader2, AlertCircle } from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import { useCustomerTagihan } from "../../../hooks/useCustomers";
import { formatRupiah, formatTanggal, formatProductName } from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";

const CustomerTagihanModal = () => {
  const { modals, selectedItem, tagihanFilter, openTagihanDetailModal, closeAllModals } = useCustomerModals();

  const isOpen = modals.tagihan && !!selectedItem;

  const { data, isLoading, error, refetch } = useCustomerTagihan(
    selectedItem?.id,
    tagihanFilter,
    isOpen
  );

  const details = data?.details || [];
  const summary = data?.summary || {};

  // ESC key handler
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

  const title = tagihanFilter === "daily" ? "Tagihan Harian" : tagihanFilter === "pesanan" ? "Tagihan Pesanan" : "Semua Tagihan";
  const colorClass = tagihanFilter === "daily" ? "from-orange-500 to-red-500" : "from-purple-500 to-indigo-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && closeAllModals()}
    >
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={cn("px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-gradient-to-r text-white", colorClass)}>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold truncate">{title}</h2>
            <p className="text-xs text-white/80 truncate mt-0.5">{selectedItem.name}</p>
          </div>
          <button onClick={closeAllModals} className="p-2 hover:bg-white/10 rounded-lg transition-colors group flex-shrink-0">
            <X className="w-5 h-5 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Total Tagihan</p>
              <p className="text-lg font-bold text-slate-900">
                {isLoading ? "..." : `Rp ${formatRupiah(summary.total_tagihan || 0)}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">Jumlah Item</p>
              <p className="text-lg font-bold text-slate-900">
                {isLoading ? "..." : summary.jumlah_item || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Memuat data tagihan...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-slate-900 font-semibold">Gagal Memuat Data</p>
              <p className="text-sm text-slate-500 mt-1">
                {error.response?.data?.message || "Terjadi kesalahan"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : details.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-slate-900 font-semibold">Semua Tagihan Lunas! 🎉</p>
              <p className="text-sm text-slate-500 mt-1">Tidak ada tagihan yang belum dibayar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {details.map((d) => {
                const sisa = Number(d.sisa_tagihan) || 0;
                const sudahBayar = Number(d.total_bayar) || 0;
                const subtotal = Number(d.subtotal) || 0;
                const progress = subtotal > 0 ? (sudahBayar / subtotal) * 100 : 0;
                const isDaily = d.transaksi?.jenis_transaksi === "daily";

                return (
                  <div
                    key={d.id}
                    onClick={() => openTagihanDetailModal(d)}
                    className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all active:scale-[0.99] bg-white group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold",
                            isDaily ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {isDaily ? "Harian" : "Pesanan"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {d.product?.kode || "-"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2">
                          {formatProductName(d.product)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
                        <Calendar size={10} />
                        {formatTanggal(d.transaksi?.tanggal, "short")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase">Subtotal</p>
                          <p className="font-semibold text-slate-700">Rp {formatRupiah(subtotal)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase">Dibayar</p>
                          <p className="font-semibold text-emerald-600">Rp {formatRupiah(sudahBayar)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase">Sisa</p>
                        <p className="font-bold text-red-600 text-sm">Rp {formatRupiah(sisa)}</p>
                      </div>
                    </div>

                    {progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 text-right">
                          {Math.round(progress)}% terbayar
                        </p>
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-blue-600 group-hover:text-blue-700">
                      <Wallet size={11} />
                      <span>Klik untuk lihat detail & bayar</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTagihanModal;