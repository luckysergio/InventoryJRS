import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useConfirmDialog } from "../hooks/useConfirmDialog";
import {
  LayoutDashboard,
  Users,
  Boxes,
  Receipt,
  Warehouse,
  Factory,
  ClipboardCheck,
  Database,
  PersonStanding,
  Handshake,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu,
  X,
  Loader2,
  Star,
  TrendingUp,    // ✅ BARU: untuk Product Terlaris
  Flame,         // ✅ BARU: alternatif icon untuk Best Seller
} from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";
import { useAuth } from "../hooks/useAuth";

const buildNavItems = (userRole) => {
  const isAdmin = userRole === "admin";
  const isAllowedForTransaksi = userRole === "admin" || userRole === "admin_toko";

  const items = [
    {
      title: "Dashboard",
      href: "/home",
      icon: LayoutDashboard,
    },
  ];

  // Master Data - Admin only
  if (isAdmin) {
    items.push({
      title: "Master Data",
      href: "/master-data",
      icon: Database,
      children: [
        { title: "User", href: "/user", icon: Users },
        { title: "Karyawan", href: "/karyawan", icon: Users },
        { title: "Jabatan", href: "/jabatan", icon: Settings },
        { title: "Jenis Product", href: "/jenis", icon: Boxes },
        { title: "Type Product", href: "/type", icon: Boxes },
        { title: "Bahan Product", href: "/bahan", icon: Boxes },
        { title: "Status Transaksi", href: "/status-transaksi", icon: Receipt },
        { title: "Place", href: "/place", icon: Warehouse },
      ],
    });
  }

  // Customer & Distributor
  if (isAllowedForTransaksi) {
    items.push({ title: "Customer", href: "/customer", icon: PersonStanding });
    items.push({ title: "Distributor", href: "/distributor", icon: Handshake });
  }

  // Product
  items.push({
    title: "Product",
    href: "/product",
    icon: Boxes,
    children: [
      { title: "Semua Product", href: "/product", icon: Boxes },
      { title: "Product Customer", href: "/product-customer", icon: PersonStanding },
      { title: "Product Distributor", href: "/product-distributor", icon: Handshake },
      { title: "Harga Product", href: "/harga-product", icon: Star },
      // ✅ UPDATED: Icon TrendingUp lebih tepat untuk "Terlaris"
      { title: "Product Terlaris", href: "/product-terlaris", icon: TrendingUp },
    ],
  });

  // Transaksi - admin & admin_toko only
  if (isAllowedForTransaksi) {
    items.push({
      title: "Transaksi",
      href: "/transaksi",
      icon: Receipt,
      children: [
        { title: "Transaksi Daily", href: "/transaksi", icon: Receipt },
        { title: "Transaksi Pesanan", href: "/pesanan", icon: Receipt },
        { title: "Riwayat Transaksi", href: "/riwayat-transaksi", icon: Receipt },
      ],
    });
  }

  // Inventory
  items.push({
    title: "Inventory",
    href: "/inventory",
    icon: Warehouse,
    children: [
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "Product Movement", href: "/product-movement", icon: Boxes },
    ],
  });

  // Production
  items.push({
    title: "Production",
    href: "/production",
    icon: Factory,
    children: [
      { title: "Production", href: "/production", icon: Factory },
      { title: "Riwayat Production", href: "/riwayat-production", icon: Factory },
    ],
  });

  // Stok Opname
  items.push({
    title: "Stok Opname",
    href: "/stok-opname",
    icon: ClipboardCheck,
    children: [
      { title: "Stok Opname", href: "/stok-opname", icon: ClipboardCheck },
      { title: "Riwayat SO", href: "/riwayat-stok-opname", icon: ClipboardCheck },
    ],
  });

  return items;
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Auth state
  const user = useAuthStore((state) => state.user);
  const { logout, isLoggingOut } = useAuth();
  const { warning } = useConfirmDialog();

  // Build nav items based on user role
  const navItems = buildNavItems(user?.role);

  // Role labels mapping
  const roleLabels = {
    admin: "Administrator",
    admin_toko: "Admin Toko",
    operator: "Operator",
  };

  // Check window size for mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Auto expand current path
  useEffect(() => {
    const currentPath = location.pathname;
    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => currentPath === child.href || currentPath.startsWith(child.href + "/")
        );
        if (hasActiveChild && !expandedItems.includes(item.title)) {
          setExpandedItems((prev) => [...prev, item.title]);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const toggleExpand = (title) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  // Handle logout with ConfirmDialog
  const handleLogout = async () => {
    const result = await warning(
      "Logout?",
      "Apakah Anda yakin ingin keluar dari sistem?"
    );

    if (!result) return;

    try {
      await logout();
      navigate("/jayarubberseallogin", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/jayarubberseallogin", { replace: true });
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderNavItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isItemActive = !hasChildren && isActive(item.href);
    const isParentActive = hasChildren && item.children?.some((child) => isActive(child.href));
    const isSidebarOpen = isMobile ? isMobileOpen : isOpen;

    return (
      <div key={item.title} className="w-full">
        <Link
          to={hasChildren ? "#" : item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpand(item.title);
            } else if (isMobile) {
              setIsMobileOpen(false);
            }
          }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
            isItemActive
              ? "bg-blue-50 text-blue-700"
              : isParentActive
              ? "bg-blue-50/50 text-blue-600"
              : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-600",
            depth > 0 && "pl-10",
            !isSidebarOpen && !isMobile && "justify-center px-2"
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              isItemActive || isParentActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
            )}
          />

          {(isSidebarOpen || isMobile) && (
            <span
              className={cn(
                "flex-1 text-sm font-medium truncate",
                isItemActive || isParentActive ? "text-blue-700" : "text-gray-700"
              )}
            >
              {item.title}
            </span>
          )}

          {(isSidebarOpen || isMobile) && item.badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              {item.badge}
            </span>
          )}

          {(isSidebarOpen || isMobile) && hasChildren && (
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-200 shrink-0",
                isExpanded && "rotate-90",
                isItemActive || isParentActive ? "text-blue-600" : "text-gray-400"
              )}
            />
          )}
        </Link>

        {(isSidebarOpen || isMobile) && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Sidebar Content dengan User Profile Header
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* User Profile Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-gray-100",
          !isOpen && !isMobile && "justify-center px-2"
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 shrink-0 font-semibold text-sm">
          {getUserInitials()}
        </div>
        
        {(isOpen || isMobile) && (
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              {user?.name || "Pengguna"}
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {roleLabels[user?.role] || user?.role || "Role"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation & Logout */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-200 flex flex-col">
        <div className="space-y-1 flex-1">
          {navItems.map((item) => renderNavItem(item))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 disabled:opacity-50",
              !isOpen && !isMobile && "justify-center px-2"
            )}
          >
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5" />
            )}
            {(isOpen || isMobile) && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );

  // Mobile sidebar with overlay
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] h-full bg-white shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "hidden lg:block h-screen sticky top-0 bg-white border-r border-gray-100 transition-all duration-300 shrink-0",
        isOpen ? "w-64" : "w-[72px]"
      )}
    >
      {sidebarContent}

      <button
        onClick={toggleSidebar}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-40 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:border-blue-300 hover:text-blue-600 hover:scale-110 active:scale-90"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}