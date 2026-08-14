import { useState, useEffect } from "react";
import { X, Tag, User, Globe, Calendar, FileText } from "lucide-react";
import { useHargaProductStore } from "../../../lib/zustand/hargaProductStore";
import { useCreateHargaProduct, useUpdateHargaProduct, useProducts, useCustomers } from "../../../hooks/useHargaProducts";

const formatRupiah = (value) => {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

const unformatRupiah = (value) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

const formatProductName = (p) => {
  if (!p) return "";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? `${p.kode} - ${parts.join(" ")}` : p.kode;
};

const HargaProductForm = () => {
  const { isFormOpen, selectedHarga, closeModals } = useHargaProductStore();
  const createMutation = useCreateHargaProduct();
  const updateMutation = useUpdateHargaProduct();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();

  const [form, setForm] = useState({ product_id: "", customer_id: "", harga: "", tanggal_berlaku: "", keterangan: "" });
  const [error, setError] = useState("");

  const isEdit = !!selectedHarga;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isFormOpen) {
      if (isEdit) {
        setForm({
          product_id: String(selectedHarga.product_id),
          customer_id: selectedHarga.customer_id ? String(selectedHarga.customer_id) : "",
          harga: String(selectedHarga.harga),
          tanggal_berlaku: selectedHarga.tanggal_berlaku ? selectedHarga.tanggal_berlaku.split('T')[0] : "",
          keterangan: selectedHarga.keterangan || "",
        });
      } else {
        setForm({ product_id: "", customer_id: "", harga: "", tanggal_berlaku: "", keterangan: "" });
      }
      setError("");
    }
  }, [isFormOpen, isEdit, selectedHarga]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawHarga = unformatRupiah(form.harga);
    
    if (!form.product_id) {
      setError("Product wajib dipilih");
      return;
    }
    if (!rawHarga || Number(rawHarga) < 1) {
      setError("Harga wajib diisi dan harus lebih dari 0");
      return;
    }

    const payload = {
      product_id: parseInt(form.product_id, 10),
      customer_id: form.customer_id ? parseInt(form.customer_id, 10) : null,
      harga: Number(rawHarga),
      tanggal_berlaku: form.tanggal_berlaku || null,
      keterangan: form.keterangan.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: selectedHarga.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeModals();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10 ${isEdit ? 'bg-gradient-to-r from-amber-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isEdit ? 'bg-amber-100' : 'bg-blue-100'}`}>
              <Tag className={`w-5 h-5 ${isEdit ? 'text-amber-600' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{isEdit ? "Edit Harga Product" : "Tambah Harga Product Baru"}</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Product <span className="text-red-500">*</span></label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.product_id}
                onChange={(e) => { setForm({ ...form, product_id: e.target.value }); if(error) setError(""); }}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                disabled={isSubmitting}
                required
              >
                <option value="">Pilih Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{formatProductName(p)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Customer <span className="text-slate-400 font-normal">(Kosongkan untuk Harga Umum)</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white appearance-none"
                disabled={isSubmitting}
              >
                <option value="">Harga Umum (Semua Customer)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga (Rp) <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiah(unformatRupiah(form.harga))}
                onChange={(e) => {
                  const raw = unformatRupiah(e.target.value);
                  setForm({ ...form, harga: raw });
                  if (error) setError("");
                }}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-sm font-medium ${error ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"}`}
                placeholder="0"
                disabled={isSubmitting}
                required
              />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          {/* Tanggal Berlaku */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tanggal Berlaku</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={form.tanggal_berlaku}
                onChange={(e) => setForm({ ...form, tanggal_berlaku: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                rows="2"
                placeholder="Opsional"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Actions */}
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

export default HargaProductForm;