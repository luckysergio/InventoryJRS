import { useState, useEffect } from "react";
import { X, Briefcase } from "lucide-react";
import { useJabatanStore } from "../../../lib/zustand/jabatanStore";
import { useCreateJabatan, useUpdateJabatan } from "../../../hooks/useJabatans";

const JabatanForm = () => {
  const { isModalOpen, selectedJabatan, closeModal } = useJabatanStore();
  const createMutation = useCreateJabatan();
  const updateMutation = useUpdateJabatan();

  const [nama, setNama] = useState("");
  const [error, setError] = useState("");

  const isEdit = !!selectedJabatan;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Reset & Populate form saat modal dibuka
  useEffect(() => {
    if (isModalOpen) {
      if (isEdit) {
        setNama(selectedJabatan.nama);
      } else {
        setNama("");
      }
      setError("");
    }
  }, [isModalOpen, isEdit, selectedJabatan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedNama = nama.trim();

    if (!trimmedNama) {
      setError("Nama jabatan wajib diisi");
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedJabatan.id, data: { nama: trimmedNama } });
      } else {
        await createMutation.mutateAsync({ nama: trimmedNama });
      }
      closeModal();
    } catch (err) {
      // Error sudah di-handle di hook, tapi kita bisa set local error jika perlu
      console.error(err);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between ${isEdit ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <Briefcase className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Jabatan" : "Tambah Jabatan Baru"}
            </h2>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Jabatan <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={nama}
                onChange={(e) => {
                  // ✅ Auto uppercase untuk UX yang lebih baik dan sesuai validasi backend
                  setNama(e.target.value.toUpperCase());
                  if (error) setError("");
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium tracking-wide ${
                  error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
                }`}
                placeholder="CONTOH: STAFF ADMINISTRASI"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {error ? (
              <p className="mt-1.5 text-xs text-red-600">{error}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">Hanya huruf kapital dan spasi yang diperbolehkan.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
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

export default JabatanForm;