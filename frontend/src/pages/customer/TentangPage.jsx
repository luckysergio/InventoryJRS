import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, Eye, HeartHandshake, ShieldCheck, 
  Award, Users, ArrowRight, CheckCircle2 
} from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';

const SkipNavigation = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    Lewati ke konten utama
  </a>
);

const HeroSection = () => (
  <section className="relative pt-16 pb-16 lg:pt-10 lg:pb-24 overflow-hidden bg-gradient-to-br from-white via-brand-50 to-ocean-50">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
      <span 
        className="inline-block px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6"
        data-aos="fade-down"
      >
        Tentang Kami
      </span>
      <h1 
        className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-slate-900 mb-6 text-balance"
        data-aos="fade-up"
      >
        Mitra Terpercaya untuk Solusi <span className="text-gradient">Rubber Seal</span> Industri Anda
      </h1>
      <p 
        className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8"
        data-aos="fade-up" 
        data-aos-delay="100"
      >
        Sejak 2010, Jaya Rubber Seal berkomitmen menyediakan produk karet berkualitas tinggi dengan inovasi berkelanjutan dan pelayanan yang mengutamakan kepuasan pelanggan.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Jelajahi Produk Kami
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link
          to="/#kontak"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 text-slate-900 font-semibold hover:border-brand-300 hover:bg-brand-50 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Hubungi Kami
        </Link>
      </div>
    </div>
  </section>
);
const StorySection = () => (
  <section className="py-16 lg:py-24 bg-white" aria-labelledby="story-heading">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div data-aos="fade-right">
          {/* Placeholder untuk gambar kantor/tim. Ganti src dengan gambar asli Anda */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-100 to-ocean-100 shadow-xl">
            <img 
              src="/Logo/logo.png" 
              alt="Kantor atau Tim Jaya Rubber Seal" 
              className="w-full h-full object-contain p-8"
              width="800"
              height="600"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
        
        <div data-aos="fade-left">
          <h2 id="story-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-6">
            Perjalanan Kami Sejak 2010
          </h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-900">Jaya Rubber Seal</strong> didirikan dengan satu visi sederhana: menjadi penyedia solusi sealing dan mounting karet terbaik di Indonesia dengan harga yang terjangkau tanpa mengorbankan kualitas.
            </p>
            <p>
              Berawal dari sebuah bengkel kecil di Jakarta, kami telah berkembang menjadi distributor dan produsen yang dipercaya oleh ratusan perusahaan industri, otomotif, dan manufaktur di seluruh nusantara.
            </p>
            <p>
              Dengan fasilitas produksi modern dan tim Quality Control yang ketat, kami memastikan setiap O-Ring, Gasket, dan Mounting yang keluar dari pabrik kami memenuhi standar ketahanan dan performa tertinggi.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-brand-500 mt-1 flex-shrink-0" size={24} aria-hidden="true" />
              <div>
                <h3 className="font-bold text-slate-900">15+ Tahun</h3>
                <p className="text-sm text-slate-600">Pengalaman Industri</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-brand-500 mt-1 flex-shrink-0" size={24} aria-hidden="true" />
              <div>
                <h3 className="font-bold text-slate-900">1000+ Klien</h3>
                <p className="text-sm text-slate-600">Membangun Kepercayaan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ==========================================
   VISION & MISSION SECTION
   ========================================== */
const VisionMissionSection = () => (
  <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-900 to-brand-950 text-white" aria-labelledby="visimisi-heading">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16" data-aos="fade-up">
        <h2 id="visimisi-heading" className="text-3xl sm:text-4xl font-display font-bold mb-4">Visi & Misi</h2>
        <p className="text-slate-300 text-lg">Arah dan komitmen kami dalam melayani industri Indonesia.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div 
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="w-14 h-14 rounded-xl bg-brand-500/20 flex items-center justify-center mb-6">
            <Eye className="text-brand-400" size={28} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">Visi</h3>
          <p className="text-slate-300 leading-relaxed">
            Menjadi perusahaan produsen dan distributor produk rubber seal dan mounting karet terdepan di Indonesia yang dikenal karena kualitas, inovasi, dan integritas.
          </p>
        </div>

        <div 
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <div className="w-14 h-14 rounded-xl bg-ocean-500/20 flex items-center justify-center mb-6">
            <Target className="text-ocean-400" size={28} aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">Misi</h3>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-400 mt-2 flex-shrink-0" aria-hidden="true" />
              <span>Menyediakan produk karet berkualitas tinggi dengan harga kompetitif.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-400 mt-2 flex-shrink-0" aria-hidden="true" />
              <span>Memberikan layanan konsultasi teknis yang profesional dan responsif.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-400 mt-2 flex-shrink-0" aria-hidden="true" />
              <span>Berkontribusi pada efisiensi dan keamanan operasional industri mitra kami.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

/* ==========================================
   CORE VALUES SECTION
   ========================================== */
const values = [
  {
    icon: ShieldCheck,
    title: 'Kualitas Tanpa Kompromi',
    desc: 'Setiap produk melewati uji kualitas ketat sebelum sampai ke tangan Anda.'
  },
  {
    icon: HeartHandshake,
    title: 'Berorientasi Pelanggan',
    desc: 'Kepuasan dan kebutuhan Anda adalah prioritas utama dalam setiap solusi yang kami tawarkan.'
  },
  {
    icon: Award,
    title: 'Integritas & Transparansi',
    desc: 'Kami menjunjung tinggi kejujuran dalam harga, spesifikasi, dan layanan purna jual.'
  },
  {
    icon: Users,
    title: 'Tim Ahli Berdedikasi',
    desc: 'Didukung oleh tenaga ahli yang berpengalaman di bidang material karet dan teknik industri.'
  }
];

const ValuesSection = () => (
  <section className="py-16 lg:py-24 bg-white" aria-labelledby="values-heading">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16" data-aos="fade-up">
        <h2 id="values-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">Nilai-Nilai Perusahaan</h2>
        <p className="text-slate-600 text-lg">Prinsip yang memandu setiap langkah dan keputusan kami.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {values.map((val, idx) => {
          const Icon = val.icon;
          return (
            <div 
              key={val.title}
              className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              data-aos="fade-up"
              data-aos-delay={idx * 100}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                <Icon className="text-brand-600" size={24} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 mb-2">{val.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{val.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

/* ==========================================
   CTA SECTION
   ========================================== */
const CTASection = () => (
  <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-br from-brand-600 via-ocean-600 to-brand-700" aria-labelledby="cta-heading">
    <div className="absolute inset-0 opacity-10" aria-hidden="true">
      <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-white rounded-full" />
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto" data-aos="zoom-in">
        <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 text-balance">
          Siap Bekerja Sama dengan Kami?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Diskusikan kebutuhan rubber seal atau mounting custom Anda dengan tim ahli kami. Kami siap memberikan solusi terbaik dengan harga pabrik.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://wa.me/6281287951140?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20berkonsultasi%20mengenai%20kebutuhan%20produk."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
          >
            Hubungi via WhatsApp
          </a>
          <Link
            to="/products"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
          >
            Lihat Katalog Produk
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

/* ==========================================
   MAIN PAGE COMPONENT
   ========================================== */
const TentangPage = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Schema.org Organization untuk SEO Lokal yang kuat
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jaya Rubber Seal',
    url: import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id',
    logo: `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/Logo/logo.png`,
    description: 'Spesialis rubber seal, mounting, dan seal industri berkualitas. Produk buatan sendiri dengan harga pabrik langsung.',
    foundingDate: '2010',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Pertokoan Glodok Jaya Lt.2 Blok A 35, Jl. Hayam Wuruk',
      addressLocality: 'Jakarta Barat',
      addressRegion: 'DKI Jakarta',
      postalCode: '11180',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-21-62305916',
      contactType: 'customer service',
      areaServed: 'ID',
      availableLanguage: ['Indonesian'],
    },
    sameAs: [
      'https://www.tokopedia.com/jayarubberseal',
      'https://www.tiktok.com/@jayarubberseal',
      'https://www.instagram.com/jayarubberseal.id/',
    ],
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title="Tentang Kami"
        description="Pelajari lebih lanjut tentang Jaya Rubber Seal, sejarah, visi, misi, dan komitmen kami dalam menyediakan produk rubber seal dan mounting karet berkualitas tinggi sejak 2010."
        keywords="tentang jaya rubber seal, profil perusahaan, sejarah rubber seal, visi misi, produsen karet jakarta"
        schema={organizationSchema}
      />
      
      <main id="main-content" tabIndex="-1" className="bg-white">
        <h1 className="sr-only">Tentang Jaya Rubber Seal - Profil Perusahaan</h1>
        <HeroSection />
        <StorySection />
        <VisionMissionSection />
        <ValuesSection />
        <CTASection />
      </main>
    </>
  );
};

export default TentangPage;