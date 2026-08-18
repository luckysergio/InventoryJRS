import { useState, useEffect } from "react";
import { X, User, Phone, Mail, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCustomerModals } from "../../../lib/zustand/customerStore";
import { useCreateCustomer, useUpdateCustomer } from "../../../hooks/useCustomers";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const CustomerForm = () => {
  const { modals, selectedItem, closeAllModals } = useCustomerModals();
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { success, info } = useConfirmDialog();

  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedItem;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEdit && selectedItem) {
      setForm({
        name: selectedItem.name || "",
        phone: selectedItem.phone || "",
        email: selectedItem.email || "",
      });
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setForm({ name: "", phone: "", email: "" });
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedItem, modals.edit, modals.create]);

  const validate = (fieldName) => {
    const newErrors = { ...errors };

    if (fieldName === "name" || !fieldName) {
      const trimmed = (form.name || "").trim();
      if (!trimmed) newErrors.name = "Nama customer wajib diisi";
      else if (trimmed.length < 2) newErrors.name = "Nama minimal 2 karakter";
      else delete newErrors.name;
    }

    if (fieldName === "phone" || !fieldName) {
      const trimmed = (form.phone || "").trim();
      if (trimmed && trimmed.length < 8) newErrors.phone = "No HP minimal 8 karakter";
      else delete newErrors.phone;
    }

    if (fieldName === "email" || !fieldName) {
      const trimmed = (form.email || "").trim();
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) newErrors.email = "Format email tidak valid";
      else delete newErrors.email;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setTimeout(() => validate(name), 0);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, email: true });
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedItem.id, data: payload });
        await success("Berhasil!", "Customer berhasil diperbarui");
        closeAllModals();
      } else {
        await createMutation.mutateAsync(payload);
        await success("Berhasil!", "Customer berhasil ditambahkan");
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
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleCancel = () => { if (!isSubmitting) closeAllModals(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0", isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-blue-50 to-white")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}>
              <User className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Customer" : "Tambah Customer Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nama */}
          <FormField label="Nama Customer" required error={errors.name} touched={touched.name}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.name && touched.name ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="Masukkan nama customer" disabled={isSubmitting} autoFocus />
              {touched.name && form.name.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.name ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
              )}
            </div>
          </FormField>

          {/* No HP */}
          <FormField label="Nomor Telepon" error={errors.phone} touched={touched.phone}>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.phone && touched.phone ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="08xxxxxxxxxx" disabled={isSubmitting} />
              {touched.phone && form.phone.trim() && !errors.phone && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              )}
            </div>
          </FormField>

          {/* Email */}
          <FormField label="Email" error={errors.email} touched={touched.email}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.email && touched.email ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="email@contoh.com" disabled={isSubmitting} />
              {touched.email && form.email.trim() && !errors.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
              )}
            </div>
          </FormField>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting}
              className={cn("flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700")}>
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

export default CustomerForm;