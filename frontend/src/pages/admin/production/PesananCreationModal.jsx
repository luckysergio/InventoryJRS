import { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Factory, User, Package } from 'lucide-react';
import { useKaryawansDropdown, useCreateProduction } from '../../../hooks/useProductions';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { cn } from '../../../lib/utils';

// ==========================================
// UTILITY
// ==========================================
const formatProductName = (p) => {
  if (!p) return '-';
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(' • ') || '-';
};

// ==========================================
// PESANAN CREATION MODAL
// ==========================================
const PesananCreationModal = ({ isOpen, pesanan, onClose }) => {
  const { data: karyawansRaw = [], isLoading: loadingKaryawan } = useKaryawansDropdown();
  const createMut = useCreateProduction();
  const { warning, success, info } = useConfirmDialog();

  const [form, setForm] = useState({
    karyawan_id: '',
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
  });

  const [errors, setErrors] = useState({});

  // Convert raw data to options format
  const karyawans = useMemo(() => {
    if (!Array.isArray(karyawansRaw)) return [];
    return karyawansRaw.map((k) => ({
      value: k.id,
      label: k.nama,
      nama: k.nama,
    }));
  }, [karyawansRaw]);

  // Reset form saat modal buka
  useEffect(() => {
    if (isOpen) {
      setForm({
        karyawan_id: '',
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // ESC key handler + body scroll lock
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !createMut.isPending) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, createMut.isPending, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};
    if (!form.karyawan_id) newErrors.karyawan_id = 'Pilih karyawan terlebih dahulu';
    if (!form.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi';
    if (!form.tanggal_selesai) newErrors.tanggal_selesai = 'Tanggal selesai wajib diisi';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      await warning('Validasi Gagal', firstError);
      return;
    }

    // ✅ ConfirmDialog untuk konfirmasi
    const confirmed = await warning(
      'Buat Produksi Pesanan?',
      `Produksi pesanan "${pesanan.product?.kode || ''}" akan dibuat dengan status "Antri". Lanjutkan?`
    );
    if (!confirmed) return;

    try {
      await createMut.mutateAsync({
        transaksi_detail_id: pesanan.id,
        jenis_pembuatan: 'pesanan',
        karyawan_id: form.karyawan_id,
        tanggal_mulai: form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
      });
      await success(
        'Berhasil',
        `Produksi pesanan "${pesanan.product?.kode || ''}" berhasil dibuat.`
      );
      onClose();
    } catch (error) {
      if (error.response?.status === 422) {
        const errorData = error.response.data?.errors || {};
        const msg = Object.values(errorData).flat().join('\n');
        await warning('Validasi Gagal', msg || 'Data tidak valid.');
      } else {
        await info(
          'Gagal Membuat Produksi',
          error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'
        );
      }
    }
  };

  if (!isOpen || !pesanan) return null;

  const isSubmitting = createMut.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-amber-50 via-orange-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Buat Produksi Pesanan</h2>
              <p className="text-[11px] text-slate-500">
                {pesanan.product?.kode || '-'} • {formatProductName(pesanan.product)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Pesanan Info Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 space-y-2">
              {/* Customer */}
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wide">Customer</p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {pesanan.transaksi?.customer?.name || 'Customer'}
                  </p>
                  {pesanan.transaksi?.customer?.phone && (
                    <p className="text-[11px] text-slate-600 truncate">
                      📞 {pesanan.transaksi.customer.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Qty */}
              <div className="flex items-start gap-2 pt-2 border-t border-amber-200/60">
                <Package className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wide">Quantity</p>
                  <p className="text-sm font-bold text-slate-900">
                    {pesanan.qty} unit
                  </p>
                </div>
              </div>
            </div>

            {/* Karyawan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Karyawan <span className="text-red-500">*</span>
              </label>
              <select
                value={form.karyawan_id}
                onChange={(e) => {
                  setForm({ ...form, karyawan_id: e.target.value });
                  setErrors((er) => ({ ...er, karyawan_id: undefined }));
                }}
                disabled={isSubmitting || loadingKaryawan}
                className={cn(
                  'w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
                  'transition-all disabled:opacity-50',
                  errors.karyawan_id ? 'border-red-300 bg-red-50' : 'border-slate-200'
                )}
                required
              >
                <option value="">{loadingKaryawan ? 'Memuat...' : 'Pilih Karyawan'}</option>
                {karyawans.map((k) => (
                  <option key={k.value} value={k.value}>{k.nama}</option>
                ))}
              </select>
              {errors.karyawan_id && (
                <p className="text-[11px] text-red-600 mt-1">{errors.karyawan_id}</p>
              )}
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tgl Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggal_mulai}
                  onChange={(e) => {
                    setForm({ ...form, tanggal_mulai: e.target.value });
                    setErrors((er) => ({ ...er, tanggal_mulai: undefined }));
                  }}
                  max={form.tanggal_selesai || undefined}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full border-2 rounded-xl px-3 py-2.5 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
                    'transition-all disabled:opacity-50',
                    errors.tanggal_mulai ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  )}
                  required
                />
                {errors.tanggal_mulai && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.tanggal_mulai}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Tgl Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.tanggal_selesai}
                  onChange={(e) => {
                    setForm({ ...form, tanggal_selesai: e.target.value });
                    setErrors((er) => ({ ...er, tanggal_selesai: undefined }));
                  }}
                  min={form.tanggal_mulai || undefined}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full border-2 rounded-xl px-3 py-2.5 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
                    'transition-all disabled:opacity-50',
                    errors.tanggal_selesai ? 'border-red-300 bg-red-50' : 'border-slate-200'
                  )}
                  required
                />
                {errors.tanggal_selesai && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.tanggal_selesai}</p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0 p-4 sm:p-5 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
            )}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
            ) : (
              <><Factory size={16} /> Buat Produksi</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PesananCreationModal;