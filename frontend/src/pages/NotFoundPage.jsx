import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

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
          <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 rounded-2xl blur opacity-40" />

          {/* Card */}
          <div className="relative bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-2xl border border-amber-900/50 overflow-hidden shadow-2xl">
            {/* Header with Warning Stripe */}
            <div className="relative bg-gradient-to-r from-amber-900/30 to-amber-950/30 border-b border-amber-900/50 px-8 py-6">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-black to-yellow-500" />

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-amber-900/50 border-2 border-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-amber-400 tracking-wider">
                    404
                  </h1>
                  <p className="text-sm text-gray-400 mt-1 font-mono">
                    PAGE NOT FOUND
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">
              {/* Message */}
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 border border-gray-700 mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-200 mb-2">
                  Halaman Tidak Ditemukan
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Maaf, halaman yang Anda cari tidak ada, telah dihapus, atau
                  URL-nya salah.
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
                <Link
                  to={isAuthenticated ? "/home" : "/"}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-lg text-white font-medium transition-colors"
                >
                  <Home className="w-5 h-5" />
                  {isAuthenticated ? "Dashboard" : "Beranda"}
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-700/50 px-8 py-4 bg-gray-900/30">
              <p className="text-xs text-gray-500 text-center font-mono">
                © {new Date().getFullYear()} JAYA RUBBER SEAL - 404 ERROR HANDLER
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;