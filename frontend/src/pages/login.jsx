import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, Factory, Key, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConfirmDialog } from "../hooks/useConfirmDialog";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn } = useAuth();
  const { success, info } = useConfirmDialog();

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

    try {
      await login({ email: email.trim().toLowerCase(), password });
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
            message = data.message || "Anda terlalu sering mencoba login. Silakan tunggu beberapa menit.";
            break;
          case 500:
            message = "Server sedang mengalami gangguan internal.";
            break;
          default:
            message = data.message || "Gagal terhubung ke server.";
        }
      } else if (err.request) {
        title = "Koneksi Gagal";
        message = "Tidak dapat terhubung ke server. Periksa koneksi internet atau pastikan backend berjalan.";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md p-4 animate-fade-in-up">
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header with Logo */}
          <div className="pt-10 pb-6 px-8 text-center">
            <div className="inline-flex items-center justify-center mb-6 relative group">
              <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all duration-500" />
              <img 
                src="/Logo/logo.png" 
                alt="Jaya Rubber Seal Logo" 
                className="w-20 h-20 object-contain relative z-10 drop-shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback Icon */}
              <div className="hidden w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl items-center justify-center shadow-lg z-10">
                <Factory className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-sm">Sign in to access your dashboard</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">EMAIL ADDRESS</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all duration-200 sm:text-sm"
                    placeholder="name@company.com"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 ml-1">PASSWORD</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all duration-200 sm:text-sm"
                    placeholder="••••••••"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-slate-400 hover:text-blue-400 font-medium transition-colors flex items-center gap-1.5"
                  disabled={isLoggingIn}
                >
                  <Key className="w-3.5 h-3.5" /> Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className={`w-full relative overflow-hidden rounded-xl py-4 font-bold text-white shadow-lg transition-all duration-300 transform active:scale-[0.98] ${
                  isLoggingIn 
                    ? "bg-slate-700 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/25 hover:from-blue-500 hover:to-cyan-500"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoggingIn ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      AUTHENTICATING...
                    </>
                  ) : (
                    <>SIGN IN <ArrowRight className="w-5 h-5" /></>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scale-in">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <AlertCircle className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Reset Password</h3>
              <p className="text-slate-400 text-sm mt-2">Enter your email to receive a reset link.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="email@example.com"
                  required
                  disabled={isResetting}
                />
              </div>
              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResetting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Login;