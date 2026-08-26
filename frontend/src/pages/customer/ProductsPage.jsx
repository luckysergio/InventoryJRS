import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft,
  Package, SlidersHorizontal, Eye, CheckCircle2,
  AlertCircle, Tag, Layers, Loader2,
  User, Ruler, Box, Wallet, Warehouse, Phone
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import {
  useAllProducts,
  useJenisProducts,
  useTypeProducts,
  useProductDetail,
} from './hooks/usePublicProducts';
import { cn } from '../../lib/utils';

// ✅ FIX: Gunakan VITE_APP_URL untuk fallback, bukan VITE_ASSET_URL (yang mungkin mengandung /api)
const APP_URL = import.meta.env.VITE_APP_URL || 'https://www.jayarubberseal.com';
const WA_NUMBER = '6281287951140';

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value || 0);

// ✅ FIX: Helper resolusi gambar yang aman dari bug duplikasi "/api/"
const resolveImage = (url, path) => {
  if (url) return url; // Backend sudah mengirim URL lengkap yang benar
  if (path) {
    const cleanPath = path.startsWith('products/') ? path : `products/${path}`;
    return `${APP_URL}/storage/${cleanPath}`;
  }
  return null;
};

const SkipNavigation = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    Lewati ke konten utama
  </a>
);

/* ==========================================
   PRODUCT DETAIL MODAL
   ========================================== */
