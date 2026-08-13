import { Menu, ChevronDown, LogOut, User, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../lib/zustand/authStore";

const Navbar = ({ setSidebarOpen, centerContent }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  
  // ✅ Gunakan Zustand, bukan localStorage langsung
  const user = useAuthStore((state) => state.user);
  const { logout, isLoggingOut } = useAuth();

  useEffect(() => {
    const close = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    const res = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to exit the system?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      background: "#1e293b",
      color: "#f1f5f9",
    });
    
    if (!res.isConfirmed) return;

    try {
      // ✅ Pakai useAuth hook, bukan axios manual
      await logout();
      navigate("/jayarubberseallogin", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      // Tetap redirect meskipun API error
      navigate("/jayarubberseallogin", { replace: true });
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleLabels = {
    admin: "Administrator",
    admin_toko: "Admin Toko",
    operator: "Operator",
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-700" />
          </button>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex justify-center px-4">
          <div className="w-full max-w-3xl">
            {centerContent && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50">
                {centerContent}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {getInitials(user?.name)}
              </div>

              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {roleLabels[user?.role] || user?.role || "Operator"}
                </div>
              </div>

              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-slideDown">
                {/* User Info */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {getInitials(user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {user?.name}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 group transition-colors disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <LogOut size={16} className="text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </div>
                      <div className="text-xs text-gray-500">Exit system</div>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-xs text-gray-500 flex items-center justify-between">
                    <span>System v1.0</span>
                    <span className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Secure
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;