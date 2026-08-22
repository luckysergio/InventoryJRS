import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";

const DashboardError = ({ error, onRetry }) => {
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Terjadi kesalahan saat memuat data dashboard.";

  return (
    <div className="bg-white rounded-3xl border border-rose-200/60 p-8 sm:p-14 text-center shadow-lg shadow-rose-100/50 animate-fadeIn">
      <div className="relative mx-auto w-20 h-20 mb-5">
        <div className="absolute inset-0 bg-rose-200 rounded-full blur-xl opacity-60" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-200 rotate-3">
          <WifiOff className="w-9 h-9 text-white" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">
        Gagal Memuat Dashboard
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
        {errorMessage}
      </p>
      
      <button
        onClick={onRetry}
        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-500 to-sky-500 text-white rounded-xl text-sm font-semibold hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 active:scale-95"
      >
        <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-700" />
        Coba Lagi
      </button>
    </div>
  );
};

export default DashboardError;