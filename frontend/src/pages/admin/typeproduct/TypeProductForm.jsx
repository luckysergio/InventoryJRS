import { useState, useEffect } from "react";
import { X, Tag, Layers, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useTypeProductModals } from "../../../lib/zustand/typeProductStore";
import { useCreateTypeProduct, useUpdateTypeProduct } from "../../../hooks/useTypeProducts";
import { useJenisDropdown } from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const MAX_LENGTH = 100;

const TypeProductForm = () => {
  const { modals, selectedType, closeAllModals } = useTypeProductModals();
  const createMutation = useCreateTypeProduct();
  const updateMutation = useUpdateTypeProduct();
  const { success, info } = useConfirmDialog();

  const { data: jenisOptions = [], isLoading: loadingJenis } = useJenisDropdown();

  const [form, setForm] = useState({ nama: "", jenis_id: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedType;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEdit && selectedType) {
      setForm({
        nama: selectedType.nama || "",
        jenis_id: selectedType.jenis_id ? String(selectedType.jenis_id) : "",
      });
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setForm({ nama: "", jenis_id: "" });
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedType, modals.edit, modals.create]);

  const validate = (fieldName, value) => {
    const newErrors = { ...errors };

    if (fieldName === "jenis_id" || !fieldName) {
      if (!form.jenis_id) newErrors.jenis_id = "Jenis product wajib dipilih";
      else delete newErrors.jenis_id;
    }

    if (fieldName === "nama" || !fieldName) {
      const trimmed = (form.nama || "").trim();
      if (!trimmed) newErrors.nama = "Nama type wajib diisi";
      else if (trimmed.length < 2) newErrors.nama = "Nama minimal 2 karakter";
      else if (trimmed.length > MAX_LENGTH) newErrors.nama = `Nama maksimal ${MAX_LENGTH} karakter`;
      else if (!/^[A-Z0-9\s\-\(\)#]+$/.test(trimmed)) newErrors.nama = "Hanya huruf kapital, angka, spasi, dan (-, (), #)";
      else delete newErrors.nama;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "nama" ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (touched[name]) setTimeout(() => validate(name, newValue), 0);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name, e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ nama: true, jenis_id: true });
    if (!validate(null, null)) return;

    const payload = {
      nama: form.nama.trim(),
      jenis_id: parseInt(form.jenis_id, 10),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedType.id, data: payload });
        await success("Berhasil!", `Type "${payload.nama}" berhasil diperbarui`);
        closeAllModals();
      } else {
        await createMutation.mutateAsync(payload);
        await success("Berhasil!", `Type "${payload.nama}" berhasil ditambahkan`);
        closeAllModals();
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => {
          serverErrors[key] = err.response.data.errors[key][0];
        });
        setErrors(serverErrors);
        return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan, silakan coba lagi");
    }
  };

  const handleCancel = () => { if (!isSubmitting) closeAllModals(); };

  if (!isOpen) return null;

  const charCount = form.nama.length;
  const charPercentage = (charCount / MAX_LENGTH) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        <div className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0", isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-blue-50 to-white")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}>
              <Layers className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? "Edit Type Product" : "Tambah Type Product Baru"}
            </h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <FormField label="Jenis Product" required error={errors.jenis_id} touched={touched.jenis_id}>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                name="jenis_id"
                value={form.jenis_id}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white appearance-none cursor-pointer",
                  errors.jenis_id && touched.jenis_id ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
                )}
                disabled={loadingJenis || isSubmitting}
              >
                <option value="">{loadingJenis ? "Memuat..." : "Pilih Jenis Product"}</option>
                {jenisOptions.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>
          </FormField>

          <FormField label="Nama Type" required error={errors.nama} touched={touched.nama}>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                onBlur={handleBlur}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium tracking-wide",
                  errors.nama && touched.nama ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
                )}
                placeholder="CONTOH: TIPE A"
                disabled={isSubmitting}
                autoFocus
                maxLength={MAX_LENGTH}
              />
              {touched.nama && form.nama.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.nama ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              {errors.nama && touched.nama ? (
                <p className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.nama}
                </p>
              ) : (
                <p className="text-slate-500">Kapital, angka, spasi, (-, (), #). Contoh: TIPE A</p>
              )}
              <span className={cn(
                "font-medium",
                charPercentage > 90 ? "text-red-600" : charPercentage > 75 ? "text-amber-600" : "text-slate-500"
              )}>
                {charCount}/{MAX_LENGTH}
              </span>
            </div>
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  charPercentage > 90 ? "bg-red-500" : charPercentage > 75 ? "bg-amber-500" : "bg-blue-500"
                )}
                style={{ width: `${charPercentage}%` }}
              />
            </div>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
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

const FormField = ({ label, required, error, touched, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && touched && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

export default TypeProductForm;