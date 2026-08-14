import { useState, useEffect } from "react";
import { X, User, Phone, Mail, Briefcase, Plus } from "lucide-react";
import { useKaryawanStore } from "../../../lib/zustand/karyawanStore";
import { useCreateKaryawan, useUpdateKaryawan, useJabatans } from "../../../hooks/useKaryawans";

const KaryawanForm = () => {
  const { isFormOpen, selectedKaryawan, closeModals } = useKaryawanStore();
  const createMutation = useCreateKaryawan();
  const updateMutation = useUpdateKaryawan();
  
  // Ambil data jabatan dari hook
  const { data: jabatansData } = useJabatans(); 

  const [form, setForm] = useState({ 
    nama: "", 
    no_hp: "", 
    email: "", 
    jabatan_id: "", 
    jabatan_nama: "" 
  });
  
  const [isCreatingNewJabatan, setIsCreatingNewJabatan] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = !!selectedKaryawan;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit) {
        setForm({
          nama: selectedKaryawan.nama || "",
          no_hp: selectedKaryawan.no_hp || "",
          email: selectedKaryawan.email || "",
          jabatan_id: selectedKaryawan.jabatan_id ? String(selectedKaryawan.jabatan_id) : "",
          jabatan_nama: "",
        });
        setIsCreatingNewJabatan(false);
      } else {
        setForm({ nama: "", no_hp: "", email: "", jabatan_id: "", jabatan_nama: "" });
        setIsCreatingNewJabatan(false);
      }
      setErrors({});
    }
  }, [isFormOpen, isEdit, selectedKaryawan]);

  const handleJabatanChange = (e) => {
    const value = e.target.value;
    if (value === "new") {
      setIsCreatingNewJabatan(true);
      setForm((prev) => ({ ...prev, jabatan_id: "", jabatan_nama: "" }));
    } else {
      setIsCreatingNewJabatan(false);
      setForm((prev) => ({ ...prev, jabatan_id: value, jabatan_nama: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nama: form.nama.trim(),
      no_hp: form.no_hp.trim(),
      email: form.email.trim(),
    };

    if (form.jabatan_id) {
      payload.jabatan_id = form.jabatan_id;
    } else if (isCreatingNewJabatan && form.jabatan_nama.trim()) {
      payload.jabatan_nama = form.jabatan_nama.trim().toUpperCase();
    } else {
      setErrors({ jabatan: "Pilih jabatan atau isi nama jabatan baru" });
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedKaryawan.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModals();
    } catch (err) {
      // Error sudah di-handle di hook (useConfirmDialog), jadi tidak perlu toast di sini
      console.error("Submit error:", err);
    }
  };

  if (!isFormOpen) return null;

  // ✅ FIX: Ambil data dengan aman, baik hook mengembalikan array langsung ATAU object { data: [] }
  const jabatans = Array.isArray(jabatansData) 
    ? jabatansData 
    : (jabatansData?.data || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isEdit ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <User className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Karyawan" : "Tambah Karyawan Baru"}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={form.nama} 
                onChange={(e) => setForm({ ...form, nama: e.target.value })} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="Nama karyawan" 
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
                onChange={(e) => setForm({ ...form, no_hp: e.target.value })} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="08xxxxxxxxxx" 
                disabled={isSubmitting} 
                required 
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                placeholder="email@contoh.com" 
                disabled={isSubmitting} 
                required 
              />
            </div>
          </div>

          {/* Jabatan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jabatan <span className="text-red-500">*</span></label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={isCreatingNewJabatan ? "new" : form.jabatan_id}
                onChange={handleJabatanChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                disabled={isSubmitting}
                required
              >
                <option value="">Pilih Jabatan</option>
                {/* ✅ Mapping data jabatan yang sudah di-fix */}
                {jabatans.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
                <option value="new">➕ Tambah Jabatan Baru</option>
              </select>
            </div>
            {errors.jabatan && <p className="mt-1 text-xs text-red-600">{errors.jabatan}</p>}

            {isCreatingNewJabatan && (
              <div className="mt-2 relative animate-fadeIn">
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={form.jabatan_nama}
                  onChange={(e) => setForm({ ...form, jabatan_nama: e.target.value.toUpperCase() })}
                  className="w-full pl-10 pr-4 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide"
                  placeholder="NAMA JABATAN BARU (HURUF KAPITAL)"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={closeModals} 
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" 
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
                  Menyimpan...
                </>
              ) : (
                isEdit ? "Perbarui" : "Simpan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KaryawanForm;