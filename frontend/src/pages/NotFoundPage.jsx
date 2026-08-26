import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Search } from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const homePath = isAuthenticated ? "/home" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-brand-50 to-ocean-50 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-50 to-ocean-50 border-b border-slate-100 px-8 py-8 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-brand-100 border-2 border-brand-200 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-brand-600" />
            </div>
            <h1 className="text-5xl font-display font-black text-slate-900 mb-2 tracking-tight">
              404
            </h1>
            <p className="text-slate-600 font-semibold uppercase tracking-wide">
              Halaman Tidak Ditemukan
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            {/* Message */}
            <div className="text-center">
              <p className="text-slate-700 text-lg leading-relaxed max-w-sm mx-auto">
                Maaf, halaman yang Anda cari tidak ada, telah dipindahkan, atau URL-nya salah.
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
              <Link
                to={homePath}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-ocean-500 hover:shadow-lg hover:shadow-brand-500/30 rounded-xl text-white font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                <Home className="w-5 h-5" />
                {isAuthenticated ? "Dashboard" : "Beranda"}
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-8 py-4 bg-slate-50/50">
            <p className="text-xs text-slate-500 text-center font-medium">
              © {new Date().getFullYear()} Jaya Rubber Seal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;