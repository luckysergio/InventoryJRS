import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Factory, Truck, HeadphonesIcon, Award, Sparkles,
  Star, ArrowRight, CheckCircle2, ChevronDown,
  Phone, Mail, Package, Cog,
  Quote, Users, ThumbsUp, CircleDot, Layers, Wrench,
  MessageSquare, FileCheck, ClipboardCheck, PackageCheck,
  X, Tag, Warehouse, Calendar,
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import Section from './components/Section';
import { useBestSellerProducts } from './hooks/usePublicProducts';
import { cn } from '../../lib/utils';

const APP_URL = import.meta.env.VITE_APP_URL || 'https://www.jayarubberseal.com';

const resolveImage = (url, path) => {
  if (url) return url;
  if (path) return `${APP_URL}/storage/${path}`;
  return null;
};

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);

const WA_NUMBER = '6281287951140';

const STATS = [
  { icon: Users, value: '1.000+', label: 'Pelanggan Puas', ariaLabel: 'Lebih dari 1000 pelanggan puas' },
  { icon: Award, value: '15+', label: 'Tahun Pengalaman', ariaLabel: 'Lebih dari 15 tahun pengalaman' },
  { icon: Factory, value: '500+', label: 'Varian Produk', ariaLabel: 'Lebih dari 500 varian produk' },
  { icon: ThumbsUp, value: '99%', label: 'Tingkat Kepuasan', ariaLabel: '99 persen tingkat kepuasan pelanggan' },
];

const FEATURES = [
  { icon: Shield, title: 'Garansi Kualitas', description: 'Setiap produk melewati quality control ketat untuk memastikan daya tahan dan performa terbaik di lapangan.', color: 'from-emerald-500 to-teal-600' },
  { icon: Factory, title: 'Harga Pabrik Langsung', description: 'Dapatkan harga kompetitif langsung dari produsen tanpa perantara, hemat biaya operasional industri Anda.', color: 'from-blue-500 to-indigo-600' },
  { icon: Truck, title: 'Pengiriman Cepat', description: 'Stok selalu ready dan pengiriman cepat ke seluruh Indonesia dengan packaging aman dan terjamin.', color: 'from-orange-500 to-red-600' },
  { icon: HeadphonesIcon, title: 'Support 24/7', description: 'Tim teknis kami siap membantu konsultasi dan after-sales service kapan pun Anda membutuhkan.', color: 'from-purple-500 to-pink-600' },
  { icon: Award, title: 'Produk Bersertifikat', description: 'Material karet berkualitas tinggi yang telah memenuhi standar industri nasional dan internasional.', color: 'from-amber-500 to-yellow-600' },
  { icon: Cog, title: 'Custom Order', description: 'Melayani pembuatan rubber seal custom sesuai spesifikasi dan dimensi khusus kebutuhan proyek Anda.', color: 'from-cyan-500 to-sky-600' },
];

const CATEGORIES = [
  { name: 'O-Ring', path: '/products', description: 'O-ring berbagai ukuran dan material (NBR, Viton, Silicone, EPDM) untuk sealing industri dan otomotif.', icon: CircleDot, badge: 'Best Seller', gradient: 'from-brand-500 to-brand-700' },
  { name: 'Gasket', path: '/products', description: 'Gasket karet tahan panas, oli, dan kimia untuk aplikasi mesin industri, pipa, dan flange.', icon: Layers, badge: 'Populer', gradient: 'from-ocean-500 to-ocean-700' },
  { name: 'Rubber Mounting', path: '/products', description: 'Mounting karet anti-vibrasi untuk mesin, genset, kendaraan, dan peralatan industri berat.', icon: Wrench, badge: 'Tersedia', gradient: 'from-emerald-500 to-teal-700' },
  { name: 'Custom Rubber', path: '/products/custom', description: 'Layanan produksi karet custom sesuai gambar teknis dan spesifikasi khusus proyek Anda.', icon: Cog, badge: 'On Demand', gradient: 'from-purple-500 to-indigo-700' },
];

