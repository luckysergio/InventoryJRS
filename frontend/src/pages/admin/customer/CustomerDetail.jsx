import { useEffect, useCallback } from "react";
import { X, User, Phone, Mail, Pencil } from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import { cn } from "../../../lib/utils";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID").format(Math.round(Number(value) || 0));

const CustomerDetail = () => {
  const { modals, selectedItem, closeAllModals, openEditModal, openTagihanModal } =
    useCustomerModals();

  const isOpen = modals.detail;

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

  const tagihanHarian = Number(selectedItem.tagihan_harian_belum_lunas) || 0;
  const tagihanPesanan = Number(selectedItem.tagihan_pesanan_belum_lunas) || 0;
  const totalTagihan = tagihanHarian + tagihanPesanan;
  const hasOutstanding = totalTagihan > 0;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 truncate">Detail Customer</h2>
          </div>
          <button onClick={closeAllModals} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group">
            <X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Profile */}
          <div className="px-5 pt-5 pb-4 text-center bg-gradient-to-b from-slate-50 to-white">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white mx-auto">
              {selectedItem.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{selectedItem.name}</h3>
          </div>

          {/* Info Grid */}
          <div className="px-5 py-4 space-y-2">
            <InfoItem icon={Phone} iconBg="bg-emerald-100" iconColor="text-emerald-600" label="No Telepon" value={selectedItem.phone || "-"} />
            <InfoItem icon={Mail} iconBg="bg-blue-100" iconColor="text-blue-600" label="Email" value={selectedItem.email || "-"} breakAll />

            {/* Tagihan Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-3">Ringkasan Tagihan</p>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <div
                  className={cn("p-3 rounded-xl border text-center transition", tagihanHarian > 0 ? "bg-orange-50 border-orange-200 cursor-pointer hover:bg-orange-100" : "bg-slate-50 border-slate-100")}
                  onClick={() => tagihanHarian > 0 && openTagihanModal(selectedItem, "daily")}
                >
                  <p className="text-[10px] text-slate-500 uppercase">Harian</p>
                  <p className={cn("text-sm font-bold mt-0.5", tagihanHarian > 0 ? "text-orange-700" : "text-slate-400")}>{formatRupiah(tagihanHarian)}</p>
                </div>
                <div
                  className={cn("p-3 rounded-xl border text-center transition", tagihanPesanan > 0 ? "bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100" : "bg-slate-50 border-slate-100")}
                  onClick={() => tagihanPesanan > 0 && openTagihanModal(selectedItem, "pesanan")}
                >
                  <p className="text-[10px] text-slate-500 uppercase">Pesanan</p>
                  <p className={cn("text-sm font-bold mt-0.5", tagihanPesanan > 0 ? "text-purple-700" : "text-slate-400")}>{formatRupiah(tagihanPesanan)}</p>
                </div>
              </div>

              <div className={cn("p-3 rounded-xl border text-center", hasOutstanding ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
                <p className={cn("text-[10px] uppercase font-medium", hasOutstanding ? "text-red-600" : "text-emerald-600")}>Total Tagihan</p>
                <p className={cn("text-lg font-bold mt-0.5", hasOutstanding ? "text-red-700" : "text-emerald-700")}>{formatRupiah(totalTagihan)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
          <button onClick={closeAllModals} className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95">Tutup</button>
          <button
            onClick={() => { closeAllModals(); setTimeout(() => openEditModal(selectedItem), 150); }}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
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

export default CustomerDetail;