const ProductDetailModal = ({ product, onClose }) => {
  const { data: detail, isLoading } = useProductDetail(product?.id, {
    enabled: !!product?.id,
  });
  const [activeImage, setActiveImage] = useState('depan');
  const closeButtonRef = useRef(null);

  const data = detail || product;

  const handleEscKey = useCallback((e) => {
    if (e.key === 'Escape' && product) onClose();
  }, [product, onClose]);

  useEffect(() => {
    if (product) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [product, handleEscKey]);

  useEffect(() => {
    setActiveImage('depan');
  }, [product?.id]);

  if (!product) return null;

  const qtyToko = Number(data?.qty_toko) || 0;
  const qtyBengkel = Number(data?.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;

  const fotoUrls = [
    resolveImage(data?.foto_depan_url, data?.foto_depan),
    resolveImage(data?.foto_samping_url, data?.foto_samping),
    resolveImage(data?.foto_atas_url, data?.foto_atas),
  ].filter(Boolean);

  const waText = encodeURIComponent(
    `Halo Jaya Rubber Seal, saya tertarik dengan produk ${data?.kode || ''} (${data?.jenis?.nama || ''} ${data?.type?.nama || ''}). Apakah stok tersedia?`
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-brand-500 to-ocean-500 rounded-lg shadow-sm flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="modal-product-title" className="text-lg font-bold text-slate-900 truncate">
                {isLoading ? 'Memuat detail...' : data?.kode || '-'}
              </h2>
              <p className="text-xs text-slate-500 truncate">
                {[data?.jenis?.nama, data?.type?.nama, data?.bahan?.nama].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 sm:p-6 space-y-6">
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
              <>
                {/* Photo Gallery */}
                {fotoUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {fotoUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Foto produk ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full aspect-video bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                    <Package className="w-12 h-12 text-slate-300" />
                  </div>
                )}

                {/* Price & Stock Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <p className="text-xs text-emerald-600 font-medium mb-1 uppercase tracking-wide">Harga Umum</p>
                    <p className="text-xl font-bold text-emerald-700">{formatRupiah(data?.harga_umum)}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <p className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">Total Stok</p>
                    <p className={cn("text-xl font-bold", totalQty < 20 ? "text-red-600" : "text-blue-700")}>
                      {totalQty} Unit
                    </p>
                  </div>
                </div>

                {/* Detail Items */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                      <Tag className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Spesifikasi</p>
                      <p className="text-sm font-medium text-slate-900">
                        {data?.jenis?.nama || '-'} {data?.type?.nama ? `- ${data.type.nama}` : ''}{' '}
                        {data?.bahan?.nama ? `(${data.bahan.nama})` : ''} | {data?.ukuran || 'Ukuran standar'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                        <Warehouse className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Stok Toko</p>
                        <p className="text-sm font-bold text-slate-900">{qtyToko} Unit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                        <Warehouse className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Stok Bengkel</p>
                        <p className="text-sm font-bold text-slate-900">{qtyBengkel} Unit</p>
                      </div>
                    </div>
                  </div>

                  {data?.keterangan && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="p-2 bg-slate-200 rounded-lg flex-shrink-0">
                        <Ruler className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Keterangan</p>
                        <p className="text-sm text-slate-900 break-words">{data.keterangan}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky Actions */}
        {!isLoading && (
          <div className="sticky bottom-0 px-5 py-4 border-t border-slate-200/60 bg-white flex gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95"
            >
              Tutup
            </button>
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-ocean-500 hover:shadow-lg hover:shadow-brand-500/30 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              Tanya Stok via WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================
   PRODUCT CARD
   ========================================== */
const ProductCard = ({ product, index, onSelect }) => {
  const imageUrl = resolveImage(product.foto_depan_url, product.foto_depan);
  const productName = product.jenis?.nama || product.kode || 'Produk Rubber Seal';
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
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 cursor-pointer"
      data-aos="fade-up"
      data-aos-delay={Math.min(index * 50, 300)}
      aria-label={`Lihat detail produk ${fullLabel}`}
    >
      <div className="relative aspect-square bg-gradient-to-br from-brand-50 to-ocean-50 overflow-hidden">
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
            <Package className="text-brand-300" size={48} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 pointer-events-none">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Eye size={16} aria-hidden="true" />
            <span>Klik untuk Detail</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-mono text-slate-600 mb-1">{product.kode || '-'}</p>
        <h3 className="font-display font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors min-h-[3rem]">
          {productName} {product.type?.nama || ''}
        </h3>

        {product.ukuran && (
          <p className="text-xs text-slate-700 mb-3 flex items-center gap-1">
            <span className="font-medium">Ukuran:</span>
            <span>{product.ukuran}</span>
          </p>
        )}

        {product.bahan?.nama && (
          <p className="text-xs text-slate-700 mb-3 flex items-center gap-1">
            <span className="font-medium">Bahan:</span>
            <span>{product.bahan.nama}</span>
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-sm font-bold text-brand-600 flex items-center gap-1">
            Lihat Detail
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
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
  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100" role="status" aria-label="Memuat produk">
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
const DesktopFilterSidebar = ({ filters, setFilters, jenisList, typeList, isLoadingJenis, isLoadingType }) => {
  const activeFiltersCount = (filters.jenisId ? 1 : 0) + (filters.typeId ? 1 : 0);

  const handleSelectJenis = (jenisId) => {
    setFilters((prev) => ({ ...prev, jenisId: prev.jenisId === jenisId ? null : jenisId, typeId: null, page: 1 }));
  };

  const handleSelectType = (typeId) => {
    setFilters((prev) => ({ ...prev, typeId: prev.typeId === typeId ? null : typeId, page: 1 }));
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
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
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
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                !filters.jenisId ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
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
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                    isActive ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
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
          <p className="text-xs text-slate-500 italic py-2">Pilih jenis produk terlebih dahulu untuk melihat tipe yang tersedia.</p>
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
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                !filters.typeId ? 'bg-ocean-50 text-ocean-700 border border-ocean-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
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
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                    isActive ? 'bg-ocean-50 text-ocean-700 border border-ocean-200' : 'text-slate-700 hover:bg-slate-50 border border-transparent'
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
   MOBILE QUICK FILTER CHIPS
   ========================================== */
const MobileQuickFilterChips = ({ filters, setFilters, jenisList, typeList }) => {
  const hasFilters = filters.jenisId || filters.typeId;

  const handleSelectJenis = (jenisId) => {
    setFilters((prev) => ({ ...prev, jenisId: prev.jenisId === jenisId ? null : jenisId, typeId: null, page: 1 }));
  };

  const handleSelectType = (typeId) => {
    setFilters((prev) => ({ ...prev, typeId: prev.typeId === typeId ? null : typeId, page: 1 }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, jenisId: null, typeId: null, page: 1 }));
  };

  return (
    <div className="mb-6">
      {hasFilters && (
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-red-600 text-sm font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
            aria-label="Hapus semua filter"
          >
            <X size={14} aria-hidden="true" />
            Reset Filter
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="radiogroup" aria-label="Filter jenis produk">
        <button
          onClick={() => handleSelectJenis(null)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 border-2 flex-shrink-0',
            !filters.jenisId ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
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
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 border-2 flex-shrink-0',
                isActive ? 'bg-brand-500 text-white border-brand-500 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
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
        <div className="flex gap-2 overflow-x-auto pb-2 mt-3 -mx-4 px-4" role="radiogroup" aria-label="Filter tipe produk" data-aos="fade-down">
          <button
            onClick={() => handleSelectType(null)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-ocean-500 border-2 flex-shrink-0',
              !filters.typeId ? 'bg-ocean-500 text-white border-ocean-500 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-ocean-300'
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
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all focus:outline-none focus:ring-2 focus:ring-ocean-500 border-2 flex-shrink-0',
                  isActive ? 'bg-ocean-500 text-white border-ocean-500 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-ocean-300'
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
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
          currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
        )}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Sebelumnya</span>
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Halaman 1">
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
            'w-10 h-10 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
            page === currentPage ? 'bg-gradient-to-r from-brand-500 to-ocean-500 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
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
          <button onClick={() => onPageChange(totalPages)} className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label={`Halaman ${totalPages}`}>
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
          currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
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
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6" aria-hidden="true">
      <Package size={40} className="text-slate-400" />
    </div>
    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Produk Tidak Ditemukan</h3>
    <p className="text-slate-600 mb-6 max-w-md mx-auto">
      Maaf, tidak ada produk yang sesuai dengan filter yang Anda pilih. Coba ubah filter atau hapus semua filter untuk melihat semua produk.
    </p>
    <button
      onClick={onClearFilters}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
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
      Maaf, kami tidak dapat memuat daftar produk. Silakan coba lagi nanti atau hubungi tim support kami.
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      Coba Lagi
    </button>
  </div>
);

/* ==========================================
   PRODUCTS PAGE - MAIN
   ========================================== */
const ProductsPage = () => {
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
  } = useAllProducts({
    page: filters.page,
    pageSize: filters.pageSize,
    jenisId: filters.jenisId,
    typeId: filters.typeId,
  });

  const products = productsData.data || [];
  const totalProducts = productsData.total || 0;
  const totalPages = productsData.lastPage || 1;

  // Sync URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.jenisId) params.set('jenis_id', filters.jenisId.toString());
    if (filters.typeId) params.set('type_id', filters.typeId.toString());
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.pageSize !== 12) params.set('pageSize', filters.pageSize.toString());
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // AOS
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.jenisId, filters.typeId, filters.pageSize]);

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
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: APP_URL },
          { '@type': 'ListItem', position: 2, name: 'Semua Produk', item: `${APP_URL}/products` },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Katalog Produk Rubber Seal',
        numberOfItems: totalProducts,
        itemListElement: products.slice(0, 20).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: [product.jenis?.nama, product.type?.nama, product.ukuran].filter(Boolean).join(' ') || product.kode,
            sku: product.kode,
            description: product.keterangan || 'Produk rubber seal berkualitas',
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
        title="Semua Produk"
        description="Jelajahi katalog lengkap produk rubber seal, o-ring, gasket, mounting karet, dan seal industri berkualitas tinggi dari Jaya Rubber Seal. Harga pabrik langsung."
        keywords="produk rubber seal, katalog rubber seal, daftar produk karet, o-ring, gasket, mounting karet, oil seal"
        schema={productsSchema}
      />
      <main id="main-content" tabIndex="-1">
        <h1 className="sr-only">Semua Produk Rubber Seal — Jaya Rubber Seal</h1>

        {/* Slim header */}
        <section className="relative pt-6 sm:pt-8 pb-2 bg-gradient-to-br from-white via-brand-50 to-ocean-50">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-10 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Katalog Produk</h2>
              <div className="flex items-center gap-2 text-sm text-slate-600" aria-live="polite">
                <Package size={18} aria-hidden="true" />
                <span className="font-semibold text-slate-900">{totalProducts.toLocaleString('id-ID')}</span>
                <span>produk</span>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-6 sm:py-10 bg-white" aria-label="Daftar produk">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {/* DESKTOP ONLY: Sidebar kiri, selalu visible, sticky */}
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
                {/* MOBILE ONLY: Quick filter chips di atas grid */}
                <div className="lg:hidden">
                  <MobileQuickFilterChips filters={filters} setFilters={setFilters} jenisList={jenisList} typeList={typeList} />
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
                          <ProductCard product={product} index={index} onSelect={setSelectedProduct} />
                        </div>
                      ))}
                    </div>

                    <Pagination currentPage={filters.page} totalPages={totalPages} onPageChange={handlePageChange} />
                  </>
                ) : (
                  <EmptyState onClearFilters={clearAllFilters} />
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal Detail */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </>
  );
};

export default ProductsPage;