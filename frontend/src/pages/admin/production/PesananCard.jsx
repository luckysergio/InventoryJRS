import { Package, User, Factory, Calendar } from 'lucide-react';

const formatProductName = (p) => {
  if (!p) return '-';
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(' • ') || '-';
};

const PesananCard = ({ pesanan, onCreateProduction }) => {
  const product = pesanan.product;
  const customer = pesanan.transaksi?.customer;

  return (
    <div className="group bg-white border border-amber-200 rounded-xl p-3 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Badge */}
      <div className="flex justify-center mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
          <Factory size={10} />
          Siap Produksi
        </span>
      </div>

      {/* Product Info */}
      <div className="text-center mb-2">
        <p className="font-mono font-bold text-xs text-indigo-700 truncate">
          {product?.kode || '-'}
        </p>
        <p className="text-[10px] text-slate-600 line-clamp-2 min-h-[28px] mt-0.5 leading-tight">
          {formatProductName(product)}
        </p>
      </div>

      {/* Customer + Qty */}
      <div className="space-y-1 mb-2">
        {customer && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
            <User size={10} className="text-slate-400" />
            <span className="truncate font-medium">{customer.name}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
          <Package size={10} className="text-slate-400" />
          <span>Qty: <strong className="text-amber-700">{pesanan.qty}</strong></span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-auto pt-2 border-t border-amber-100">
        <button
          onClick={() => onCreateProduction(pesanan)}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-semibold py-2 rounded-lg transition-all shadow-sm shadow-amber-500/30 active:scale-95 flex items-center justify-center gap-1"
        >
          <Factory size={12} />
          Buat Produksi
        </button>
      </div>
    </div>
  );
};

export default PesananCard;