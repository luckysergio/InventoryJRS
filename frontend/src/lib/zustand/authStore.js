import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }, false, 'setAuth'),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }, false, 'clearAuth'),

      updateToken: (token) =>
        set({ token }, false, 'updateToken'),

      updateUser: (user) =>
        set({ user }, false, 'updateUser'),

      // ✅ Tambah logout sebagai alias clearAuth agar interceptor tidak crash
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }, false, 'logout'),

      hasRole: (role) => get().user?.role === role,
      hasAnyRole: (roles) => roles.includes(get().user?.role),
    }),
    {
      name: 'jrs-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================
// SELECTORS
// ============================================
export const useAuthState = () =>
  useAuthStore(useShallow((s) => ({
    user: s.user,
    token: s.token,
    isAuthenticated: s.isAuthenticated,
    setAuth: s.setAuth,
    clearAuth: s.clearAuth,
    updateToken: s.updateToken,
    updateUser: s.updateUser,
    logout: s.logout,
  })));

export const useUserRole = () =>
  useAuthStore(useShallow((s) => s.user?.role || null));

export const useIsAdmin = () =>
  useAuthStore(useShallow((s) => s.user?.role === 'admin'));