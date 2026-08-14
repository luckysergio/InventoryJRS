import { useState, useEffect, useRef, useMemo } from "react";
import { X, Image as ImageIcon, Camera, Tag, Truck, CheckCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useDistributorProductStore } from "../../../lib/zustand/distributorProductStore";
import { 
  useCreateDistributorProduct, 
  useUpdateDistributorProduct, 
  useJenis, 
  useTypes, 
  useBahans, 
  useDistributors,
  useCreateDistributor // ✅ Sekarang ini akan berhasil di-import
} from "../../../hooks/useDistributorProducts";

// --- Utility Functions for Code Generation ---
const extractJenisKode = (text) => {
  if (!text) return "";
  const clean = text.trim().toUpperCase();
  return clean.length < 2 ? clean : clean.charAt(0) + clean.charAt(clean.length - 1);
};

const extractTypeKode = (text) => {
  if (!text) return "";
  const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  const huruf = words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join("");
  const numbers = text.match(/\d+/g) || [];
  const angka = numbers.length >= 2 ? numbers[0] + numbers[1] : (numbers[0] || "");
  return (huruf + angka).toUpperCase();
};

const extractBahanKode = (text) => {
  if (!text) return "";
  const clean = text.replace(/\(.+?\)/g, "").trim().toUpperCase();
  const words = clean.split(/\s+/).filter((w) => /^[A-Z]/.test(w));
  return words.length === 1 ? words[0].slice(0, 2) : words.map((w) => w.charAt(0)).join("");
};

const extractUkuranKode = (text) => {
  if (!text) return "";
  const matches = text.match(/\d+[.,]?\d*/g);
  return matches ? matches.map((n) => n.replace(/[.,]/g, "")).join("") : "";
};

const generateDistributorPrefix = (nama, noHp) => {
  if (!nama) return "";
  const initial = nama.trim().split(/\s+/).map((word) => word.charAt(0).toUpperCase()).join("");
  const hpAngka = (noHp || "").replace(/\D/g, "");
  return initial + hpAngka.slice(-4);
};

const getKodePreview = (jenisNama, typeNama, bahanNama, ukuran, distributorNama, distributorHp) => {
  const jKode = extractJenisKode(jenisNama);
  const tKode = extractTypeKode(typeNama);
  const bKode = extractBahanKode(bahanNama);
  const uKode = extractUkuranKode(ukuran);
  const baseKode = (jKode + tKode + bKode + uKode).toUpperCase();
  const distPrefix = generateDistributorPrefix(distributorNama, distributorHp);
  return distPrefix ? `${distPrefix}-${baseKode}` : baseKode;
};

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const unformatRupiah = (str) => parseInt(String(str || "").replace(/\D/g, ""), 10) || 0;

