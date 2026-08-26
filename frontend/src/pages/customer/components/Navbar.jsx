import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Phone, ShoppingBag } from 'lucide-react';
import { cn } from '../../../lib/utils';
import useCustomerStore from '../store/customerStore';
import { useScrollSpy } from '../hooks/useScrollSpy';
import Logo from './Logo';

/* Desktop nav (dengan dropdown Produk) */
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

/* ✅ Mobile nav — tanpa logo & WA, produk pakai dropdown */
const MOBILE_NAV = [
  { label: 'Beranda', path: '/', id: 'home' },
  { label: 'Produk', path: null, id: 'products', hasDropdown: true },
  { label: 'Blog', path: '/blog', id: 'blog' },
  { label: 'Tentang', path: '/tentang', id: 'about' },
];

const PRODUCT_DROPDOWN = [
  { label: 'Semua Produk', path: '/products', description: 'Katalog lengkap' },
  { label: 'Produk Custom', path: '/products/custom', description: 'Harga khusus customer' },
];

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { isScrolled } = useCustomerStore();
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);

  const mobileDropdownRef = useRef(null);

  useScrollSpy(isHome ? ['home', 'products', 'about', 'blog'] : []);

  useEffect(() => {
    setProductMenuOpen(false);
    setMobileProductOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target)) {
        setMobileProductOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMobileActive = (item) => {
    if (item.hasDropdown) return location.pathname.startsWith('/products');
    return item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path);
  };

  const isDesktopActive = (item) => {
    if (!item.children) return location.pathname === item.path;
    return item.children.some((c) => location.pathname.startsWith(c.path));
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-3 sm:px-6 lg:px-10 pt-3 sm:pt-5 pointer-events-none"
      role="banner"
    >
      <div className="mx-auto max-w-7xl pointer-events-auto">
        <div
          className={cn(
            'rounded-full border backdrop-blur-xl transition-all duration-300 relative',
            isScrolled
              ? 'bg-white/95 border-brand-100 shadow-xl shadow-brand-500/10'
              : 'bg-white/85 border-white/60 shadow-lg shadow-slate-900/5'
          )}
        >
          {/* ✅ items-center untuk mobile, justify-between untuk desktop */}
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2 px-2.5 sm:px-5">
            {/* Logo — hanya di desktop (sm+) */}
            <Link
              to="/"
              aria-label="Jaya Rubber Seal - Home"
              className="hidden sm:block group shrink-0 min-w-0"
            >
              <Logo size="sm" className="group-hover:scale-[1.03] transition-transform" />
            </Link>

            <nav
              ref={mobileDropdownRef}
              className="flex lg:hidden flex-1 items-center justify-center gap-2.5 relative"
              aria-label="Mobile navigation"
            >
              {MOBILE_NAV.map((item) =>
                item.hasDropdown ? (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setMobileProductOpen(!mobileProductOpen)}
                      className={cn(
                        'flex items-center gap-2.5 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all',
                        isMobileActive(item)
                          ? 'bg-gradient-to-r from-brand-500 to-ocean-500 text-white shadow-md shadow-brand-500/30'
                          : 'text-slate-700 hover:text-brand-600 hover:bg-brand-50 active:scale-95'
                      )}
                      aria-expanded={mobileProductOpen}
                    >
                      {item.label}
                      <ChevronDown
                        size={12}
                        className={cn(
                          'transition-transform duration-200',
                          mobileProductOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        'absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden',
                        'transition-all duration-200 origin-top',
                        mobileProductOpen
                          ? 'opacity-100 scale-100 visible'
                          : 'opacity-0 scale-95 invisible pointer-events-none'
                      )}
                    >
                      {PRODUCT_DROPDOWN.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileProductOpen(false)}
                          className={cn(
                            'flex items-start gap-3 p-3 transition-colors group',
                            location.pathname === child.path
                              ? 'bg-brand-50'
                              : 'hover:bg-brand-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              location.pathname === child.path
                                ? 'bg-brand-500'
                                : 'bg-brand-100 group-hover:bg-brand-500'
                            )}
                          >
                            <ShoppingBag
                              size={16}
                              className={cn(
                                'transition-colors',
                                location.pathname === child.path
                                  ? 'text-white'
                                  : 'text-brand-600 group-hover:text-white'
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{child.label}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{child.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all',
                      isMobileActive(item)
                        ? 'bg-gradient-to-r from-brand-500 to-ocean-500 text-white shadow-md shadow-brand-500/30'
                        : 'text-slate-700 hover:text-brand-600 hover:bg-brand-50 active:scale-95'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Desktop nav */}
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
                          'flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                          isDesktopActive(item)
                            ? 'text-brand-600 bg-brand-50'
                            : 'text-slate-700 hover:text-brand-600 hover:bg-brand-50'
                        )}
                        aria-expanded={productMenuOpen}
                        aria-haspopup="true"
                      >
                        {item.label}
                        <ChevronDown
                          size={16}
                          className={cn(
                            'transition-transform duration-200',
                            productMenuOpen && 'rotate-180'
                          )}
                        />
                      </button>

                      <div
                        className={cn(
                          'absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden',
                          'transition-all duration-200 origin-top',
                          productMenuOpen
                            ? 'opacity-100 scale-100 visible'
                            : 'opacity-0 scale-95 invisible'
                        )}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              'flex items-start gap-3 p-4 transition-colors group',
                              location.pathname === child.path ? 'bg-brand-50' : 'hover:bg-brand-50'
                            )}
                          >
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                location.pathname === child.path
                                  ? 'bg-brand-500'
                                  : 'bg-brand-100 group-hover:bg-brand-500'
                              )}
                            >
                              <ShoppingBag
                                size={18}
                                className={cn(
                                  'transition-colors',
                                  location.pathname === child.path
                                    ? 'text-white'
                                    : 'text-brand-600 group-hover:text-white'
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{child.label}</p>
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
                        'px-4 py-2 rounded-full text-sm font-medium transition-colors',
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

            {/* CTA desktop */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <a
                href="https://wa.me/6281287951140?text=Halo%20Jaya%20Rubber%20Seal%2C%20saya%20ingin%20konsultasi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-ocean-500 text-white text-sm font-bold shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 hover:scale-105 active:scale-95 transition-all"
              >
                <Phone size={16} />
                <span>Konsultasi Gratis</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;