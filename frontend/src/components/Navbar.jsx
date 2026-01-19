import { Menu, ChevronDown, User, LogOut, Factory, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";

const Navbar = ({ setSidebarOpen, centerContent }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    const close = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const logout = async () => {
    const res = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to exit the system?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
      background: '#1e293b',
      color: '#f1f5f9'
    });
    if (!res.isConfirmed) return;

    try {
      await axios.post("http://127.0.0.1:8000/api/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.log("Logout API error:", error);
    }

    localStorage.clear();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 bg-gray backdrop-blur-md">
      <div className="h-16 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
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
              <div className="bg-gray backdrop-blur-sm rounded-xl px-4 py-2">
                {centerContent}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Online</span>
          </div>

          {/* User Profile */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
            >
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ') || "Operator"}
                </div>
              </div>
              
              <ChevronDown 
                size={16} 
                className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-slideDown">
                {/* User Info */}
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/50">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-600">{user?.email}</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <LogOut size={16} className="text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Logout</div>
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