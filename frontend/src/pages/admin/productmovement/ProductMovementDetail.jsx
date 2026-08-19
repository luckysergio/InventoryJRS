import { useEffect, useCallback } from "react";
import { X, ArrowDown, ArrowUp, Repeat, Factory, Calendar, Package, MapPin } from "lucide-react";
import { useProductMovementModals } from "../../../lib/zustand/productMovementStore";
import { cn } from "../../../lib/utils";

const formatRupiah = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(v) || 0);

const MOVEMENT_BADGES = {
  in: { label: "MASUK", icon: ArrowDown, color: "text-green-700 bg-green-50 border-green-200" },
  out: { label: "KELUAR", icon: ArrowUp, color: "text-red-700 bg-red-50 border-red-200" },
  transfer: { label: "TRANSFER", icon: Repeat, color: "text-blue-700 bg-blue-50 border-blue-200" },
  produksi: { label: "PRODUKSI", icon: Factory, color: "text-purple-700 bg-purple-50 border-purple-200" },
};

const ProductMovementDetail = () => {
  const { modals, selectedItem, closeAllModals } = useProductMovementModals();
  const isOpen = modals.detail;

  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedItem) return null;

  const badge = MOVEMENT_BADGES[selectedItem.tipe] || { label: selectedItem.tipe?.toUpperCase() || "–", icon: null, color: "text-gray-700 bg-gray-50 border-gray-200" };
  const BadgeIcon = badge.icon;
  const product = selectedItem.product || null;
  const place = selectedItem.place || null;
  const isOut = selectedItem.tipe === "out" || selectedItem.tipe === "transfer";

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0"><Package className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Mutasi</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Badge & Date */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border", badge.color)}>
              {BadgeIcon && <BadgeIcon size={14} />}
              {badge.label}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={12} />
              {new Date(selectedItem.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          {/* Product Info */}
          <div className="px-5 pb-4">
            <div className="bg-slate-50 rounded-xl p-4 text-center mb-4">
              <p className="font-mono font-bold text-sm text-indigo-700 break-words mb-1">{product?.kode || "-"}</p>
              <p className="text-xs text-slate-500">
                {[product?.jenis?.nama, product?.type?.nama, product?.ukuran].filter(Boolean).join(" • ") || "-"}
              </p>
            </div>

            {/* Qty */}
            <div className={cn("text-center py-4 rounded-xl border mb-4", isOut ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200")}>
              <p className={cn("text-[10px] uppercase font-medium", isOut ? "text-red-600" : "text-green-600")}>Jumlah Mutasi</p>
              <p className={cn("text-2xl font-bold mt-1", isOut ? "text-red-700" : "text-green-700")}>
                {isOut ? "−" : "+"}{selectedItem.qty}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <InfoItem icon={MapPin} iconBg="bg-blue-100" iconColor="text-blue-600" label="Lokasi" value={place?.nama || "–"} subValue={place?.kode} />
              {selectedItem.keterangan && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] text-amber-600 uppercase font-medium mb-1">Keterangan</p>
                  <p className="text-sm text-slate-700">{selectedItem.keterangan}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex-shrink-0">
          <button onClick={closeAllModals} className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, subValue }) => (
  <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group">
    <div className={cn("p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg)}><Icon className={cn("w-3.5 h-3.5", iconColor)} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
      {subValue && <p className="text-[10px] text-slate-400">{subValue}</p>}
    </div>
  </div>
);

export default ProductMovementDetail;