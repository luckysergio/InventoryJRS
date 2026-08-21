import { useMemo, useState, useCallback } from 'react';
import { Download, Calendar, RefreshCw, X, Factory, CheckCircle, XCircle, History, Search } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useProductionFilters } from '../../../lib/zustand/productionStore';
import { useProductions } from '../../../hooks/useProductions';
import { cn } from '../../../lib/utils';

const statusConfig = {
  selesai: {
    label: 'Selesai',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: CheckCircle,
  },
  batal: {
    label: 'Dibatalkan',
    bg: 'bg-red-50',
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

// Skeleton
const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
    <div className="flex justify-center mb-2">
      <div className="h-5 w-20 bg-slate-200 rounded-full" />
    </div>
    <div className="text-center mb-2">
      <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto mb-1" />
      <div className="h-2.5 bg-slate-100 rounded w-1/2 mx-auto" />
    </div>
    <div className="space-y-1">
      <div className="h-2.5 bg-slate-100 rounded w-full" />
      <div className="h-2.5 bg-slate-100 rounded w-2/3 mx-auto" />
    </div>
  </div>
);

const RiwayatProductionPage = () => {
  const {
    riwayatFilters,
    setRiwayatDari,
    setRiwayatSampai,
    resetRiwayatFilters,
    hasRiwayatActiveFilters,
    getRiwayatPeriodeLabel,
  } = useProductionFilters();

  const { data, isLoading, isFetching, refetch } = useProductions();
  const [searchInput, setSearchInput] = useState('');

  // Filter hanya selesai & batal, lalu filter by date + search
  const filteredProductions = useMemo(() => {
    const all = data?.productions || [];
    const history = all.filter((p) => p.status === 'selesai' || p.status === 'batal');

    return history.filter((p) => {
      // Filter tanggal
      const date = new Date(p.updated_at || p.tanggal_selesai || p.tanggal_mulai);
      const dari = riwayatFilters.dari ? new Date(riwayatFilters.dari) : null;
      const sampai = riwayatFilters.sampai ? new Date(riwayatFilters.sampai) : null;
      if (dari && date < dari) return false;
      if (sampai) {
        const sampaiEnd = new Date(sampai);
        sampaiEnd.setHours(23, 59, 59, 999);
        if (date > sampaiEnd) return false;
      }

      // Filter search
      if (searchInput) {
        const term = searchInput.toLowerCase();
        const kode = p.product?.kode?.toLowerCase() || '';
        const nama = formatProductName(p.product).toLowerCase();
        const customer = p.transaksi?.customer?.name?.toLowerCase() || '';
        if (!kode.includes(term) && !nama.includes(term) && !customer.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [data, riwayatFilters, searchInput]);

  const isFilterActive = hasRiwayatActiveFilters() || searchInput;

  const exportToExcel = useCallback(() => {
    if (filteredProductions.length === 0) {
      Swal.fire('Info', 'Tidak ada data untuk diekspor', 'info');
      return;
    }

    const dataToExport = filteredProductions.map((p) => ({
      'Kode Produk': p.product?.kode || '-',
      'Nama Produk': formatProductName(p.product),
      'Qty': p.qty,
      'Jenis': p.jenis_pembuatan === 'pesanan' ? 'Pesanan' : 'Inventory',
      'Customer': p.jenis_pembuatan === 'pesanan' ? (p.transaksi?.customer?.name || '-') : '-',
      'Karyawan': p.karyawan?.nama || '-',
      'Status': p.status === 'selesai' ? 'Selesai' : 'Dibatalkan',
      'Tanggal Mulai': formatDate(p.tanggal_mulai),
      'Tanggal Selesai': formatDate(p.tanggal_selesai),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Produksi');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Riwayat_Produksi_JRS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: `${filteredProductions.length} data diekspor ke Excel`,
      timer: 1800,
      showConfirmButton: false,
    });
  }, [filteredProductions]);

  // Summary stats
  const stats = useMemo(() => {
    const selesai = filteredProductions.filter((p) => p.status === 'selesai').length;
    const batal = filteredProductions.filter((p) => p.status === 'batal').length;
    const totalQty = filteredProductions
      .filter((p) => p.status === 'selesai')
      .reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    return { total: filteredProductions.length, selesai, batal, totalQty };
  }, [filteredProductions]);

  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari kode produk, nama, atau customer..."
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dari */}
            <div className="relative flex-shrink-0 min-w-[150px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={riwayatFilters.dari}
                onChange={(e) => setRiwayatDari(e.target.value)}
                max={riwayatFilters.sampai || undefined}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="hidden lg:flex items-center text-slate-400 text-xs font-medium">
              s/d
            </div>

            {/* Sampai */}
            <div className="relative flex-shrink-0 min-w-[150px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={riwayatFilters.sampai}
                onChange={(e) => setRiwayatSampai(e.target.value)}
                min={riwayatFilters.dari || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button
                  onClick={() => { resetRiwayatFilters(); setSearchInput(''); }}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  <X size={14} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2.5 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
              </button>
              <button
                onClick={exportToExcel}
                disabled={filteredProductions.length === 0}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg transition-all shadow-sm shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Excel"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS */}
      {!isLoading && filteredProductions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={History}
            gradient="from-indigo-500 to-blue-600"
            label="Total Riwayat"
            value={stats.total}
          />
          <StatCard
            icon={CheckCircle}
            gradient="from-emerald-500 to-teal-600"
            label="Selesai"
            value={stats.selesai}
          />
          <StatCard
            icon={XCircle}
            gradient="from-red-500 to-rose-600"
            label="Dibatalkan"
            value={stats.batal}
          />
          <StatCard
            icon={Factory}
            gradient="from-amber-500 to-orange-600"
            label="Unit Diproduksi"
            value={stats.totalQty}
          />
        </div>
      )}

      {/* PERIODE LABEL */}
      {!isLoading && filteredProductions.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-sm">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Riwayat Produksi</h2>
            <p className="text-xs text-slate-500">
              {filteredProductions.length} data • {getRiwayatPeriodeLabel()}
            </p>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredProductions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <History className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">Tidak Ada Riwayat</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? 'Tidak ada data pada filter yang dipilih. Coba ubah rentang tanggal atau kata kunci.'
              : 'Riwayat produksi akan muncul setelah ada produksi yang selesai atau dibatalkan.'}
          </p>
          {isFilterActive && (
            <button
              onClick={() => { resetRiwayatFilters(); setSearchInput(''); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <X size={14} />
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredProductions.map((p) => {
            const status = statusConfig[p.status] || statusConfig.selesai;
            const StatusIcon = status.icon;
            const customer = p.jenis_pembuatan === 'pesanan'
              ? p.transaksi?.customer?.name
              : null;

            return (
              <div
                key={p.id}
                className={cn(
                  'bg-white border rounded-xl p-3 transition-all duration-200 flex flex-col',
                  'hover:shadow-md hover:-translate-y-0.5',
                  status.border
                )}
              >
                {/* Status Badge */}
                <div className="flex justify-center mb-2">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    status.bg, status.text
                  )}>
                    <StatusIcon size={10} />
                    {status.label}
                  </span>
                </div>

                {/* Product Info */}
                <div className="text-center mb-2">
                  <p className="font-mono font-bold text-xs text-indigo-700 truncate">
                    {p.product?.kode || '-'}
                  </p>
                  <p className="text-[10px] text-slate-600 line-clamp-2 min-h-[28px] mt-0.5 leading-tight">
                    {formatProductName(p.product)}
                  </p>
                </div>

                {/* Customer (if pesanan) */}
                {customer && (
                  <div className="text-[9px] text-center text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mb-2 truncate">
                    👤 {customer}
                  </div>
                )}

                {/* Qty */}
                <div className="text-center mb-2">
                  <p className="text-xs text-slate-500">Qty</p>
                  <p className="font-bold text-slate-900">{p.qty}</p>
                </div>

                {/* Dates */}
                <div className="mt-auto pt-2 border-t border-slate-100 text-[9px] text-slate-500 text-center space-y-0.5">
                  {p.tanggal_mulai && <div>Mulai: <strong>{formatDate(p.tanggal_mulai)}</strong></div>}
                  {p.tanggal_selesai && <div>Selesai: <strong>{formatDate(p.tanggal_selesai)}</strong></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Helper stat card
const StatCard = ({ icon: Icon, gradient, label, value }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
    <div className={cn('p-2 rounded-lg shadow-sm flex-shrink-0 bg-gradient-to-br', gradient)}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
      <p className="font-bold text-lg text-slate-900">{value}</p>
    </div>
  </div>
);

export default RiwayatProductionPage;