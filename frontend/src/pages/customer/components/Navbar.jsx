import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone, ShoppingBag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import useCustomerStore from '../store/customerStore';
import { useScrollSpy } from '../hooks/useScrollSpy';
import Logo from './Logo';

const NAV_ITEMS = [
  { label: 'Beranda', path: '/', id: 'home' },
  {
    label: 'Produk',
    path: null,
    children: [
      { label: 'Semua Produk', path: '/products', description: 'Katalog lengkap' },
      { label: 'Produk Custom', path: '/products/custom', description: 'Harga khusus customer' },
    ],
  },
  { label: 'Blog', path: '/blog', id: 'blog' },
  { label: 'Tentang Kami', path: '/tentang', id: 'about' },
];

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { isMobileMenuOpen, isScrolled, toggleMobileMenu, closeMobileMenu } = useCustomerStore();
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  useScrollSpy(isHome ? ['home', 'products', 'about', 'blog'] : []);

  useEffect(() => {
    closeMobileMenu();
    setProductMenuOpen(false);
  }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-md border-b border-brand-100'
            : 'bg-white/80 backdrop-blur-md'
        )}
        role="banner"
      >
        {/* ✅ Tinggi konsisten: h-16 mobile, h-[68px] desktop */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-[68px] items-center justify-between gap-3">
            {/* Logo */}
            <Link to="/" aria-label="Jaya Rubber Seal - Home" className="group shrink-0 min-w-0">
              <Logo size="sm" className="group-hover:scale-[1.02] transition-transform sm:size-md" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="relative">
                  {item.children ? (
                    <div
                      onMouseEnter={() => setProductMenuOpen(true)}
                      onMouseLeave={() => setProductMenuOpen(false)}
                    >
                      <button
                        className={cn(
                          'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                          'text-slate-700 hover:text-brand-600 hover:bg-brand-50'
                        )}
                        aria-expanded={productMenuOpen}
                        aria-haspopup="true"
                      >
                        {item.label}
                        <ChevronDown
                          size={16}
                          className={cn('transition-transform duration-200', productMenuOpen && 'rotate-180')}
                        />
                      </button>

                      <div
                        className={cn(
                          'absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden',
                          'transition-all duration-200 origin-top-left',
                          productMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
                        )}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className="flex items-start gap-3 p-4 hover:bg-brand-50 transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center shrink-0 group-hover:bg-brand-500 transition-colors">
                              <ShoppingBag size={18} className="text-brand-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                                {child.label}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{child.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        location.pathname === item.path
                          ? 'text-brand-600 bg-brand-50'
                          : 'text-slate-700 hover:text-brand-600 hover:bg-brand-50'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* ✅ Kanan: WA (text desktop / icon mobile) + Hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/6281287951140"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-ocean-500 text-white text-sm font-semibold shadow-md shadow-brand-500/30 hover:shadow-lg hover:scale-105 transition-all"
              >
                <Phone size={16} />
                <span>Hubungi Kami</span>
              </a>

              {/* WA icon-only di mobile */}
              <a
                href="https://wa.me/6281287951140"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat WhatsApp"
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-brand-500 to-ocean-500 text-white shadow-md shadow-brand-500/30 active:scale-95 transition-all"
              >
                <Phone size={18} />
              </a>

              <button
                onClick={toggleMobileMenu}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl lg:hidden transition-transform duration-300 flex flex-col',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Mobile menu"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
          <Logo size="sm" />
          <button
            onClick={closeMobileMenu}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {item.children ? (
                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                    >
                      <ShoppingBag size={18} />
                      <div>
                        <p className="font-medium">{child.label}</p>
                        <p className="text-xs text-slate-500">{child.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-slate-700 hover:bg-brand-50 hover:text-brand-600'
                  )}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
          <a
            href="https://wa.me/6281287951140"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-gradient-to-r from-brand-500 to-ocean-500 text-white font-semibold shadow-md active:scale-[0.98] transition-all"
          >
            <Phone size={18} />
            Hubungi via WhatsApp
          </a>
        </div>
      </aside>
    </>
  );
};

export default Navbar;