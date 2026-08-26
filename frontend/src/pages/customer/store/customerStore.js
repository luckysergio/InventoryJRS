import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useCustomerStore = create(
  devtools(
    persist(
      (set, get) => ({
        isMobileMenuOpen: false,
        activeSection: 'home',
        isScrolled: false,
        theme: 'light',

        publicProducts: [],
        customProducts: [],
        featuredProducts: [],
        blogPosts: [],

        lastFetched: {
          products: null,
          custom: null,
          blog: null,
        },

        toggleMobileMenu: () =>
          set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

        closeMobileMenu: () => set({ isMobileMenuOpen: false }),

        setActiveSection: (section) =>
          set((state) => {
            if (state.activeSection === section) return state; // ✅ Skip jika sama
            return { activeSection: section };
          }),

        // ✅ FIX UTAMA: Skip update jika nilai tidak berubah
        setScrolled: (value) =>
          set((state) => {
            if (state.isScrolled === value) return state;
            return { isScrolled: value };
          }),

        setPublicProducts: (products) =>
          set({
            publicProducts: products,
            lastFetched: { ...get().lastFetched, products: Date.now() },
          }),

        setCustomProducts: (products) =>
          set({
            customProducts: products,
            lastFetched: { ...get().lastFetched, custom: Date.now() },
          }),

        setFeaturedProducts: (products) => set({ featuredProducts: products }),

        setBlogPosts: (posts) =>
          set({
            blogPosts: posts,
            lastFetched: { ...get().lastFetched, blog: Date.now() },
          }),

        isCacheFresh: (key, maxAge = 5 * 60 * 1000) => {
          const lastFetch = get().lastFetched[key];
          if (!lastFetch) return false;
          return Date.now() - lastFetch < maxAge;
        },

        reset: () =>
          set({
            publicProducts: [],
            customProducts: [],
            featuredProducts: [],
            blogPosts: [],
            lastFetched: { products: null, custom: null, blog: null },
          }),
      }),
      {
        name: 'jrs-customer-store',
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    { name: 'CustomerStore' }
  )
);

export default useCustomerStore;