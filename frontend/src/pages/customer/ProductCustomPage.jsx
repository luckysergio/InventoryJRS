import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft,
  Package, SlidersHorizontal, Eye, CheckCircle2,
  AlertCircle, Tag, Layers, Loader2,
  User, Ruler, Box, Wallet, Sparkles,
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import {
  useAllProductCustoms,
  useJenisProducts,
  useTypeProducts,
  useProductCustomDetail,
} from './hooks/useProductCustoms';
import { cn } from '../../lib/utils';

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const WA_NUMBER = '6281287951140';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);

const resolveImage = (url, path) =>
  url || (path ? `${ASSET_URL}/storage/${path}` : null);

/* ==========================================
   SKIP NAVIGATION
   ========================================== */
const SkipNavigation = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    Lewati ke konten utama
  </a>
);

/* ==========================================
   PRODUCT CUSTOM DETAIL MODAL
   ========================================== */
const ProductCustomDetailModal = ({ product, onClose }) => {
  const { data: detail, isLoading } = useProductCustomDetail(product?.id, {
    enabled: !!product?.id,
  });
  const [activeImage, setActiveImage] = useState('depan');
  const closeButtonRef = useRef(null);

  const data = detail || product;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    setActiveImage('depan');
  }, [product?.id]);

  const images = [
    { key: 'depan', label: 'Depan', url: resolveImage(data?.foto_depan_url, data?.foto_depan) },
    { key: 'samping', label: 'Samping', url: resolveImage(data?.foto_samping_url, data?.foto_samping) },
    { key: 'atas', label: 'Atas', url: resolveImage(data?.foto_atas_url, data?.foto_atas) },
  ].filter((img) => img.url);

  const currentImage = images.find((img) => img.key === activeImage) || images[0] || null;
  const totalStok = (data?.qty_toko || 0) + (data?.qty_bengkel || 0);

  const waText = encodeURIComponent(
    `Halo Jaya Rubber Seal, saya tertarik dengan produk custom ${data?.kode || ''} (${data?.jenis?.nama || ''} ${data?.type?.nama || ''}). Mohon info lebih lanjut.`
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-custom-detail-title"
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-purple-50 to-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-xs font-mono text-slate-500">{data?.kode || '-'}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={10} aria-hidden="true" />
                Custom
              </span>
            </div>
            <h2
              id="product-custom-detail-title"
              className="text-lg font-display font-bold text-slate-900 truncate"
            >
              {isLoading
                ? 'Memuat detail...'
                : [data?.jenis?.nama, data?.type?.nama].filter(Boolean).join(' ') || 'Detail Produk Custom'}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Tutup detail produk"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6" aria-label="Memuat detail produk" role="status">
              <div className="aspect-square bg-slate-200 rounded-2xl animate-pulse" aria-hidden="true" />
              <div className="space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse" aria-hidden="true" />
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" aria-hidden="true" />
                <div className="h-10 bg-slate-200 rounded w-2/3 animate-pulse" aria-hidden="true" />
                <div className="h-24 bg-slate-200 rounded animate-pulse" aria-hidden="true" />
              </div>
              <span className="sr-only">Memuat detail produk...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-ocean-50 border border-slate-100">
                  {currentImage ? (
                    <img
                      src={currentImage.url}
                      alt={`Foto ${currentImage.label} ${data?.kode || 'produk custom'}`}
                      className="w-full h-full object-cover"
                      style={{ aspectRatio: '1/1' }}
                      width="600"
                      height="600"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
                      <Package className="text-purple-300" size={56} />
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 mt-3" role="group" aria-label="Pilih foto produk">
                    {images.map((img) => (
                      <button
                        key={img.key}
                        onClick={() => setActiveImage(img.key)}
                        className={cn(
                          'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                          currentImage?.key === img.key
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-slate-200 hover:border-purple-300'
                        )}
                        aria-label={`Foto ${img.label}`}
                        aria-pressed={currentImage?.key === img.key}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" width="64" height="64" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                    <Sparkles size={12} aria-hidden="true" />
                    Produk Custom
                  </span>
                  {data?.jenis?.nama && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold">
                      <Tag size={12} aria-hidden="true" />
                      {data.jenis.nama}
                    </span>
                  )}
                  {data?.type?.nama && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ocean-50 text-ocean-700 border border-ocean-200 text-xs font-semibold">
                      <Layers size={12} aria-hidden="true" />
                      {data.type.nama}
                    </span>
                  )}
                  {data?.bahan?.nama && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                      <Box size={12} aria-hidden="true" />
                      {data.bahan.nama}
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-brand-50 border border-purple-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Harga Custom</p>
                  <p className="text-2xl sm:text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-brand-600">
                    {formatRupiah(data?.harga)}
                  </p>
                </div>

                <dl className="space-y-2 text-sm">
                  {data?.ukuran && (
                    <div className="flex items-center gap-2">
                      <Ruler size={15} className="text-slate-400" aria-hidden="true" />
                      <dt className="text-slate-500">Ukuran:</dt>
                      <dd className="font-semibold text-slate-900">{data.ukuran}</dd>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-slate-400" aria-hidden="true" />
                    <dt className="text-slate-500">Stok Total:</dt>
                    <dd className="font-semibold text-slate-900">{totalStok} unit</dd>
                  </div>
                </dl>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 font-medium uppercase">Toko</p>
                    <p className={cn('text-lg font-bold', (data?.qty_toko || 0) > 0 ? 'text-emerald-700' : 'text-red-500')}>
                      {data?.qty_toko || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] text-blue-600 font-medium uppercase">Bengkel</p>
                    <p className={cn('text-lg font-bold', (data?.qty_bengkel || 0) > 0 ? 'text-blue-700' : 'text-red-500')}>
                      {data?.qty_bengkel || 0}
                    </p>
                  </div>
                </div>

                <p
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full',
                    totalStok > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  )}
                >
                  {totalStok > 0 ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertCircle size={14} aria-hidden="true" />}
                  {totalStok > 0 ? 'Produk Tersedia' : 'Stok Habis'}
                </p>

                {data?.keterangan && (
                  <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">{data.keterangan}</p>
                )}

                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-brand-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <User size={18} aria-hidden="true" />
                  Tanya Produk Custom Ini
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   PRODUCT CUSTOM CARD
   ========================================== */
const ProductCustomCard = ({ product, index, onSelect }) => {
  const imageUrl = resolveImage(product.foto_depan_url, product.foto_depan);
  const productName = product.jenis?.nama || product.kode || 'Produk Custom';
  const fullLabel = [product.kode, product.jenis?.nama, product.type?.nama, product.ukuran]
    .filter(Boolean)
    .join(' • ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(product)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(product);
        }
      }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
      data-aos="fade-up"
      data-aos-delay={Math.min(index * 50, 300)}
      aria-label={`Lihat detail produk custom ${fullLabel}`}
    >
      <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-ocean-50 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            decoding="async"
            width="400"
            height="400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
            <Package className="text-purple-300" size={48} />
          </div>
        )}

        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-1">
          <Sparkles size={12} aria-hidden="true" />
          <span>Custom</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 pointer-events-none">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Eye size={16} aria-hidden="true" />
            <span>Lihat Detail</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-mono text-slate-500 mb-1">{product.kode || '-'}</p>
        <h3 className="font-display font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[3rem]">
          {productName} {product.type?.nama || ''}
        </h3>

        {product.ukuran && (
          <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
            <span className="font-medium">Ukuran:</span>
            <span>{product.ukuran}</span>
          </p>
        )}

        {product.bahan?.nama && (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
            <span className="font-medium">Bahan:</span>
            <span>{product.bahan.nama}</span>
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-sm font-bold text-purple-600 flex items-center gap-1">
            Lihat Detail
            <ChevronRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </span>
          {(product.qty_toko > 0 || product.qty_bengkel > 0) && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} aria-hidden="true" />
              Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================
   PRODUCT CARD SKELETON
   ========================================== */
const ProductCardSkeleton = () => (
  <div
    className="bg-white rounded-2xl overflow-hidden border border-slate-100"
    role="status"
    aria-label="Memuat produk"
  >
    <div className="aspect-square bg-slate-200 animate-pulse" aria-hidden="true" />
    <div className="p-5 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" aria-hidden="true" />
      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" aria-hidden="true" />
      <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" aria-hidden="true" />
      <div className="h-8 bg-slate-200 rounded w-full animate-pulse" aria-hidden="true" />
    </div>
    <span className="sr-only">Memuat produk...</span>
  </div>
);

/* ==========================================
   DESKTOP FILTER SIDEBAR
   ========================================== */
const DesktopFilterSidebar = ({
  filters,
  setFilters,
  jenisList,
  typeList,
  isLoadingJenis,
  isLoadingType,
}) => {
  const activeFiltersCount = (filters.jenisId ? 1 : 0) + (filters.typeId ? 1 : 0);

  const handleSelectJenis = (jenisId) => {
    setFilters((prev) => ({
      ...prev,
      jenisId: prev.jenisId === jenisId ? null : jenisId,
      typeId: null,
      page: 1,
    }));
  };

  const handleSelectType = (typeId) => {
    setFilters((prev) => ({
      ...prev,
      typeId: prev.typeId === typeId ? null : typeId,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, jenisId: null, typeId: null, page: 1 }));
  };

  return (
    <div className="sticky top-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal size={20} aria-hidden="true" />
          Filter
        </h2>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-purple-600 hover:text-purple-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-2 py-1"
            aria-label="Hapus semua filter"
          >
            Hapus Semua
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Tag size={18} aria-hidden="true" />
          Jenis Produk
        </h3>

        {isLoadingJenis ? (
          <div className="flex items-center justify-center py-4 text-slate-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Memuat...</span>
          </div>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" role="radiogroup" aria-label="Filter jenis produk">
            <button
              onClick={() => handleSelectJenis(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
                !filters.jenisId
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-slate-700 hover:bg-slate-50 border border-transparent'
              )}
              role="radio"
              aria-checked={!filters.jenisId}
            >
              <Package size={16} aria-hidden="true" />
              <span className="flex-1 text-left">Semua Jenis</span>
              {!filters.jenisId && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>

            {jenisList.map((jenis) => {
              const isActive = filters.jenisId === jenis.value;
              return (
                <button
                  key={jenis.value}
                  onClick={() => handleSelectJenis(jenis.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
                    isActive
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  )}
                  role="radio"
                  aria-checked={isActive}
                >
                  <span className="flex-1 text-left">{jenis.label}</span>
                  {isActive && <CheckCircle2 size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers size={18} aria-hidden="true" />
          Tipe Produk
        </h3>

        {!filters.jenisId ? (
          <p className="text-xs text-slate-500 italic py-2">
            Pilih jenis produk terlebih dahulu untuk melihat tipe yang tersedia.
          </p>
        ) : isLoadingType ? (
          <div className="flex items-center justify-center py-4 text-slate-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            <span className="text-sm">Memuat tipe...</span>
          </div>
        ) : typeList.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">Tidak ada tipe untuk jenis ini.</p>
        ) : (
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1" role="radiogroup" aria-label="Filter tipe produk">
            <button
              onClick={() => handleSelectType(null)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
                !filters.typeId
                  ? 'bg-ocean-50 text-ocean-700 border border-ocean-200'
                  : 'text-slate-700 hover:bg-slate-50 border border-transparent'
              )}
              role="radio"
              aria-checked={!filters.typeId}
            >
              <span className="flex-1 text-left">Semua Tipe</span>
              {!filters.typeId && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>

            {typeList.map((type) => {
              const isActive = filters.typeId === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => handleSelectType(type.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
                    isActive
                      ? 'bg-ocean-50 text-ocean-700 border border-ocean-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  )}
                  role="radio"
                  aria-checked={isActive}
                >
                  <span className="flex-1 text-left">{type.label}</span>
                  {isActive && <CheckCircle2 size={16} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   ✅ MOBILE QUICK FILTER CHIPS (Fixed & Optimized)
   ========================================== */
const MobileQuickFilterChips = ({ filters, setFilters, jenisList, typeList }) => {
  const hasFilters = filters.jenisId || filters.typeId;

  const handleSelectJenis = (jenisId) => {
    setFilters((prev) => ({
      ...prev,
      jenisId: prev.jenisId === jenisId ? null : jenisId,
      typeId: null,
    }));
  };

  const handleSelectType = (typeId) => {
    setFilters((prev) => ({
      ...prev,
      typeId: prev.typeId === typeId ? null : typeId,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, jenisId: null, typeId: null, page: 1 }));
  };

  // ✅ Class wrapper untuk scroll horizontal yang aman (tanpa negative margin)
  const scrollContainerClass = cn(
    "flex gap-2 overflow-x-auto pb-3 w-full snap-x touch-pan-y"
  );

  return (
    <div className="mb-6">
      {hasFilters && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-red-600 text-sm font-medium bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
            aria-label="Hapus semua filter"
          >
            <X size={14} aria-hidden="true" />
            Reset Filter
          </button>
        </div>
      )}

      <div
        className={scrollContainerClass}
        role="radiogroup"
        aria-label="Filter jenis produk"
      >
        <button
          onClick={() => handleSelectJenis(null)}
          className={cn(
            "snap-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 border-2 flex-shrink-0",
            !filters.jenisId
              ? "bg-purple-500 text-white border-purple-500 shadow-md focus:ring-purple-300"
              : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 focus:ring-purple-200"
          )}
          role="radio"
          aria-checked={!filters.jenisId}
        >
          <Package size={14} aria-hidden="true" />
          <span>Semua</span>
        </button>

        {jenisList.map((jenis) => {
          const isActive = filters.jenisId === jenis.value;
          return (
            <button
              key={jenis.value}
              onClick={() => handleSelectJenis(jenis.value)}
              className={cn(
                "snap-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 border-2 flex-shrink-0",
                isActive
                  ? "bg-purple-500 text-white border-purple-500 shadow-md focus:ring-purple-300"
                  : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 focus:ring-purple-200"
              )}
              role="radio"
              aria-checked={isActive}
            >
              {jenis.label}
              {isActive && <CheckCircle2 size={14} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {filters.jenisId && typeList.length > 0 && (
        <div
          className={cn(scrollContainerClass, "mt-2")}
          role="radiogroup"
          aria-label="Filter tipe produk"
          data-aos="fade-down"
        >
          <button
            onClick={() => handleSelectType(null)}
            className={cn(
              "snap-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 border-2 flex-shrink-0",
              !filters.typeId
                ? "bg-ocean-500 text-white border-ocean-500 shadow-md focus:ring-ocean-300"
                : "bg-white text-slate-700 border-slate-200 hover:border-ocean-300 focus:ring-ocean-200"
            )}
            role="radio"
            aria-checked={!filters.typeId}
          >
            <span>Semua Tipe</span>
          </button>

          {typeList.map((type) => {
            const isActive = filters.typeId === type.value;
            return (
              <button
                key={type.value}
                onClick={() => handleSelectType(type.value)}
                className={cn(
                  "snap-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 border-2 flex-shrink-0",
                  isActive
                    ? "bg-ocean-500 text-white border-ocean-500 shadow-md focus:ring-ocean-300"
                    : "bg-white text-slate-700 border-slate-200 hover:border-ocean-300 focus:ring-ocean-200"
                )}
                role="radio"
                aria-checked={isActive}
              >
                {type.label}
                {isActive && <CheckCircle2 size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ==========================================
   PAGINATION
   ========================================== */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Navigasi halaman produk" className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
          currentPage === 1
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200'
        )}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Sebelumnya</span>
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Halaman 1"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-slate-400" aria-hidden="true">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'w-10 h-10 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
            page === currentPage
              ? 'bg-gradient-to-r from-purple-500 to-brand-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200'
          )}
          aria-label={`Halaman ${page}`}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-slate-400" aria-hidden="true">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={`Halaman ${totalPages}`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500',
          currentPage === totalPages
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-600 border border-slate-200'
        )}
        aria-label="Halaman berikutnya"
      >
        <span className="hidden sm:inline">Berikutnya</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
};

/* ==========================================
   EMPTY & ERROR STATE
   ========================================== */
const EmptyState = ({ onClearFilters }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mb-6" aria-hidden="true">
      <Sparkles size={40} className="text-purple-400" />
    </div>
    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Produk Custom Tidak Ditemukan</h3>
    <p className="text-slate-600 mb-6 max-w-md mx-auto">
      Maaf, tidak ada produk custom yang sesuai dengan filter yang Anda pilih. Coba ubah filter atau hapus semua filter.
    </p>
    <button
      onClick={onClearFilters}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-brand-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <X size={18} aria-hidden="true" />
      Hapus Semua Filter
    </button>
  </div>
);

const ErrorState = ({ onRetry }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6" aria-hidden="true">
      <AlertCircle size={40} className="text-red-500" />
    </div>
    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Terjadi Kesalahan</h3>
    <p className="text-slate-600 mb-6 max-w-md mx-auto">
      Maaf, kami tidak dapat memuat daftar produk custom. Silakan coba lagi nanti.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-brand-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      Coba Lagi
    </button>
  </div>
);

/* ==========================================
   PRODUCT CUSTOM PAGE - MAIN
   ========================================== */
const ProductCustomPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [filters, setFilters] = useState({
    jenisId: searchParams.get('jenis_id') ? parseInt(searchParams.get('jenis_id'), 10) : null,
    typeId: searchParams.get('type_id') ? parseInt(searchParams.get('type_id'), 10) : null,
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '12', 10),
  });

  const { data: jenisList = [], isLoading: isLoadingJenis } = useJenisProducts();
  const { data: typeList = [], isLoading: isLoadingType } = useTypeProducts(filters.jenisId);

  const {
    data: productsData = { data: [], total: 0, lastPage: 1 },
    isLoading,
    error,
    refetch,
  } = useAllProductCustoms({
    page: filters.page,
    pageSize: filters.pageSize,
    jenisId: filters.jenisId,
    typeId: filters.typeId,
  });

  const products = productsData.data || [];
  const totalProducts = productsData.total || 0;
  const totalPages = productsData.lastPage || 1;

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.jenisId) params.set('jenis_id', filters.jenisId.toString());
    if (filters.typeId) params.set('type_id', filters.typeId.toString());
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.pageSize !== 12) params.set('pageSize', filters.pageSize.toString());
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  // ✅ FIX: Mencegah warning exhaustive-deps dan reset page yang tidak perlu
  const prevFiltersRef = useRef({ jenisId: filters.jenisId, typeId: filters.typeId, pageSize: filters.pageSize });

  useEffect(() => {
    const prev = prevFiltersRef.current;
    const hasFilterChanged = 
      prev.jenisId !== filters.jenisId || 
      prev.typeId !== filters.typeId || 
      prev.pageSize !== filters.pageSize;

    if (hasFilterChanged && filters.page !== 1) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }
    
    prevFiltersRef.current = { jenisId: filters.jenisId, typeId: filters.typeId, pageSize: filters.pageSize };
  }, [filters.jenisId, filters.typeId, filters.pageSize, filters.page]);

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setFilters({ jenisId: null, typeId: null, page: 1, pageSize: filters.pageSize });
  };

  const productsSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id' },
          { '@type': 'ListItem', position: 2, name: 'Produk Custom', item: `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/product-customs` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Katalog Produk Custom Rubber Seal',
        numberOfItems: totalProducts,
        itemListElement: products.slice(0, 20).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: [product.jenis?.nama, product.type?.nama, product.ukuran].filter(Boolean).join(' ') || product.kode,
            sku: product.kode,
            description: product.keterangan || 'Produk rubber seal custom berkualitas',
            image: resolveImage(product.foto_depan_url, product.foto_depan) || '',
            brand: { '@type': 'Brand', name: 'Jaya Rubber Seal' },
          },
        })),
      },
    ],
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title="Produk Custom"
        description="Katalog produk rubber seal custom berkualitas tinggi dari Jaya Rubber Seal. Produk pesanan khusus dengan harga khusus sesuai kebutuhan Anda."
        keywords="produk custom rubber seal, karet custom, pesanan khusus, o-ring custom, gasket custom, mounting custom"
        schema={productsSchema}
      />
      <main id="main-content" tabIndex="-1">
        <h1 className="sr-only">Produk Custom Rubber Seal — Jaya Rubber Seal</h1>

        <section className="relative pt-6 sm:pt-8 pb-2 bg-gradient-to-br from-white via-purple-50 to-ocean-50">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                  Produk Custom
                </h2>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
                <Package size={18} aria-hidden="true" />
                <span className="font-semibold text-slate-900">
                  {totalProducts.toLocaleString('id-ID')}
                </span>
                <span>produk</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-6 sm:py-10 bg-white" aria-label="Daftar produk custom">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              <aside className="hidden lg:block lg:w-72 flex-shrink-0">
                <DesktopFilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  jenisList={jenisList}
                  typeList={typeList}
                  isLoadingJenis={isLoadingJenis}
                  isLoadingType={isLoadingType}
                />
              </aside>

              <div className="flex-1 min-w-0">
                <div className="lg:hidden">
                  <MobileQuickFilterChips
                    filters={filters}
                    setFilters={setFilters}
                    jenisList={jenisList}
                    typeList={typeList}
                  />
                </div>

                {error ? (
                  <ErrorState onRetry={refetch} />
                ) : isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Memuat produk">
                    {[...Array(Math.min(filters.pageSize, 12))].map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
                      {products.map((product, index) => (
                        <div key={product.id} role="listitem">
                          <ProductCustomCard
                            product={product}
                            index={index}
                            onSelect={setSelectedProduct}
                          />
                        </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={filters.page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </>
                ) : (
                  <EmptyState onClearFilters={clearAllFilters} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedProduct && (
        <ProductCustomDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default ProductCustomPage;