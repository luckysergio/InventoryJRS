import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoggingOut: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoggingOut: false });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:login', {
            detail: { user, token },
          }));
        }
      },

      clearAuth: () => {
        const state = get();
        if (state.isLoggingOut) return;

        // ✅ Set flag DULU sebagai guard
        set({ isLoggingOut: true });

        // Destroy Echo via dynamic import (avoid circular dependency)
        import('../websocket')
          .then(({ destroyEcho }) => {
            try {
              destroyEcho();
            } catch (e) {
              // ignore
            }
          })
          .catch(() => {
            // module not found - ignore
          });

        // Clear auth state (jangan reset isLoggingOut di sini!)
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

        // ✅ Reset flag di next tick agar tidak block future logout
        setTimeout(() => {
          set({ isLoggingOut: false });
        }, 100);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      },

      updateToken: (token) => set({ token }),

      updateUser: (user) => set({ user }),

      hasRole: (role) => get().user?.role === role,

      hasAnyRole: (roles) => {
        const userRole = get().user?.role;
        return roles.includes(userRole);
      },
    }),
    {
      name: 'jrs-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // ❌ JANGAN persist isLoggingOut
      }),
    }
  )
);

export const useAuthState = () =>
  useAuthStore(useShallow((s) => ({
    user: s.user,
    token: s.token,
    isAuthenticated: s.isAuthenticated,
    isLoggingOut: s.isLoggingOut,
    setAuth: s.setAuth,
    clearAuth: s.clearAuth,
    updateToken: s.updateToken,
    updateUser: s.updateUser,
  })));

export const useUserRole = () =>
  useAuthStore((s) => s.user?.role || null);

export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'admin');