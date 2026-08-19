import { useState, useEffect, useRef, useMemo } from "react";
import { X, Image as ImageIcon, Camera, Tag, Package, Loader2, AlertCircle } from "lucide-react";
import { useProductModals } from "../../../lib/zustand/productStore";
import { useJenisDropdown, useTypesDropdown, useBahansDropdown } from "../../../hooks/useMasterData";
import { useCreateProduct, useUpdateProduct } from "../../../hooks/useProducts";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

const jenisKode = (text) => { if (!text) return ""; const c = text.trim().toUpperCase(); return c.length < 2 ? c : c.charAt(0) + c.charAt(c.length - 1); };
const typeKode = (text) => { if (!text) return ""; const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase(); const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); const huruf = words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join(""); const numbers = text.match(/\d+/g) || []; const angka = numbers.length >= 2 ? numbers[0] + numbers[1] : (numbers[0] || ""); return (huruf + angka).toUpperCase(); };
const bahanKode = (text) => { if (!text) return ""; const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase(); const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); return words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join(""); };
const ukuranKode = (text) => { if (!text) return ""; const matches = text.match(/\d+[.,]?\d*/g); return matches ? matches.map((n) => n.replace(/[.,]/g, "")).join("") : ""; };
const generateKode = (j, t, b, u) => (jenisKode(j) + typeKode(t) + bahanKode(b) + ukuranKode(u)).toUpperCase();

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const unformatRupiah = (str) => parseInt(String(str || "").replace(/\D/g, ""), 10) || 0;

