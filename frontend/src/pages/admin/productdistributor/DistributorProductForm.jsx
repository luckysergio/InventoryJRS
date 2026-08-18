import { useState, useEffect, useRef, useMemo } from "react";
import { X, Image as ImageIcon, Camera, Tag, Truck, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useDistributorProductModals } from "../../../lib/zustand/distributorProductStore";
import {
  useCreateDistributorProduct,
  useUpdateDistributorProduct,
  useCreateDistributor,
} from "../../../hooks/useDistributorProducts";
import { useJenisDropdown, useTypesDropdown, useBahansDropdown, useDistributorsDropdown } from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

// --- Code Generation Helpers (mirror backend) ---
const extractJenisKode = (text) => { if (!text) return ""; const c = text.trim().toUpperCase(); return c.length < 2 ? c : c.charAt(0) + c.charAt(c.length - 1); };
const extractTypeKode = (text) => { if (!text) return ""; const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase(); const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); const huruf = words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join(""); const numbers = text.match(/\d+/g) || []; const angka = numbers.length >= 2 ? numbers[0] + numbers[1] : (numbers[0] || ""); return (huruf + angka).toUpperCase(); };
const extractBahanKode = (text) => { if (!text) return ""; const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase(); const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w)); return words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join(""); };
const extractUkuranKode = (text) => { if (!text) return ""; const matches = text.match(/\d+[.,]?\d*/g); return matches ? matches.map((n) => n.replace(/[.,]/g, "")).join("") : ""; };
const generateDistributorPrefix = (nama, noHp) => { if (!nama) return ""; const initial = nama.trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase()).join(""); const hpAngka = (noHp || "").replace(/\D/g, ""); return initial + hpAngka.slice(-4); };

const getKodePreview = (jenisNama, typeNama, bahanNama, ukuran, distributorNama, distributorHp) => {
  const baseKode = (extractJenisKode(jenisNama) + extractTypeKode(typeNama) + extractBahanKode(bahanNama) + extractUkuranKode(ukuran)).toUpperCase();
  const prefix = generateDistributorPrefix(distributorNama, distributorHp);
  return prefix ? `${prefix}-${baseKode}` : baseKode || "—";
};

const formatRupiahDisplay = (value) => { if (!value && value !== 0) return ""; return new Intl.NumberFormat("id-ID").format(value); };
const unformatRupiah = (str) => parseInt(String(str || "").replace(/\D/g, ""), 10) || 0;

