import { X, Tag, Truck, Warehouse, Calendar } from "lucide-react";
import { useDistributorProductStore } from "../../../lib/zustand/distributorProductStore";

const formatRupiah = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);
const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : p.kode;
};

const DistributorProductDetail = () => {
  const { isDetailOpen, selectedItem, closeModals, openEditModal } = useDistributorProductStore();

  if (!isDetailOpen || !selectedItem) return null;

  const handleEdit = () => {
    closeModals();
    setTimeout(() => openEditModal(selectedItem), 150);
  };

  const totalQty = (Number(selectedItem.qty_toko) || 0) + (Number(selectedItem.qty_bengkel) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Truck className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-lg font-semibold text-slate-900">Detail Product Distributor</h2>
          </div>
          <button onClick={closeModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-900">{selectedItem.kode}</h3>
            <p className="text-sm text-slate-500 mt-1">{formatProductName(selectedItem)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <p className="text-xs text-blue-600 font-medium mb-1">Harga Beli</p>
              <p className="text-lg font-bold text-blue-700">{formatRupiah(selectedItem.harga_beli)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium mb-1">Harga Jual</p>
              <p className="text-lg font-bold text-emerald-700">{formatRupiah(selectedItem.harga_umum)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0"><Truck className="w-4 h-4 text-purple-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Distributor</p>
                <p className="text-sm font-medium text-slate-900 truncate">{selectedItem.distributor?.nama || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                <Warehouse className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-xs text-slate-500">Toko</p>
                <p className="text-sm font-bold text-slate-900">{selectedItem.qty_toko || 0}</p>
              </div>
              <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                <Warehouse className="w-4 h-4 text-slate-500 mb-1" />
                <p className="text-xs text-slate-500">Bengkel</p>
                <p className="text-sm font-bold text-slate-900">{selectedItem.qty_bengkel || 0}</p>
              </div>
              <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Warehouse className="w-4 h-4 text-blue-500 mb-1" />
                <p className="text-xs text-blue-600">Total</p>
                <p className="text-sm font-bold text-blue-700">{totalQty}</p>
              </div>
            </div>

            {selectedItem.keterangan && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5"><Calendar className="w-4 h-4 text-amber-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Keterangan</p>
                  <p className="text-sm font-medium text-slate-900">{selectedItem.keterangan}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={closeModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Tutup</button>
            <button onClick={handleEdit} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Truck className="w-4 h-4" /> Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorProductDetail;