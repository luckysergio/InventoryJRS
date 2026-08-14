import { X, Tag, User, Globe, Calendar, FileText, Pencil } from "lucide-react";
import { useHargaProductStore } from "../../../lib/zustand/hargaProductStore";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID").format(value);
const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? `${p.kode} - ${parts.join(" ")}` : p.kode;
};

const HargaProductDetail = () => {
  const { isDetailOpen, selectedHarga, closeModals, openEditModal } = useHargaProductStore();

  if (!isDetailOpen || !selectedHarga) return null;

  const handleEdit = () => {
    closeModals();
    setTimeout(() => openEditModal(selectedHarga), 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Tag className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-lg font-semibold text-slate-900">Detail Harga</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Rp {formatRupiah(selectedHarga.harga)}</h3>
            <p className="text-sm text-slate-500 mt-1">{formatProductName(selectedHarga.product)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                {selectedHarga.customer_id ? <User className="w-4 h-4 text-purple-600" /> : <Globe className="w-4 h-4 text-slate-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Customer</p>
                <p className="text-sm font-medium text-slate-900 truncate">{selectedHarga.customer?.name || "Harga Umum (Semua Customer)"}</p>
              </div>
            </div>

            {selectedHarga.tanggal_berlaku && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0"><Calendar className="w-4 h-4 text-emerald-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Tanggal Berlaku</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedHarga.tanggal_berlaku).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            )}

            {selectedHarga.keterangan && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5"><FileText className="w-4 h-4 text-amber-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Keterangan</p>
                  <p className="text-sm font-medium text-slate-900">{selectedHarga.keterangan}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={closeModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Tutup</button>
            <button onClick={handleEdit} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HargaProductDetail;