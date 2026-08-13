import { useNavigate, useLocation } from "react-router-dom";
import { Shield, ArrowLeft, Home, Lock } from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";

const ForbiddenPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  const requiredRoles = location.state?.requiredRoles || [];
  const fromPath = location.state?.from?.pathname || "/home";

  const roleLabels = {
    admin: "Administrator",
    admin_toko: "Admin Toko",
    operator: "Operator",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(90deg, #475569 1px, transparent 1px),
                             linear-gradient(180deg, #475569 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-2xl blur opacity-40" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-2xl border border-red-900/50 overflow-hidden shadow-2xl">
            {/* Header with Warning Stripe */}
            <div className="relative bg-gradient-to-r from-red-900/30 to-red-950/30 border-b border-red-900/50 px-8 py-6">
              {/* Safety Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-black to-yellow-500" />
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-900/50 border-2 border-red-700 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-red-400 tracking-wider">
                    AKSES DITOLAK
                  </h1>
                  <p className="text-sm text-gray-400 mt-1 font-mono">
                    ERROR 403 - FORBIDDEN ACCESS
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">
              {/* Current User Info */}
              <div className="bg-gray-900/50 rounded-lg border border-gray-700/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400 font-mono">
                    INFORMASI USER
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nama:</span>
                    <p className="text-gray-200 font-medium">{user?.name || "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Role Saat Ini:</span>
                    <p className="text-gray-200 font-medium">
                      {roleLabels[user?.role] || user?.role || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Required Roles */}
              {requiredRoles.length > 0 && (
                <div className="bg-red-950/20 rounded-lg border border-red-900/30 p-4">
                  <p className="text-sm text-gray-400 mb-2 font-mono">
                    HALAMAN INI HANYA BISA DIAKSES OLEH:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredRoles.map((role) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-red-900/30 border border-red-700/50 rounded text-sm text-red-300 font-medium"
                      >
                        {roleLabels[role] || role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              <div className="text-center py-4">
                <p className="text-gray-300 text-lg">
                  Anda tidak memiliki izin untuk mengakses halaman ini.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Hubungi administrator jika Anda merasa ini adalah kesalahan.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-200 font-medium transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Kembali
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-colors"
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700/50 px-8 py-4 bg-gray-900/30">
              <p className="text-xs text-gray-500 text-center font-mono">
                © {new Date().getFullYear()} JAYA RUBBER SEAL - ACCESS CONTROL SYSTEM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;