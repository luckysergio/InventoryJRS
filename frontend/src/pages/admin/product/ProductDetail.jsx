import { useEffect, useCallback } from "react";
import { X, Tag, Package, Warehouse, Calendar, Pencil, Image as ImageIcon } from "lucide-react";
import { useProductModals } from "../../../lib/zustand/productStore";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

const ProductDetail = () => {
  const { modals, selectedProduct, closeAllModals, openEditModal } = useProductModals();
  const isOpen = modals.detail;

  const handleEdit = () => { closeAllModals(); setTimeout(() => openEditModal(selectedProduct), 150); };
  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedProduct) return null;

  const qtyToko = Number(selectedProduct.qty_toko) || 0;
  const qtyBengkel = Number(selectedProduct.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;

  const fotoUrls = [
    selectedProduct.foto_depan_url || (selectedProduct.foto_depan ? `${ASSET_URL}/storage/${selectedProduct.foto_depan}` : null),
    selectedProduct.foto_samping_url || (selectedProduct.foto_samping ? `${ASSET_URL}/storage/${selectedProduct.foto_samping}` : null),
    selectedProduct.foto_atas_url || (selectedProduct.foto_atas ? `${ASSET_URL}/storage/${selectedProduct.foto_atas}` : null),
  ].filter(Boolean);

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0"><Package className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Product</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Photo Gallery */}
          <div className="px-5 pt-5 pb-3">
            {fotoUrls.length > 0 ? (
              <div className="flex justify-center gap-3">
                {fotoUrls.map((url, idx) => (
                  <img key={idx} src={url} alt={`Foto ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="w-full h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200"><ImageIcon className="w-8 h-8 text-slate-300" /></div>
            )}
          </div>

          {/* Product Info */}
          <div className="px-5 pb-4 text-center">
            <h3 className="text-xl font-bold text-slate-900">{selectedProduct.kode}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {[selectedProduct.jenis?.nama, selectedProduct.type?.nama, selectedProduct.bahan?.nama, selectedProduct.ukuran].filter(Boolean).join(" • ")}
            </p>
          </div>

          {/* Price & Stock Cards */}
          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Harga Umum</p>
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(selectedProduct.harga_umum)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Stok</p>
              <p className={cn("text-lg font-bold", totalQty < 20 ? "text-red-600" : "text-blue-700")}>{totalQty} Unit</p>
            </div>
          </div>

          {/* Detail Items */}
          <div className="px-5 pb-5 space-y-2">
            <InfoItem icon={Tag} iconBg="bg-purple-100" iconColor="text-purple-600" label="Spesifikasi"
              value={`${selectedProduct.jenis?.nama || "-"} ${selectedProduct.type?.nama ? `- ${selectedProduct.type.nama}` : ""} ${selectedProduct.bahan?.nama ? `(${selectedProduct.bahan.nama})` : ""} | ${selectedProduct.ukuran}`} />

            <div className="grid grid-cols-2 gap-2">
              <InfoItem icon={Warehouse} iconBg="bg-amber-100" iconColor="text-amber-600" label="Stok Toko" value={String(qtyToko)} compact />
              <InfoItem icon={Warehouse} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Stok Bengkel" value={String(qtyBengkel)} compact />
            </div>

            {selectedProduct.keterangan && (
              <InfoItem icon={Calendar} iconBg="bg-slate-100" iconColor="text-slate-600" label="Keterangan" value={selectedProduct.keterangan} breakAll />
            )}
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

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, breakAll, compact }) => (
  <div className={cn("flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group", compact && "py-2")}>
    <div className={cn("rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg, compact ? "p-1" : "p-1.5")}><Icon className={cn(iconColor, compact ? "w-3 h-3" : "w-3.5 h-3.5")} /></div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-slate-500 font-medium uppercase tracking-wide", compact ? "text-[9px]" : "text-[11px]")}>{label}</p>
      <p className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm", breakAll ? "break-all" : "truncate")}>{value}</p>
    </div>
  </div>
);

export default ProductDetail;