// --- Searchable Distributor Dropdown ---
const SearchableDistributorDropdown = ({ distributors, selectedValue, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = distributors.filter((d) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return d.label?.toLowerCase().includes(s);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { setIsOpen(false); setSearch(""); }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => { if (isOpen && inputRef.current && !disabled) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen, disabled]);

  const selected = distributors.find((d) => String(d.value) === String(selectedValue));

  if (disabled) {
    return <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">{selected ? selected.label : "Pilih Distributor..."}</div>;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm">
        <span className="truncate">{selected ? selected.label : "Pilih Distributor..."}</span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 ml-2" /> : <ChevronDown size={16} className="text-slate-400 ml-2" />}
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input ref={inputRef} type="text" placeholder="Cari distributor..." className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200" value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} />
              {search && <button type="button" onClick={(e) => { e.stopPropagation(); setSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 max-h-40">
            {filtered.length === 0 ? <div className="p-3 text-sm text-slate-500 text-center">Tidak ditemukan</div> : (
              filtered.map((d) => (
                <button key={d.value} type="button" onClick={() => { onSelect(d.value); setIsOpen(false); setSearch(""); }} className={cn("w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between", String(d.value) === String(selectedValue) ? "bg-blue-100 text-blue-800" : "")}>
                  <span className="truncate">{d.label}</span>
                  {String(d.value) === String(selectedValue) && <CheckCircle size={14} className="text-blue-600 ml-2" />}
                </button>
              ))
            )}
          </div>
          {onCreateNew && (
            <button type="button" onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }} className="p-2 border-t border-slate-100 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 font-medium">
              <Truck size={14} /> Tambah Distributor Baru
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Import ChevronUp/ChevronDown/Search/X/CheckCircle untuk dropdown
import { ChevronUp, ChevronDown, Search as SearchIcon } from "lucide-react";

// --- Main Form Component ---
const DistributorProductForm = () => {
  const { modals, selectedItem, closeAllModals } = useDistributorProductModals();
  const createMutation = useCreateDistributorProduct();
  const updateMutation = useUpdateDistributorProduct();
  const createDistributorMutation = useCreateDistributor();
  const { success, info } = useConfirmDialog();

  const { data: jenisOptions = [], isLoading: loadingJenis } = useJenisDropdown();
  const { data: bahansOptions = [], isLoading: loadingBahans } = useBahansDropdown();
  const { data: distributorsData = [] } = useDistributorsDropdown();

  const [form, setForm] = useState({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", distributor_id: "", harga_beli: "", harga_umum: "" });
  const [newInputs, setNewInputs] = useState({ jenis: "", type: "", bahan: "" });
  const [fotos, setFotos] = useState({ depan: null, samping: null, atas: null });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ✅ FIX: Flag untuk mencegah auto-reset type sebelum form terinisialisasi
  const [isInitialized, setIsInitialized] = useState(false);

  const [isCreatingNewDistributor, setIsCreatingNewDistributor] = useState(false);
  const [newDistForm, setNewDistForm] = useState({ nama: "", no_hp: "" });

  const isEdit = modals.edit && selectedItem;
  const isCreate = modals.create;
  const isOpen = isEdit || isCreate;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || createDistributorMutation.isPending;

  const fileRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };
  const camRefs = { depan: useRef(null), samping: useRef(null), atas: useRef(null) };

  const isNewJenis = form.jenis_id === "new";
  const isNewType = form.type_id === "new";
  const isNewBahan = form.bahan_id === "new";

  // ✅ FIX: Types dropdown reactive terhadap jenis_id
  const activeJenisId = isNewJenis ? null : (form.jenis_id || null);
  const { data: typesOptions = [], isLoading: loadingTypes } = useTypesDropdown(activeJenisId);

  // ✅ FIX: Reset form saat modal open/close + set initialized flag
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
      return;
    }

    if (isEdit && selectedItem) {
      setForm({
        jenis_id: String(selectedItem.jenis_id || ""),
        type_id: String(selectedItem.type_id || ""),
        bahan_id: String(selectedItem.bahan_id || ""),
        ukuran: selectedItem.ukuran || "",
        keterangan: selectedItem.keterangan || "",
        distributor_id: String(selectedItem.distributor_id || ""),
        harga_beli: String(selectedItem.harga_beli || ""),
        harga_umum: String(selectedItem.harga_umum || ""),
      });
      setFotos({
        depan: selectedItem.foto_depan_url || (selectedItem.foto_depan ? `${ASSET_URL}/storage/${selectedItem.foto_depan}` : null),
        samping: selectedItem.foto_samping_url || (selectedItem.foto_samping ? `${ASSET_URL}/storage/${selectedItem.foto_samping}` : null),
        atas: selectedItem.foto_atas_url || (selectedItem.foto_atas ? `${ASSET_URL}/storage/${selectedItem.foto_atas}` : null),
      });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({});
      setTouched({});
      // ✅ Tunda initialized agar types hinna selesai dimuat sebelum auto-reset berjalan
      setIsInitialized(false);
    } else if (isCreate) {
      setForm({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", distributor_id: "", harga_beli: "", harga_umum: "" });
      setFotos({ depan: null, samping: null, atas: null });
      setNewInputs({ jenis: "", type: "", bahan: "" });
      setErrors({});
      setTouched({});
      setIsInitialized(true);
    }
  }, [isEdit, isCreate, selectedItem, modals.edit, modals.create]);

  // ✅ FIX: Set initialized setelah types selesai dimuat saat edit mode
  useEffect(() => {
    if (isEdit && !loadingTypes && !isInitialized) {
      setIsInitialized(true);
    }
  }, [isEdit, loadingTypes, isInitialized]);

  // ✅ FIX: Auto-reset type HANYA jika sudah initialized DAN types sudah loaded
  useEffect(() => {
    if (!isInitialized || loadingTypes) return;
    if (isNewJenis || isNewType) return;
    if (form.jenis_id && form.type_id) {
      const isValid = typesOptions.some((t) => String(t.value) === String(form.type_id));
      if (!isValid) {
        setForm((prev) => ({ ...prev, type_id: "" }));
      }
    }
  }, [form.jenis_id, form.type_id, typesOptions, loadingTypes, isInitialized, isNewJenis, isNewType]);

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
    let dNama = "", dHp = "";
    if (isCreatingNewDistributor) { dNama = newDistForm.nama; dHp = newDistForm.no_hp; }
    else if (form.distributor_id) { const dist = distributorsData.find((d) => String(d.value) === String(form.distributor_id)); dNama = dist?.label || ""; }
    return getKodePreview(jNama, tNama, bNama, form.ukuran, dNama, dHp);
  }, [form.jenis_id, form.type_id, form.bahan_id, form.ukuran, form.distributor_id, newInputs, isCreatingNewDistributor, newDistForm, jenisOptions, typesOptions, bahansOptions, distributorsData]);

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!form.distributor_id && !isCreatingNewDistributor) newErrors.distributor_id = "Distributor wajib dipilih";
    if (!form.jenis_id) newErrors.jenis_id = "Jenis wajib dipilih";
    else if (isNewJenis && !newInputs.jenis.trim()) newErrors.jenis_id = "Nama jenis baru wajib diisi";
    if (!form.ukuran?.trim()) newErrors.ukuran = "Ukuran wajib diisi";
    const rawBeli = unformatRupiah(form.harga_beli);
    if (!rawBeli || rawBeli < 0) newErrors.harga_beli = "Harga beli wajib diisi";
    const rawUmum = unformatRupiah(form.harga_umum);
    if (!rawUmum || rawUmum < 0) newErrors.harga_umum = "Harga jual wajib diisi";
    if (isCreatingNewDistributor && !newDistForm.nama.trim()) newErrors.new_distributor = "Nama distributor baru wajib diisi";

    if (!isNewJenis) {
      if (!form.type_id) newErrors.type_id = "Tipe wajib dipilih";
      else if (isNewType && !newInputs.type.trim()) newErrors.type_id = "Nama tipe baru wajib diisi";
    } else {
      if (!newInputs.type.trim()) newErrors.type_id = "Nama tipe baru wajib diisi saat membuat jenis baru";
    }

    if (isNewBahan && !newInputs.bahan.trim()) newErrors.bahan_id = "Nama bahan baru wajib diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { info("Error", "Ukuran file maksimal 5MB"); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) { info("Error", "Hanya JPG/PNG/WebP"); return; }
    setFotos((prev) => ({ ...prev, [field]: file }));
  };

  const handleCreateNewDistributor = async () => {
    if (!newDistForm.nama.trim()) { setErrors((prev) => ({ ...prev, new_distributor: "Nama distributor baru wajib diisi" })); return; }
    try {
      const result = await createDistributorMutation.mutateAsync({ nama: newDistForm.nama.trim(), no_hp: newDistForm.no_hp?.trim() || "" });
      const newId = result.data?.data?.id || result.data?.id;
      setForm((prev) => ({ ...prev, distributor_id: String(newId) }));
      setIsCreatingNewDistributor(false);
      setNewDistForm({ nama: "", no_hp: "" });
      setErrors((prev) => ({ ...prev, new_distributor: undefined, distributor_id: undefined }));
      await success("Berhasil!", "Distributor baru berhasil dibuat dan dipilih");
    } catch (err) {
      // Error handled in mutation
    }
  };

  // ✅ FIX: Urutan benar → mutateAsync → success → closeAllModals
  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ distributor_id: true, jenis_id: true, ukuran: true, harga_beli: true, harga_umum: true, type_id: true, bahan_id: true });
    if (!validate()) return;

    const formData = new FormData();
    formData.append("ukuran", form.ukuran.trim());
    formData.append("distributor_id", form.distributor_id);
    formData.append("harga_beli", unformatRupiah(form.harga_beli));
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
        await updateMutation.mutateAsync({ id: selectedItem.id, formData });
        await success("Berhasil!", "Product distributor berhasil diperbarui");
        closeAllModals();
      } else {
        await createMutation.mutateAsync(formData);
        await success("Berhasil!", "Product distributor berhasil ditambahkan");
        closeAllModals();
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const serverErrors = {};
        Object.keys(err.response.data.errors).forEach((key) => { serverErrors[key] = err.response.data.errors[key][0]; });
        setErrors(serverErrors);
        return;
      }
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
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
            <div className={cn("p-2 rounded-lg", isEdit ? "bg-amber-100" : "bg-blue-100")}><Truck className={cn("w-5 h-5", isEdit ? "text-amber-600" : "text-blue-600")} /></div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Product Distributor" : "Tambah Product Distributor Baru"}</h2>
          </div>
          <button onClick={handleCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Kode Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Product <span className="text-slate-400 font-normal">(Auto-generated)</span></label>
            <div className={cn("w-full px-4 py-2.5 border rounded-lg font-mono font-semibold tracking-wider text-center transition-colors", kodePreview !== "—" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400")}>{kodePreview}</div>
          </div>

          {/* Distributor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Distributor <span className="text-red-500">*</span></label>
            <SearchableDistributorDropdown
              distributors={distributorsData}
              selectedValue={form.distributor_id}
              onSelect={(val) => { setIsCreatingNewDistributor(false); setForm((prev) => ({ ...prev, distributor_id: val })); setErrors((prev) => ({ ...prev, distributor_id: undefined })); }}
              onCreateNew={() => { setIsCreatingNewDistributor(true); setForm((prev) => ({ ...prev, distributor_id: "" })); }}
              disabled={isEdit}
            />
            {errors.distributor_id && touched.distributor_id && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.distributor_id}</p>}
            {isCreatingNewDistributor && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3 animate-fadeIn">
                <p className="text-xs font-medium text-blue-800 flex items-center gap-1"><Truck size={12} /> Buat Distributor Baru</p>
                <input type="text" placeholder="Nama Distributor *" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newDistForm.nama} onChange={(e) => setNewDistForm((p) => ({ ...p, nama: e.target.value }))} />
                <input type="tel" placeholder="Nomor HP" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newDistForm.no_hp} onChange={(e) => setNewDistForm((p) => ({ ...p, no_hp: e.target.value }))} />
                {errors.new_distributor && <p className="text-xs text-red-600">{errors.new_distributor}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={handleCreateNewDistributor} disabled={createDistributorMutation.isPending} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-50">
                    {createDistributorMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : <><CheckCircle size={14} /> Simpan & Pilih</>}
                  </button>
                  <button type="button" onClick={() => { setIsCreatingNewDistributor(false); setNewDistForm({ nama: "", no_hp: "" }); setErrors((prev) => ({ ...prev, new_distributor: undefined })); }} className="px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition">Batal</button>
                </div>
              </div>
            )}
          </div>

          {/* Harga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Harga Beli" required error={errors.harga_beli} touched={touched.harga_beli}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
                <input type="text" inputMode="numeric" value={formatRupiahDisplay(form.harga_beli)} onChange={(e) => setForm((p) => ({ ...p, harga_beli: String(unformatRupiah(e.target.value)) }))} className={cn("w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium", errors.harga_beli && touched.harga_beli ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")} placeholder="0" disabled={isSubmitting} />
              </div>
            </FormField>
            <FormField label="Harga Jual" required error={errors.harga_umum} touched={touched.harga_umum}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">Rp</span>
                <input type="text" inputMode="numeric" value={formatRupiahDisplay(form.harga_umum)} onChange={(e) => setForm((p) => ({ ...p, harga_umum: String(unformatRupiah(e.target.value)) }))} className={cn("w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium", errors.harga_umum && touched.harga_umum ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")} placeholder="0" disabled={isSubmitting} />
              </div>
            </FormField>
          </div>

          {/* Master Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JENIS */}
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

            {/* TYPE - ✅ FIX: Sama persis dengan ProductForm */}
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
                    <option value="">{loadingTypes ? "Memuat..." : (form.jenis_id ? `Pilih Tipe (${typesOptions.length} tersedia)` : "Pilih Jenis dulu")}</option>
                    {typesOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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

            {/* BAHAN */}
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

            {/* UKURAN */}
            <FormField label="Ukuran" required error={errors.ukuran} touched={touched.ukuran}>
              <input type="text" value={form.ukuran} onChange={(e) => setForm((p) => ({ ...p, ukuran: e.target.value }))}
                onBlur={() => setTouched((p) => ({ ...p, ukuran: true }))}
                className={cn("w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm", errors.ukuran && touched.ukuran ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500")}
                placeholder="Contoh: 10x20" disabled={isSubmitting} />
            </FormField>
          </div>

          {/* Foto */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto Product</label>
            <div className="grid grid-cols-3 gap-4">
              {renderFotoInput("Depan", "depan")}
              {renderFotoInput("Samping", "samping")}
              {renderFotoInput("Atas", "atas")}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows={2} placeholder="Opsional" disabled={isSubmitting} />
          </div>

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

export default DistributorProductForm;