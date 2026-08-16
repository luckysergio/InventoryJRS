import { useState, useEffect } from "react";
import { X, Tag, User, Globe, Calendar, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useHargaProductModals } from "../../../lib/zustand/hargaProductStore";
import { useCreateHargaProduct, useUpdateHargaProduct, useProductsDropdown, useCustomersDropdown } from "../../../hooks/useHargaProducts";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const formatRupiahDisplay = (value) => {
  if (!value && value !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

const HargaProductForm = () => {
  const { modals, selectedHarga, closeAllModals } = useHargaProductModals();
  const createMutation = useCreateHargaProduct();
  const updateMutation = useUpdateHargaProduct();
  const { success, info } = useConfirmDialog();

  const { data: products = [] } = useProductsDropdown();
  const { data: customers = [] } = useCustomersDropdown();

  const [form, setForm] = useState({ product_id: "", customer_id: "", harga: "", tanggal_berlaku: "", keterangan: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const isEdit = modals.edit && selectedHarga;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isEdit && selectedHarga) {
      setForm({
        product_id: String(selectedHarga.product_id),
        customer_id: selectedHarga.customer_id ? String(selectedHarga.customer_id) : "",
        harga: String(selectedHarga.harga),
        tanggal_berlaku: selectedHarga.tanggal_berlaku ? selectedHarga.tanggal_berlaku.split('T')[0] : "",
        keterangan: selectedHarga.keterangan || "",
      });
      setErrors({});
      setTouched({});
    } else if (isCreate) {
      setForm({ product_id: "", customer_id: "", harga: "", tanggal_berlaku: "", keterangan: "" });
      setErrors({});
      setTouched({});
    }
  }, [isEdit, isCreate, selectedHarga, modals.edit, modals.create]);

  const validate = (fieldName) => {
    const newErrors = { ...errors };
    
    if ((fieldName === "product_id" || !fieldName) && !form.product_id) {
      newErrors.product_id = "Product wajib dipilih";
    } else if (fieldName === "product_id" || !fieldName) {
      delete newErrors.product_id;
    }

    if (fieldName === "harga" || !fieldName) {
      const raw = unformatRupiah(form.harga);
      if (!raw || Number(raw) < 1) {
        newErrors.harga = "Harga wajib diisi dan harus lebih dari 0";
      } else {
        delete newErrors.harga;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    // Special handling for harga input
    if (name === "harga") {
      newValue = unformatRupiah(value);
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));
    if (touched[name]) setTimeout(() => validate(name), 0);
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validate(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ product_id: true, harga: true });
    if (!validate()) return;

    const payload = {
      product_id: parseInt(form.product_id, 10),
      customer_id: form.customer_id ? parseInt(form.customer_id, 10) : null,
      harga: Number(unformatRupiah(form.harga)),
      tanggal_berlaku: form.tanggal_berlaku || null,
      keterangan: form.keterangan.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedHarga.id, data: payload });
        closeAllModals();
        await success("Berhasil!", "Harga berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(payload);
        closeAllModals();
        await success("Berhasil!", "Harga berhasil ditambahkan");
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
              <Tag className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Harga" : "Tambah Harga Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Product Select */}
          <FormField label="Product" required error={errors.product_id} touched={touched.product_id}>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select name="product_id" value={form.product_id} onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white appearance-none", errors.product_id && touched.product_id ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                disabled={isSubmitting}>
                <option value="">Pilih Product</option>
                {products.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </FormField>

          {/* Customer Select */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Customer <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select name="customer_id" value={form.customer_id} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                disabled={isSubmitting}>
                <option value="">Harga Umum (Semua Customer)</option>
                {customers.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 flex items-center gap-1"><Globe className="w-3 h-3" /> Kosongkan untuk harga yang berlaku umum</p>
          </div>

          {/* Harga Input */}
          <FormField label="Harga (Rp)" required error={errors.harga} touched={touched.harga}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
              <input type="text" inputMode="numeric" name="harga"
                value={formatRupiahDisplay(form.harga)}
                onChange={handleChange} onBlur={handleBlur}
                className={cn("w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-semibold tracking-wide", errors.harga && touched.harga ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="0" disabled={isSubmitting} autoFocus />
              {touched.harga && !errors.harga && form.harga && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
              )}
            </div>
          </FormField>

          {/* Tanggal Berlaku */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Berlaku</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="date" name="tanggal_berlaku" value={form.tanggal_berlaku} onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" disabled={isSubmitting} />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea name="keterangan" value={form.keterangan} onChange={handleChange} rows={2}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="Opsional" disabled={isSubmitting} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting}
              className={cn("flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50", isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700")}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : (isEdit ? "Perbarui" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Reusable FormField wrapper
const FormField = ({ label, required, error, touched, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
    {children}
    {error && touched && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default HargaProductForm;