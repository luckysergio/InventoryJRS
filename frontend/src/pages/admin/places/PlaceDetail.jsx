import { useEffect, useCallback } from "react";
import { X, MapPin, Pencil, Calendar } from "lucide-react";
import { usePlaceModals } from "../../../lib/zustand/placeStore";
import { cn } from "../../../lib/utils";

const PlaceDetail = () => {
  const { modals, selectedItem, closeAllModals, openEditModal } = usePlaceModals();
  const isOpen = modals.detail;

  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedItem) return null;

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0"><MapPin className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Tempat</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-5 pt-5 pb-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white mx-auto">
              {selectedItem.kode?.slice(0, 2) || "?"}
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{selectedItem.nama}</h3>
            <div className="mt-1.5 inline-flex items-center gap-1 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full">
              <MapPin size={12} className="text-slate-500" />
              <span className="text-xs font-mono font-semibold text-slate-600">{selectedItem.kode}</span>
            </div>
          </div>

          <div className="px-5 py-4 space-y-2">
            {selectedItem.keterangan && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-[10px] text-amber-600 uppercase font-medium mb-1">Keterangan</p>
                <p className="text-sm text-slate-700">{selectedItem.keterangan}</p>
              </div>
            )}

            <InfoItem icon={Calendar} iconBg="bg-blue-100" iconColor="text-blue-600" label="Dibuat" value={formatDate(selectedItem.created_at)} />
            <InfoItem icon={Calendar} iconBg="bg-green-100" iconColor="text-green-600" label="Terakhir Diperbarui" value={formatDate(selectedItem.updated_at)} />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
          <button onClick={closeAllModals} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
          <button onClick={() => { closeAllModals(); setTimeout(() => openEditModal(selectedItem), 150); }} className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</button>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value }) => (
  <div className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group">
    <div className={cn("p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg)}><Icon className={cn("w-3.5 h-3.5", iconColor)} /></div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

export default PlaceDetail;