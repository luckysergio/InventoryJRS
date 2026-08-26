import { useEffect, useRef } from 'react';
import useCustomerStore from '../store/customerStore';

/**
 * Hook untuk detect active section berdasarkan scroll position
 * Digunakan untuk highlight navbar menu
 *
 * ✅ FIXED: Gunakan useRef untuk track previous value → prevent infinite loop
 */
export const useScrollSpy = (sectionIds = []) => {
  const setActiveSection = useCustomerStore((s) => s.setActiveSection);
  const setScrolled = useCustomerStore((s) => s.setScrolled);

  // ✅ Track previous values dengan useRef (tidak trigger re-render)
  const prevScrolled = useRef(false);
  const prevActiveSection = useRef('home');

  useEffect(() => {
    const handleScroll = () => {
      // ===== SCROLL DETECTION (with guard) =====
      const currentScrolled = window.scrollY > 20;
      if (currentScrolled !== prevScrolled.current) {
        prevScrolled.current = currentScrolled;
        setScrolled(currentScrolled);
      }

      // ===== ACTIVE SECTION DETECTION =====
      if (sectionIds.length === 0) return;

      const scrollPosition = window.scrollY + 120;

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            // ✅ Skip jika section tidak berubah
            if (prevActiveSection.current !== id) {
              prevActiveSection.current = id;
              setActiveSection(id);
            }
            break;
          }
        }
      }
    };

    // Passive listener untuk performance
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial call
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, setActiveSection, setScrolled]);
};