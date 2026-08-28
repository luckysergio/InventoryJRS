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

        set({ isLoggingOut: true });

        import('../websocket')
          .then(({ destroyEcho }) => {
            try {
              destroyEcho();
            } catch (e) {
            }
          })
          .catch(() => {
          });

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });

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

export const useIsAdminToko = () => useAuthStore((state) => {
  const role = state.user?.role;
  return role === 'admin_toko' || role === 'toko';
});