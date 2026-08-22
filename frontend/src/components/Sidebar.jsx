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
  TrendingUp,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuthStore } from "../lib/zustand/authStore";
import { useAuth } from "../hooks/useAuth";

const buildNavItems = (userRole) => {
  const isAdmin = userRole === "admin";
  const isAllowedForTransaksi = userRole === "admin" || userRole === "admin_toko";

  const items = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      category: "Utama",
    },
  ];

  // Master Data - Admin only
  if (isAdmin) {
    items.push({
      title: "Master Data",
      href: "/master-data",
      icon: Database,
      category: "Manajemen",
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
    items.push({ title: "Customer", href: "/customer", icon: PersonStanding, category: "Manajemen" });
    items.push({ title: "Distributor", href: "/distributor", icon: Handshake, category: "Manajemen" });
  }

  // Product
  items.push({
    title: "Product",
    href: "/product",
    icon: Boxes,
    category: "Manajemen",
    children: [
      { title: "Semua Product", href: "/product", icon: Boxes },
      { title: "Product Customer", href: "/product-customer", icon: PersonStanding },
      { title: "Product Distributor", href: "/product-distributor", icon: Handshake },
      { title: "Harga Product", href: "/harga-product", icon: Star },
      { title: "Product Terlaris", href: "/product-terlaris", icon: TrendingUp },
    ],
  });

  // Transaksi - admin & admin_toko only
  if (isAllowedForTransaksi) {
    items.push({
      title: "Transaksi",
      href: "/transaksi",
      icon: Receipt,
      category: "Operasional",
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
    category: "Operasional",
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
    category: "Operasional",
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
    category: "Operasional",
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
  const [hoveredItem, setHoveredItem] = useState(null);

  // Auth state
  const user = useAuthStore((state) => state.user);
  const { logout, isLoggingOut } = useAuth();
  const { warning } = useConfirmDialog();

  // Build nav items based on user role
  const navItems = buildNavItems(user?.role);

  // Group nav items by category
  const groupedNavItems = navItems.reduce((acc, item) => {
    const category = item.category || "Lainnya";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Role labels mapping
  const roleLabels = {
    admin: "Administrator",
    admin_toko: "Admin Toko",
    operator: "Operator",
  };

  // Check window size for mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
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
    const isCollapsed = !isSidebarOpen && !isMobile;

    return (
      <div
        key={item.title}
        className="w-full relative"
        onMouseEnter={() => isCollapsed && setHoveredItem(item.title)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <Link
          to={hasChildren ? "#" : item.href}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              if (isSidebarOpen || isMobile) toggleExpand(item.title);
            } else if (isMobile) {
              setIsMobileOpen(false);
            }
          }}
          className={cn(
            "sidebar-item group relative flex items-center gap-3 rounded-xl transition-all duration-200",
            isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
            depth > 0 && !isCollapsed && "pl-11",
            isItemActive
              ? "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 shadow-sm shadow-blue-100"
              : isParentActive
              ? "bg-blue-50/60 text-blue-700"
              : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-700"
          )}
        >
          {/* Active indicator bar */}
          {isItemActive && !isCollapsed && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
          )}

          {/* Icon */}
          <div
            className={cn(
              "relative flex items-center justify-center shrink-0 transition-all duration-200",
              isCollapsed ? "h-6 w-6" : "h-8 w-8 rounded-lg",
              isItemActive || isParentActive
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-gray-50 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
            )}
          >
            <item.icon className={cn("transition-transform duration-200", isCollapsed ? "h-5 w-5" : "h-4 w-4", "group-hover:scale-110")} />
          </div>

          {/* Title */}
          {!isCollapsed && (
            <span
              className={cn(
                "flex-1 text-sm font-medium truncate transition-all duration-200",
                isItemActive || isParentActive ? "text-blue-700 font-semibold" : "text-gray-700"
              )}
            >
              {item.title}
            </span>
          )}

          {/* Badge */}
          {!isCollapsed && item.badge && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 rounded-full shadow-sm">
              {item.badge}
            </span>
          )}

          {/* Chevron */}
          {!isCollapsed && hasChildren && (
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform duration-300 shrink-0",
                isExpanded && "rotate-90",
                isItemActive || isParentActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
              )}
            />
          )}
        </Link>

        {/* Tooltip for collapsed state */}
        {isCollapsed && hoveredItem === item.title && (
          <div
            className={cn(
              "sidebar-tooltip absolute left-full top-1/2 ml-3 z-50 whitespace-nowrap px-3 py-1.5",
              "bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl",
              "pointer-events-none"
            )}
          >
            {item.title}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
          </div>
        )}

        {/* Children */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 ml-4 pl-4 border-l border-blue-100 space-y-0.5 animate-fadeIn">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderChildItem = (child) => {
    const isChildActive = isActive(child.href);
    const isSidebarOpen = isMobile ? isMobileOpen : isOpen;
    const isCollapsed = !isSidebarOpen && !isMobile;

    return (
      <Link
        key={child.title}
        to={child.href}
        onClick={() => isMobile && setIsMobileOpen(false)}
        className={cn(
          "sidebar-sub-item group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
          isCollapsed && "justify-center",
          isChildActive
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-gray-600 hover:bg-blue-50/60 hover:text-blue-700"
        )}
      >
        <child.icon
          className={cn(
            "h-4 w-4 shrink-0 transition-all duration-200",
            isChildActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
          )}
        />
        {!isCollapsed && <span className="text-sm truncate">{child.title}</span>}
        {isChildActive && !isCollapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </Link>
    );
  };

  // Sidebar Content
  const sidebarContent = (
    <div className="sidebar-glass flex flex-col h-full relative">
      {/* User Profile Card */}
      <div
        className={cn(
          "px-4 py-3 border-b border-blue-50 transition-all duration-300",
          !isOpen && !isMobile && "px-3 py-3"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-gradient-to-br from-blue-50/80 to-sky-50/80 border border-blue-100/50 transition-all duration-300",
            !isOpen && !isMobile && "p-0 bg-transparent border-0"
          )}
        >
          <div className="relative shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-300/40 font-semibold text-sm">
              {getUserInitials()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>

          {(isOpen || isMobile) && (
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-gray-900 truncate">{user?.name || "Pengguna"}</h1>
              <p className="text-xs text-blue-600 truncate font-medium">
                {roleLabels[user?.role] || user?.role || "Role"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 flex flex-col">
        <div className="space-y-4 flex-1">
          {Object.entries(groupedNavItems).map(([category, items]) => (
            <div key={category} className="space-y-1">
              {(isOpen || isMobile) && (
                <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
                  <span className="text-[10px] font-bold tracking-widest text-blue-500/70 uppercase">
                    {category}
                  </span>
                  <div className="flex-1 sidebar-divider" />
                </div>
              )}

              {items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.includes(item.title);
                const isItemActive = !hasChildren && isActive(item.href);
                const isParentActive = hasChildren && item.children?.some((child) => isActive(child.href));
                const isSidebarOpen = isMobile ? isMobileOpen : isOpen;
                const isCollapsed = !isSidebarOpen && !isMobile;

                return (
                  <div
                    key={item.title}
                    className="w-full relative"
                    onMouseEnter={() => isCollapsed && setHoveredItem(item.title)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <Link
                      to={hasChildren ? "#" : item.href}
                      onClick={(e) => {
                        if (hasChildren) {
                          e.preventDefault();
                          if (isSidebarOpen || isMobile) toggleExpand(item.title);
                        } else if (isMobile) {
                          setIsMobileOpen(false);
                        }
                      }}
                      className={cn(
                        "sidebar-item group relative flex items-center gap-3 rounded-xl transition-all duration-200",
                        isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                        isItemActive
                          ? "bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 shadow-sm shadow-blue-100"
                          : isParentActive
                          ? "bg-blue-50/60 text-blue-700"
                          : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-700"
                      )}
                    >
                      {isItemActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                      )}

                      <div
                        className={cn(
                          "relative flex items-center justify-center shrink-0 transition-all duration-200",
                          isCollapsed ? "h-5 w-5" : "h-8 w-8 rounded-lg",
                          isItemActive || isParentActive
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200"
                            : "bg-white border border-blue-100 text-gray-500 group-hover:bg-blue-100 group-hover:border-blue-200 group-hover:text-blue-600"
                        )}
                      >
                        <item.icon className={cn("transition-transform duration-200 group-hover:scale-110", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                      </div>

                      {!isCollapsed && (
                        <span
                          className={cn(
                            "flex-1 text-sm font-medium truncate transition-all duration-200",
                            isItemActive || isParentActive ? "text-blue-700 font-semibold" : "text-gray-700"
                          )}
                        >
                          {item.title}
                        </span>
                      )}

                      {!isCollapsed && item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}

                      {!isCollapsed && hasChildren && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform duration-300 shrink-0",
                            isExpanded && "rotate-90",
                            isItemActive || isParentActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-500"
                          )}
                        />
                      )}
                    </Link>

                    {isCollapsed && hoveredItem === item.title && (
                      <div className="sidebar-tooltip absolute left-full top-1/2 ml-3 z-50 whitespace-nowrap px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl pointer-events-none">
                        {item.title}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                      </div>
                    )}

                    {!isCollapsed && hasChildren && isExpanded && (
                      <div className="mt-1 ml-3 pl-4 border-l-2 border-blue-100 space-y-0.5 animate-fadeIn">
                        {item.children?.map((child) => renderChildItem(child))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Logout Section */}
        <div className="mt-4 pt-4 border-t border-blue-50">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 disabled:opacity-50",
              !isOpen && !isMobile && "justify-center px-2",
              "text-red-500 hover:text-red-600 hover:bg-red-50 group"
            )}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:text-red-600 transition-all shrink-0">
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              )}
            </div>
            {(isOpen || isMobile) && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Keluar..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-40 lg:hidden p-2.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg shadow-blue-500/10 border border-blue-100 hover:bg-blue-50 hover:shadow-blue-500/20 transition-all duration-200 group"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
        </button>

        {isMobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-blue-950/40 backdrop-blur-sm animate-fade-in-overlay"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-72 max-w-[85%] h-full bg-white shadow-2xl shadow-blue-500/10 animate-slide-in-left">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-lg bg-white border border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 group shadow-sm"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4 text-gray-600 group-hover:text-blue-600 group-hover:rotate-90 transition-all duration-300" />
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
        "hidden lg:block h-screen sticky top-0 transition-all duration-300 shrink-0 border-r border-blue-50 bg-white",
        isOpen ? "w-64" : "w-[72px]"
      )}
    >
      {sidebarContent}

      <button
        onClick={toggleSidebar}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className={cn(
          "absolute -right-3.5 top-1/2 -translate-y-1/2 z-40",
          "flex h-7 w-7 items-center justify-center rounded-full",
          "bg-white border border-blue-100 text-blue-600 shadow-lg shadow-blue-500/10",
          "transition-all duration-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-blue-500/30",
          "hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
      </button>
    </aside>
  );
}