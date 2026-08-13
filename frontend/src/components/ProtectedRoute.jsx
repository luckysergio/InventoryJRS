import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../lib/zustand/authStore";

const ProtectedRoute = ({ children, roles = [] }) => {
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuthStore();

  // ✅ Defensive check: pastikan roles adalah array
  // Ini menangani kasus jika props dikirim sebagai null/undefined/bukan array
  const requiredRoles = Array.isArray(roles) ? roles : [];

  // Loading state: token ada tapi user belum ter-fetch dari profile
  if (!user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 font-mono">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Belum login → redirect ke login page
  if (!token || !isAuthenticated) {
    return <Navigate to="/jayarubberseallogin" state={{ from: location }} replace />;
  }

  // Cek role jika ada restriction
  if (requiredRoles.length > 0 && user) {
    const hasAccess = requiredRoles.includes(user.role);

    if (!hasAccess) {
      return (
        <Navigate
          to="/403"
          state={{ from: location, requiredRoles }}
          replace
        />
      );
    }
  }

  // Akses diizinkan
  return children;
};

export default ProtectedRoute;