import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, Factory, Shield, Cog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { status, token, user, message } = response.data;

      if (!status) {
        throw new Error(message || "Login gagal");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      await Swal.fire({
        icon: "success",
        title: "Login Berhasil",
        text: "Selamat datang kembali!",
        timer: 1500,
        showConfirmButton: false,
        background: "#1e293b",
        color: "#f1f5f9",
      });

      navigate("/home");
    } catch (error) {
      let title = "Login Gagal";
      let text = "Terjadi kesalahan. Silakan coba lagi.";

      if (error.response) {
        const { status, data } = error.response;
        if (status === 422) {
          text = data?.message || "Email dan password wajib diisi";
        } else if (status === 401) {
          text = data?.message || "Email atau password salah";
        }
      } else if (error.request) {
        text =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      Swal.fire({
        icon: "error",
        title,
        text,
        confirmButtonText: "OK",
        background: "#1e293b",
        color: "#f1f5f9",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border-2 border-blue-400/20 rounded-full animate-spin-slow">
            <div className="absolute top-0 left-1/2 w-1 h-8 bg-blue-400/20 -translate-x-1/2" />
            <div className="absolute top-1/2 right-0 w-8 h-1 bg-blue-400/20 -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/2 w-1 h-8 bg-blue-400/20 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 w-8 h-1 bg-blue-400/20 -translate-y-1/2" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border-2 border-orange-400/20 rounded-full animate-spin-reverse">
            <div className="absolute top-0 left-1/2 w-1 h-6 bg-orange-400/20 -translate-x-1/2" />
            <div className="absolute top-1/2 right-0 w-6 h-1 bg-orange-400/20 -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/2 w-1 h-6 bg-orange-400/20 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 w-6 h-1 bg-orange-400/20 -translate-y-1/2" />
          </div>
        </div>

        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(90deg, #475569 1px, transparent 1px),
                               linear-gradient(180deg, #475569 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/10 to-transparent" />
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-16 h-16 bg-gradient-to-t from-gray-700/0 via-gray-600/10 to-gray-700/0 rounded-full animate-float"
            style={{
              left: `${15 + i * 10}%`,
              bottom: "-30px",
              animationDelay: `${i * 0.5}s`,
              animationDuration: "8s",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => {
          const icons = [
            <Cog key="cog" className="w-4 h-4 text-blue-400/20" />,
            <Factory key="factory" className="w-4 h-4 text-orange-400/20" />,
            <Shield key="shield" className="w-4 h-4 text-emerald-400/20" />,
          ];
          const Icon = icons[i % 3];

          return (
            <div
              key={i}
              className="absolute animate-float-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: "15s",
              }}
            >
              {Icon}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes pulse-industrial {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes slideInIndustrial {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        className="relative z-10 w-full max-w-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Industrial Card with Metal Texture */}
        <div className="relative">
          {/* Metal Frame Effect */}
          <div
            className={`absolute -inset-0.5 bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 rounded-2xl blur opacity-60 transition-all duration-500 ${isHovered ? "opacity-80" : ""}`}
          />

          {/* Bolt Decorations */}
          <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg" />
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg" />

          {/* Main Card with Industrial Texture */}
          <div className="relative bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 rounded-2xl border border-gray-700/50 overflow-hidden shadow-2xl animate-slideInIndustrial">
            {/* Subtle Metal Texture Overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 48%, #4b5563 50%, transparent 52%),
                  linear-gradient(-45deg, transparent 48%, #4b5563 50%, transparent 52%)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Header Section with Industrial Theme */}
            <div className="relative overflow-hidden">
              {/* Conveyor Belt Effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-move-belt" />

              <div className="relative px-8 pt-10 pb-6 text-center">
                {/* Industrial Logo Container */}
                <div className="relative inline-flex mb-2">
                  {/* Metal Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-gray-600/30" />

                  {/* Gear Background */}
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-spin-slow" />

                  {/* Main Logo */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center shadow-inner">
                    {/* Inner Gear */}
                    <div className="absolute w-16 h-16 rounded-full border border-orange-500/20 animate-spin-reverse" />

                    {/* Factory Icon */}
                    <div className="relative z-10">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg">
                        <img
                          src="/Favicon/favJRS.webp"
                          alt="JRS Logo"
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-full h-full flex items-center justify-center text-white font-bold text-sm";
                            fallback.textContent = "JRS";
                            e.target.parentNode.appendChild(fallback);
                          }}
                        />
                      </div>
                      {/* Bolt Accents */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                  </div>

                  {/* Outer Gears */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full border border-blue-400/30 animate-spin-reverse">
                    <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-blue-400/30 -translate-x-1/2" />
                    <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-blue-400/30 -translate-y-1/2" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full border border-orange-400/30 animate-spin-slow">
                    <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-orange-400/30 -translate-x-1/2" />
                    <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-orange-400/30 -translate-y-1/2" />
                  </div>
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-gray-200 to-orange-400 bg-clip-text text-transparent">
                    JAYA RUBBER SEAL
                  </span>
                </h1>

                {/* Safety Warning Strip */}
                <div className="mt-6 mx-auto w-32 h-1.5 bg-gradient-to-r from-yellow-500 via-black to-yellow-500 rounded-full" />
              </div>
            </div>

            <div className="px-8 pb-10 pt-6 relative">
              <div className="relative bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-6">
                <div className="mb-6 text-center"></div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="group">
                    <div className="flex items-center mb-3"></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <input
                        type="email"
                        className="relative w-full bg-gray-900/70 border-2 border-gray-700 rounded-lg px-4 py-3.5 pl-11 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-gray-200 placeholder-gray-500 transition-all duration-300 font-mono"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="employee@jayarubberseal.com"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <Mail className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </div>

                  {/* Password Input - Industrial Style */}
                  <div className="group">
                    <div className="flex items-center mb-3"></div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-amber-600/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="relative w-full bg-gray-900/70 border-2 border-gray-700 rounded-lg px-4 py-3.5 pl-11 pr-11 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 text-gray-200 placeholder-gray-500 transition-all duration-300 font-mono"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                        <Lock className="w-5 h-5 text-gray-500 group-hover:text-orange-400 transition-colors" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Industrial Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full relative overflow-hidden group mt-8 ${
                      loading ? "opacity-80 cursor-not-allowed" : ""
                    }`}
                  >
                    {/* Button Metal Plate */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-700 via-gray-800 to-gray-900 rounded-lg border-2 border-gray-600" />

                    {/* Button Press Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Button Indicator Light */}
                    <div
                      className={`absolute top-3 left-3 w-2 h-2 rounded-full ${loading ? "bg-green-500 animate-pulse" : "bg-gray-500 group-hover:bg-blue-400"}`}
                    />

                    {/* Shine Effect */}
                    <div className="absolute top-0 left-0 w-8 h-full bg-white/10 skew-x-12 -translate-x-16 group-hover:translate-x-[200%] transition-transform duration-700" />

                    {/* Button Content */}
                    <div className="relative py-3.5 rounded-lg flex items-center justify-center">
                      {loading ? (
                        <span className="flex items-center text-gray-300 font-semibold tracking-wider">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          SYSTEM ACCESS...
                        </span>
                      ) : (
                        <>
                          <Shield className="w-5 h-5 mr-3 text-gray-300 group-hover:text-white transition-colors" />
                          <span className="text-gray-300 font-semibold tracking-wider group-hover:text-white transition-colors">
                            AUTHORIZE ACCESS
                          </span>
                          <div className="ml-3 w-6 h-6 rounded border border-gray-500 group-hover:border-blue-400 flex items-center justify-center transition-colors">
                            <svg
                              className="w-3 h-3 text-gray-400 group-hover:text-blue-300 transition-colors"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Industrial Separator */}
                  <div className="flex items-center justify-center space-x-4 pt-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                  </div>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-gray-500 tracking-wider">
                © {new Date().getFullYear()} JAYA RUBBER SEAL
              </p>
            </div>

            {/* Corner Metal Plates */}
            <div className="absolute top-4 left-4 w-6 h-6 border-2 border-gray-600/50 rounded-sm rotate-45" />
            <div className="absolute top-4 right-4 w-6 h-6 border-2 border-gray-600/50 rounded-sm rotate-45" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-2 border-gray-600/50 rounded-sm rotate-45" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-gray-600/50 rounded-sm rotate-45" />
          </div>
        </div>
      </div>

      {/* Add Industrial Animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }

        @keyframes move-belt {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse-industrial {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-20px) rotate(90deg);
            opacity: 0.4;
          }
        }

        @keyframes slideInIndustrial {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }

        .animate-move-belt {
          animation: move-belt 3s linear infinite;
        }

        .animate-pulse-industrial {
          animation: pulse-industrial 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 8s linear infinite;
        }

        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }

        .animate-slideInIndustrial {
          animation: slideInIndustrial 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default Login;
