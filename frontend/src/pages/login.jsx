import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, Factory, Key, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import { useRecaptcha } from "../hooks/useRecaptcha";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { success, info } = useConfirmDialog();
  const { isReady, execute } = useRecaptcha();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      info("Input Tidak Lengkap", "Mohon isi email dan password.");
      return;
    }

    if (!isReady) {
      info("Verifikasi Belum Siap", "Sistem keamanan sedang dimuat, silakan tunggu sebentar.");
      return;
    }

    try {
      const recaptchaToken = await execute('login');

      const credentials = {
        email: email.trim().toLowerCase(),
        password: password,
        'g-recaptcha-response': recaptchaToken,
      };

      await login(credentials);
      await success("Login Berhasil", "Selamat datang kembali!");
      
      const redirectTo = location.state?.from?.pathname || "/home";
      navigate(redirectTo, { replace: true });
      
    } catch (err) {
      let title = "Login Gagal";
      let message = "Terjadi kesalahan pada server.";
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        switch (status) {
          case 400:
            title = "Verifikasi Keamanan Gagal";
            message = data.message || "Aktivitas mencurigakan terdeteksi. Silakan refresh halaman.";
            break;
          case 401:
            message = "Email atau password yang Anda masukkan salah.";
            break;
          case 422:
            if (data.errors) {
              const firstError = Object.values(data.errors)[0];
              message = Array.isArray(firstError) ? firstError[0] : firstError;
            } else {
              message = data.message || "Data tidak valid.";
            }
            break;
          case 429:
            title = "Terlalu Banyak Percobaan";
            message = data.message || "Silakan tunggu beberapa menit sebelum mencoba lagi.";
            break;
          case 500:
            message = "Server sedang mengalami gangguan internal.";
            break;
          default:
            message = data.message || "Gagal terhubung ke server.";
        }
      } else if (err.request) {
        title = "Koneksi Gagal";
        message = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      info(title, message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsResetting(true);
    try {
      const api = (await import('../lib/api/axios')).default; 
      await api.post("/auth/forgot-password", { email: resetEmail });
      
      success("Permintaan Diterima", "Link reset password telah dikirim ke email Anda.");
      setShowForgotModal(false);
      setResetEmail("");
    } catch (error) {
      info("Gagal Mengirim", error.response?.data?.message || "Periksa koneksi internet Anda.");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowForgotModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const isDisabled = isLoggingIn || !isReady;

  return (
    // ✅ NO SCROLL FIX: min-h-screen + flex center memastikan konten selalu di tengah.
    // Tema diubah menjadi Putih & Biru Muda yang smooth.
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-white relative font-sans selection:bg-blue-200">
      
      {/* Background Elements (Subtle Light Blue Blobs) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/30 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* ✅ ACCESSIBILITY: Main landmark */}
      <main className="relative z-10 w-full max-w-md p-4 sm:p-6 animate-fade-in-up">
        <div className="bg-white/90 backdrop-blur-xl border border-blue-100 rounded-3xl shadow-2xl shadow-blue-900/5 overflow-hidden">
          
          {/* Header with Logo */}
          <div className="pt-8 pb-4 px-6 sm:px-10 text-center">
            <div className="inline-flex items-center justify-center mb-4 relative group">
              {/* Soft Blue Glow */}
              <div className="absolute inset-0 bg-blue-400/10 blur-2xl rounded-full group-hover:bg-blue-400/20 transition-all duration-700" />
              
              {/* ✅ PERFORMANCE: fetchPriority & explicit dimensions */}
              <img 
                src="/Logo/logo.png" 
                alt="Jaya Rubber Seal Logo" 
                width={80}
                height={80}
                className="w-20 h-20 object-contain relative z-10 transition-transform duration-500 group-hover:scale-105"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback Icon */}
              <div className="hidden w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl items-center justify-center shadow-lg z-10">
                <Factory className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Form Section (Compact spacing to prevent laptop scroll) */}
          <div className="px-6 sm:px-10 pb-8">
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              
              {/* Email Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-300 sm:text-sm"
                    placeholder="name@company.com"
                    disabled={isDisabled}
                    autoComplete="email"
                    aria-required="true"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all duration-300 sm:text-sm"
                    placeholder="••••••••"
                    disabled={isDisabled}
                    autoComplete="current-password"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200 rounded-r-xl"
                    tabIndex={-1}
                    disabled={isDisabled}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors duration-300 flex items-center gap-1.5 group focus:outline-none focus:underline"
                  disabled={isDisabled}
                >
                  <Key className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-300" /> 
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isDisabled}
                className={`w-full relative overflow-hidden rounded-xl py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 transform active:scale-[0.98] mt-2 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
                  isDisabled
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isDisabled ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {!isReady ? "LOADING SECURITY..." : "AUTHENTICATING..."}
                    </>
                  ) : (
                    <>
                      SIGN IN <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="bg-slate-50/50 px-6 sm:px-10 py-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              © {new Date().getFullYear()} Jaya Rubber Seal. All rights reserved.
            </p>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal (Light Theme Match) */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-blue-900/10 w-full max-w-md p-6 sm:p-8 relative animate-modalIn">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Tutup modal"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-500 mb-4 ring-1 ring-blue-100 mx-auto">
                <Key className="w-6 h-6" />
              </div>
              <h3 id="modal-title" className="text-xl font-bold text-slate-800">Reset Password</h3>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                Masukkan email Anda dan kami akan mengirimkan link untuk mereset password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <label htmlFor="reset-email" className="sr-only">Email Address</label>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="reset-email"
                  name="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 focus:outline-none transition-all duration-300"
                  placeholder="email@example.com"
                  required
                  disabled={isResetting}
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white py-3.5 rounded-xl font-semibold transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Mengirim...
                  </>
                ) : "Kirim Link Reset"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Utility Animations */}
      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.5; } }
        
        .animate-fade-in-up { animation: fade-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-modalIn { animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Login;