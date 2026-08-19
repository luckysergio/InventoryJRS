import { useState, useEffect, useRef, useMemo } from "react";
import {
  X, Image as ImageIcon, Camera, Tag, User, Loader2, AlertCircle,
  CheckCircle, Truck, Plus, ChevronUp, ChevronDown, Search,
} from "lucide-react";
import { useProductCustomerModals } from "../../../lib/zustand/productCustomerStore";
import { useCreateProductCustomer, useUpdateProductCustomer } from "../../../hooks/useProductCustomers";
import { useJenisDropdown, useTypesDropdown, useBahansDropdown, useCustomersDropdown } from "../../../hooks/useMasterData";
import { useCreateCustomer } from "../../../hooks/useCustomers";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

// Kode generator helpers (mirror backend)
const jenisKode = (t) => { if (!t) return ""; const c = t.trim().toUpperCase(); return c.length < 2 ? c : c.charAt(0) + c.charAt(c.length - 1); };
const typeKode = (t) => { if (!t) return ""; const c = t.replace(/\(.+?\)/g, "").trim().toUpperCase(); const w = c.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); const h = w.length === 1 ? w[0].slice(0, 2) : w.map((w) => w.charAt(0)).join(""); const n = t.match(/\d+/g) || []; const a = n.length >= 2 ? n[0] + n[1] : n[0] || ""; return (h + a).toUpperCase(); };
const bahanKode = (t) => { if (!t) return ""; const c = t.replace(/\(.+?\)/g, "").trim().toUpperCase(); const w = c.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); return w.length === 1 ? w[0].slice(0, 2) : w.map((w) => w.charAt(0)).join(""); };
const ukuranKode = (t) => { if (!t) return ""; const m = t.match(/\d+[.,]?\d*/g); return m ? m.map((n) => n.replace(/[.,]/g, "")).join("") : ""; };
const customerPrefix = (name, phone) => { if (!name) return ""; const init = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase()).join("").slice(0, 4); const hp = (phone || "").replace(/\D/g, ""); return init + hp.slice(-4); };

const generateKodePreview = (jenisNama, typeNama, bahanNama, ukuran, custName, custPhone) => {
  const base = (jenisKode(jenisNama) + typeKode(typeNama) + bahanKode(bahanNama) + ukuranKode(ukuran)).toUpperCase();
  const prefix = customerPrefix(custName, custPhone);
  return prefix ? `${prefix}-${base}` : base || "—";
};

const formatRupiahDisplay = (v) => { if (!v && v !== 0) return ""; return new Intl.NumberFormat("id-ID").format(v); };
const unformatRupiah = (s) => parseInt(String(s || "").replace(/\D/g, ""), 10) || 0;

