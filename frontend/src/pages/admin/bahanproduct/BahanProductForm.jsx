import { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import { useBahanProductStore } from "../../../lib/zustand/bahanProductStore";
import { useCreateBahanProduct, useUpdateBahanProduct } from "../../../hooks/useBahanProducts";

const BahanProductForm = () => {
  const { isFormOpen, selectedBahan, closeModals } = useBahanProductStore();
  const createMutation = useCreateBahanProduct();
  const updateMutation = useUpdateBahanProduct();

  const [nama, setNama] = useState("");
  const [error, setError] = useState("");

  const isEdit = !!selectedBahan;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit) {
        setNama(selectedBahan.nama);
      } else {
        setNama("");
      }
      setError("");
    }
  }, [isFormOpen, isEdit, selectedBahan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNama = nama.trim().toUpperCase();

    if (!trimmedNama) {
      setError("Nama bahan wajib diisi");
      return;
    }

    if (!/^[A-Z0-9\s\-\(\)#]+$/.test(trimmedNama)) {
      setError("Nama harus menggunakan HURUF KAPITAL, angka, atau karakter (-, (), #)");
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedBahan.id, data: { nama: trimmedNama } });
      } else {
        await createMutation.mutateAsync({ nama: trimmedNama });
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
              <Package className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Bahan Product" : "Tambah Bahan Product Baru"}
            </h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Bahan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={nama}
                onChange={(e) => {
                  // ✅ Auto uppercase untuk UX yang lebih baik dan sesuai validasi backend
                  setNama(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium tracking-wide ${
                  error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
                }`}
                placeholder="CONTOH: KARET ALAM #1"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {error ? (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">Hanya huruf kapital, angka, atau karakter (-, (), #).</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${
                isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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

export default BahanProductForm;