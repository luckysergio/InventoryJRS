import { useEffect, useCallback } from "react";
import { X, Tag, User, Globe, Calendar, FileText, Pencil } from "lucide-react";
import { useHargaProductModals } from "../../../lib/zustand/hargaProductStore";
import { cn } from "../../../lib/utils";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID").format(value);

const HargaProductDetail = () => {
  const { modals, selectedHarga, closeAllModals, openEditModal } = useHargaProductModals();
  const isOpen = modals.detail;

  const handleEdit = () => { closeAllModals(); setTimeout(() => openEditModal(selectedHarga), 150); };

  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedHarga) return null;

  const product = selectedHarga.product;
  const productParts = [product?.jenis?.nama, product?.type?.nama, product?.ukuran].filter(Boolean);
  const productLabel = productParts.length > 0 ? productParts.join(" • ") : product?.kode || "-";
  const isCustomerSpecific = !!selectedHarga.customer_id;

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0"><Tag className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Harga</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Price Hero */}
          <div className="px-5 pt-6 pb-4 text-center bg-gradient-to-b from-slate-50 to-white">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Harga Berlaku</p>
            <p className="text-3xl font-bold text-emerald-600">Rp {formatRupiah(selectedHarga.harga)}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-white shadow-sm">
              <Tag className="w-3 h-3 text-blue-500" />
              <span className="text-slate-700">{product?.kode || "-"}</span>
            </div>
            <p className="text-sm text-slate-600 mt-2 font-medium">{productLabel}</p>
          </div>

          {/* Info Grid */}
          <div className="px-5 py-4 space-y-2">
            <InfoItem icon={isCustomerSpecific ? User : Globe} iconBg={isCustomerSpecific ? "bg-purple-100" : "bg-slate-100"} iconColor={isCustomerSpecific ? "text-purple-600" : "text-slate-600"} label="Target Customer" value={isCustomerSpecific ? selectedHarga.customer?.name : "Harga Umum (Semua Customer)"} />
            
            {selectedHarga.tanggal_berlaku && (
              <InfoItem icon={Calendar} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="Tanggal Berlaku" value={new Date(selectedHarga.tanggal_berlaku).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
            )}

            {selectedHarga.keterangan && (
              <InfoItem icon={FileText} iconBg="bg-amber-100" iconColor="text-amber-600" label="Keterangan" value={selectedHarga.keterangan} breakAll />
            )}

            <InfoItem icon={Calendar} iconBg="bg-blue-100" iconColor="text-blue-600" label="Terakhir Diperbarui" value={new Date(selectedHarga.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
          <button onClick={closeAllModals} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
          <button onClick={handleEdit} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
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

export default HargaProductDetail;