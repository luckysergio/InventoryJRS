import { X, Tag, Package, Warehouse, Calendar } from "lucide-react";
import { useProductStore } from "../../../lib/zustand/productStore";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : p.kode;
};

const ProductDetail = () => {
  const { isDetailOpen, selectedProduct, closeModals, openEditModal } = useProductStore();

  if (!isDetailOpen || !selectedProduct) return null;

  const handleEdit = () => {
    closeModals();
    setTimeout(() => openEditModal(selectedProduct), 150);
  };

  const qtyToko = Number(selectedProduct.qty_toko) || 0;
  const qtyBengkel = Number(selectedProduct.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-lg font-semibold text-slate-900">Detail Product</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Foto Grid */}
          <div className="flex justify-center gap-3">
            {[selectedProduct.foto_depan, selectedProduct.foto_samping, selectedProduct.foto_atas].filter(Boolean).map((foto, idx) => (
              <img key={idx} src={`${import.meta.env.VITE_ASSET_URL}/storage/${foto}`} alt="Foto" className="w-20 h-20 object-cover rounded-lg border border-slate-200 shadow-sm" />
            ))}
            {!selectedProduct.foto_depan && !selectedProduct.foto_samping && !selectedProduct.foto_atas && (
              <div className="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Package size={24} /></div>
            )}
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{selectedProduct.kode}</h3>
            <p className="text-sm text-slate-500 mt-1">{formatProductName(selectedProduct)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Harga Umum</p>
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(selectedProduct.harga_umum)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Stok</p>
              <p className="text-lg font-bold text-blue-700">{totalQty} Unit</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0"><Tag className="w-4 h-4 text-purple-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Spesifikasi</p>
                <p className="text-sm font-medium text-slate-900">{selectedProduct.jenis?.nama} {selectedProduct.type?.nama && `- ${selectedProduct.type.nama}`} {selectedProduct.bahan?.nama && `(${selectedProduct.bahan.nama})`} | {selectedProduct.ukuran}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0"><Warehouse className="w-4 h-4 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Stok Toko</p>
                  <p className="text-sm font-semibold text-slate-900">{qtyToko}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0"><Warehouse className="w-4 h-4 text-indigo-600" /></div>
                <div>
                  <p className="text-xs text-slate-500">Stok Bengkel</p>
                  <p className="text-sm font-semibold text-slate-900">{qtyBengkel}</p>
                </div>
              </div>
            </div>

            {selectedProduct.keterangan && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-slate-200 rounded-lg flex-shrink-0 mt-0.5"><Calendar className="w-4 h-4 text-slate-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Keterangan</p>
                  <p className="text-sm font-medium text-slate-900">{selectedProduct.keterangan}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={closeModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Tutup</button>
            <button onClick={handleEdit} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Package className="w-4 h-4" /> Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;