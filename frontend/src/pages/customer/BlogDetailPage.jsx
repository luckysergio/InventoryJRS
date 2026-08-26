import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ArrowRight, Tag, Share2 } from 'lucide-react'; // ✅ ArrowRight ditambahkan di sini
import AOS from 'aos';
import SEO from './components/SEO';
import { BLOG_POSTS } from '../../data/blogPosts';

const SkipNavigation = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
  >
    Lewati ke konten utama
  </a>
);

const BlogDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    if (!post) {
      navigate('/blog', { replace: true });
      return;
    }
    
    AOS.init({ duration: 800, once: true, offset: 50 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post, navigate]);

  if (!post) return null;

  // Filter artikel terkait berdasarkan kategori (maksimal 3)
  const relatedPosts = BLOG_POSTS
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/Logo/logo.png`,
    author: {
      '@type': 'Organization',
      name: post.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Jaya Rubber Seal',
      logo: {
        '@type': 'ImageObject',
        url: `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/Logo/logo.png`
      }
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${import.meta.env.VITE_SITE_URL || 'https://jayarubberseal.id'}/blog/${post.slug}`
    }
  };

  return (
    <>
      <SkipNavigation />
      <SEO
        title={`${post.title} | Blog Jaya Rubber Seal`}
        description={post.excerpt}
        keywords={`rubber seal, ${post.category.toLowerCase()}, ${post.title.toLowerCase()}`}
        schema={articleSchema}
      />

      <main id="main-content" tabIndex="-1" className="bg-white min-h-screen">

        {/* Article Header */}
        <header className="pt-12 pb-8 lg:pt-16 lg:pb-12 bg-gradient-to-br from-white via-brand-50 to-ocean-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6" data-aos="fade-down">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                <Tag size={14} aria-hidden="true" />
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Calendar size={14} aria-hidden="true" />
                {new Date(post.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-slate-600">
                <Clock size={14} aria-hidden="true" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-slate-900 leading-tight mb-6 text-balance" data-aos="fade-up">
              {post.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8" data-aos="fade-up" data-aos-delay="100">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-ocean-500 flex items-center justify-center text-white font-bold text-sm">
                  JRS
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-900">{post.author}</p>
                  <p className="text-xs text-slate-500">Tim Ahli Jaya Rubber Seal</p>
                </div>
              </div>
              
              <button 
                onClick={() => navigator.share ? navigator.share({ title: post.title, url: window.location.href }) : null}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors text-slate-600"
                aria-label="Bagikan artikel"
                title="Bagikan artikel"
              >
                <Share2 size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="py-12 lg:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
              {post.content.map((paragraph, idx) => {
                // Deteksi sederhana untuk heading atau list item agar tipografi lebih dinamis
                if (paragraph.match(/^\d+\./)) {
                  return (
                    <p key={idx} className="font-semibold text-slate-900 pl-4 border-l-4 border-brand-500">
                      {paragraph}
                    </p>
                  );
                }
                return <p key={idx}>{paragraph}</p>;
              })}
            </div>

            {/* Article Footer / CTA */}
            <div className="mt-12 pt-8 border-t border-slate-200">
              <div className="bg-gradient-to-br from-brand-50 to-ocean-50 rounded-2xl p-6 sm:p-8 text-center">
                <h3 className="text-xl font-display font-bold text-slate-900 mb-3">
                  Butuh Konsultasi Mengenai Artikel Ini?
                </h3>
                <p className="text-slate-600 mb-6 max-w-xl mx-auto">
                  Tim teknis kami siap membantu Anda memilih material dan spesifikasi rubber seal yang paling tepat untuk aplikasi Anda.
                </p>
                <a
                  href={`https://wa.me/6281287951140?text=Halo,%20saya%20membaca%20artikel%20tentang%20${encodeURIComponent(post.title)}%20dan%20ingin%20bertanya%20lebih%20lanjut.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  Hubungi Kami via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-8 text-center">
                Artikel Terkait
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {relatedPosts.map((relatedPost, idx) => (
                  <Link
                    key={relatedPost.id}
                    to={`/blog/${relatedPost.slug}`}
                    className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-slate-100 flex flex-col"
                    data-aos="fade-up"
                    data-aos-delay={idx * 100}
                  >
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold w-fit mb-3">
                      {relatedPost.category}
                    </span>
                    <h3 className="text-lg font-display font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors flex-1">
                      {relatedPost.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 group-hover:gap-2.5 transition-all mt-4">
                      Baca Selengkapnya
                      <ArrowRight size={16} aria-hidden="true" /> {/* ✅ Sekarang ArrowRight sudah terdefinisi */}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to Blog Button */}
        <div className="py-12 bg-white text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-brand-500 hover:text-brand-600 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Kembali ke Daftar Artikel
          </Link>
        </div>
      </main>
    </>
  );
};

export default BlogDetailPage;