const ProductForm = () => {
  const { modals, selectedProduct, closeAllModals } = useProductModals();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { success, info } = useConfirmDialog();

  const { data: jenisOptions = [], isLoading: loadingJenis } = useJenisDropdown();
  const { data: bahansOptions = [], isLoading: loadingBahans } = useBahansDropdown();

  const [form, setForm] = useState({
    jenis_id: "", type_id: "", bahan_id: "",
    ukuran: "", keterangan: "", harga_umum: "",
  });
  const [newInputs, setNewInputs] = useState({ jenis: "", type: "", bahan: "" });
  const [fotos, setFotos] = useState({ depan: null, samping: null, atas: null });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  // ✅ FIX: Tambah isInitialized flag untuk mencegah reset saat loading
  const [isInitialized, setIsInitialized] = useState(false);

  const fileRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };
  const camRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };

  const isEdit = modals.edit && selectedProduct;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const isNewJenis = form.jenis_id === "new";
  const isNewType = form.type_id === "new";
  const isNewBahan = form.bahan_id === "new";

  const activeJenisId = isNewJenis ? null : (form.jenis_id || null);
  const { data: typesOptions = [], isLoading: loadingTypes } = useTypesDropdown(activeJenisId);

  // Reset form saat modal open/close
  useEffect(() => {
    if (!isOpen) { setIsInitialized(false); return; }
    
    if (isEdit && selectedProduct) {
      setForm({
        jenis_id: String(selectedProduct.jenis_id || ""),
        type_id: String(selectedProduct.type_id || ""),
        bahan_id: String(selectedProduct.bahan_id || ""),
        ukuran: selectedProduct.ukuran || "",
        keterangan: selectedProduct.keterangan || "",
        harga_umum: String(selectedProduct.harga_umum || ""),
      });
      setFotos({
        depan: selectedProduct.foto_depan_url || (selectedProduct.foto_depan ? `${ASSET_URL}/storage/${selectedProduct.foto_depan}` : null),
        samping: selectedProduct.foto_samping_url || (selectedProduct.foto_samping ? `${ASSET_URL}/storage/${selectedProduct.foto_samping}` : null),
        atas: selectedProduct.foto_atas_url || (selectedProduct.foto_atas ? `${ASSET_URL}/storage/${selectedProduct.foto_atas}` : null),
      });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({});
      setTouched({});
      setIsInitialized(false); // Reset flag, tunggu types load
    } else if (isCreate) {
      setForm({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", harga_umum: "" });
      setFotos({ depan: null, samping: null, atas: null });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({});
      setTouched({});
      setIsInitialized(true); // Create mode langsung initialized
    }
  }, [isEdit, isCreate, selectedProduct, modals.edit, modals.create]);

  // ✅ FIX: Tunggu types selesai loading sebelum set initialized
  useEffect(() => {
    if (isEdit && !loadingTypes && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isEdit, loadingTypes, isInitialized]);

  const filteredTypes = useMemo(() => {
    if (!form.jenis_id || isNewJenis) return [];
    return typesOptions;
  }, [form.jenis_id, isNewJenis, typesOptions]);

  // ✅ FIX: Auto-reset type_id HANYA setelah initialized DAN types sudah load
  useEffect(() => {
    // Guard: jangan reset saat masih loading atau belum initialized
    if (!isInitialized || loadingTypes) return;
    if (isNewJenis || isNewType) return;
    
    if (form.jenis_id && form.type_id) {
      const isValid = filteredTypes.some((t) => String(t.value) === String(form.type_id));
      if (!isValid) {
        setForm((prev) => ({ ...prev, type_id: "" }));
      }
    }
  }, [form.jenis_id, form.type_id, filteredTypes, loadingTypes, isInitialized, isNewJenis, isNewType]);

  // Live kode preview
  const kodePreview = useMemo(() => {
    const jNama = isNewJenis
      ? newInputs.jenis
      : jenisOptions.find((j) => String(j.value) === String(form.jenis_id))?.label || "";
    const tNama = isNewType
      ? newInputs.type
      : typesOptions.find((t) => String(t.value) === String(form.type_id))?.label || "";
    const bNama = isNewBahan
      ? newInputs.bahan
      : bahansOptions.find((b) => String(b.value) === String(form.bahan_id))?.label || "";
    return generateKode(jNama, tNama, bNama, form.ukuran) || "—";
  }, [form.jenis_id, form.type_id, form.bahan_id, form.ukuran, newInputs, isNewJenis, isNewType, isNewBahan, jenisOptions, typesOptions, bahansOptions]);

  const validate = () => {
    const newErrors = {};

    if (!form.jenis_id) {
      newErrors.jenis_id = "Jenis wajib dipilih";
    } else if (isNewJenis && !newInputs.jenis.trim()) {
      newErrors.jenis_id = "Nama jenis baru wajib diisi";
    }

    if (!isNewJenis) {
      if (!form.type_id) {
        newErrors.type_id = "Tipe wajib dipilih";
      } else if (isNewType && !newInputs.type.trim()) {
        newErrors.type_id = "Nama tipe baru wajib diisi";
      }
    } else {
      if (!newInputs.type.trim()) {
        newErrors.type_id = "Nama tipe baru wajib diisi saat membuat jenis baru";
      }
    }

    if (!form.ukuran?.trim()) newErrors.ukuran = "Ukuran wajib diisi";

    const rawHarga = unformatRupiah(form.harga_umum);
    if (!rawHarga || rawHarga < 0) newErrors.harga_umum = "Harga wajib diisi dan tidak boleh negatif";

    if (isNewBahan && !newInputs.bahan.trim()) newErrors.bahan_id = "Nama bahan baru wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ jenis_id: true, type_id: true, ukuran: true, harga_umum: true, bahan_id: true });
    if (!validate()) return;

    const formData = new FormData();
    formData.append("ukuran", form.ukuran.trim());
    formData.append("harga_umum", unformatRupiah(form.harga_umum));
    if (form.keterangan) formData.append("keterangan", form.keterangan);

    if (isNewJenis) {
      formData.append("jenis_nama", newInputs.jenis.trim().toUpperCase());
      formData.append("type_nama", newInputs.type.trim().toUpperCase());
    } else {
      formData.append("jenis_id", form.jenis_id);
      if (isNewType) {
        formData.append("type_nama", newInputs.type.trim().toUpperCase());
      } else if (form.type_id) {
        formData.append("type_id", form.type_id);
      }
    }

    if (isNewBahan) {
      formData.append("bahan_nama", newInputs.bahan.trim().toUpperCase());
    } else if (form.bahan_id) {
      formData.append("bahan_id", form.bahan_id);
    }

    if (fotos.depan instanceof File) formData.append("foto_depan", fotos.depan);
    if (fotos.samping instanceof File) formData.append("foto_samping", fotos.samping);
    if (fotos.atas instanceof File) formData.append("foto_atas", fotos.atas);

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedProduct.id, formData });
        await success("Berhasil!", "Product berhasil diperbarui");
        closeAllModals();
      } else {
        await createMutation.mutateAsync(formData);
        await success("Berhasil!", "Product berhasil ditambahkan");
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

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { info("Error", "Ukuran file maksimal 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) { info("Error", "Hanya JPG/PNG/WebP"); return; }
    setFotos((prev) => ({ ...prev, [field]: file }));
  };

  const handleCancel = () => { if (!isSubmitting) closeAllModals(); };

  const handleJenisChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, jenis_id: val, type_id: "" }));
    setNewInputs((prev) => ({ ...prev, jenis: "", type: "" }));
    setErrors((prev) => ({ ...prev, jenis_id: undefined, type_id: undefined }));
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, type_id: val }));
    if (val !== "new") setNewInputs((prev) => ({ ...prev, type: "" }));
    setErrors((prev) => ({ ...prev, type_id: undefined }));
  };

  const handleBahanChange = (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, bahan_id: val }));
    if (val !== "new") setNewInputs((prev) => ({ ...prev, bahan: "" }));
    setErrors((prev) => ({ ...prev, bahan_id: undefined }));
  };

  if (!isOpen) return null;

  const renderFotoInput = (label, field) => {
    const foto = fotos[field];
    const preview = foto instanceof File ? URL.createObjectURL(foto) : foto;
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600 text-center">{label}</label>
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            {preview ? (
              <img src={preview} alt={label} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
            ) : (
              <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50"><ImageIcon size={20} className="text-slate-400" /></div>
            )}
            {preview && (
              <button type="button" onClick={() => setFotos((prev) => ({ ...prev, [field]: null }))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition">×</button>
            )}
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => fileRefs[field].current?.click()} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">Galeri</button>
            <button type="button" onClick={() => camRefs[field].current?.click()} className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition flex items-center gap-0.5"><Camera size={9} /> Kamera</button>
          </div>
        </div>
        <input type="file" ref={fileRefs[field]} accept="image/*" onChange={(e) => handleFileChange(e, field)} className="hidden" />
        <input type="file" ref={camRefs[field]} accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, field)} className="hidden" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        <div className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0", isEdit ? "bg-gradient-to-r from-amber-50 to-white" : "bg-gradient-to-r from-blue-50 to-white")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}><Package className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} /></div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Product" : "Tambah Product Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Product <span className="text-slate-400 font-normal">(Auto-generated)</span></label>
            <div className={cn("w-full px-4 py-2.5 border rounded-lg font-mono font-semibold tracking-wider text-center transition-colors", kodePreview !== "—" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400")}>
              {kodePreview}
            </div>
          </div>

          <FormField label="Harga Umum" required error={errors.harga_umum} touched={touched.harga_umum}>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" inputMode="numeric" value={formatRupiah(unformatRupiah(form.harga_umum))}
                onChange={(e) => setForm({ ...form, harga_umum: String(unformatRupiah(e.target.value)) })}
                onBlur={() => setTouched((p) => ({ ...p, harga_umum: true }))}
                className={cn("w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium", errors.harga_umum && touched.harga_umum ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="Rp 0" disabled={isSubmitting} />
            </div>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Jenis" required error={errors.jenis_id} touched={touched.jenis_id}>
              <select value={form.jenis_id} onChange={handleJenisChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                disabled={loadingJenis || isSubmitting}>
                <option value="">{loadingJenis ? "Memuat..." : "Pilih Jenis"}</option>
                {jenisOptions.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                <option value="new">➕ Tambah Jenis Baru</option>
              </select>
              {isNewJenis && (
                <div className="mt-2 space-y-2">
                  <input type="text" placeholder="Nama JENIS baru (HURUF KAPITAL)"
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide"
                    value={newInputs.jenis} onChange={(e) => setNewInputs((p) => ({ ...p, jenis: e.target.value.toUpperCase() }))}
                    disabled={isSubmitting} autoFocus />
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">💡 Jenis baru akan dibuat otomatis. Anda juga wajib mengisi Tipe baru di bawah.</p>
                </div>
              )}
            </FormField>

            <FormField label={`Tipe ${isNewJenis ? "Baru *" : "*"}`} required error={errors.type_id} touched={touched.type_id}>
              {isNewJenis ? (
                <div className="space-y-2">
                  <input type="text" placeholder="Nama TIPE baru (HURUF KAPITAL)"
                    className={cn("w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium tracking-wide",
                      errors.type_id && touched.type_id ? "border-red-300 focus:ring-red-500" : "border-blue-300 focus:ring-blue-500")}
                    value={newInputs.type}
                    onChange={(e) => { setNewInputs((p) => ({ ...p, type: e.target.value.toUpperCase() })); if (errors.type_id) setErrors((p) => ({ ...p, type_id: undefined })); }}
                    disabled={isSubmitting} autoFocus />
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">💡 Tipe ini akan otomatis dibuat dan dihubungkan dengan Jenis baru.</p>
                </div>
              ) : (
                <>
                  <select value={form.type_id} onChange={handleTypeChange}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!form.jenis_id || loadingTypes || isSubmitting}>
                    <option value="">{loadingTypes ? "Memuat..." : (form.jenis_id ? `Pilih Tipe (${filteredTypes.length} tersedia)` : "Pilih Jenis dulu")}</option>
                    {filteredTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    <option value="new">➕ Tambah Tipe Baru</option>
                  </select>
                  {isNewType && (
                    <input type="text" placeholder="Nama TIPE baru (HURUF KAPITAL)"
                      className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide"
                      value={newInputs.type}
                      onChange={(e) => { setNewInputs((p) => ({ ...p, type: e.target.value.toUpperCase() })); if (errors.type_id) setErrors((p) => ({ ...p, type_id: undefined })); }}
                      disabled={isSubmitting} autoFocus />
                  )}
                </>
              )}
            </FormField>

            <FormField label="Bahan" error={errors.bahan_id} touched={touched.bahan_id}>
              <select value={form.bahan_id} onChange={handleBahanChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                disabled={loadingBahans || isSubmitting}>
                <option value="">{loadingBahans ? "Memuat..." : "Pilih Bahan"}</option>
                {bahansOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                <option value="new">➕ Tambah Bahan Baru</option>
              </select>
              {isNewBahan && (
                <input type="text" placeholder="Nama BAHAN baru (HURUF KAPITAL)"
                  className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide"
                  value={newInputs.bahan}
                  onChange={(e) => { setNewInputs((p) => ({ ...p, bahan: e.target.value.toUpperCase() })); if (errors.bahan_id) setErrors((p) => ({ ...p, bahan_id: undefined })); }}
                  disabled={isSubmitting} autoFocus />
              )}
            </FormField>

            <FormField label="Ukuran" required error={errors.ukuran} touched={touched.ukuran}>
              <input type="text" value={form.ukuran} onChange={(e) => setForm((p) => ({ ...p, ukuran: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, ukuran: true }))}
                className={cn("w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.ukuran && touched.ukuran ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="Contoh: 10x20" disabled={isSubmitting} />
            </FormField>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto Product</label>
            <div className="grid grid-cols-3 gap-4">
              {renderFotoInput("Depan", "depan")}
              {renderFotoInput("Samping", "samping")}
              {renderFotoInput("Atas", "atas")}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows={2} placeholder="Opsional" disabled={isSubmitting} />
          </div>

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

const FormField = ({ label, required, error, touched, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
    {children}
    {error && touched && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

export default ProductForm;