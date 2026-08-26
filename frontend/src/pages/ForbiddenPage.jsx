import { useNavigate, useLocation } from "react-router-dom";
import { Shield, ArrowLeft, Home, Lock } from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  
  const requiredRoles = location.state?.requiredRoles || [];
  const homePath = isAuthenticated ? "/home" : "/";

  const roleLabels = {
    admin: "Administrator",
    admin_toko: "Admin Toko",
    operator: "Operator",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-brand-50 to-ocean-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-50 to-ocean-50 border-b border-slate-100 px-8 py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-brand-600" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">
              Akses Ditolak
            </h1>
            <p className="text-slate-600 font-medium">
              ERROR 403 - FORBIDDEN ACCESS
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            {/* Current User Info */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-slate-500" />
                <span className="text-sm text-slate-700 font-semibold uppercase tracking-wide">
                  Informasi User
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1">Nama:</span>
                  <p className="text-slate-900 font-semibold">{user?.name || "-"}</p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Role Saat Ini:</span>
                  <p className="text-slate-900 font-semibold">
                    {roleLabels[user?.role] || user?.role || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Required Roles */}
            {requiredRoles.length > 0 && (
              <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                <p className="text-sm text-red-800 mb-3 font-semibold">
                  Halaman ini hanya bisa diakses oleh:
                </p>
                <div className="flex flex-wrap gap-2">
                  {requiredRoles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm text-red-700 font-medium shadow-sm"
                    >
                      {roleLabels[role] || role}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="text-center">
              <p className="text-slate-700 text-lg font-medium">
                Anda tidak memiliki izin untuk mengakses halaman ini.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Hubungi administrator jika Anda merasa ini adalah kesalahan.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-700 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Kembali
              </button>
              <button
                onClick={() => navigate(homePath)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-ocean-500 hover:shadow-lg hover:shadow-brand-500/30 rounded-xl text-white font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <Home className="w-5 h-5" />
                {isAuthenticated ? "Dashboard" : "Beranda"}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 text-center font-medium">
              © {new Date().getFullYear()} Jaya Rubber Seal - Access Control System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;