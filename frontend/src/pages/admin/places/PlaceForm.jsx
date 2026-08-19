import { useState, useEffect } from "react";
import { X, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePlaceModals } from "../../../lib/zustand/placeStore";
import { useCreatePlace, useUpdatePlace } from "../../../hooks/usePlaces";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const PlaceForm = () => {
  const { modals, selectedItem, closeAllModals } = usePlaceModals();
  const createMut = useCreatePlace();
  const updateMut = useUpdatePlace();
  const { success, info } = useConfirmDialog();

  const [form, setForm] = useState({ nama: "", kode: "", keterangan: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.form && !!selectedItem;
  const isCreate = modals.form && !selectedItem;
  const isOpen = modals.form;
  const isSubmitting = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && selectedItem) {
      setForm({
        nama: selectedItem.nama || "",
        kode: selectedItem.kode || "",
        keterangan: selectedItem.keterangan || "",
      });
    } else {
      setForm({ nama: "", kode: "", keterangan: "" });
    }
    setErrors({});
    setTouched({});
  }, [isEdit, isCreate, selectedItem, modals.form]);

  const validate = (fieldName) => {
    const e = { ...errors };
    if (fieldName === "nama" || !fieldName) {
      const v = (form.nama || "").trim();
      if (!v) e.nama = "Nama tempat wajib diisi";
      else if (v.length < 2) e.nama = "Nama minimal 2 karakter";
      else delete e.nama;
    }
    if (fieldName === "kode" || !fieldName) {
      const v = (form.kode || "").trim().toUpperCase();
      if (!v) e.kode = "Kode tempat wajib diisi";
      else if (!/^[A-Z0-9_\-]+$/.test(v)) e.kode = "Kode hanya boleh huruf kapital, angka, underscore, strip";
      else delete e.kode;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === "kode" ? value.toUpperCase() : value;
    setForm((p) => ({ ...p, [name]: val }));
    if (touched[name]) setTimeout(() => validate(name), 0);
  };

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
    validate(e.target.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ nama: true, kode: true });
    if (!validate()) return;

    const payload = {
      nama: form.nama.trim(),
      kode: form.kode.trim().toUpperCase(),
      keterangan: form.keterangan.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedItem.id, data: payload });
        await success("Berhasil!", "Tempat berhasil diperbarui");
      } else {
        await createMut.mutateAsync(payload);
        await success("Berhasil!", "Tempat berhasil ditambahkan");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const se = {};
        Object.keys(err.response.data.errors).forEach((k) => { se[k] = err.response.data.errors[k][0]; });
        setErrors(se);
        return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleCancel = () => { if (!isSubmitting) closeAllModals(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        <div className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0", isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-indigo-50 to-white")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-indigo-100")}><MapPin className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-indigo-600")} /></div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Tempat" : "Tambah Tempat Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nama */}
          <FormField label="Nama Tempat" required error={errors.nama} touched={touched.nama}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" name="nama" value={form.nama} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.nama && touched.nama ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500")}
                placeholder="Contoh: Toko Utama" disabled={isSubmitting} autoFocus />
              {touched.nama && form.nama.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.nama ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
              )}
            </div>
          </FormField>

          {/* Kode */}
          <FormField label="Kode Tempat" required error={errors.kode} touched={touched.kode}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono font-bold">#</span>
              <input type="text" name="kode" value={form.kode} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-mono tracking-wider", errors.kode && touched.kode ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500")}
                placeholder="Contoh: TOKO" disabled={isSubmitting} maxLength={20} />
              {touched.kode && form.kode.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.kode ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Huruf kapital, angka, underscore, strip. Maks 20 karakter.</p>
          </FormField>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea name="keterangan" value={form.keterangan} onChange={handleChange}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" rows={2} placeholder="Opsional" disabled={isSubmitting} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className={cn("flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700")}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : (isEdit ? "Perbarui" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FormField = ({ label, required, error, touched, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
    {children}
    {error && touched && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default PlaceForm;