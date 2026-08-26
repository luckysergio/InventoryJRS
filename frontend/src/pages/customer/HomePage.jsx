import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Factory, Truck, HeadphonesIcon, Award, Sparkles,
  Star, ArrowRight, CheckCircle2, ChevronDown,
  Phone, Mail, Package, Cog,
  Quote, Users, ThumbsUp,
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import Section from './components/Section';
import { useBestSellerProducts } from './hooks/usePublicProducts';
import { cn } from '../../lib/utils';

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';

const FEATURES = [
  { icon: Factory, title: 'Produk Buatan Sendiri', description: 'Diproduksi langsung di workshop kami dengan kontrol kualitas ketat di setiap tahap.', color: 'from-brand-500 to-cyan-500' },
  { icon: ThumbsUp, title: 'Kepuasan Pelanggan', description: 'Garansi kualitas dan layanan after-sales yang responsif untuk setiap pembelian.', color: 'from-ocean-500 to-blue-500' },
  { icon: Shield, title: 'Kualitas Terjamin', description: 'Material rubber premium yang tahan lama, anti bocor, dan sesuai standar industri.', color: 'from-emerald-500 to-teal-500' },
  { icon: Award, title: 'Harga Pabrik Langsung', description: 'Tanpa perantara! Dapatkan harga terbaik langsung dari produsen untuk pembelian grosir maupun satuan.', color: 'from-amber-500 to-orange-500' },
  { icon: Truck, title: 'Pengiriman Seluruh Indonesia', description: 'Melayani pengiriman ke seluruh nusantara via ekspedisi terpercaya dengan packing aman.', color: 'from-purple-500 to-pink-500' },
  { icon: HeadphonesIcon, title: 'Konsultasi Gratis & Custom', description: 'Tim ahli kami siap membantu memilih produk atau membuat rubber custom sesuai kebutuhan Anda.', color: 'from-rose-500 to-red-500' },
];

/* ✅ HANYA 2 KATEGORI */
const CATEGORIES = [
  {
    name: 'Semua Produk',
    description: 'Jelajahi katalog lengkap rubber seal, mounting, o-ring, gasket, dan produk industri lainnya.',
    path: '/products',
    icon: Package,
    gradient: 'from-brand-500 via-cyan-500 to-ocean-600',
    badge: 'Katalog Lengkap',
  },
  {
    name: 'Produk Custom',
    description: 'Produk dengan harga khusus untuk customer terdaftar. Pesan sesuai spesifikasi Anda.',
    path: '/products/custom',
    icon: Sparkles,
    gradient: 'from-ocean-600 via-blue-500 to-brand-400',
    badge: 'Harga Khusus',
  },
];

const PROCESS_STEPS = [
  { number: '01', title: 'Konsultasi', description: 'Hubungi tim kami untuk konsultasi gratis mengenai kebutuhan rubber seal Anda.', icon: HeadphonesIcon },
  { number: '02', title: 'Pemilihan Produk', description: 'Pilih dari katalog produk kami atau custom sesuai spesifikasi yang dibutuhkan.', icon: Package },
  { number: '03', title: 'Produksi & QC', description: 'Produk diproduksi dengan standar kualitas tinggi dan melalui quality control ketat.', icon: Factory },
  { number: '04', title: 'Pengiriman Aman', description: 'Packing rapi dan pengiriman cepat ke seluruh Indonesia via ekspedisi terpercaya.', icon: Truck },
];

const TESTIMONIALS = [
  { name: 'Budi Santoso', company: 'PT. Maju Jaya Industri', role: 'Procurement Manager', rating: 5, initials: 'BS', content: 'Kualitas rubber seal dari Jaya Rubber sangat bagus dan tahan lama. Pengiriman cepat dan harga sangat kompetitif untuk pembelian grosir. Recommended!' },
  { name: 'Siti Rahayu', company: 'Bengkel Auto Prima', role: 'Owner', rating: 5, initials: 'SR', content: 'Sudah berlangganan lebih dari 3 tahun. Produk mounting karetnya berkualitas dan tim mereka sangat responsif. Cocok untuk bengkel saya.' },
  { name: 'Ahmad Hidayat', company: 'CV. Teknik Mandiri', role: 'Technical Director', rating: 5, initials: 'AH', content: 'Layanan custom rubber-nya sangat membantu. Tim Jaya Rubber paham kebutuhan teknis kami dan hasilnya sesuai spesifikasi. Top!' },
];

