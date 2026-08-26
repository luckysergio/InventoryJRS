import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Filter, X, ChevronRight, ChevronLeft, ChevronDown,
  Package, SlidersHorizontal, Grid3x3, List, ArrowUpDown,
  Home, Eye, ShoppingCart, Sparkles, CheckCircle2, AlertCircle,
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import Section from './components/Section';
import { useAllProducts } from './hooks/usePublicProducts';
import { cn } from '../../lib/utils';

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

/* ==========================================
   DATA CONSTANTS - Filter Options
   ========================================== */
const CATEGORIES = [
  { id: 'all', name: 'Semua Kategori', icon: Package },
  { id: 'o-ring', name: 'O-Ring', icon: Package },
  { id: 'gasket', name: 'Gasket', icon: Package },
  { id: 'mounting', name: 'Mounting Karet', icon: Package },
  { id: 'oil-seal', name: 'Oil Seal', icon: Package },
  { id: 'custom', name: 'Custom Rubber', icon: Sparkles },
];

const MATERIALS = [
  { id: 'nbr', name: 'NBR (Nitrile)' },
  { id: 'viton', name: 'Viton (FKM)' },
  { id: 'silicone', name: 'Silicone' },
  { id: 'epdm', name: 'EPDM' },
  { id: 'natural', name: 'Natural Rubber' },
  { id: 'neoprene', name: 'Neoprene' },
];

const SORT_OPTIONS = [
  { id: 'newest', name: 'Terbaru', icon: ArrowUpDown },
  { id: 'popular', name: 'Terpopuler', icon: ArrowUpDown },
  { id: 'name-asc', name: 'Nama A-Z', icon: ArrowUpDown },
  { id: 'name-desc', name: 'Nama Z-A', icon: ArrowUpDown },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48];

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
   BREADCRUMB
   ========================================== */
const Breadcrumb = () => (
  <nav aria-label="Breadcrumb" className="mb-6">
    <ol className="flex items-center gap-2 text-sm text-slate-600">
      <li>
        <Link
          to="/"
          className="flex items-center gap-1 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
          aria-label="Kembali ke beranda"
        >
          <Home size={16} aria-hidden="true" />
          <span>Beranda</span>
        </Link>
      </li>
      <li aria-hidden="true">
        <ChevronRight size={16} className="text-slate-400" />
      </li>
      <li>
        <span className="font-semibold text-slate-900" aria-current="page">
          Semua Produk
        </span>
      </li>
    </ol>
  </nav>
);

/* ==========================================
   PRODUCT CARD
   ========================================== */
