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
        set({ user, token, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      updateToken: (token) =>
        set({ token }),

      updateUser: (user) =>
        set({ user }),

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
    setAuth: s.setAuth,
    clearAuth: s.clearAuth,
    updateToken: s.updateToken,
    updateUser: s.updateUser,
  })));

export const useUserRole = () =>
  useAuthStore((s) => s.user?.role || null);

export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'admin');