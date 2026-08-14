import { useState, useEffect, useRef, useMemo } from "react";
import { X, Image as ImageIcon, Camera, Tag, Package } from "lucide-react";
import { useProductStore } from "../../../lib/zustand/productStore";
import { useCreateProduct, useUpdateProduct, useJenis, useTypes, useBahans } from "../../../hooks/useProducts";

const jenisKode = (text) => {
  if (!text) return "";
  const clean = text.trim().toUpperCase();
  return clean.length < 2 ? clean : clean.charAt(0) + clean.charAt(clean.length - 1);
};

const typeKode = (text) => {
  if (!text) return "";
  const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  const huruf = words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join("");
  const numbers = text.match(/\d+/g) || [];
  const angka = numbers.length >= 2 ? numbers[0] + numbers[1] : (numbers[0] || "");
  return (huruf + angka).toUpperCase();
};

const bahanKode = (text) => {
  if (!text) return "";
  const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  return words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join("");
};

const ukuranKode = (text) => {
  if (!text) return "";
  const matches = text.match(/\d+[.,]?\d*/g);
  return matches ? matches.map((n) => n.replace(/[.,]/g, "")).join("") : "";
};

const generateKode = (jenisNama, typeNama, bahanNama, ukuran) => 
  (jenisKode(jenisNama) + typeKode(typeNama) + bahanKode(bahanNama) + ukuranKode(ukuran)).toUpperCase();

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const unformatRupiah = (str) => parseInt(String(str || "").replace(/\D/g, ""), 10) || 0;