const PROCESS_STEPS = [
  { number: 1, title: 'Konsultasi', description: 'Hubungi tim kami via WhatsApp atau telepon untuk mendiskusikan kebutuhan rubber seal Anda.', icon: MessageSquare },
  { number: 2, title: 'Penawaran', description: 'Kami berikan penawaran harga terbaik beserta spesifikasi produk yang sesuai kebutuhan.', icon: FileCheck },
  { number: 3, title: 'Konfirmasi', description: 'Setelah deal, lakukan pembayaran dan kami segera proses pesanan Anda dengan cepat.', icon: ClipboardCheck },
  { number: 4, title: 'Pengiriman', description: 'Produk dikirim dengan packaging aman ke alamat Anda di seluruh Indonesia.', icon: PackageCheck },
];

const TESTIMONIALS = [
  { name: 'Budi Santoso', role: 'Procurement Manager', company: 'PT. Manufaktur Jaya', content: 'Kualitas O-Ring dari Jaya Rubber Seal sangat bagus dan tahan lama. Sudah 3 tahun jadi supplier utama kami dan belum pernah mengecewakan.', rating: 5, initials: 'BS' },
  { name: 'Ir. Hartono', role: 'Plant Engineer', company: 'PT. Auto Parts Indonesia', content: 'Respons cepat, harga bersaing, dan produk selalu ready stock. Sangat membantu kelancaran produksi kami. Recommended!', rating: 5, initials: 'IH' },
  { name: 'Siti Rahayu', role: 'Owner', company: 'Bengkel Maju Motor', content: 'Pelayanan ramah dan bisa custom sesuai kebutuhan bengkel saya. Pengiriman juga cepat sampai ke Surabaya. Terima kasih Jaya Rubber Seal!', rating: 5, initials: 'SR' },
];

const FAQ_ITEMS = [
  { question: 'Apa saja jenis material karet yang tersedia?', answer: 'Kami menyediakan berbagai material karet seperti NBR (Nitrile), Viton (FKM), Silicone, EPDM, Natural Rubber, dan Neoprene. Setiap material memiliki karakteristik khusus untuk aplikasi yang berbeda, dan tim kami siap membantu Anda memilih yang paling sesuai.' },
  { question: 'Apakah bisa order custom sesuai ukuran khusus?', answer: 'Ya, kami melayani pembuatan rubber seal custom sesuai gambar teknis atau sampel yang Anda berikan. Minimum order bervariasi tergantung kompleksitas produk. Silakan hubungi tim kami untuk konsultasi lebih lanjut.' },
  { question: 'Berapa lama waktu pengiriman?', answer: 'Untuk produk ready stock, pengiriman dilakukan dalam 1-2 hari kerja. Untuk area Jakarta dan sekitarnya biasanya sampai dalam 1 hari, sedangkan luar pulau 2-5 hari tergantung lokasi dan jasa ekspedisi yang dipilih.' },
  { question: 'Apakah ada garansi untuk produk yang dijual?', answer: 'Ya, semua produk kami memiliki garansi kualitas. Jika terdapat cacat produksi atau tidak sesuai spesifikasi, kami akan melakukan penggantian tanpa biaya tambahan. Garansi tidak berlaku untuk kesalahan pemilihan material atau kerusakan akibat pemakaian.' },
  { question: 'Bagaimana cara melakukan pemesanan?', answer: 'Anda bisa memesan melalui WhatsApp, email, atau datang langsung ke toko kami di Glodok Jaya. Cukup berikan informasi jenis produk, ukuran, material, dan jumlah yang dibutuhkan. Tim kami akan segera memberikan penawaran harga.' },
  { question: 'Apakah melayani pembelian satuan atau hanya grosir?', answer: 'Kami melayani pembelian baik satuan (eceran) maupun grosir (partai besar). Untuk pembelian dalam jumlah besar, kami menawarkan harga khusus yang lebih kompetitif. Hubungi kami untuk mendapatkan penawaran terbaik.' },
];

const SkipNavigation = () => (
  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white">
    Lewati ke konten utama
  </a>
);

