import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Loader2, Factory, Search, ChevronDown, Package } from 'lucide-react'; // ✅ FIXED: Tambah Package
import { useProductionModals } from '../../../lib/zustand/productionStore';
import {
  useCreateProduction,
  useKaryawansDropdown,
  useProductsDropdown,
} from '../../../hooks/useProductions';
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
// SEARCHABLE SELECT COMPONENT
// ==========================================
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Cari...',
  searchPlaceholder = 'Ketik kode atau nama...',
  disabled = false,
  isLoading = false,
  emptyText = 'Tidak ada data',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter((opt) => {
      const label = (opt.label || '').toLowerCase();
      const kode = (opt.kode || '').toLowerCase();
      const nama = formatProductName(opt).toLowerCase();
      return label.includes(term) || kode.includes(term) || nama.includes(term);
    });
  }, [options, search]);

  // Get selected option
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onChange(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-left',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'transition-all disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-between gap-2'
        )}
      >
        {isLoading ? (
          <span className="text-slate-400">Memuat...</span>
        ) : selectedOption ? (
          <div className="flex-1 min-w-0">
            <p className="font-mono font-semibold text-indigo-700 truncate text-[11px]">
              {selectedOption.kode || '-'}
            </p>
            <p className="text-[11px] text-slate-600 truncate">
              {formatProductName(selectedOption)}
            </p>
          </div>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memuat...</span>
                  </div>
                ) : (
                  <>
                    {/* ✅ FIXED: Package sudah di-import */}
                    <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                    <p>{emptyText}</p>
                    {search && (
                      <p className="text-xs text-slate-400 mt-1">
                        Tidak ada hasil untuk "{search}"
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-option
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'w-full px-3 py-2 text-left transition-colors flex items-start gap-2 border-b border-slate-50 last:border-0',
                      isSelected
                        ? 'bg-indigo-50 hover:bg-indigo-100'
                        : isHighlighted
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-mono font-semibold text-[11px] text-indigo-700 truncate">
                          {opt.kode || '-'}
                        </p>
                        {isSelected && (
                          <span className="text-[9px] font-bold text-white bg-indigo-600 px-1.5 py-0.5 rounded-full">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        {formatProductName(opt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          {filteredOptions.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
              <span>{filteredOptions.length} produk</span>
              <span className="hidden sm:inline">↑↓ Navigate • Enter Pilih • Esc Tutup</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// PRODUCTION FORM COMPONENT
// ==========================================
const ProductionForm = () => {
  const { modals, closeCreateModal } = useProductionModals();
  const createMut = useCreateProduction();
  const { data: karyawansRaw = [], isLoading: loadingKaryawan } = useKaryawansDropdown();
  const { data: productsRaw = [], isLoading: loadingProducts } = useProductsDropdown();
  const { warning, success, info } = useConfirmDialog();

  const [form, setForm] = useState({
    product_id: '',
    qty: 1,
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
    karyawan_id: '',
  });

  const [errors, setErrors] = useState({});

  const isOpen = modals.create;

  // Convert raw data to options format
  const karyawans = useMemo(() => {
    if (!Array.isArray(karyawansRaw)) return [];
    return karyawansRaw.map((k) => ({
      value: k.id,
      label: k.nama,
      nama: k.nama,
    }));
  }, [karyawansRaw]);

  const products = useMemo(() => {
    if (!Array.isArray(productsRaw)) return [];
    return productsRaw.map((p) => ({
      value: p.id,
      label: `${p.kode || ''} ${formatProductName(p)}`.trim(),
      kode: p.kode,
      ...p,
    }));
  }, [productsRaw]);

  // Reset form saat modal buka
  useEffect(() => {
    if (isOpen) {
      setForm({
        product_id: '',
        qty: 1,
        tanggal_mulai: new Date().toISOString().split('T')[0],
        tanggal_selesai: '',
        karyawan_id: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !createMut.isPending) {
        closeCreateModal();
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
  }, [isOpen, createMut.isPending, closeCreateModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const newErrors = {};
    if (!form.karyawan_id) newErrors.karyawan_id = 'Pilih karyawan terlebih dahulu';
    if (!form.product_id) newErrors.product_id = 'Pilih produk terlebih dahulu';
    if (!form.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi';
    if (!form.tanggal_selesai) newErrors.tanggal_selesai = 'Tanggal selesai wajib diisi';
    if (!form.qty || parseInt(form.qty) < 1) newErrors.qty = 'Quantity minimal 1';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      await warning('Validasi Gagal', firstError);
      return;
    }

    // ✅ ConfirmDialog untuk konfirmasi
    const confirmed = await warning(
      'Buat Produksi Inventory?',
      'Produksi akan dibuat dengan status "Antri". Lanjutkan?'
    );
    if (!confirmed) return;

    try {
      await createMut.mutateAsync({
        ...form,
        qty: parseInt(form.qty),
        jenis_pembuatan: 'inventory',
      });
      await success('Berhasil', 'Produksi inventory berhasil dibuat.');
      closeCreateModal();
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

  if (!isOpen) return null;

  const isSubmitting = createMut.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && closeCreateModal()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-indigo-50 via-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Produksi Inventory</h2>
              <p className="text-[11px] text-slate-500">Tambah produksi baru untuk stok</p>
            </div>
          </div>
          <button
            onClick={closeCreateModal}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
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
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                  'transition-all disabled:opacity-50',
                  errors.karyawan_id
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200'
                )}
                required
              >
                <option value="">
                  {loadingKaryawan ? 'Memuat...' : 'Pilih Karyawan'}
                </option>
                {karyawans.map((k) => (
                  <option key={k.value} value={k.value}>{k.nama}</option>
                ))}
              </select>
              {errors.karyawan_id && (
                <p className="text-[11px] text-red-600 mt-1">{errors.karyawan_id}</p>
              )}
            </div>

            {/* Produk - SEARCHABLE SELECT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Produk <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={form.product_id}
                onChange={(val) => {
                  setForm({ ...form, product_id: val });
                  setErrors((er) => ({ ...er, product_id: undefined }));
                }}
                options={products}
                placeholder="Pilih produk..."
                searchPlaceholder="Cari kode atau nama produk..."
                disabled={isSubmitting || loadingProducts}
                isLoading={loadingProducts}
                emptyText="Tidak ada produk tersedia"
              />
              {errors.product_id && (
                <p className="text-[11px] text-red-600 mt-1">{errors.product_id}</p>
              )}
            </div>

            {/* Qty */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.qty}
                onChange={(e) => {
                  setForm({ ...form, qty: e.target.value });
                  setErrors((er) => ({ ...er, qty: undefined }));
                }}
                disabled={isSubmitting}
                className={cn(
                  'w-full border-2 rounded-xl px-3 py-2.5 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                  'transition-all disabled:opacity-50',
                  errors.qty ? 'border-red-300 bg-red-50' : 'border-slate-200'
                )}
                required
              />
              {errors.qty && (
                <p className="text-[11px] text-red-600 mt-1">{errors.qty}</p>
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
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
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
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
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
            onClick={closeCreateModal}
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
              'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-500/30'
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

export default ProductionForm;