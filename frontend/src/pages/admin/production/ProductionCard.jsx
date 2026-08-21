import { Play, CheckCircle, XCircle, User, Package, Clock, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useUserRole } from '../../../lib/zustand/authStore';

const statusConfig = {
  antri: {
    label: 'Antri',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: Clock,
  },
  produksi: {
    label: 'Produksi',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Play,
  },
  selesai: {
    label: 'Selesai',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  batal: {
    label: 'Batal',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: XCircle,
  },
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatProductName = (p) => {
  if (!p) return '-';
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(' • ') || '-';
};

/**
 * ProductionCard Component
 * 
 * @param {Object} props
 * @param {Object} props.production - Production data
 * @param {boolean} props.isProcessing - Loading state untuk card ini
 * @param {Function} props.onUpdateStatus - (id, status) => void
 * @param {Function} props.onDelete - (production) => void
 * @param {Function} props.onSelesaiWithUpload - (production) => void
 */
const ProductionCard = ({
  production,
  isProcessing = false,
  onUpdateStatus,
  onDelete,
  onSelesaiWithUpload,
}) => {
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const canOperate = role === 'admin' || role === 'operator';

  const status = statusConfig[production.status] || statusConfig.antri;
  const StatusIcon = status.icon;

  const p = production;
  const product = p.product;

  // Disable interactions saat processing
  const buttonDisabled = isProcessing;

  return (
    <div
      className={cn(
        'group relative bg-white border rounded-xl p-3 transition-all duration-200 flex flex-col h-full',
        'hover:shadow-lg hover:-translate-y-0.5',
        status.border,
        'hover:border-blue-300',
        isProcessing && 'opacity-70 pointer-events-none'
      )}
    >
      {/* Status Badge + Delete Button */}
      <div className="flex justify-between items-start mb-2">
        <span className={cn(
          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
          status.bg, status.text
        )}>
          {isProcessing ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <StatusIcon size={10} />
          )}
          {status.label}
        </span>
        {isAdmin && p.status === 'antri' && !isProcessing && (
          <button
            onClick={() => onDelete(p)}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-500 transition-all"
            title="Hapus"
          >
            <Trash2 size={12} />
          </button>
        )}
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

      {/* Karyawan + Qty */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
          <User size={10} className="text-slate-400" />
          <span className="truncate">{p.karyawan?.nama || '-'}</span>
        </div>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
          <Package size={10} className="text-slate-400" />
          <span>Qty: <strong>{p.qty}</strong></span>
        </div>
      </div>

      {/* Customer (jika pesanan) */}
      {p.jenis_pembuatan === 'pesanan' && p.transaksi?.customer && (
        <div className="text-[9px] text-center text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mb-2 truncate">
          👤 {p.transaksi.customer.name}
        </div>
      )}

      {/* Dates */}
      <div className="text-[9px] text-slate-500 text-center mb-2 space-y-0.5">
        {p.tanggal_mulai && (
          <div>Mulai: <strong>{formatDate(p.tanggal_mulai)}</strong></div>
        )}
        {p.tanggal_selesai && (
          <div>Selesai: <strong>{formatDate(p.tanggal_selesai)}</strong></div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex gap-1">
        {/* MULAI button (status antri) */}
        {p.status === 'antri' && canOperate && (
          <button
            onClick={() => onUpdateStatus(p.id, 'produksi')}
            disabled={buttonDisabled}
            className={cn(
              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1',
              'bg-blue-50 hover:bg-blue-100 text-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <><Loader2 size={10} className="animate-spin" /> Proses...</>
            ) : (
              <><Play size={10} /> Mulai</>
            )}
          </button>
        )}

        {/* SELESAI button (status produksi) */}
        {p.status === 'produksi' && canOperate && (
          <button
            onClick={() => onSelesaiWithUpload(p)}
            disabled={buttonDisabled}
            className={cn(
              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1',
              'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <><Loader2 size={10} className="animate-spin" /> Proses...</>
            ) : (
              <><CheckCircle size={10} /> Selesai</>
            )}
          </button>
        )}

        {/* BATAL button (status antri/produksi, admin only) */}
        {p.status !== 'selesai' && p.status !== 'batal' && isAdmin && (
          <button
            onClick={() => onUpdateStatus(p.id, 'batal')}
            disabled={buttonDisabled}
            className={cn(
              'flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1',
              'bg-red-50 hover:bg-red-100 text-red-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <><Loader2 size={10} className="animate-spin" /></>
            ) : (
              <><XCircle size={10} /> Batal</>
            )}
          </button>
        )}

        {/* Final state (selesai/batal) */}
        {(p.status === 'selesai' || p.status === 'batal') && (
          <div className="flex-1 text-center text-[10px] text-slate-400 py-1.5">
            {p.status === 'selesai' ? '✓ Final' : '✗ Dibatalkan'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionCard;