import { useState, useEffect } from "react";
import { X, Tag, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useStatusTransaksiModals } from "../../../lib/zustand/statusTransaksiStore";
import { useCreateStatusTransaksi, useUpdateStatusTransaksi } from "../../../hooks/useStatusTransaksi";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const StatusTransaksiForm = () => {
  const { modals, selectedItem, closeAllModals } = useStatusTransaksiModals();
  const createMut = useCreateStatusTransaksi();
  const updateMut = useUpdateStatusTransaksi();
  const { success, info } = useConfirmDialog();

  const [nama, setNama] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const isEdit = modals.form && selectedItem;
  const isCreate = modals.form && !selectedItem;
  const isOpen = modals.form;
  const isSubmitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (isEdit && selectedItem) {
      setNama(selectedItem.nama || "");
      setError("");
      setTouched(false);
    } else if (isCreate) {
      setNama("");
      setError("");
      setTouched(false);
    }
  }, [isEdit, isCreate, selectedItem]);

  const validate = (value) => {
    const v = (value || "").trim();
    if (!v) return "Nama status wajib diisi";
    if (v.length < 2) return "Minimal 2 karakter";
    if (v.length > 100) return "Maksimal 100 karakter";
    return "";
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setNama(val);
    if (touched) setError(validate(val));
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validate(nama));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validate(nama);
    if (err) { setError(err); return; }

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedItem.id, data: { nama: nama.trim() } });
        await success("Berhasil!", "Status transaksi berhasil diperbarui");
      } else {
        await createMut.mutateAsync({ nama: nama.trim() });
        await success("Berhasil!", "Status transaksi berhasil ditambahkan");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat();
        setError(msgs[0] || "Validasi gagal");
        return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={cn(
          "px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
          isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-blue-50 to-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}>
              <Tag className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Status Transaksi" : "Tambah Status Transaksi"}
            </h2>
          </div>
          <button onClick={() => !isSubmitting && closeAllModals()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={nama}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors",
                  error && touched
                    ? "border-red-300 focus:ring-red-500"
                    : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="Contoh: Selesai, Pending, Dibatalkan"
                disabled={isSubmitting}
                autoFocus
                maxLength={100}
              />
              {touched && nama.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {error
                    ? <AlertCircle className="w-5 h-5 text-red-500" />
                    : <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  }
                </div>
              )}
            </div>
            {error && touched && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
            {!error && touched && nama.trim() && (
              <p className="mt-1 text-xs text-slate-400">{nama.trim().length}/100 karakter</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => !isSubmitting && closeAllModals()}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
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

export default StatusTransaksiForm;