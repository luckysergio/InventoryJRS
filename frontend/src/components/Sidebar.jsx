import {
  X,
  ChevronDown,
  Home,
  Boxes,
  Receipt,
  Warehouse,
  Factory,
  ClipboardCheck,
  PersonStanding,
  Handshake,
  ArrowLeft,
  Database,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);

  const [masterDataOpen, setMasterDataOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [transaksiOpen, setTransaksiOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [stokOpnameOpen, setStokOpnameOpen] = useState(false);

  const storedUser = localStorage.getItem("user");
  const userRole = storedUser ? JSON.parse(storedUser).role : null;
  const isAdmin = userRole === "admin";
  const isAllowedForTransaksi = userRole === "admin" || userRole === "admin_toko";

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    const path = location.pathname;

    const productionRoutes = ["/production", "/RiwayatProduction"];
    const isProductionRoute = productionRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    const productRoutes = [
      "/product",
      "/product-distributor",
      "/harga-product",
      "/product-terlaris",
    ];
    const isProductRoute = productRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    const transaksiRoutes = ["/transaksi", "/pesanan", "/riwayat-transaksi"];
    const isTransaksiRoute = transaksiRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    const inventoryRoutes = ["/inventory", "/ProductMovement"];
    const isInventoryRoute = inventoryRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    const stokOpnameRoutes = ["/StokOpname", "/Riwayat-StokOpname"];
    const isStokOpnameRoute = stokOpnameRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    const masterDataRoutes = [
      "/user",
      "/karyawan",
      "/jenis",
      "/type",
      "/bahan",
      "/status-transaksi",
      "/jabatan",
    ];
    const isMasterDataRoute = masterDataRoutes.some(
      (route) => path === route || path.startsWith(route + "/"),
    );

    setProductionOpen(isProductionRoute);
    setProductOpen(isProductRoute);
    setTransaksiOpen(isTransaksiRoute);
    setInventoryOpen(isInventoryRoute);
    setStokOpnameOpen(isStokOpnameRoute);
    setMasterDataOpen(isMasterDataRoute);
  }, [location.pathname]);

  const NavLink = ({ children, to, icon: Icon }) => {
    const isActive = location.pathname === to;

    return (
      <div className="relative group">
        <Link
          to={to}
          className={`
            flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300
            group-hover:scale-[1.02] group-hover:shadow-sm
            ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-600 hover:bg-gray-50/90 hover:text-gray-900"
            }
            ${isMinimized ? "justify-center px-3" : ""}
          `}
        >
          {/* Active indicator */}
          {isActive && !isMinimized && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full" />
          )}

          <div className="relative">
            <Icon
              className={`
                w-5 h-5 transition-all duration-300
                ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-blue-500"
                }
                ${isMinimized ? "group-hover:scale-110" : ""}
              `}
            />

            {/* Active dot indicator for minimized state */}
            {isActive && isMinimized && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
            )}
          </div>

          {!isMinimized && (
            <span className="font-medium text-sm whitespace-nowrap">
              {children}
            </span>
          )}
        </Link>

        {/* Tooltip for minimized state */}
        {isMinimized && (
          <div
            className="
            absolute left-full top-1/2 -translate-y-1/2 ml-2
            px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg
            shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
            pointer-events-none whitespace-nowrap z-50
            before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
            before:border-4 before:border-transparent before:border-r-gray-900
          "
          >
            {children}
          </div>
        )}
      </div>
    );
  };

  // Dropdown untuk menu bertingkat
  const Dropdown = ({ title, open, setOpen, children, icon: Icon }) => (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center justify-between w-full px-4 py-3.5 rounded-xl
          transition-all duration-300 group hover:scale-[1.02]
          ${
            open
              ? "bg-gradient-to-r from-gray-50 to-gray-100/80 text-gray-900 border border-gray-200/50"
              : "text-gray-600 hover:bg-gray-50/90 hover:text-gray-900"
          }
          ${isMinimized ? "justify-center px-3" : ""}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon
              className={`
                w-5 h-5 transition-all duration-300
                ${
                  open
                    ? "text-blue-600"
                    : "text-gray-500 group-hover:text-blue-500"
                }
                ${isMinimized ? "group-hover:scale-110" : ""}
              `}
            />

            {/* Indicator for active dropdown in minimized state */}
            {open && isMinimized && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            )}
          </div>

          {!isMinimized && (
            <span className="font-medium text-sm whitespace-nowrap">
              {title}
            </span>
          )}
        </div>

        {!isMinimized && (
          <ChevronDown
            className={`
              w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0
              ${open ? "rotate-180" : ""}
            `}
          />
        )}
      </button>

      {!isMinimized && (
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${open ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}
          `}
        >
          <div className="ml-5 pl-4 space-y-0.5 border-l-2 border-gray-200/60">
            {children}
          </div>
        </div>
      )}

      {/* Tooltip for dropdown in minimized state */}
      {isMinimized && (
        <div
          className="
          absolute left-full top-1/2 -translate-y-1/2 ml-2
          px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg
          shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none whitespace-nowrap z-50
          before:absolute before:right-full before:top-1/2 before:-translate-y-1/2
          before:border-4 before:border-transparent before:border-r-gray-900
        "
        >
          {title}
        </div>
      )}
    </div>
  );

  // Submenu link
  const SubNavLink = ({ children, to }) => {
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        className={`
          block px-4 py-2.5 text-sm rounded-lg transition-all duration-300
          group relative
          ${
            isActive
              ? "bg-blue-50/80 text-blue-700 font-medium shadow-sm"
              : "text-gray-600 hover:bg-gray-50/70 hover:text-gray-900"
          }
        `}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600 rounded-r" />
        )}

        <span
          className={`
          ${isActive ? "ml-2" : ""}
          transition-all duration-200 group-hover:translate-x-1
        `}
        >
          {children}
        </span>

        {/* Hover indicator */}
        {!isActive && (
          <div
            className="
            absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2
            bg-gray-300 rounded-r opacity-0 group-hover:opacity-100
            transition-all duration-300
          "
          />
        )}
      </Link>
    );
  };

  // Logo section
  const LogoSection = () => (
    <div className="flex items-center gap-3">
      <div
        className={`
        relative flex items-center justify-center
        ${isMinimized ? "w-10 h-10" : "w-9 h-9"}
        transition-all duration-300
      `}
      >
        <img
          src="/Favicon/favJRS.webp"
          alt="JRS Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            e.target.style.display = "none";
            const fallback = document.createElement("div");
            fallback.className = `
              w-full h-full flex items-center justify-center rounded-xl
              bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200/50
            `;
            fallback.innerHTML =
              '<span class="text-xs font-bold text-blue-600">JRS</span>';
            e.target.parentNode.appendChild(fallback);
          }}
        />
      </div>

      {!isMinimized && (
        <div className="overflow-hidden">
          <h1 className="text-base font-bold text-gray-800 whitespace-nowrap">
            Jaya Rubber Seal
          </h1>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
            Manufacturing System
          </p>
        </div>
      )}
    </div>
  );

  // Header sidebar
  const SidebarHeader = () => (
    <div
      className={`
      px-5 py-3.5 border-b border-gray-200/50 
      bg-gradient-to-br from-white to-gray-50/50
      backdrop-blur-sm
    `}
    >
      <div className="flex items-center justify-between">
        <LogoSection />

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={`
            p-2 rounded-xl hover:bg-gray-100 transition-all duration-300
            group border border-transparent hover:border-gray-200
            ${isMinimized ? "mx-auto" : ""}
            lg:flex hidden items-center justify-center
          `}
          title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
        >
          <ArrowLeft
            className={`
              w-4 h-4 text-gray-500 group-hover:text-gray-700
              transition-transform duration-300
              ${isMinimized ? "rotate-180" : ""}
            `}
          />
        </button>
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="px-2.5 py-3 space-y-0.5">
      <NavLink to="/home" icon={Home}>
        Home
      </NavLink>

      {/* Master Data - Hanya untuk admin */}
      {isAdmin && (
        <div className="relative">
          <Dropdown
            title="Master Data"
            open={masterDataOpen}
            setOpen={setMasterDataOpen}
            icon={Database}
          >
            <SubNavLink to="/user">User</SubNavLink>
            <SubNavLink to="/karyawan">Karyawan</SubNavLink>
            <SubNavLink to="/jabatan">Data Jabatan</SubNavLink>
            <SubNavLink to="/jenis">Jenis Product</SubNavLink>
            <SubNavLink to="/type">Type Product</SubNavLink>
            <SubNavLink to="/bahan">Bahan Product</SubNavLink>
            <SubNavLink to="/status-transaksi">Status Transaksi</SubNavLink>
          </Dropdown>
        </div>
      )}

      {/* Customer & Distributor */}
      {isAllowedForTransaksi && (
        <NavLink to="/customer" icon={PersonStanding}>
          Customer
        </NavLink>
      )}
      {isAllowedForTransaksi && (
        <NavLink to="/distributor" icon={Handshake}>
          Distributor
        </NavLink>
      )}

      {/* Product */}
      <Dropdown
        title="Product"
        open={productOpen}
        setOpen={setProductOpen}
        icon={Boxes}
      >
        <SubNavLink to="/product">Product</SubNavLink>
        <SubNavLink to="/product-distributor">Product Distributor</SubNavLink>
        <SubNavLink to="/product-terlaris">Product Terlaris</SubNavLink>
        <SubNavLink to="/harga-product">Harga Product</SubNavLink>
      </Dropdown>

      {/* Transaksi - hanya untuk admin dan admin_toko */}
      {isAllowedForTransaksi && (
        <Dropdown
          title="Transaksi"
          open={transaksiOpen}
          setOpen={setTransaksiOpen}
          icon={Receipt}
        >
          <SubNavLink to="/transaksi">Transaksi Daily</SubNavLink>
          <SubNavLink to="/pesanan">Transaksi Pesanan</SubNavLink>
          <SubNavLink to="/riwayat-transaksi">Riwayat Transaksi</SubNavLink>
        </Dropdown>
      )}

      {/* Inventory */}
      <Dropdown
        title="Inventory"
        open={inventoryOpen}
        setOpen={setInventoryOpen}
        icon={Warehouse}
      >
        <SubNavLink to="/inventory">Inventory</SubNavLink>
        <SubNavLink to="/ProductMovement">Product Movement</SubNavLink>
      </Dropdown>

      {/* Production */}
      <Dropdown
        title="Production"
        open={productionOpen}
        setOpen={setProductionOpen}
        icon={Factory}
      >
        <SubNavLink to="/production">Production</SubNavLink>
        <SubNavLink to="/RiwayatProduction">Riwayat Production</SubNavLink>
      </Dropdown>

      {/* Stok Opname */}
      <Dropdown
        title="Stok Opname"
        open={stokOpnameOpen}
        setOpen={setStokOpnameOpen}
        icon={ClipboardCheck}
      >
        <SubNavLink to="/StokOpname">Stok Opname</SubNavLink>
        <SubNavLink to="/Riwayat-StokOpname">Riwayat SO</SubNavLink>
      </Dropdown>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex bg-white/95 backdrop-blur-sm border-r border-gray-200/50
          flex-col overflow-hidden shadow-xl transition-all duration-300
          ${isMinimized ? "w-[88px]" : "w-[280px]"}
        `}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <SidebarContent />
          </div>

          {/* Minimized indicator */}
          {isMinimized && (
            <div className="px-4 py-3 border-t border-gray-200/50">
              <div className="text-center">
                <div className="w-6 h-0.5 bg-gray-300 mx-auto rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden
          transition-all duration-300
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-white/95 backdrop-blur-sm
          shadow-2xl transform transition-all duration-300 lg:hidden
          ${sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"}
        `}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200/50">
              <LogoSection />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto px-2.5 py-3">
                <SidebarContent />
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
