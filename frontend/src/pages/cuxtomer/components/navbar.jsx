import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: "Beranda", id: "beranda" },
    { label: "Tentang", id: "tentang" },
    { label: "Produk", id: "catalog" },
    { label: "Kontak", id: "kontak" }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? "py-4 bg-gradient-to-r from-white/95 to-gray-50/95 backdrop-blur-lg border-b border-gray-200/70 shadow-md" 
        : "py-6 bg-gradient-to-r from-white/90 to-gray-50/90 backdrop-blur-md"
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo - Link ke TikTok */}
          <a 
            href="https://www.tiktok.com/@jayarubberseal" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-3 group"
          >
            <div className="p-2 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-lg group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-700 group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300">
                Jaya Rubber Seal
              </h1>
            </div>
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-700 hover:text-cyan-700 transition-colors duration-300 font-medium relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-600 to-blue-700 group-hover:w-full transition-all duration-300"></span>
                </button>
              </li>
            ))}
            {/* Tokopedia Button - Tetap di kanan */}
            <li>
              <a 
                href="https://www.tokopedia.com/jayarubberseal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-105 group"
              >
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-white font-medium">Belanja</span>
              </a>
            </li>
          </ul>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden">
            {/* Tokopedia Button Mobile */}
            <a 
              href="https://www.tokopedia.com/jayarubberseal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </a>
            
            <button 
              className="text-gray-700 hover:text-cyan-700 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden absolute left-0 right-0 mt-2 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-lg border-b border-gray-200/70 rounded-b-2xl shadow-xl transition-all duration-300 transform ${
          mobileMenuOpen 
            ? "opacity-100 translate-y-0 visible" 
            : "opacity-0 -translate-y-4 invisible"
        }`}>
          <div className="px-6 py-4">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left text-gray-700 hover:text-cyan-700 transition-colors duration-300 font-medium py-3 flex items-center justify-between group"
                  >
                    <span>{item.label}</span>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-cyan-700 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;