const ProductDetailModal = ({ product, onClose }) => {
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

  if (!product) return null;

  const fotoUrls = [
    resolveImage(product.foto_depan_url, product.foto_depan),
    resolveImage(product.foto_samping_url, product.foto_samping),
    resolveImage(product.foto_atas_url, product.foto_atas),
  ].filter(Boolean);

  const waText = encodeURIComponent(`Halo Jaya Rubber Seal, saya tertarik dengan produk ${product.kode} (${product.jenis?.nama} ${product.type?.nama}). Apakah stok tersedia?`);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-labelledby="modal-product-title">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 px-5 py-4 border-b border-slate-200/60 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-brand-500 to-ocean-500 rounded-lg shadow-sm flex-shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="modal-product-title" className="text-lg font-bold text-slate-900 truncate">{product.kode}</h2>
              <p className="text-xs text-slate-500 truncate">
                {[product.jenis?.nama, product.type?.nama, product.bahan?.nama].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" aria-label="Tutup modal">
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Photo Gallery */}
            {fotoUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {fotoUrls.map((url, idx) => (
                  <img key={idx} src={url} alt={`Foto produk ${idx + 1}`} className="w-full aspect-square object-cover rounded-xl border border-slate-200 shadow-sm" />
                ))}
              </div>
            ) : (
              <div className="w-full aspect-video bg-slate-50 rounded-xl flex items-center justify-center border border-dashed border-slate-200">
                <Package className="w-12 h-12 text-slate-300" />
              </div>
            )}

            {/* Detail Items */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0"><Tag className="w-4 h-4 text-purple-600" /></div>
                <div className="flex-1">
                  <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Spesifikasi</p>
                  <p className="text-sm font-medium text-slate-900">
                    {product.jenis?.nama || '-'} {product.type?.nama ? `- ${product.type.nama}` : ''} {product.bahan?.nama ? `(${product.bahan.nama})` : ''} | {product.ukuran || 'Ukuran standar'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="sticky bottom-0 px-5 py-4 border-t border-slate-200/60 bg-white flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95">
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
      </div>
    </div>
  );
};