const FAQ_ITEMS = [
  { question: 'Apakah Jaya Rubber Seal melayani pembelian satuan?', answer: 'Ya, kami melayani pembelian satuan maupun grosir. Untuk pembelian grosir, kami memberikan harga khusus yang lebih kompetitif. Hubungi tim sales kami untuk penawaran terbaik.' },
  { question: 'Bisakah saya memesan rubber seal dengan ukuran custom?', answer: 'Tentu bisa! Kami menerima pesanan rubber custom sesuai spesifikasi Anda. Cukup kirimkan gambar teknik atau sampel produk, tim kami akan memberikan konsultasi gratis dan quotation terbaik.' },
  { question: 'Berapa lama waktu produksi untuk produk custom?', answer: 'Waktu produksi bervariasi tergantung kompleksitas dan jumlah pesanan, umumnya 3-14 hari kerja. Untuk produk ready stock, pengiriman bisa dilakukan di hari yang sama.' },
  { question: 'Apakah ada garansi untuk produk yang dibeli?', answer: 'Ya, kami memberikan garansi kualitas untuk setiap produk. Jika terdapat cacat produksi, kami akan mengganti produk atau mengembalikan uang Anda sesuai ketentuan yang berlaku.' },
  { question: 'Bagaimana cara pengiriman ke luar kota?', answer: 'Kami bekerja sama dengan berbagai ekspedisi terpercaya (JNE, J&T, SiCepat, dll) untuk pengiriman ke seluruh Indonesia. Packing dilakukan dengan aman menggunakan bubble wrap dan kardus tebal.' },
  { question: 'Dimana lokasi toko fisik Jaya Rubber Seal?', answer: 'Toko kami berlokasi di Pertokoan Glodok Jaya Lt.2 Blok A 35, Jakarta Barat. Anda bisa mengunjungi langsung atau hubungi kami untuk konsultasi online via WhatsApp.' },
];

const STATS = [
  { value: '1000+', label: 'Pelanggan Puas', icon: Users },
  { value: '500+', label: 'Varian Produk', icon: Package },
  { value: '15+', label: 'Tahun Pengalaman', icon: Award },
  { value: '34', label: 'Provinsi Terjangkau', icon: Truck },
];

/* ==========================================
   HERO — ✅ spacing compact + LOGO
   ========================================== */
