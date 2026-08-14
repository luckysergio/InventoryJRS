import { useState, useEffect } from "react";
import { X, User, Phone, Mail } from "lucide-react";
import { useDistributorStore } from "../../../lib/zustand/distributorStore";
import { useCreateDistributor, useUpdateDistributor } from "../../../hooks/useDistributors";

const DistributorForm = () => {
  const { isFormOpen, selectedDistributor, closeModals } = useDistributorStore();
  const createMutation = useCreateDistributor();
  const updateMutation = useUpdateDistributor();

  const [form, setForm] = useState({ nama: "", no_hp: "", email: "" });
  const [errors, setErrors] = useState({});

  const isEdit = !!selectedDistributor;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit) {
        setForm({
          nama: selectedDistributor.nama || "",
          no_hp: selectedDistributor.no_hp || "",
          email: selectedDistributor.email || "",
        });
      } else {
        setForm({ nama: "", no_hp: "", email: "" });
      }
      setErrors({});
    }
  }, [isFormOpen, isEdit, selectedDistributor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi sederhana di frontend
    if (!form.nama.trim() || !form.no_hp.trim()) {
      setErrors({ general: "Nama dan No HP wajib diisi" });
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      no_hp: form.no_hp.trim(),
      email: form.email.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedDistributor.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModals();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isEdit ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <User className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Distributor" : "Tambah Distributor Baru"}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{errors.general}</p>}

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Distributor <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={form.nama} 
                onChange={(e) => { setForm({ ...form, nama: e.target.value }); if(errors.general) setErrors({}); }} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="Nama perusahaan / perorangan" 
                disabled={isSubmitting} 
                required 
              />
            </div>
          </div>

          {/* No HP */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">No HP <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={form.no_hp} 
                onChange={(e) => { setForm({ ...form, no_hp: e.target.value }); if(errors.general) setErrors({}); }} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="08xxxxxxxxxx" 
                disabled={isSubmitting} 
                required 
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-slate-400 font-normal">(Opsional)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="email@contoh.com" 
                disabled={isSubmitting} 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={closeModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
              {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>) : (isEdit ? "Perbarui" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DistributorForm;