const ProductCard = ({ product, index }) => {
  const imageUrl = product.foto_depan_url || (product.foto_depan ? `${ASSET_URL}/storage/${product.foto_depan}` : null);
  const productName = product.jenis?.nama || product.kode || 'Produk Rubber Seal';

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      data-aos="fade-up"
      data-aos-delay={index * 50}
      aria-label={`Lihat detail produk ${productName}`}
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
        
        {/* Badges */}
        {product.is_best_seller && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
            <Sparkles size={12} aria-hidden="true" />
            <span>Best Seller</span>
          </div>
        )}
        
        {product.is_custom && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold shadow-lg flex items-center gap-1">
            <Sparkles size={12} aria-hidden="true" />
            <span>Custom</span>
          </div>
        )}

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <div className="flex items-center gap-2 text-white text-sm font-semibold">
            <Eye size={16} aria-hidden="true" />
            <span>Lihat Detail</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs font-mono text-slate-500 mb-1">{product.kode || '-'}</p>
        <h3 className="font-display font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors min-h-[3rem]">
          {productName} {product.type?.nama || ''}
        </h3>
        
        {product.ukuran && (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
            <span className="font-medium">Ukuran:</span>
            <span>{product.ukuran}</span>
          </p>
        )}

        {product.material && (
          <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
            <span className="font-medium">Material:</span>
            <span>{product.material}</span>
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-sm font-bold text-brand-600 flex items-center gap-1">
            Lihat Detail
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
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
   FILTER SIDEBAR
   ========================================== */
const FilterSidebar = ({ filters, setFilters, isOpen, onClose }) => {
  const toggleCategory = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleMaterial = (materialId) => {
    setFilters(prev => ({
      ...prev,
      materials: prev.materials.includes(materialId)
        ? prev.materials.filter(id => id !== materialId)
        : [...prev.materials, materialId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      materials: [],
      search: filters.search,
      sort: 'newest',
    });
  };

  const activeFiltersCount = filters.categories.length + filters.materials.length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 lg:top-24 left-0 h-screen lg:h-auto w-80 lg:w-72 bg-white lg:bg-transparent z-50 lg:z-0 transform transition-transform duration-300 lg:transform-none overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        aria-label="Filter produk"
      >
        <div className="p-6 lg:p-0 lg:space-y-6">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-lg font-display font-bold text-slate-900">Filter Produk</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Tutup filter"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between mb-4">
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

          {/* Active filters count mobile */}
          {activeFiltersCount > 0 && (
            <div className="lg:hidden mb-4">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Hapus {activeFiltersCount} Filter Aktif
              </button>
            </div>
          )}

          {/* Categories */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Package size={18} aria-hidden="true" />
              Kategori
            </h3>
            <div className="space-y-2" role="group" aria-label="Filter kategori">
              {CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const isActive = filters.categories.includes(cat.id) || (cat.id === 'all' && filters.categories.length === 0);
                return (
                  <button
                    key={cat.id}
                    onClick={() => cat.id === 'all' 
                      ? setFilters(prev => ({ ...prev, categories: [] }))
                      : toggleCategory(cat.id)
                    }
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                      isActive
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    )}
                    aria-pressed={isActive}
                  >
                    <IconComponent size={16} aria-hidden="true" />
                    <span className="flex-1 text-left">{cat.name}</span>
                    {isActive && <CheckCircle2 size={16} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-display font-bold text-slate-900 mb-4">Material</h3>
            <div className="space-y-2" role="group" aria-label="Filter material">
              {MATERIALS.map(material => {
                const isActive = filters.materials.includes(material.id);
                return (
                  <button
                    key={material.id}
                    onClick={() => toggleMaterial(material.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
                      isActive
                        ? 'bg-brand-50 text-brand-700 border border-brand-200'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    )}
                    aria-pressed={isActive}
                  >
                    <span>{material.name}</span>
                    {isActive && <CheckCircle2 size={16} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile apply button */}
          <button
            onClick={onClose}
            className="lg:hidden w-full mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-bold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Terapkan Filter
          </button>
        </div>
      </aside>
    </>
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
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="Navigasi halaman produk" className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
          currentPage === 1
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
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
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Halaman 1"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-slate-400" aria-hidden="true">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'w-10 h-10 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
            page === currentPage
              ? 'bg-gradient-to-r from-brand-500 to-ocean-500 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
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
            className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
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
          'flex items-center gap-1 px-4 py-2 rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500',
          currentPage === totalPages
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white text-slate-700 hover:bg-brand-50 hover:text-brand-600 border border-slate-200'
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
   EMPTY STATE
   ========================================== */
const EmptyState = ({ onClearFilters }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6" aria-hidden="true">
      <Package size={40} className="text-slate-400" />
    </div>
    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
      Produk Tidak Ditemukan
    </h3>
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

/* ==========================================
   ERROR STATE
   ========================================== */
const ErrorState = ({ onRetry }) => (
  <div className="text-center py-16 px-4">
    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6" aria-hidden="true">
      <AlertCircle size={40} className="text-red-500" />
    </div>
    <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
      Terjadi Kesalahan
    </h3>
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
   PRODUCTS PAGE - Main Component
   ========================================== */
const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    categories: searchParams.get('category') ? [searchParams.get('category')] : [],
    materials: searchParams.get('material') ? searchParams.get('material').split(',') : [],
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '12'),
  });

  // Fetch products
  const { data: productsData = { data: [], total: 0 }, isLoading, error, refetch } = useAllProducts({
    page: filters.page,
    pageSize: filters.pageSize,
    category: filters.categories.join(','),
    material: filters.materials.join(','),
    search: filters.search,
    sort: filters.sort,
  });

  const products = productsData.data || [];
  const totalProducts = productsData.total || 0;
  const totalPages = Math.ceil(totalProducts / filters.pageSize);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.categories.length > 0) params.set('category', filters.categories.join(','));
    if (filters.materials.length > 0) params.set('material', filters.materials.join(','));
    if (filters.search) params.set('search', filters.search);
    if (filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.pageSize !== 12) params.set('pageSize', filters.pageSize.toString());
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Initialize AOS
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, [filters.categories, filters.materials, filters.search, filters.sort, filters.pageSize]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFilters(prev => ({ ...prev, search: formData.get('search') || '' }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      materials: [],
      search: '',
      sort: 'newest',
      page: 1,
      pageSize: filters.pageSize,
    });
  };

  const activeFiltersCount = filters.categories.length + filters.materials.length + (filters.search ? 1 : 0);

  const productsSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.jenis?.nama || product.kode || 'Produk Rubber Seal',
        description: product.jenis?.deskripsi || 'Produk rubber seal berkualitas',
        sku: product.kode,
        image: product.foto_depan_url || (product.foto_depan ? `${ASSET_URL}/storage/${product.foto_depan}` : ''),
      }
    })),
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title="Semua Produk"
        description="Jelajahi katalog lengkap produk rubber seal, mounting, o-ring, gasket, dan seal industri berkualitas tinggi dari Jaya Rubber Seal. Harga pabrik langsung."
        keywords="produk rubber seal, katalog rubber seal, daftar produk karet, o-ring, gasket, mounting karet, oil seal"
        schema={productsSchema}
      />
      <main id="main-content" tabIndex="-1">
        {/* Page Header */}
        <section className="relative pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 bg-gradient-to-br from-white via-brand-50 to-ocean-50">
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-20 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumb />
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div data-aos="fade-right">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 mb-2">
                  Semua Produk
                </h1>
                <p className="text-base sm:text-lg text-slate-700">
                  Jelajahi katalog lengkap produk rubber seal berkualitas tinggi
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600" data-aos="fade-left">
                <Package size={18} aria-hidden="true" />
                <span className="font-semibold text-slate-900">
                  {totalProducts.toLocaleString('id-ID')}
                </span>
                <span>produk ditemukan</span>
              </div>
            </div>

            {/* Search & Controls */}
            <div className="flex flex-col sm:flex-row gap-3" data-aos="fade-up" data-aos-delay="100">
              {/* Search Bar */}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <label htmlFor="product-search" className="sr-only">Cari produk</label>
                <div className="relative">
                  <Search 
                    size={20} 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                    aria-hidden="true" 
                  />
                  <input
                    type="search"
                    id="product-search"
                    name="search"
                    defaultValue={filters.search}
                    placeholder="Cari produk berdasarkan nama, kode, atau material..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    aria-label="Cari produk"
                  />
                  {filters.search && (
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                      aria-label="Hapus pencarian"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </form>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="lg:hidden inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="Buka filter produk"
              >
                <Filter size={18} aria-hidden="true" />
                <span>Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-brand-500 text-white text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <label htmlFor="product-sort" className="sr-only">Urutkan produk</label>
                <select
                  id="product-sort"
                  value={filters.sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                  className="appearance-none w-full sm:w-auto px-6 py-3.5 pr-10 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                  aria-label="Urutkan produk"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={18} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                  aria-hidden="true" 
                />
              </div>

              {/* Page Size */}
              <div className="relative">
                <label htmlFor="page-size" className="sr-only">Jumlah produk per halaman</label>
                <select
                  id="page-size"
                  value={filters.pageSize}
                  onChange={(e) => setFilters(prev => ({ ...prev, pageSize: parseInt(e.target.value) }))}
                  className="appearance-none w-full sm:w-auto px-6 py-3.5 pr-10 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer"
                  aria-label="Jumlah produk per halaman"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>
                      {size} / halaman
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  size={18} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
                  aria-hidden="true" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-8 sm:py-12 bg-white" aria-label="Daftar produk">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-8">
              {/* Filter Sidebar */}
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                isOpen={filterOpen}
                onClose={() => setFilterOpen(false)}
              />

              {/* Products Grid */}
              <div className="flex-1 min-w-0">
                {error ? (
                  <ErrorState onRetry={refetch} />
                ) : isLoading ? (
                  <div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    role="status"
                    aria-label="Memuat produk"
                  >
                    {[...Array(filters.pageSize)].map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
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
    </>
  );
};

export default ProductsPage;