const ProductForm = () => {
  const { isFormOpen, selectedProduct, closeModals } = useProductStore();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  
  const { data: jenisData, isLoading: loadingJenis } = useJenis();
  const { data: typesData, isLoading: loadingTypes } = useTypes();
  const { data: bahansData, isLoading: loadingBahans } = useBahans();

  const safeJenis = Array.isArray(jenisData) ? jenisData : [];
  const safeTypes = Array.isArray(typesData) ? typesData : [];
  const safeBahans = Array.isArray(bahansData) ? bahansData : [];

  const [form, setForm] = useState({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", harga_umum: "" });
  const [jenisInputBaru, setJenisInputBaru] = useState("");
  const [typeInputBaru, setTypeInputBaru] = useState("");
  const [bahanInputBaru, setBahanInputBaru] = useState("");
  
  const [fotoDepan, setFotoDepan] = useState(null);
  const [fotoSamping, setFotoSamping] = useState(null);
  const [fotoAtas, setFotoAtas] = useState(null);

  const isEdit = !!selectedProduct;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const fileDepan = useRef(null); const camDepan = useRef(null);
  const fileSamping = useRef(null); const camSamping = useRef(null);
  const fileAtas = useRef(null); const camAtas = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit && selectedProduct) {
        setForm({
          jenis_id: String(selectedProduct.jenis_id || ""),
          type_id: String(selectedProduct.type_id || ""),
          bahan_id: String(selectedProduct.bahan_id || ""),
          ukuran: selectedProduct.ukuran || "",
          keterangan: selectedProduct.keterangan || "",
          harga_umum: formatRupiah(selectedProduct.harga_umum),
        });
        setFotoDepan(selectedProduct.foto_depan ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedProduct.foto_depan}` : null);
        setFotoSamping(selectedProduct.foto_samping ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedProduct.foto_samping}` : null);
        setFotoAtas(selectedProduct.foto_atas ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedProduct.foto_atas}` : null);
      } else {
        setForm({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", harga_umum: "" });
        setFotoDepan(null); setFotoSamping(null); setFotoAtas(null);
      }
      setJenisInputBaru(""); setTypeInputBaru(""); setBahanInputBaru("");
    }
  }, [isFormOpen, isEdit, selectedProduct]);

  const filteredTypes = useMemo(() => {
    if (!form.jenis_id || form.jenis_id === "new") return [];
    return safeTypes.filter((t) => String(t.jenis_id) === String(form.jenis_id));
  }, [form.jenis_id, safeTypes]);

  const isTypeValidForJenis = useMemo(() => {
    if (!form.type_id || form.type_id === "new") return true;
    return filteredTypes.some((t) => String(t.id) === String(form.type_id));
  }, [form.type_id, filteredTypes]);

  useEffect(() => {
    if (form.jenis_id && form.jenis_id !== "new" && form.type_id && form.type_id !== "new") {
      if (!isTypeValidForJenis) {
        setForm((prev) => ({ ...prev, type_id: "" }));
      }
    }
  }, [form.jenis_id, form.type_id, isTypeValidForJenis]);

  const getKodePreview = () => {
    const jNama = form.jenis_id === "new" ? jenisInputBaru : safeJenis.find((j) => String(j.id) === String(form.jenis_id))?.nama || "";
    const tNama = form.type_id === "new" ? typeInputBaru : safeTypes.find((t) => String(t.id) === String(form.type_id))?.nama || "";
    const bNama = form.bahan_id === "new" ? bahanInputBaru : safeBahans.find((b) => String(b.id) === String(form.bahan_id))?.nama || "";
    return generateKode(jNama, tNama, bNama, form.ukuran) || "—";
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Ukuran file maksimal 5MB");
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return alert("Hanya file JPG/PNG yang diizinkan");
      setFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const kode = getKodePreview();
    if (!form.ukuran || kode === "—") return alert("Ukuran wajib diisi untuk generate kode");

    const formData = new FormData();
    formData.append("ukuran", form.ukuran);
    formData.append("harga_umum", unformatRupiah(form.harga_umum));
    if (form.keterangan) formData.append("keterangan", form.keterangan);

    if (form.jenis_id === "new") formData.append("jenis_nama", jenisInputBaru.trim());
    else if (form.jenis_id) formData.append("jenis_id", form.jenis_id);

    if (form.type_id === "new") formData.append("type_nama", typeInputBaru.trim());
    else if (form.type_id) formData.append("type_id", form.type_id);

    if (form.bahan_id === "new") formData.append("bahan_nama", bahanInputBaru.trim());
    else if (form.bahan_id) formData.append("bahan_id", form.bahan_id);

    if (fotoDepan instanceof File) formData.append("foto_depan", fotoDepan);
    if (fotoSamping instanceof File) formData.append("foto_samping", fotoSamping);
    if (fotoAtas instanceof File) formData.append("foto_atas", fotoAtas);

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedProduct.id, formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      closeModals();
    } catch (err) {
      // Error sudah dihandle di mutation hook
    }
  };

  const handleJenisChange = (e) => {
    const val = e.target.value;
    if (val === "new") {
      setForm(prev => ({ ...prev, jenis_id: "new", type_id: "new" }));
      setJenisInputBaru("");
      setTypeInputBaru("");
    } else {
      setForm(prev => ({ ...prev, jenis_id: val, type_id: "" }));
      setJenisInputBaru("");
      setTypeInputBaru("");
    }
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, type_id: val }));
    if (val !== "new") setTypeInputBaru("");
  };

  const handleBahanChange = (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, bahan_id: val }));
    if (val !== "new") setBahanInputBaru("");
  };

  const renderFotoInput = (label, foto, setFoto, fileRef, camRef) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600 text-center">{label}</label>
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative">
          {foto ? (
            <img src={foto instanceof File ? URL.createObjectURL(foto) : foto} alt={label} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
          ) : (
            <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
              <ImageIcon size={20} className="text-slate-400" />
            </div>
          )}
          {foto && (
            <button type="button" onClick={() => setFoto(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition">×</button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">Galeri</button>
          <button type="button" onClick={() => camRef.current?.click()} className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition flex items-center gap-1"><Camera size={10} /> Kamera</button>
        </div>
      </div>
      <input type="file" ref={fileRef} accept="image/*" onChange={(e) => handleFileChange(e, setFoto)} className="hidden" />
      <input type="file" ref={camRef} accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, setFoto)} className="hidden" />
    </div>
  );

  if (!isFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 ${isEdit ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <Package className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Product" : "Tambah Product Baru"}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Product <span className="text-slate-400 font-normal">(Auto-generated)</span></label>
            <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono font-semibold tracking-wider text-center">
              {getKodePreview()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga Umum <span className="text-red-500">*</span></label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" inputMode="numeric" value={form.harga_umum} onChange={(e) => setForm({ ...form, harga_umum: formatRupiah(unformatRupiah(e.target.value)) })} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="Rp0" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis <span className="text-red-500">*</span></label>
              <select value={form.jenis_id} onChange={handleJenisChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" required disabled={loadingJenis}>
                <option value="">{loadingJenis ? "Memuat..." : "Pilih Jenis"}</option>
                {safeJenis.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                <option value="new">➕ Tambah Jenis Baru</option>
              </select>
              {form.jenis_id === "new" && (
                <input type="text" placeholder="Nama jenis baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={jenisInputBaru} onChange={(e) => setJenisInputBaru(e.target.value.toUpperCase())} required />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tipe {form.jenis_id === "new" ? "Baru" : ""} <span className="text-red-500">*</span>
              </label>
              {form.jenis_id === "new" ? (
                <div className="space-y-2">
                  <input 
                    type="text"
                    placeholder="Nama tipe baru (HURUF KAPITAL)"
                    className="w-full px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide"
                    value={typeInputBaru}
                    onChange={(e) => setTypeInputBaru(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <span>💡</span> Tipe ini akan otomatis dibuat dan dihubungkan dengan Jenis baru.
                  </p>
                </div>
              ) : (
                <>
                  <select 
                    value={form.type_id} 
                    onChange={handleTypeChange} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400" 
                    disabled={!form.jenis_id || loadingTypes}
                  >
                    <option value="">
                      {loadingTypes ? "Memuat..." : (form.jenis_id ? `Pilih Tipe (${filteredTypes.length} tersedia)` : "Pilih Jenis dulu")}
                    </option>
                    {filteredTypes.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
                    <option value="new">➕ Tambah Tipe Baru</option>
                  </select>
                  {form.type_id === "new" && (
                    <input 
                      type="text" 
                      placeholder="Nama tipe baru (HURUF KAPITAL)" 
                      className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" 
                      value={typeInputBaru} 
                      onChange={(e) => setTypeInputBaru(e.target.value.toUpperCase())} 
                      required 
                    />
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bahan</label>
              <select value={form.bahan_id} onChange={handleBahanChange} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" disabled={loadingBahans}>
                <option value="">{loadingBahans ? "Memuat..." : "Pilih Bahan"}</option>
                {safeBahans.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                <option value="new">➕ Tambah Bahan Baru</option>
              </select>
              {form.bahan_id === "new" && (
                <input type="text" placeholder="Nama bahan baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={bahanInputBaru} onChange={(e) => setBahanInputBaru(e.target.value.toUpperCase())} required />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Ukuran <span className="text-red-500">*</span></label>
              <input type="text" value={form.ukuran} onChange={(e) => setForm({ ...form, ukuran: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Contoh: 10x20" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Foto Product</label>
            <div className="grid grid-cols-3 gap-4">
              {renderFotoInput("Depan", fotoDepan, setFotoDepan, fileDepan, camDepan)}
              {renderFotoInput("Samping", fotoSamping, setFotoSamping, fileSamping, camSamping)}
              {renderFotoInput("Atas", fotoAtas, setFotoAtas, fileAtas, camAtas)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" rows="2" placeholder="Opsional" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={closeModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button type="submit" disabled={isSubmitting} className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 ${isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
              {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menyimpan...</>) : (isEdit ? "Perbarui" : "Simpan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;