const HeroSection = () => {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <section id="home" className="relative pt-6 sm:pt-10 lg:pt-16 pb-14 lg:pb-20 overflow-hidden bg-gradient-to-br from-white via-brand-50 to-ocean-50">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-brand-100/20 to-transparent rounded-full" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left - Content */}
          <div data-aos="fade-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-200 shadow-sm mb-5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
              </span>
              <span className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
                Spesialis Rubber Seal Sejak 2010
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-slate-900 mb-5 text-balance">
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

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-7 max-w-xl">
              Jaya Rubber Seal menyediakan berbagai produk rubber seal, mounting, dan seal industri
              berkualitas tinggi dengan{' '}
              <strong className="text-slate-900">harga pabrik langsung</strong>. Dipercaya oleh
              1000+ pelanggan di seluruh Indonesia.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-xl hover:shadow-brand-500/40 hover:scale-105 transition-all"
              >
                Lihat Katalog Produk
                <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/6281287951140?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20tertarik%20dengan%20produk%20Anda"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all"
              >
                <Phone size={18} />
                Konsultasi Gratis
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> Produk Original</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> Garansi Kualitas</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> Pengiriman Cepat</span>
            </div>
          </div>

          {/* Right - Visual dengan LOGO */}
          <div className="relative" data-aos="fade-left" data-aos-delay="200">
            <div className="relative aspect-square max-w-md lg:max-w-lg mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 blur-2xl opacity-20" />
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-brand-100 to-ocean-100 flex items-center justify-center">
                <div className="absolute inset-8 rounded-full border-8 border-dashed border-white/50 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-16 rounded-full border-4 border-white/30 animate-[spin_15s_linear_infinite_reverse]" />

                {/* ✅ LOGO di tengah */}
                <div className="relative z-10 text-center p-6">
                  {logoFailed ? (
                    <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-2xl">
                      <span className="text-5xl sm:text-6xl font-display font-black text-white">JRS</span>
                    </div>
                  ) : (
                    <img
                      src="/Logo/logo.png"
                      alt="Logo Jaya Rubber Seal"
                      className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4 object-contain drop-shadow-2xl"
                      onError={() => setLogoFailed(true)}
                    />
                  )}
                  <p className="text-xl sm:text-2xl font-display font-bold text-slate-900">Jaya Rubber Seal</p>
                  <p className="text-sm text-slate-600 mt-1">Rubber & Seal Specialist</p>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-3 animate-float" data-aos="fade-down" data-aos-delay="400">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Award className="text-emerald-600" size={22} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500">Berpengalaman</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">15+ Tahun</p>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-white rounded-2xl shadow-xl p-3 sm:p-4 flex items-center gap-3 animate-float" style={{ animationDelay: '1.5s' }} data-aos="fade-up" data-aos-delay="600">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Star className="text-amber-500 fill-amber-500" size={22} />
                </div>
                <div>
                  <p className="text-[11px] sm:text-xs text-slate-500">Rating</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">4.9/5.0</p>
                </div>
              </div>

              <div className="absolute top-1/2 -right-4 lg:-right-8 bg-white rounded-2xl shadow-xl p-3 sm:p-4 hidden sm:flex items-center gap-3 animate-float" style={{ animationDelay: '0.5s' }} data-aos="fade-left" data-aos-delay="800">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                  <Users className="text-brand-600" size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pelanggan</p>
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

/* ==========================================
   STATS
   ========================================== */
const StatsSection = () => (
  <section className="py-10 sm:py-12 bg-white border-y border-slate-100">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {STATS.map((stat, idx) => (
          <div key={stat.label} className="text-center group" data-aos="fade-up" data-aos-delay={idx * 100}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-ocean-50 mb-3 group-hover:scale-110 transition-transform">
              <stat.icon className="text-brand-600" size={24} />
            </div>
            <p className="text-3xl lg:text-4xl font-display font-black text-gradient mb-1">{stat.value}</p>
            <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ==========================================
   FEATURES
   ========================================== */
const FeaturesSection = () => (
  <Section id="features" title="Mengapa Memilih Jaya Rubber Seal?" subtitle="Keunggulan Kami" background="light">
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, idx) => (
        <div key={feature.title} className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100" data-aos="fade-up" data-aos-delay={idx * 80}>
          <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform', feature.color)}>
            <feature.icon className="text-white" size={24} strokeWidth={2.5} />
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900 mb-2">{feature.title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-100/30 to-transparent rounded-bl-3xl rounded-tr-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  </Section>
);

/* ==========================================
   ✅ KATEGORI — 2 CARD
   ========================================== */
const CategoriesSection = () => (
  <Section id="categories" title="Jelajahi Produk Kami" subtitle="Temukan yang Anda Butuhkan" background="white">
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {CATEGORIES.map((cat, idx) => (
        <Link
          key={cat.path}
          to={cat.path}
          className="group relative overflow-hidden rounded-3xl bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5"
          data-aos="zoom-in"
          data-aos-delay={idx * 120}
        >
          {/* Gradient header */}
          <div className={cn('relative p-6 sm:p-8 bg-gradient-to-br text-white overflow-hidden', cat.gradient)}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-6 -right-6 w-32 h-32 border-8 border-white rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 border-8 border-white rounded-full" />
            </div>
            <div className="relative flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <cat.icon size={28} strokeWidth={2.5} />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-semibold">
                {cat.badge}
              </span>
            </div>
            <h3 className="relative text-2xl font-display font-bold mt-5">{cat.name}</h3>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{cat.description}</p>
            <div className="flex items-center gap-2 text-sm font-bold text-brand-600 group-hover:gap-3 transition-all">
              <span>Lihat Produk</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  </Section>
);

/* ==========================================
   BEST SELLER
   ========================================== */
const BestSellerSection = () => {
  const { data: bestSellers = [], isLoading } = useBestSellerProducts(6);

  return (
    <Section id="products" title="Produk Terlaris Kami" subtitle="Pilihan Terbaik" background="light">
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-40 bg-slate-200 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : bestSellers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellers.slice(0, 6).map((product, idx) => (
            <Link key={product.id} to={`/products/${product.id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100" data-aos="fade-up" data-aos-delay={idx * 80}>
              <div className="relative aspect-square bg-gradient-to-br from-brand-50 to-ocean-50 overflow-hidden">
                {product.foto_depan_url || product.foto_depan ? (
                  <img src={product.foto_depan_url || `${ASSET_URL}/storage/${product.foto_depan}`} alt={product.kode} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-brand-300" size={48} />
                  </div>
                )}
                {product.rank && (
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center shadow-lg">
                    #{product.rank}
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-mono text-slate-400 mb-1">{product.kode}</p>
                <h3 className="font-display font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {product.jenis?.nama || 'Produk'} {product.type?.nama || ''}
                </h3>
                {product.ukuran && <p className="text-xs text-slate-500 mb-3">Ukuran: {product.ukuran}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-sm font-bold text-brand-600">Lihat Detail</span>
                  <ArrowRight size={16} className="text-brand-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Package size={48} className="mx-auto mb-3 text-slate-300" />
          <p>Belum ada produk terlaris</p>
        </div>
      )}

      <div className="text-center mt-10" data-aos="fade-up">
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-brand-200 text-brand-700 font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all">
          Lihat Semua Produk
          <ArrowRight size={18} />
        </Link>
      </div>
    </Section>
  );
};

/* ==========================================
   PROCESS
   ========================================== */
const ProcessSection = () => (
  <Section id="process" title="Cara Kerja Kami" subtitle="Proses Mudah & Transparan" background="white">
    <div className="relative max-w-5xl mx-auto">
      <div className="hidden lg:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-200 via-ocean-200 to-brand-200" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {PROCESS_STEPS.map((step, idx) => (
          <div key={step.number} className="relative text-center" data-aos="fade-up" data-aos-delay={idx * 150}>
            <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 blur-xl opacity-30" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-xl">
                <step.icon className="text-white" size={36} strokeWidth={2} />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-white border-4 border-brand-500 flex items-center justify-center">
                <span className="font-display font-black text-brand-600 text-sm">{step.number}</span>
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 mb-2">{step.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

/* ==========================================
   TESTIMONIALS
   ========================================== */
const TestimonialsSection = () => (
  <Section id="testimonials" title="Apa Kata Pelanggan Kami" subtitle="Testimoni" background="light">
    <div className="grid md:grid-cols-3 gap-6">
      {TESTIMONIALS.map((t, idx) => (
        <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 relative" data-aos="fade-up" data-aos-delay={idx * 100}>
          <div className="absolute -top-4 right-6 w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center shadow-lg">
            <Quote className="text-white" size={20} strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1 mb-4">
            {[...Array(t.rating)].map((_, i) => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-slate-700 leading-relaxed mb-6 italic">"{t.content}"</p>
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center text-white font-bold">{t.initials}</div>
            <div>
              <p className="font-display font-bold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.role} • {t.company}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </Section>
);

/* ==========================================
   FAQ
   ========================================== */
const FAQItem = ({ item, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-brand-300 transition-colors" data-aos="fade-up" data-aos-delay={index * 50}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50 transition-colors" aria-expanded={isOpen}>
        <span className="font-semibold text-slate-900 text-sm sm:text-base">{item.question}</span>
        <ChevronDown size={20} className={cn('flex-shrink-0 text-brand-500 transition-transform', isOpen && 'rotate-180')} />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-96' : 'max-h-0')}>
        <div className="px-5 sm:px-6 pb-4 text-sm text-slate-600 leading-relaxed">{item.answer}</div>
      </div>
    </div>
  );
};

const FAQSection = () => (
  <Section id="faq" title="Pertanyaan yang Sering Diajukan" subtitle="FAQ" background="white">
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQ_ITEMS.map((item, idx) => <FAQItem key={idx} item={item} index={idx} />)}
    </div>
  </Section>
);

/* ==========================================
   CTA
   ========================================== */
const CTASection = () => (
  <section className="relative py-16 sm:py-20 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-ocean-600 to-brand-700" />
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-white rounded-full" />
    </div>
    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto" data-aos="zoom-in">
        <Sparkles className="w-12 h-12 text-white/80 mx-auto mb-4" />
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 text-balance">
          Siap Memesan Rubber Seal Berkualitas?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Hubungi tim kami sekarang untuk konsultasi gratis dan dapatkan penawaran terbaik untuk kebutuhan rubber seal Anda!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="https://wa.me/6281287951140?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20memesan%20produk" target="_blank" rel="noopener noreferrer" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all">
            <Phone size={20} />
            Chat WhatsApp Sekarang
          </a>
          <Link to="/products" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold hover:bg-white/20 transition-all">
            Lihat Katalog
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
          <a href="tel:+622162305916" className="flex items-center gap-2 hover:text-white transition-colors"><Phone size={16} /> +62 21 62305916</a>
          <a href="mailto:sales.jayarubberseal@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={16} /> sales.jayarubberseal@gmail.com</a>
        </div>
      </div>
    </div>
  </section>
);

/* ==========================================
   MAIN
   ========================================== */
const HomePage = () => {
  useEffect(() => {
    setTimeout(() => AOS.refresh(), 100);
  }, []);

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jaya Rubber Seal',
    url: import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id',
    description: 'Spesialis rubber seal, mounting, dan seal industri berkualitas. Produk buatan sendiri dengan harga pabrik langsung.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${import.meta.env.VITE_SITE_URL}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <SEO
        title="Beranda"
        description="Jaya Rubber Seal - Spesialis rubber seal, mounting, dan seal industri berkualitas sejak 2010. Produk buatan sendiri dengan harga pabrik. Dipercaya 1000+ pelanggan di seluruh Indonesia."
        keywords="rubber seal, jual rubber seal jakarta, rubber seal berkualitas, mounting karet, seal industri, produsen rubber seal, o-ring, gasket, custom rubber, jaya rubber seal, toko rubber glodok"
        schema={websiteSchema}
      />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CategoriesSection />
      <BestSellerSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </>
  );
};

export default HomePage;