const HeroSection = () => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <section id="home" className="relative pt-6 sm:pt-10 lg:pt-16 pb-14 lg:pb-20 overflow-hidden bg-gradient-to-br from-white via-brand-50 to-ocean-50" aria-labelledby="hero-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-100/20 to-transparent rounded-full" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div data-aos="fade-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-200 shadow-sm mb-5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">Spesialis Rubber Seal Sejak 2010</span>
            </div>

            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-slate-900 mb-5 text-balance">
              Solusi{' '}
              <span className="relative inline-block">
                <span className="text-gradient">Rubber Seal</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 10C50 4 150 2 298 8" stroke="url(#underline)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline" x1="0" y1="0" x2="300" y2="0">
                      <stop stopColor="#06b6d4" />
                      <stop offset="1" stopColor="#0ea5e9" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>{' '}
              Berkualitas untuk Industri Anda
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-7 max-w-xl">
              Jaya Rubber Seal menyediakan berbagai produk rubber seal, mounting, dan seal industri berkualitas tinggi dengan{' '}
              <strong className="text-slate-900">harga pabrik langsung</strong>. Dipercaya oleh 1000+ pelanggan di seluruh Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link to="/products" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                Lihat Katalog Produk
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20tertarik%20dengan%20produk%20Anda`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
                <Phone size={18} aria-hidden="true" />
                Konsultasi Gratis
              </a>
            </div>

            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700 list-none p-0 m-0" role="list">
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" aria-hidden="true" /><span>Produk Original</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" aria-hidden="true" /><span>Garansi Kualitas</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" aria-hidden="true" /><span>Pengiriman Cepat</span></li>
            </ul>
          </div>

          <div className="relative" data-aos="fade-left" data-aos-delay="200">
            <div className="relative aspect-square max-w-md lg:max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 blur-2xl opacity-20" aria-hidden="true" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-100 to-ocean-100 flex items-center justify-center">
                <div className="absolute inset-8 rounded-full border-8 border-dashed border-white/50 animate-[spin_20s_linear_infinite]" aria-hidden="true" />
                <div className="absolute inset-16 rounded-full border-4 border-white/30 animate-[spin_15s_linear_infinite_reverse]" aria-hidden="true" />

                <div className="relative z-10 text-center p-6">
                  {logoFailed ? (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-2xl" role="img" aria-label="Logo Jaya Rubber Seal">
                      <span className="text-5xl sm:text-6xl font-display font-black text-white">JRS</span>
                    </div>
                  ) : (
                    <img
                      src="/Logo/logo.png"
                      alt="Logo Jaya Rubber Seal - Spesialis Rubber Seal Jakarta"
                      className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 object-contain drop-shadow-2xl"
                      width="160"
                      height="160"
                      fetchPriority="high"
                      loading="eager"
                      decoding="async"
                      onError={() => setLogoFailed(true)}
                    />
                  )}
                  <p className="text-xl sm:text-2xl font-display font-bold text-slate-900">Jaya Rubber Seal</p>
                  <p className="text-sm text-slate-700 mt-1">Rubber & Seal Specialist</p>
                </div>
              </div>

              <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-3 animate-float" data-aos="fade-down" data-aos-delay="400" role="status" aria-label="Berpengalaman lebih dari 15 tahun">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0" aria-hidden="true"><Award className="text-emerald-600" size={22} /></div>
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-700 font-medium">Berpengalaman</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">15+ Tahun</p>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-3 animate-float" style={{ animationDelay: '1.5s' }} data-aos="fade-up" data-aos-delay="600" role="status" aria-label="Rating 4.9 dari 5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0" aria-hidden="true"><Star className="text-amber-500 fill-amber-500" size={22} /></div>
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-700 font-medium">Rating</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">4.9/5.0</p>
                </div>
              </div>

              <div className="absolute top-1/2 -right-4 lg:-right-8 bg-white rounded-2xl shadow-xl p-3 sm:p-4 hidden sm:flex items-center gap-3 animate-float" style={{ animationDelay: '0.5s' }} data-aos="fade-left" data-aos-delay="800" role="status" aria-label="Lebih dari 1000 pelanggan">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0" aria-hidden="true"><Users className="text-brand-600" size={24} /></div>
                <div>
                  <p className="text-xs text-slate-700 font-medium">Pelanggan</p>
                  <p className="font-bold text-slate-900">1000+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsSection = () => (
  <section className="py-10 sm:py-12 bg-white border-y border-slate-100" aria-label="Statistik perusahaan">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {STATS.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.label} className="text-center group" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-ocean-50 mb-3 group-hover:scale-110 transition-transform" aria-hidden="true">
                <IconComponent className="text-brand-600" size={24} />
              </div>
              <p className="text-3xl lg:text-4xl font-display font-black text-gradient mb-1" aria-label={stat.ariaLabel}>{stat.value}</p>
              <p className="text-sm text-slate-700 font-medium">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <Section id="features" title="Mengapa Memilih Jaya Rubber Seal?" subtitle="Keunggulan Kami" background="light">
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, idx) => {
        const IconComponent = feature.icon;
        return (
          <article key={feature.title} className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100" data-aos="fade-up" data-aos-delay={idx * 80}>
            <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform', feature.color)} aria-hidden="true">
              <IconComponent className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{feature.description}</p>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-100/30 to-transparent rounded-bl-3xl rounded-tr-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          </article>
        );
      })}
    </div>
  </Section>
);

const CategoriesSection = () => (
  <Section id="categories" title="Jelajahi Produk Kami" subtitle="Temukan yang Anda Butuhkan" background="white">
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {CATEGORIES.map((cat, idx) => {
        const IconComponent = cat.icon;
        return (
          <Link 
            key={cat.name}
            to={cat.path} 
            className="group relative overflow-hidden rounded-3xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" 
            data-aos="zoom-in" 
            data-aos-delay={idx * 120} 
            aria-label={`Lihat kategori ${cat.name}: ${cat.description}`}
          >
            <div className={cn('relative p-6 sm:p-8 bg-gradient-to-br text-white overflow-hidden', cat.gradient)}>
              <div className="absolute inset-0 opacity-10" aria-hidden="true">
                <div className="absolute -top-6 -right-6 w-32 h-32 border-8 border-white rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 border-8 border-white rounded-full" />
              </div>
              <div className="relative flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-transform" aria-hidden="true">
                  <IconComponent size={28} strokeWidth={2.5} />
                </div>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-semibold">{cat.badge}</span>
              </div>
              <h3 className="relative text-2xl font-display font-bold mt-5">{cat.name}</h3>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-sm text-slate-700 leading-relaxed mb-4">{cat.description}</p>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-600 group-hover:gap-3 transition-all">
                <span aria-hidden="true">Lihat Produk {cat.name}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  </Section>
);

const BestSellerSection = ({ onProductClick }) => {
  const { data: bestSellers = [], isLoading } = useBestSellerProducts(6);

  return (
    <Section id="products" title="Produk Terlaris Kami" subtitle="Pilihan Terbaik" background="light">
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Memuat produk">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-40 bg-slate-200 rounded-xl mb-4" aria-hidden="true" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" aria-hidden="true" />
              <div className="h-3 bg-slate-200 rounded w-1/2" aria-hidden="true" />
              <span className="sr-only">Memuat produk...</span>
            </div>
          ))}
        </div>
      ) : bestSellers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellers.slice(0, 6).map((product, idx) => (
            <div 
              key={product.id} 
              onClick={() => onProductClick(product)}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" 
              data-aos="fade-up" 
              data-aos-delay={idx * 80}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onProductClick(product); }}
              aria-label={`Lihat detail produk ${product.jenis?.nama || product.kode || 'Rubber Seal'}`}
            >
              <div className="relative aspect-square bg-gradient-to-br from-brand-50 to-ocean-50 overflow-hidden">
                {resolveImage(product.foto_depan_url, product.foto_depan) ? (
                  <img 
                    src={resolveImage(product.foto_depan_url, product.foto_depan)} 
                    alt={product.jenis?.nama || product.kode || 'Produk Rubber Seal'} 
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
                {product.rank && (
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center shadow-lg" aria-label={`Peringkat ${product.rank}`}>
                    #{product.rank}
                  </div>
                )}
                {/* Quick View Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 pointer-events-none">
                  <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <span>Klik untuk Detail</span>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-mono text-slate-600 mb-1">{product.kode}</p>
                <h3 className="font-display font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {product.jenis?.nama || 'Produk'} {product.type?.nama || ''}
                </h3>
                {product.ukuran && <p className="text-xs text-slate-700 mb-3">Ukuran: {product.ukuran}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-brand-600">Lihat Detail</span>
                  <ArrowRight size={16} className="text-brand-600 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package size={48} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
          <p className="text-slate-700">Belum ada produk terlaris</p>
        </div>
      )}

      <div className="text-center mt-10" data-aos="fade-up">
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-brand-200 text-brand-700 font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" aria-label="Lihat semua produk rubber seal">
          Lihat Semua Produk
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
};

const ProcessSection = () => (
  <Section id="process" title="Cara Kerja Kami" subtitle="Proses Mudah & Transparan" background="white">
    <div className="relative max-w-5xl mx-auto">
      <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-ocean-200 to-brand-200" aria-hidden="true" />
      <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative list-none p-0 m-0">
        {PROCESS_STEPS.map((step, idx) => {
          const IconComponent = step.icon;
          return (
            <li key={step.number} className="relative text-center" data-aos="fade-up" data-aos-delay={idx * 150}>
              <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 blur-xl opacity-30" aria-hidden="true" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-xl" aria-hidden="true">
                  <IconComponent className="text-white" size={36} strokeWidth={2} />
                </div>
                <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white border-4 border-brand-500 flex items-center justify-center" aria-hidden="true">
                  <span className="font-display font-black text-brand-600 text-sm">{step.number}</span>
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-2">Langkah {step.number}: {step.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </li>
          );
        })}
      </ol>
    </div>
  </Section>
);

const TestimonialsSection = () => (
  <Section id="testimonials" title="Apa Kata Pelanggan Kami" subtitle="Testimoni" background="light">
    <div className="grid md:grid-cols-3 gap-6">
      {TESTIMONIALS.map((t, idx) => (
        <blockquote key={t.name} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative" data-aos="fade-up" data-aos-delay={idx * 100}>
          <div className="absolute -top-4 right-6 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-lg" aria-hidden="true">
            <Quote className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1 mb-4" aria-label={`Rating ${t.rating} dari 5 bintang`}>
            {[...Array(t.rating)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" aria-hidden="true" />)}
            <span className="sr-only">{t.rating} dari 5 bintang</span>
          </div>
          <p className="text-slate-700 leading-relaxed mb-6 italic">&ldquo;{t.content}&rdquo;</p>
          <footer className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center text-white font-bold flex-shrink-0" aria-hidden="true">{t.initials}</div>
            <div>
              <cite className="font-display font-bold text-slate-900 not-italic">{t.name}</cite>
              <p className="text-xs text-slate-700">{t.role} • {t.company}</p>
            </div>
          </footer>
        </blockquote>
      ))}
    </div>
  </Section>
);

const FAQItem = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const questionId = `faq-question-${index}`;
  const answerId = `faq-answer-${index}`;
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-brand-300 transition-colors" data-aos="fade-up" data-aos-delay={index * 50}>
      <h3 className="m-0">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500" aria-expanded={isOpen} aria-controls={answerId} id={questionId}>
          <span className="font-semibold text-slate-900 text-sm sm:text-base flex-1">{item.question}</span>
          <ChevronDown size={20} className={cn('flex-shrink-0 text-brand-500 transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
        </button>
      </h3>
      <div id={answerId} role="region" aria-labelledby={questionId} className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-96' : 'max-h-0')}>
        <div className="px-5 sm:px-6 pb-4 text-sm text-slate-700 leading-relaxed">{item.answer}</div>
      </div>
    </div>
  );
};

const FAQSection = () => (
  <Section id="faq" title="Pertanyaan yang Sering Diajukan" subtitle="FAQ" background="white">
    <div className="max-w-3xl mx-auto space-y-3" role="list">
      {FAQ_ITEMS.map((item, idx) => (
        <div key={idx} role="listitem">
          <FAQItem item={item} index={idx} />
        </div>
      ))}
    </div>
  </Section>
);

const CTASection = () => (
  <section className="relative py-16 sm:py-20 overflow-hidden" aria-labelledby="cta-heading">
    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-ocean-600 to-brand-700" aria-hidden="true" />
    <div className="absolute inset-0 opacity-10" aria-hidden="true">
      <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-white rounded-full" />
    </div>
    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto" data-aos="zoom-in">
        <Sparkles className="w-12 h-12 text-white/90 mx-auto mb-4" aria-hidden="true" />
        <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 text-balance">
          Siap Memesan Rubber Seal Berkualitas?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Hubungi tim kami sekarang untuk konsultasi gratis dan dapatkan penawaran terbaik untuk kebutuhan rubber seal Anda!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href={`https://wa.me/${WA_NUMBER}?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20memesan%20produk`} target="_blank" rel="noopener noreferrer" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600" aria-label="Chat WhatsApp untuk memesan produk">
            <Phone size={20} aria-hidden="true" />
            Chat WhatsApp Sekarang
          </a>
          <Link to="/products" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600" aria-label="Lihat katalog produk">
            Lihat Katalog
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <address className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white text-sm not-italic">
          <a href="tel:+622162305916" className="flex items-center gap-2 hover:text-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1" aria-label="Hubungi telepon +62 21 62305916">
            <Phone size={16} aria-hidden="true" /> 
            <span>+62 21 62305916</span>
          </a>
          <a href="mailto:sales.jayarubberseal@gmail.com" className="flex items-center gap-2 hover:text-white/90 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1" aria-label="Kirim email ke sales.jayarubberseal@gmail.com">
            <Mail size={16} aria-hidden="true" /> 
            <span>sales.jayarubberseal@gmail.com</span>
          </a>
        </address>
      </div>
    </div>
  </section>
);