// ==========================================
// SEARCHABLE CUSTOMER DROPDOWN
// ==========================================
const SearchableCustomerDropdown = ({ customers, selectedValue, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const sorted = [...customers].sort((a, b) => (a.label || "").toLowerCase().localeCompare((b.label || "").toLowerCase()));
    if (!search.trim()) return sorted;
    const s = search.toLowerCase();
    return sorted.filter((c) => c.label?.toLowerCase().includes(s));
  }, [customers, search]);

  useEffect(() => {
    if (isOpen && inputRef.current && !disabled) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen, disabled]);

  const selected = customers.find((c) => String(c.value) === String(selectedValue));

  if (disabled) {
    return <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">{selected ? selected.label : "Pilih Customer..."}</div>;
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm">
        <span className="truncate">{selected ? selected.label : "Pilih Customer..."}</span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 ml-2" /> : <ChevronDown size={16} className="text-slate-400 ml-2" />}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input ref={inputRef} type="text" placeholder="Cari nama/phone..." className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
                {search && <button type="button" onClick={(e) => { e.stopPropagation(); setSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 max-h-40">
              {filtered.map((c) => (
                <button key={c.value} type="button" onClick={() => { onSelect(c.value); setIsOpen(false); setSearch(""); }} className={cn("w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between", String(c.value) === String(selectedValue) ? "bg-blue-100 text-blue-800" : "")}>
                  <span className="truncate">{c.label}</span>
                  {String(c.value) === String(selectedValue) && <CheckCircle size={14} className="text-blue-600 ml-2" />}
                </button>
              ))}
              {filtered.length === 0 && <div className="p-3 text-sm text-slate-500 text-center">Tidak ditemukan</div>}
            </div>
            {onCreateNew && (
              <button type="button" onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }} className="p-2 border-t border-slate-100 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 font-medium"><Plus size={14} /> Tambah Customer Baru</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// MAIN FORM COMPONENT
// ==========================================
const ProductCustomerForm = () => {
  const { modals, selectedItem, closeAllModals } = useProductCustomerModals();
  const createMut = useCreateProductCustomer();
  const updateMut = useUpdateProductCustomer();
  const createCustomerMut = useCreateCustomer();
  const { success, info } = useConfirmDialog();

  const { data: jenisOptions = [], isLoading: loadingJenis } = useJenisDropdown();
  const { data: bahansOptions = [], isLoading: loadingBahans } = useBahansDropdown();
  const { data: customersOptions = [] } = useCustomersDropdown();

  const [form, setForm] = useState({ customer_id: "", jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", harga: "" });
  const [newInputs, setNewInputs] = useState({ jenis: "", type: "", bahan: "" });
  const [fotos, setFotos] = useState({ depan: null, samping: null, atas: null });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: "", phone: "", email: "" });
  const [isInitialized, setIsInitialized] = useState(false);

  const fileRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };
  const camRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };

  const isEdit = modals.form && !!selectedItem;
  const isCreate = modals.form && !selectedItem;
  const isOpen = modals.form;
  const isSubmitting = createMut.isPending || updateMut.isPending || createCustomerMut.isPending;

  const isNewJenis = form.jenis_id === "new";
  const isNewType = form.type_id === "new";
  const isNewBahan = form.bahan_id === "new";

  const activeJenisId = isNewJenis ? null : (form.jenis_id || null);
  const { data: typesOptions = [], isLoading: loadingTypes } = useTypesDropdown(activeJenisId);

  // Reset form
  useEffect(() => {
    if (!isOpen) { setIsInitialized(false); return; }
    if (isEdit && selectedItem) {
      const latestHarga = selectedItem.harga ?? 0;
      setForm({
        customer_id: String(selectedItem.customer_id || ""),
        jenis_id: String(selectedItem.jenis_id || ""),
        type_id: String(selectedItem.type_id || ""),
        bahan_id: String(selectedItem.bahan_id || ""),
        ukuran: selectedItem.ukuran || "",
        keterangan: selectedItem.keterangan || "",
        harga: String(latestHarga),
      });
      setFotos({
        depan: selectedItem.foto_depan_url || (selectedItem.foto_depan ? `${ASSET_URL}/storage/${selectedItem.foto_depan}` : null),
        samping: selectedItem.foto_samping_url || (selectedItem.foto_samping ? `${ASSET_URL}/storage/${selectedItem.foto_samping}` : null),
        atas: selectedItem.foto_atas_url || (selectedItem.foto_atas ? `${ASSET_URL}/storage/${selectedItem.foto_atas}` : null),
      });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({}); setTouched({});
      setIsCreatingNewCustomer(false); setNewCustForm({ name: "", phone: "", email: "" });
      setIsInitialized(false);
    } else if (isCreate) {
      setForm({ customer_id: "", jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", harga: "" });
      setFotos({ depan: null, samping: null, atas: null });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({}); setTouched({});
      setIsCreatingNewCustomer(false); setNewCustForm({ name: "", phone: "", email: "" });
      setIsInitialized(true);
    }
  }, [isEdit, isCreate, selectedItem, modals.form]);

  // Wait for types to load before allowing auto-reset
  useEffect(() => {
    if (isEdit && !loadingTypes && !isInitialized) setIsInitialized(true);
  }, [isEdit, loadingTypes, isInitialized]);

  // Auto-reset type only after initialized
  useEffect(() => {
    if (!isInitialized || loadingTypes) return;
    if (isNewJenis || isNewType) return;
    if (form.jenis_id && form.type_id) {
      const isValid = typesOptions.some((t) => String(t.value) === String(form.type_id));
      if (!isValid) setForm((prev) => ({ ...prev, type_id: "" }));
    }
  }, [form.jenis_id, form.type_id, typesOptions, loadingTypes, isInitialized, isNewJenis, isNewType]);

  // Kode preview
  const kodePreview = useMemo(() => {
    const jNama = isNewJenis ? newInputs.jenis : jenisOptions.find((j) => String(j.value) === String(form.jenis_id))?.label || "";
    const tNama = isNewType ? newInputs.type : typesOptions.find((t) => String(t.value) === String(form.type_id))?.label || "";
    const bNama = isNewBahan ? newInputs.bahan : bahansOptions.find((b) => String(b.value) === String(form.bahan_id))?.label || "";
    let cName = "", cPhone = "";
    if (isCreatingNewCustomer && newCustForm.name) { cName = newCustForm.name; cPhone = newCustForm.phone || ""; }
    else if (form.customer_id) { const c = customersOptions.find((c) => String(c.value) === String(form.customer_id)); cName = c?.label || ""; }
    return generateKodePreview(jNama, tNama, bNama, form.ukuran, cName, cPhone);
  }, [form.jenis_id, form.type_id, form.bahan_id, form.ukuran, form.customer_id, newInputs, isCreatingNewCustomer, newCustForm, jenisOptions, typesOptions, bahansOptions, customersOptions]);

  // Validation
  const validate = () => {
    const e = {};
    if (!isEdit && !form.customer_id && !isCreatingNewCustomer) e.customer_id = "Customer wajib dipilih";
    if (!form.jenis_id) e.jenis_id = "Jenis wajib dipilih";
    else if (isNewJenis && !newInputs.jenis.trim()) e.jenis_id = "Nama jenis baru wajib diisi";
    if (!form.ukuran?.trim()) e.ukuran = "Ukuran wajib diisi";
    const rawHarga = unformatRupiah(form.harga);
    if (!rawHarga && rawHarga !== 0) e.harga = "Harga wajib diisi";
    if (isCreatingNewCustomer && !newCustForm.name.trim()) e.new_customer = "Nama customer wajib diisi";
    if (!isNewJenis) {
      if (!form.type_id) e.type_id = "Tipe wajib dipilih";
      else if (isNewType && !newInputs.type.trim()) e.type_id = "Nama tipe baru wajib diisi";
    } else {
      if (!newInputs.type.trim()) e.type_id = "Nama tipe baru wajib diisi saat membuat jenis baru";
    }
    if (isNewBahan && !newInputs.bahan.trim()) e.bahan_id = "Nama bahan baru wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { info("Error", "Ukuran file maksimal 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) { info("Error", "Hanya JPG/PNG/WebP"); return; }
    setFotos((prev) => ({ ...prev, [field]: file }));
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustForm.name.trim()) { setErrors((prev) => ({ ...prev, new_customer: "Nama customer wajib diisi" })); return; }
    try {
      const result = await createCustomerMut.mutateAsync({ name: newCustForm.name.trim(), phone: newCustForm.phone?.trim() || "", email: newCustForm.email?.trim() || "" });
      const newId = result.data?.data?.id || result.data?.id;
      setForm((prev) => ({ ...prev, customer_id: String(newId) }));
      setIsCreatingNewCustomer(false); setNewCustForm({ name: "", phone: "", email: "" });
      setErrors((prev) => ({ ...prev, new_customer: undefined, customer_id: undefined }));
      await success("Berhasil!", "Customer baru berhasil dibuat dan dipilih");
    } catch (err) { /* handled in mutation */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ customer_id: true, jenis_id: true, type_id: true, ukuran: true, harga: true, bahan_id: true });
    if (!validate()) return;

    const formData = new FormData();
    formData.append("ukuran", form.ukuran.trim());
    formData.append("harga", unformatRupiah(form.harga).toString());
    if (form.keterangan) formData.append("keterangan", form.keterangan);

    if (!isEdit) formData.append("customer_id", form.customer_id);

    if (isNewJenis) { formData.append("jenis_nama", newInputs.jenis.trim().toUpperCase()); formData.append("type_nama", newInputs.type.trim().toUpperCase()); }
    else { formData.append("jenis_id", form.jenis_id); if (isNewType) formData.append("type_nama", newInputs.type.trim().toUpperCase()); else if (form.type_id) formData.append("type_id", form.type_id); }

    if (isNewBahan) formData.append("bahan_nama", newInputs.bahan.trim().toUpperCase());
    else if (form.bahan_id) formData.append("bahan_id", form.bahan_id);

    if (fotos.depan instanceof File) formData.append("foto_depan", fotos.depan);
    if (fotos.samping instanceof File) formData.append("foto_samping", fotos.samping);
    if (fotos.atas instanceof File) formData.append("foto_atas", fotos.atas);

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedItem.id, formData });
        await success("Berhasil!", "Produk customer berhasil diperbarui");
      } else {
        await createMut.mutateAsync(formData);
        await success("Berhasil!", "Produk customer berhasil ditambahkan");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const se = {}; Object.keys(err.response.data.errors).forEach((k) => { se[k] = err.response.data.errors[k][0]; });
        setErrors(se); return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleCancel = () => { if (!isSubmitting) closeAllModals(); };

  if (!isOpen) return null;

  const renderFotoInput = (label, field) => {
    const foto = fotos[field];
    const preview = foto instanceof File ? URL.createObjectURL(foto) : foto;
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-600 text-center">{label}</label>
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative">
            {preview ? <img src={preview} alt={label} className="w-16 h-16 object-cover rounded-lg border border-slate-200" /> : <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50"><ImageIcon size={20} className="text-slate-400" /></div>}
            {preview && <button type="button" onClick={() => setFotos((prev) => ({ ...prev, [field]: null }))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition">×</button>}
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
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}><Truck className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} /></div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Produk Customer" : "Tambah Produk Customer"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Kode Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Product <span className="text-slate-400 font-normal">(Auto-generated)</span></label>
            <div className={cn("w-full px-4 py-2.5 border rounded-lg font-mono font-semibold tracking-wider text-center transition-colors", kodePreview !== "—" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400")}>{isEdit ? (selectedItem?.kode || kodePreview) : kodePreview}</div>
          </div>

          {/* Customer */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer <span className="text-red-500">*</span></label>
              <SearchableCustomerDropdown customers={customersOptions} selectedValue={form.customer_id} onSelect={(val) => { setIsCreatingNewCustomer(false); setForm((p) => ({ ...p, customer_id: val })); setErrors((p) => ({ ...p, customer_id: undefined })); }} onCreateNew={() => { setIsCreatingNewCustomer(true); setForm((p) => ({ ...p, customer_id: "" })); }} />
              {errors.customer_id && touched.customer_id && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.customer_id}</p>}
              {isCreatingNewCustomer && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3 animate-fadeIn">
                  <p className="text-xs font-medium text-blue-800 flex items-center gap-1"><User size={12} /> Buat Customer Baru</p>
                  <input type="text" placeholder="Nama Customer *" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newCustForm.name} onChange={(e) => setNewCustForm((p) => ({ ...p, name: e.target.value }))} />
                  <input type="tel" placeholder="Nomor HP" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newCustForm.phone} onChange={(e) => setNewCustForm((p) => ({ ...p, phone: e.target.value }))} />
                  <input type="email" placeholder="Email (opsional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newCustForm.email} onChange={(e) => setNewCustForm((p) => ({ ...p, email: e.target.value }))} />
                  {errors.new_customer && <p className="text-xs text-red-600">{errors.new_customer}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={handleCreateNewCustomer} disabled={createCustomerMut.isPending} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-50">{createCustomerMut.isPending ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><CheckCircle size={14} /> Simpan & Pilih</>}</button>
                    <button type="button" onClick={() => { setIsCreatingNewCustomer(false); setNewCustForm({ name: "", phone: "", email: "" }); setErrors((p) => ({ ...p, new_customer: undefined })); }} className="px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition">Batal</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isEdit && form.customer_id && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer</label>
              <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">{customersOptions.find((c) => String(c.value) === String(form.customer_id))?.label || "—"}</div>
              <p className="mt-1 text-xs text-slate-500">Customer tidak dapat diubah saat edit</p>
            </div>
          )}

          {/* Harga */}
          <FormField label="Harga Customer" required error={errors.harga} touched={touched.harga}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
              <input type="text" inputMode="numeric" value={formatRupiahDisplay(unformatRupiah(form.harga))} onChange={(e) => setForm((p) => ({ ...p, harga: String(unformatRupiah(e.target.value)) }))} className={cn("w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium", errors.harga && touched.harga ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")} placeholder="0" disabled={isSubmitting} />
            </div>
          </FormField>

          {/* Master Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Jenis" required error={errors.jenis_id} touched={touched.jenis_id}>
              <select value={form.jenis_id} onChange={(e) => { setForm((p) => ({ ...p, jenis_id: e.target.value, type_id: "" })); setNewInputs((p) => ({ ...p, jenis: "", type: "" })); setErrors((p) => ({ ...p, jenis_id: undefined })); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" disabled={loadingJenis || isSubmitting}>
                <option value="">{loadingJenis ? "Memuat..." : "Pilih Jenis"}</option>
                {jenisOptions.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                <option value="new">➕ Tambah Jenis Baru</option>
              </select>
              {isNewJenis && <input type="text" placeholder="Nama JENIS baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={newInputs.jenis} onChange={(e) => setNewInputs((p) => ({ ...p, jenis: e.target.value.toUpperCase() }))} disabled={isSubmitting} />}
            </FormField>

            <FormField label={`Tipe ${isNewJenis ? "Baru *" : "*"}`} required error={errors.type_id} touched={touched.type_id}>
              {isNewJenis ? (
                <div className="space-y-2">
                  <input type="text" placeholder="Nama TIPE baru (HURUF KAPITAL)" className={cn("w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium tracking-wide", errors.type_id && touched.type_id ? "border-red-300 focus:ring-red-500" : "border-blue-300 focus:ring-blue-500")} value={newInputs.type} onChange={(e) => { setNewInputs((p) => ({ ...p, type: e.target.value.toUpperCase() })); if (errors.type_id) setErrors((p) => ({ ...p, type_id: undefined })); }} disabled={isSubmitting} />
                  <p className="text-[11px] text-blue-600">💡 Tipe akan dibuat bersama jenis baru.</p>
                </div>
              ) : (
                <>
                  <select value={form.type_id} onChange={(e) => { setForm((p) => ({ ...p, type_id: e.target.value })); setNewInputs((p) => ({ ...p, type: "" })); setErrors((p) => ({ ...p, type_id: undefined })); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400" disabled={!form.jenis_id || loadingTypes || isSubmitting}>
                    <option value="">{loadingTypes ? "Memuat..." : (form.jenis_id ? `Pilih Tipe (${typesOptions.length})` : "Pilih Jenis dulu")}</option>
                    {typesOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    <option value="new">➕ Tambah Tipe Baru</option>
                  </select>
                  {isNewType && <input type="text" placeholder="Nama TIPE baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={newInputs.type} onChange={(e) => { setNewInputs((p) => ({ ...p, type: e.target.value.toUpperCase() })); if (errors.type_id) setErrors((p) => ({ ...p, type_id: undefined })); }} disabled={isSubmitting} />}
                </>
              )}
            </FormField>

            <FormField label="Bahan" error={errors.bahan_id} touched={touched.bahan_id}>
              <select value={form.bahan_id} onChange={(e) => { setForm((p) => ({ ...p, bahan_id: e.target.value })); setNewInputs((p) => ({ ...p, bahan: "" })); setErrors((p) => ({ ...p, bahan_id: undefined })); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" disabled={loadingBahans || isSubmitting}>
                <option value="">{loadingBahans ? "Memuat..." : "Pilih Bahan"}</option>
                {bahansOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                <option value="new">➕ Tambah Bahan Baru</option>
              </select>
              {isNewBahan && <input type="text" placeholder="Nama BAHAN baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={newInputs.bahan} onChange={(e) => { setNewInputs((p) => ({ ...p, bahan: e.target.value.toUpperCase() })); if (errors.bahan_id) setErrors((p) => ({ ...p, bahan_id: undefined })); }} disabled={isSubmitting} />}
            </FormField>

            <FormField label="Ukuran" required error={errors.ukuran} touched={touched.ukuran}>
              <input type="text" value={form.ukuran} onChange={(e) => setForm((p) => ({ ...p, ukuran: e.target.value }))} onBlur={() => setTouched((p) => ({ ...p, ukuran: true }))} className={cn("w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.ukuran && touched.ukuran ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")} placeholder="Contoh: 10x20" disabled={isSubmitting} />
            </FormField>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto Product</label>
            <div className="grid grid-cols-3 gap-4">{renderFotoInput("Depan", "depan")}{renderFotoInput("Samping", "samping")}{renderFotoInput("Atas", "atas")}</div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows={2} placeholder="Opsional" disabled={isSubmitting} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className={cn("flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed", isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700")}>
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

export default ProductCustomerForm;