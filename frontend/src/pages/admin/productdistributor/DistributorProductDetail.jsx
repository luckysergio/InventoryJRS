import { useEffect, useCallback } from "react";
import { X, Tag, Truck, Warehouse, Calendar, Pencil } from "lucide-react";
import { useDistributorProductModals } from "../../../lib/zustand/distributorProductStore";
import { cn } from "../../../lib/utils";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

const DistributorProductDetail = () => {
  // ✅ FIX: Gunakan selector baru yang konsisten dengan store refactor
  const { modals, selectedItem, closeAllModals, openEditModal } = useDistributorProductModals();

  const isOpen = modals.detail;

  const handleEdit = () => {
    closeAllModals();
    setTimeout(() => openEditModal(selectedItem), 150);
  };

  const handleEscKey = useCallback(
    (e) => { if (e.key === "Escape" && isOpen) closeAllModals(); },
    [isOpen, closeAllModals]
  );

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

  if (!isOpen || !selectedItem) return null;

  const totalQty = (Number(selectedItem.qty_toko) || 0) + (Number(selectedItem.qty_bengkel) || 0);

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
    return parts.length > 0 ? parts.join(" • ") : p.kode;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0"><Truck className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Product Distributor</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group" aria-label="Close modal">
            <X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Product Info */}
          <div className="px-5 pt-5 pb-4 text-center bg-gradient-to-b from-slate-50 to-white">
            <h3 className="text-xl font-bold text-slate-900">{selectedItem.kode}</h3>
            <p className="text-sm text-slate-500 mt-1">{formatProductName(selectedItem)}</p>
          </div>

          {/* Price Cards */}
          <div className="px-5 pb-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">Harga Beli</p>
              <p className="text-lg font-bold text-blue-700">{formatRupiah(selectedItem.harga_beli)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Harga Jual</p>
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(selectedItem.harga_umum)}</p>
            </div>
          </div>

          {/* Detail Items */}
          <div className="px-5 py-4 space-y-2">
            <InfoItem icon={Truck} iconBg="bg-purple-100" iconColor="text-purple-600" label="Distributor" value={selectedItem.distributor?.nama || "-"} />

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                <Warehouse className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-xs text-slate-500">Toko</p>
                <p className="text-sm font-bold text-slate-900">{selectedItem.qty_toko || 0}</p>
              </div>
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                <Warehouse className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-xs text-slate-500">Bengkel</p>
                <p className="text-sm font-bold text-slate-900">{selectedItem.qty_bengkel || 0}</p>
              </div>
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Warehouse className="w-4 h-4 text-blue-500 mb-1" />
                <p className="text-xs text-blue-600">Total</p>
                <p className="text-sm font-bold text-blue-700">{totalQty}</p>
              </div>
            </div>

            {selectedItem.keterangan && (
              <InfoItem icon={Calendar} iconBg="bg-amber-100" iconColor="text-amber-600" label="Keterangan" value={selectedItem.keterangan} breakAll />
            )}

            <InfoItem icon={Calendar} iconBg="bg-blue-100" iconColor="text-blue-600" label="Terakhir Diperbarui" value={formatDate(selectedItem.updated_at)} />
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
          <button onClick={closeAllModals} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
          <button onClick={handleEdit} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, breakAll }) => (
  <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group">
    <div className={cn("p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg)}>
      <Icon className={cn("w-3.5 h-3.5", iconColor)} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm font-medium text-slate-900", breakAll ? "break-all" : "truncate")}>{value}</p>
    </div>
  </div>
);

export default DistributorProductDetail;