const HomePage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Beranda - Jaya Rubber Seal',
    description: 'Jaya Rubber Seal - Spesialis rubber seal, mounting, dan seal industri berkualitas sejak 2010. Produk buatan sendiri dengan harga pabrik.',
    url: APP_URL,
    mainEntity: {
      '@type': 'Store',
      name: 'Jaya Rubber Seal',
      image: `${APP_URL}/Logo/logo.png`,
      telephone: '+62-21-62305916',
      email: 'sales.jayarubberseal@gmail.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Pertokoan Glodok Jaya Lt.2 Blok A 35, Jl. Hayam Wuruk',
        addressLocality: 'Jakarta Barat',
        addressRegion: 'DKI Jakarta',
        postalCode: '11180',
        addressCountry: 'ID',
      },
    },
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title="Beranda"
        description="Jaya Rubber Seal - Spesialis rubber seal, mounting, dan seal industri berkualitas sejak 2010. Produk buatan sendiri dengan harga pabrik. Dipercaya 1000+ pelanggan di seluruh Indonesia."
        keywords="rubber seal, jual rubber seal jakarta, rubber seal berkualitas, mounting karet, seal industri, produsen rubber seal, o-ring, gasket, custom rubber, jaya rubber seal, toko rubber glodok"
        schema={homeSchema}
      />
      <main id="main-content" tabIndex="-1">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <CategoriesSection />
        <BestSellerSection onProductClick={setSelectedProduct} />
        <ProcessSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
};

export default HomePage;