// --- Searchable Distributor Dropdown Component ---
const SearchableDistributorDropdown = ({ distributors, selectedValue, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = distributors.filter((d) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return d.nama?.toLowerCase().includes(s) || d.no_hp?.toLowerCase().includes(s);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current && !disabled) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, disabled]);

  const selected = distributors.find((d) => String(d.id) === String(selectedValue));

  if (disabled) {
    return (
      <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
        {selected ? `${selected.nama} - ${selected.no_hp}` : "Pilih Distributor..."}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
      >
        <span className="truncate">{selected ? `${selected.nama} - ${selected.no_hp}` : "Pilih Distributor..."}</span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 ml-2" /> : <ChevronDown size={16} className="text-slate-400 ml-2" />}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Cari nama atau no_hp..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setSearch(""); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 max-h-40">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500 text-center">Tidak ditemukan</div>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { onSelect(d.id); setIsOpen(false); setSearch(""); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${String(d.id) === String(selectedValue) ? "bg-blue-100 text-blue-800" : ""}`}
                >
                  <span className="truncate">{d.nama} <span className="text-slate-400">- {d.no_hp}</span></span>
                  {String(d.id) === String(selectedValue) && <CheckCircle size={14} className="text-blue-600 ml-2" />}
                </button>
              ))
            )}
          </div>

          {onCreateNew && (
            <button
              type="button"
              onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }}
              className="p-2 border-t border-slate-100 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1 font-medium"
            >
              <Truck size={14} /> Tambah Distributor Baru
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Form Component ---
const DistributorProductForm = () => {
  const { isFormOpen, selectedItem, closeModals } = useDistributorProductStore();
  const createMutation = useCreateDistributorProduct();
  const updateMutation = useUpdateDistributorProduct();
  const createDistributorMutation = useCreateDistributor(); // ✅ Sekarang ini valid
  
  const { data: jenisData = [] } = useJenis();
  const { data: typesData = [] } = useTypes();
  const { data: bahansData = [] } = useBahans();
  const { data: distributorsData = [] } = useDistributors();

  const [form, setForm] = useState({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", distributor_id: "", harga_beli: "", harga_umum: "" });
  const [jenisInputBaru, setJenisInputBaru] = useState("");
  const [typeInputBaru, setTypeInputBaru] = useState("");
  const [bahanInputBaru, setBahanInputBaru] = useState("");
  
  const [fotoDepan, setFotoDepan] = useState(null);
  const [fotoSamping, setFotoSamping] = useState(null);
  const [fotoAtas, setFotoAtas] = useState(null);

  const [isCreatingNewDistributor, setIsCreatingNewDistributor] = useState(false);
  const [newDistributorForm, setNewDistributorForm] = useState({ nama: "", no_hp: "", alamat: "" });

  const isEdit = !!selectedItem;
  const isSubmitting = createMutation.isPending || updateMutation.isPending || createDistributorMutation.isPending;

  const fileDepan = useRef(null); const camDepan = useRef(null);
  const fileSamping = useRef(null); const camSamping = useRef(null);
  const fileAtas = useRef(null); const camAtas = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit && selectedItem) {
        setForm({
          jenis_id: String(selectedItem.jenis_id || ""),
          type_id: String(selectedItem.type_id || ""),
          bahan_id: String(selectedItem.bahan_id || ""),
          ukuran: selectedItem.ukuran || "",
          keterangan: selectedItem.keterangan || "",
          distributor_id: String(selectedItem.distributor_id || ""),
          harga_beli: formatRupiah(selectedItem.harga_beli),
          harga_umum: formatRupiah(selectedItem.harga_umum),
        });
        setFotoDepan(selectedItem.foto_depan ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedItem.foto_depan}` : null);
        setFotoSamping(selectedItem.foto_samping ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedItem.foto_samping}` : null);
        setFotoAtas(selectedItem.foto_atas ? `${import.meta.env.VITE_ASSET_URL}/storage/${selectedItem.foto_atas}` : null);
      } else {
        setForm({ jenis_id: "", type_id: "", bahan_id: "", ukuran: "", keterangan: "", distributor_id: "", harga_beli: "", harga_umum: "" });
        setFotoDepan(null); setFotoSamping(null); setFotoAtas(null);
      }
      setJenisInputBaru(""); setTypeInputBaru(""); setBahanInputBaru("");
      setIsCreatingNewDistributor(false);
      setNewDistributorForm({ nama: "", no_hp: "", alamat: "" });
    }
  }, [isFormOpen, isEdit, selectedItem]);

  const filteredTypes = useMemo(() => {
    if (!form.jenis_id || form.jenis_id === "new") return [];
    return typesData.filter((t) => String(t.jenis_id) === String(form.jenis_id));
  }, [form.jenis_id, typesData]);

  const getKodePreviewValue = () => {
    const jNama = form.jenis_id === "new" ? jenisInputBaru : jenisData.find((j) => String(j.id) === String(form.jenis_id))?.nama || "";
    const tNama = form.type_id === "new" ? typeInputBaru : typesData.find((t) => String(t.id) === String(form.type_id))?.nama || "";
    const bNama = form.bahan_id === "new" ? bahanInputBaru : bahansData.find((b) => String(b.id) === String(form.bahan_id))?.nama || "";
    
    let dNama = "", dHp = "";
    if (isCreatingNewDistributor) {
      dNama = newDistributorForm.nama;
      dHp = newDistributorForm.no_hp;
    } else if (form.distributor_id) {
      const dist = distributorsData.find((d) => String(d.id) === String(form.distributor_id));
      dNama = dist?.nama || "";
      dHp = dist?.no_hp || "";
    }

    return getKodePreview(jNama, tNama, bNama, form.ukuran, dNama, dHp) || "—";
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Ukuran file maksimal 5MB");
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return alert("Hanya file JPG/PNG yang diizinkan");
      setFile(file);
    }
  };

  const handleCreateNewDistributor = async () => {
    if (!newDistributorForm.nama.trim()) return alert("Nama distributor wajib diisi");
    try {
      const newDist = await createDistributorMutation.mutateAsync({
        nama: newDistributorForm.nama.trim(),
        no_hp: newDistributorForm.no_hp?.trim() || "",
        alamat: newDistributorForm.alamat?.trim() || "",
      });
      setForm({ ...form, distributor_id: String(newDist.id) });
      setIsCreatingNewDistributor(false);
      setNewDistributorForm({ nama: "", no_hp: "", alamat: "" });
    } catch (err) {
      // Error handled in mutation
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const kode = getKodePreviewValue();
    if (!form.ukuran || !form.distributor_id || kode === "—") {
      return alert("Kode, Ukuran, dan Distributor wajib diisi");
    }

    const formData = new FormData();
    formData.append("ukuran", form.ukuran);
    formData.append("distributor_id", form.distributor_id);
    formData.append("harga_beli", unformatRupiah(form.harga_beli));
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
        await updateMutation.mutateAsync({ id: selectedItem.id, formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      closeModals();
    } catch (err) {
      // Error handled in mutation
    }
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
              <Truck className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Product Distributor" : "Tambah Product Distributor Baru"}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kode Product <span className="text-slate-400 font-normal">(Auto-generated)</span></label>
            <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono font-semibold tracking-wider text-center">
              {getKodePreviewValue()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Distributor <span className="text-red-500">*</span></label>
            <SearchableDistributorDropdown
              distributors={distributorsData}
              selectedValue={form.distributor_id}
              onSelect={(val) => { setIsCreatingNewDistributor(false); setForm({ ...form, distributor_id: val }); }}
              onCreateNew={() => { setIsCreatingNewDistributor(true); setForm({ ...form, distributor_id: "" }); }}
              disabled={isEdit}
            />
            {isCreatingNewDistributor && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3 animate-fadeIn">
                <p className="text-xs font-medium text-blue-800 flex items-center gap-1"><Truck size={12} /> Buat Distributor Baru</p>
                <input type="text" placeholder="Nama Distributor *" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newDistributorForm.nama} onChange={(e) => setNewDistributorForm({ ...newDistributorForm, nama: e.target.value })} required />
                <input type="tel" placeholder="Nomor HP (opsional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" value={newDistributorForm.no_hp} onChange={(e) => setNewDistributorForm({ ...newDistributorForm, no_hp: e.target.value })} />
                <div className="flex gap-2">
                  <button type="button" onClick={handleCreateNewDistributor} disabled={createDistributorMutation.isPending} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1 disabled:opacity-50">
                    {createDistributorMutation.isPending ? "Menyimpan..." : <><CheckCircle size={14} /> Simpan & Pilih</>}
                  </button>
                  <button type="button" onClick={() => { setIsCreatingNewDistributor(false); setNewDistributorForm({ nama: "", no_hp: "", alamat: "" }); }} className="px-3 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition">Batal</button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga Beli <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">Rp</span>
                <input type="text" inputMode="numeric" value={form.harga_beli} onChange={(e) => setForm({ ...form, harga_beli: formatRupiah(unformatRupiah(e.target.value)) })} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="0" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga Jual <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">Rp</span>
                <input type="text" inputMode="numeric" value={form.harga_umum} onChange={(e) => setForm({ ...form, harga_umum: formatRupiah(unformatRupiah(e.target.value)) })} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" placeholder="0" required />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Jenis <span className="text-red-500">*</span></label>
              <select value={form.jenis_id} onChange={(e) => { setForm({ ...form, jenis_id: e.target.value, type_id: "" }); if(e.target.value !== "new") setJenisInputBaru(""); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white" required>
                <option value="">Pilih Jenis</option>
                {jenisData.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                <option value="new">➕ Tambah Jenis Baru</option>
              </select>
              {form.jenis_id === "new" && <input type="text" placeholder="Nama jenis baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={jenisInputBaru} onChange={(e) => setJenisInputBaru(e.target.value.toUpperCase())} required />}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipe</label>
              <select value={form.type_id} onChange={(e) => { setForm({ ...form, type_id: e.target.value }); if(e.target.value !== "new") setTypeInputBaru(""); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400" disabled={!form.jenis_id || form.jenis_id === "new"}>
                <option value="">Pilih Tipe</option>
                {filteredTypes.map((t) => <option key={t.id} value={t.id}>{t.nama}</option>)}
                <option value="new">➕ Tambah Tipe Baru</option>
              </select>
              {form.type_id === "new" && <input type="text" placeholder="Nama tipe baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={typeInputBaru} onChange={(e) => setTypeInputBaru(e.target.value.toUpperCase())} required />}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bahan</label>
              <select value={form.bahan_id} onChange={(e) => { setForm({ ...form, bahan_id: e.target.value }); if(e.target.value !== "new") setBahanInputBaru(""); }} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
                <option value="">Pilih Bahan</option>
                {bahansData.map((b) => <option key={b.id} value={b.id}>{b.nama}</option>)}
                <option value="new">➕ Tambah Bahan Baru</option>
              </select>
              {form.bahan_id === "new" && <input type="text" placeholder="Nama bahan baru (HURUF KAPITAL)" className="w-full mt-2 px-3 py-2.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium tracking-wide" value={bahanInputBaru} onChange={(e) => setBahanInputBaru(e.target.value.toUpperCase())} required />}
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

export default DistributorProductForm;