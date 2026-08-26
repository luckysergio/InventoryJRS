import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Clock,
  Instagram, ShoppingBag, Music2,
  ArrowUpRight, Heart,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import Logo from './Logo';

const COMPANY_INFO = {
  name: 'Jaya Rubber Seal',
  tagline: 'Rubber & Seal Specialist',
  description:
    'Spesialis rubber seal, mounting, dan seal industri berkualitas. Produk buatan sendiri dengan harga langsung dari pabrik.',
  address:
    'Pertokoan Glodok Jaya Lt.2 Blok A 35, Jl. Hayam Wuruk, Mangga Besar, Taman Sari, Jakarta Barat 11180',
  phone: '+62 21 62305916',
  whatsapp: '6281287951140',
  email: 'sales.jayarubberseal@gmail.com',
  hours: 'Senin - Sabtu: 08:00 - 17:00',
  mapsUrl:
    'https://www.google.com/maps/search/Pertokoan+Glodok+Jaya+Lt.2+Blok+A+35,+Jl.+Hayam+Wuruk,+Jakarta+Barat',
};

const SOCIAL_LINKS = [
  { name: 'Instagram', url: 'https://www.instagram.com/jayarubberseal.id/', icon: Instagram, color: 'hover:bg-pink-500 hover:text-white' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@jayarubberseal', icon: Music2, color: 'hover:bg-black hover:text-white' },
  { name: 'Tokopedia', url: 'https://www.tokopedia.com/jayarubberseal', icon: ShoppingBag, color: 'hover:bg-green-500 hover:text-white' },
];

const QUICK_LINKS = [
  { label: 'Beranda', path: '/' },
  { label: 'Semua Produk', path: '/products' },
  { label: 'Produk Custom', path: '/products/custom' },
  { label: 'Blog', path: '/blog' },
  { label: 'Tentang Kami', path: '/tentang' },
];

const PRODUCT_CATEGORIES = ['Rubber Seal', 'Mounting Karet', 'O-Ring', 'Gasket', 'Oil Seal', 'Custom Rubber'];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ocean-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6 sm:pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8">
          {/* Company */}
          <div className="col-span-2 lg:col-span-1">
            <Logo light size="md" className="mb-4" />
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              {COMPANY_INFO.description}
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${social.name}`}
                  className={cn(
                    'w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center',
                    'hover:scale-110 transition-all duration-200',
                    social.color
                  )}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-400 mb-4">Menu</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="group flex items-center gap-1 text-sm text-slate-300 hover:text-brand-400 transition-colors">
                    <span>{link.label}</span>
                    <ArrowUpRight size={14} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ✅ Produk — TEXT ONLY, tanpa redirect */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-400 mb-4">Produk</h4>
            <ul className="space-y-2.5">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <span className="text-sm text-slate-300">
                    {cat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div className="col-span-2 lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-brand-400 mb-4">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li>
                <a href={COMPANY_INFO.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  <MapPin size={18} className="shrink-0 mt-0.5 text-brand-400" />
                  <span className="leading-relaxed">{COMPANY_INFO.address}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors">
                  <Phone size={18} className="shrink-0 text-brand-400" />
                  <span>{COMPANY_INFO.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY_INFO.email}`} className="flex items-center gap-3 text-sm text-slate-300 hover:text-brand-400 transition-colors break-all">
                  <Mail size={18} className="shrink-0 text-brand-400" />
                  <span>{COMPANY_INFO.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-300">
                <Clock size={18} className="shrink-0 mt-0.5 text-brand-400" />
                <span>{COMPANY_INFO.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-12 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-brand-500/20 to-ocean-500/20 border border-brand-500/30 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-display font-bold mb-1">Butuh Produk Custom?</h4>
              <p className="text-sm text-slate-300">Konsultasikan kebutuhan rubber seal Anda dengan tim kami</p>
            </div>
            <a
              href={`https://wa.me/${COMPANY_INFO.whatsapp}?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20konsultasi%20produk%20custom`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Chat Sekarang
              <ArrowUpRight size={18} />
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center">
          <p className="text-xs sm:text-sm text-slate-400 text-center">
            © {currentYear} {COMPANY_INFO.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;