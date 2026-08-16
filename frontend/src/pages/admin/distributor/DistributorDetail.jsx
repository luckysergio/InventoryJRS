import { useEffect, useCallback } from "react";
import { X, User, Phone, Mail, Package, Pencil, Calendar } from "lucide-react";
import { useDistributorModals } from "../../../lib/zustand/distributorStore";
import { cn } from "../../../lib/utils";

const DistributorDetail = () => {
  const { modals, selectedDistributor, closeAllModals, openEditModal } = useDistributorModals();
  const isOpen = modals.detail;

  const handleEdit = () => { closeAllModals(); setTimeout(() => openEditModal(selectedDistributor), 150); };
  const handleEscKey = useCallback((e) => { if (e.key === "Escape" && isOpen) closeAllModals(); }, [isOpen, closeAllModals]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleEscKey); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleEscKey); document.body.style.overflow = ""; };
  }, [isOpen, handleEscKey]);

  if (!isOpen || !selectedDistributor) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleBackdropClick = (e) => { if (e.target === e.currentTarget) closeAllModals(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0"><User className="w-4 h-4 text-white" /></div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Distributor</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"><X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" /></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Profile Header */}
          <div className="px-5 pt-5 pb-4 text-center bg-gradient-to-b from-slate-50 to-white">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
                {selectedDistributor.nama.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{selectedDistributor.nama}</h3>
            </div>
          </div>

          {/* Info Grid */}
          <div className="px-5 py-4 space-y-2">
            <InfoItem icon={Phone} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="No HP" value={selectedDistributor.no_hp || "-"} />
            <InfoItem icon={Mail} iconBg="bg-blue-100" iconColor="text-blue-600" label="Email" value={selectedDistributor.email || "-"} breakAll />
            <InfoItem icon={Package} iconBg="bg-purple-100" iconColor="text-purple-600" label="Jumlah Product" value={`${selectedDistributor.products_count || 0} Product`} />
            <InfoItem icon={Calendar} iconBg="bg-amber-100" iconColor="text-amber-600" label="Terakhir Diperbarui" value={formatDate(selectedDistributor.updated_at)} />
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

export default DistributorDetail;