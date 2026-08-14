import { useState, useEffect } from "react";
import { X, Tag, Layers } from "lucide-react";
import { useTypeProductStore } from "../../../lib/zustand/typeProductStore";
import { useCreateTypeProduct, useUpdateTypeProduct, useJenisProducts } from "../../../hooks/useTypeProducts";

const TypeProductForm = () => {
  const { isFormOpen, selectedType, closeModals } = useTypeProductStore();
  const createMutation = useCreateTypeProduct();
  const updateMutation = useUpdateTypeProduct();
  const { data: jenisData = [] } = useJenisProducts();

  const [form, setForm] = useState({ nama: "", jenis_id: "" });
  const [error, setError] = useState("");

  const isEdit = !!selectedType;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit) {
        setForm({
          nama: selectedType.nama || "",
          jenis_id: selectedType.jenis_id ? String(selectedType.jenis_id) : "",
        });
      } else {
        setForm({ nama: "", jenis_id: "" });
      }
      setError("");
    }
  }, [isFormOpen, isEdit, selectedType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNama = form.nama.trim().toUpperCase();

    if (!trimmedNama) {
      setError("Nama type wajib diisi");
      return;
    }
    if (!form.jenis_id) {
      setError("Jenis product wajib dipilih");
      return;
    }
    if (!/^[A-Z0-9\s\-\(\)#]+$/.test(trimmedNama)) {
      setError("Nama harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #)");
      return;
    }

    try {
      const payload = { nama: trimmedNama, jenis_id: parseInt(form.jenis_id, 10) };
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedType.id, data: payload });
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
              <Layers className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Type Product" : "Tambah Type Product Baru"}
            </h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Jenis Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis Product <span className="text-red-500">*</span></label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.jenis_id}
                onChange={(e) => {
                  setForm({ ...form, jenis_id: e.target.value });
                  if (error) setError("");
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                disabled={isSubmitting}
                required
              >
                <option value="">Pilih Jenis Product</option>
                {jenisData.map((j) => (
                  <option key={j.id} value={j.id}>{j.nama}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nama Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Type <span className="text-red-500">*</span></label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={form.nama}
                onChange={(e) => {
                  setForm({ ...form, nama: e.target.value.toUpperCase() });
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium tracking-wide ${
                  error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
                }`}
                placeholder="CONTOH: KARET ALAM TIPE A"
                disabled={isSubmitting}
                required
              />
            </div>
            {error ? (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">Hanya huruf kapital, angka, atau karakter (-, (), #).</p>
            )}
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

export default TypeProductForm;