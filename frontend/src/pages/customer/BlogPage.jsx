import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Tag, Bookmark } from 'lucide-react';
import AOS from 'aos';
import SEO from './components/SEO';
import { BLOG_POSTS } from '../../data/blogPosts'; // ✅ Import dari file terpisah

const SkipNavigation = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    Lewati ke konten utama
  </a>
);

const HeroSection = () => (
  <section className="relative pt-10 pb-10 lg:pt-10 lg:pb-10 overflow-hidden bg-gradient-to-br from-white via-brand-50 to-ocean-50">
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute top-20 right-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-ocean-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
      <span className="inline-block px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold mb-6" data-aos="fade-down">
        Artikel & Wawasan
      </span>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-slate-900 mb-6 text-balance" data-aos="fade-up">
        Pusat Pengetahuan <span className="text-gradient">Rubber Seal</span> & Mounting
      </h1>
      <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8" data-aos="fade-up" data-aos-delay="100">
        Temukan panduan teknis, tips perawatan, dan wawasan industri terkini seputar solusi sealing dan isolasi getaran untuk mengoptimalkan operasional bisnis Anda.
      </p>
    </div>
  </section>
);

const BlogCard = ({ post, index }) => (
  <article 
    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100 flex flex-col h-full"
    data-aos="fade-up"
    data-aos-delay={Math.min(index * 50, 300)}
  >
    <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
          <Bookmark className="text-brand-600" size={28} aria-hidden="true" />
        </div>
      </div>
      <div className="absolute top-3 left-3">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-700 text-xs font-semibold shadow-sm">
          <Tag size={12} aria-hidden="true" />
          {post.category}
        </span>
      </div>
    </div>

    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="flex items-center gap-1">
          <Calendar size={14} aria-hidden="true" />
          {new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
        <span className="flex items-center gap-1">
          <Clock size={14} aria-hidden="true" />
          {post.readTime}
        </span>
      </div>

      <h2 className="text-lg font-display font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-brand-600 transition-colors">
        <Link to={`/blog/${post.slug}`} aria-label={`Baca selengkapnya: ${post.title}`}>
          {post.title}
        </Link>
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3 flex-1">
        {post.excerpt}
      </p>

      <Link 
        to={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 group-hover:gap-2.5 transition-all mt-auto"
        aria-label={`Baca artikel ${post.title}`}
      >
        Baca Selengkapnya
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  </article>
);

const BlogGridSection = () => (
  <section className="py-16 lg:py-24 bg-white" aria-labelledby="blog-heading">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <h2 id="blog-heading" className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-2">
            Artikel Terbaru
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {BLOG_POSTS.map((post, index) => (
          <BlogCard key={post.id} post={post} index={index} />
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-br from-brand-600 via-ocean-600 to-brand-700" aria-labelledby="cta-heading">
    <div className="absolute inset-0 opacity-10" aria-hidden="true">
      <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 border-8 border-white rounded-full" />
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-3xl mx-auto" data-aos="zoom-in">
        <h2 id="cta-heading" className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 text-balance">
          Tidak Menemukan Jawaban yang Anda Cari?
        </h2>
        <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
          Tim teknis kami siap membantu menjawab pertanyaan spesifik seputar kebutuhan rubber seal, material, atau spesifikasi custom Anda.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://wa.me/6281287951140?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20bertanya%20mengenai%20spesifikasi%20produk."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-brand-700 font-bold shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-600"
          >
            Konsultasi Gratis via WhatsApp
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

const BlogPage = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
    const timer = setTimeout(() => AOS.refresh(), 100);
    return () => clearTimeout(timer);
  }, []);

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: BLOG_POSTS.slice(0, 10).map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        author: { '@type': 'Organization', name: 'Jaya Rubber Seal' },
        datePublished: post.date,
        url: `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/blog/${post.slug}`
      }
    }))
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title="Blog & Artikel"
        description="Baca artikel terbaru seputar panduan memilih rubber seal, perbedaan material O-Ring, tips perawatan mounting karet, dan wawasan industri sealing dari para ahli Jaya Rubber Seal."
        keywords="blog rubber seal, artikel mounting karet, panduan o-ring, tips perawatan gasket, industri sealing indonesia"
        schema={blogSchema}
      />
      
      <main id="main-content" tabIndex="-1" className="bg-white">
        <h1 className="sr-only">Blog dan Artikel Edukasi Rubber Seal - Jaya Rubber Seal</h1>
        <HeroSection />
        <BlogGridSection />
        <CTASection />
      </main>
    </>
  );
};

export default BlogPage;