import { useEffect, useCallback } from "react";
import { X, User, Tag, Pencil, Image as ImageIcon } from "lucide-react";
import { useProductCustomerModals } from "../../../lib/zustand/productCustomerStore";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const formatRupiah = (v) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(v) || 0);

const ProductCustomerDetail = () => {
  const { modals, selectedItem, closeAllModals, openEditModal } = useProductCustomerModals();
  const isOpen = modals.detail;

  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedItem) return null;

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  const fotos = [
    { url: selectedItem.foto_depan_url || (selectedItem.foto_depan ? `${ASSET_URL}/storage/${selectedItem.foto_depan}` : null), label: "Depan" },
    { url: selectedItem.foto_samping_url || (selectedItem.foto_samping ? `${ASSET_URL}/storage/${selectedItem.foto_samping}` : null), label: "Samping" },
    { url: selectedItem.foto_atas_url || (selectedItem.foto_atas ? `${ASSET_URL}/storage/${selectedItem.foto_atas}` : null), label: "Atas" },
  ].filter((f) => f.url);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0"><User className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Produk Customer</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Photos */}
          {fotos.length > 0 && (
            <div className="flex justify-center gap-2 p-5 pb-2">
              {fotos.map((f, i) => (
                <img key={i} src={f.url} alt={f.label} className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="px-5 py-4 space-y-2">
            <div className="text-center mb-4">
              <p className="font-mono font-bold text-sm text-indigo-700 break-words">{selectedItem.kode}</p>
              <p className="text-xs text-slate-500 mt-1">{[selectedItem.jenis?.nama, selectedItem.type?.nama, selectedItem.ukuran].filter(Boolean).join(" • ") || "-"}</p>
            </div>

            <InfoItem icon={User} iconBg="bg-blue-100" iconColor="text-blue-600" label="Customer" value={selectedItem.customer?.name || "—"} />
            <InfoItem icon={Tag} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Harga" value={`Rp ${formatRupiah(selectedItem.harga)}`} />

            {selectedItem.keterangan && <InfoItem icon={FileText} iconBg="bg-amber-100" iconColor="text-amber-600" label="Keterangan" value={selectedItem.keterangan} breakAll />}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
          <button onClick={closeAllModals} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
          <button onClick={() => { closeAllModals(); setTimeout(() => openEditModal(selectedItem), 150); }} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, breakAll }) => (
  <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group">
    <div className={cn("p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg)}><Icon className={cn("w-3.5 h-3.5", iconColor)} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm font-medium text-slate-900", breakAll ? "break-all" : "truncate")}>{value}</p>
    </div>
  </div>
);

import { FileText } from "lucide-react";

export default ProductCustomerDetail;