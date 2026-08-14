import { X, User, Phone, Mail, Briefcase, Pencil } from "lucide-react";
import { useKaryawanStore } from "../../../lib/zustand/karyawanStore";

const KaryawanDetail = () => {
  const { isDetailOpen, selectedKaryawan, closeModals, openEditModal } = useKaryawanStore();

  if (!isDetailOpen || !selectedKaryawan) return null;

  const handleEdit = () => {
    closeModals();
    setTimeout(() => openEditModal(selectedKaryawan), 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Detail Karyawan</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-white">
              {selectedKaryawan.nama.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-slate-900 text-center">{selectedKaryawan.nama}</h3>
            <p className="text-sm text-slate-500">{selectedKaryawan.jabatan?.nama || "Belum ada jabatan"}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0"><Mail className="w-4 h-4 text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900 break-all">{selectedKaryawan.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0"><Phone className="w-4 h-4 text-emerald-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">No HP</p>
                <p className="text-sm font-medium text-slate-900">{selectedKaryawan.no_hp}</p>
              </div>
            </div>
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

export default KaryawanDetail;