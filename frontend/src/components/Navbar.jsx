// components/Navbar.jsx
import { Menu, ChevronDown, User, LogOut } from "lucide-react";
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
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });
    if (!res.isConfirmed) return;

    await axios.post("http://127.0.0.1:8000/api/logout", {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    localStorage.clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-grey border-gray-200">
      <div className="h-16 px-4 md:px-6 flex items-center gap-4 max-w-7xl mx-auto w-full">
        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>

        {/* CENTER SLOT — DIBATASI LEBARNYA */}
        <div className="flex-1 flex justify-center min-w-0">
          <div className="w-full max-w-4xl">
            {centerContent}
          </div>
        </div>

        {/* USER MENU */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
              <User size={16} />
            </div>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;