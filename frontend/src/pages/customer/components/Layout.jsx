import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import WhatsAppFloat from './WhatsAppFloat';
import { useAOS } from '../hooks/useAOS';

const Layout = () => {
  const location = useLocation();
  useAOS();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-500 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1 pt-[64px] sm:pt-[68px]" tabIndex="-1">
        <Outlet />
      </main>

      <Footer />
      <ScrollToTop />
      <WhatsAppFloat />
    </div>
  );
};

export default Layout;