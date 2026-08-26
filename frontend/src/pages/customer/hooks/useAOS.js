import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

export const useAOS = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });

    const handleRefresh = () => {
      setTimeout(() => AOS.refresh(), 100);
    };

    window.addEventListener('load', handleRefresh);
    return () => window.removeEventListener('load', handleRefresh);
  }, []);
};

export const useAOSRefresh = () => {
  return () => {
    if (typeof window !== 'undefined' && window.AOS) {
      setTimeout(() => window.AOS?.refresh(), 100);
    }
  };
};