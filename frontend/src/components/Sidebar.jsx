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
  Users,
  Handshake,
  ArrowLeft,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);

  const [productOpen, setProductOpen] = useState(false);
  const [transaksiOpen, setTransaksiOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [stokOpnameOpen, setStokOpnameOpen] = useState(false);
  const [karyawanOpen, setKaryawanOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;

    const productionRoutes = ["/production", "/RiwayatProduction"];
    const isProductionRoute = productionRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    const productRoutes = [
      "/product",
      "/product-distributor",
      "/harga-product",
      "/jenis",
      "/type",
      "/bahan",
      "/product-terlaris",
    ];
    const isProductRoute = productRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    const transaksiRoutes = [
      "/transaksi",
      "/pesanan",
      "/riwayat-transaksi",
      "/status-transaksi",
    ];
    const isTransaksiRoute = transaksiRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    const inventoryRoutes = ["/inventory", "/ProductMovement"];
    const isInventoryRoute = inventoryRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    const stokOpnameRoutes = ["/StokOpname", "/Riwayat-StokOpname"];
    const isStokOpnameRoute = stokOpnameRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    const karyawanRoutes = ["/karyawan", "/jabatan"];
    const isKaryawanRoute = karyawanRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    setProductionOpen(isProductionRoute);
    setProductOpen(isProductRoute);
    setTransaksiOpen(isTransaksiRoute);
    setInventoryOpen(isInventoryRoute);
    setStokOpnameOpen(isStokOpnameRoute);
    setKaryawanOpen(isKaryawanRoute);
  }, [location.pathname]);

  const NavLink = ({ children, to, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]"
            : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
        }`}
      >
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent animate-pulse" />
        )}
        <Icon
          className={`w-5 h-5 transition-all duration-300 relative z-10 ${
            isActive
              ? "text-white drop-shadow-sm"
              : "text-gray-400 group-hover:text-blue-500 group-hover:scale-110"
          }`}
        />
        {!isMinimized && (
          <span className="font-medium relative z-10">{children}</span>
        )}
      </Link>
    );
  };

  const Dropdown = ({ title, open, setOpen, children, icon: Icon }) => (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 group ${
          open
            ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900"
            : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 transition-all duration-300 ${
            open 
              ? "text-blue-600 scale-110" 
              : "text-gray-400 group-hover:text-blue-500 group-hover:scale-110"
          }`} />
          {!isMinimized && (
            <span className="font-medium">{title}</span>
          )}
        </div>
        {!isMinimized && (
          <div className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </button>

      {!isMinimized && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-4 pl-4 mt-2 space-y-1 border-l-2 border-gray-200">
            {children}
          </div>
        </div>
      )}
    </div>
  );

  const SubNavLink = ({ children, to }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`block px-4 py-2.5 text-sm rounded-lg transition-all duration-300 relative ${
          isActive
            ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
        }`}
      >
        {isActive && !isMinimized && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-blue-600 rounded-r" />
        )}
        {!isMinimized && (
          <span className={isActive ? "ml-2" : ""}>{children}</span>
        )}
      </Link>
    );
  };

  const SidebarHeader = () => (
    <div className="px-6 py-6 border-b border-gray-200/50 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-center gap-3">
        {!isMinimized && (
          <div>
            <h1 className="text-lg font-bold text-gray-800">Jaya Rubber Seal</h1>
          </div>
        )}
        {/* Minimize button hanya di desktop */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/80 transition-all duration-200 group lg:block hidden"
        >
          <ArrowLeft 
            className={`w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-transform duration-300 ${
              isMinimized ? "rotate-180" : ""
            }`} 
          />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex bg-white border-r border-gray-200/50 flex-col overflow-hidden shadow-xl transition-all duration-300 ${
          isMinimized ? 'w-20' : 'w-72'
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarHeader />
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <NavLink to="/dashboard-admin" icon={Home}>
              Dashboard
            </NavLink>

            <NavLink to="/customer" icon={PersonStanding}>
              Customer
            </NavLink>

            <NavLink to="/distributor" icon={Handshake}>
              Distributor
            </NavLink>

            <Dropdown title="Karyawan" open={karyawanOpen} setOpen={setKaryawanOpen} icon={Users}>
              <SubNavLink to="/karyawan">Data Karyawan</SubNavLink>
              <SubNavLink to="/jabatan">Data Jabatan</SubNavLink>
            </Dropdown>

            <Dropdown title="Product" open={productOpen} setOpen={setProductOpen} icon={Boxes}>
              <SubNavLink to="/product">Product</SubNavLink>
              <SubNavLink to="/product-distributor">Product Distributor</SubNavLink>
              <SubNavLink to="/product-terlaris">Product Terlaris</SubNavLink>
              <SubNavLink to="/harga-product">Harga Product</SubNavLink>
              <SubNavLink to="/jenis">Jenis Product</SubNavLink>
              <SubNavLink to="/type">Type Product</SubNavLink>
              <SubNavLink to="/bahan">Bahan Product</SubNavLink>
            </Dropdown>

            <Dropdown title="Transaksi" open={transaksiOpen} setOpen={setTransaksiOpen} icon={Receipt}>
              <SubNavLink to="/transaksi">Transaksi Daily</SubNavLink>
              <SubNavLink to="/pesanan">Transaksi Pesanan</SubNavLink>
              <SubNavLink to="/riwayat-transaksi">Riwayat Transaksi</SubNavLink>
            </Dropdown>

            <Dropdown title="Inventory" open={inventoryOpen} setOpen={setInventoryOpen} icon={Warehouse}>
              <SubNavLink to="/inventory">Inventory</SubNavLink>
              <SubNavLink to="/ProductMovement">Product Movement</SubNavLink>
            </Dropdown>

            <Dropdown title="Production" open={productionOpen} setOpen={setProductionOpen} icon={Factory}>
              <SubNavLink to="/production">Production</SubNavLink>
              <SubNavLink to="/RiwayatProduction">Riwayat Production</SubNavLink>
            </Dropdown>

            <Dropdown title="Stok Opname" open={stokOpnameOpen} setOpen={setStokOpnameOpen} icon={ClipboardCheck}>
              <SubNavLink to="/StokOpname">Stok Opname</SubNavLink>
              <SubNavLink to="/Riwayat-StokOpname">Riwayat SO</SubNavLink>
            </Dropdown>
          </nav>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white shadow-2xl transform transition-all duration-300 lg:hidden ${
          sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full"
        }`}
      >
        {sidebarOpen && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-gradient-to-br from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Jaya Rubber Seal</h1>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-white/80 transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900 group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>
            <div className="flex flex-col h-full overflow-hidden">
              <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <NavLink to="/dashboard-admin" icon={Home}>
                  Dashboard
                </NavLink>

                <NavLink to="/customer" icon={PersonStanding}>
                  Customer
                </NavLink>

                <NavLink to="/distributor" icon={Handshake}>
                  Distributor
                </NavLink>

                <Dropdown title="Karyawan" open={karyawanOpen} setOpen={setKaryawanOpen} icon={Users}>
                  <SubNavLink to="/karyawan">Data Karyawan</SubNavLink>
                  <SubNavLink to="/jabatan">Data Jabatan</SubNavLink>
                </Dropdown>

                <Dropdown title="Product" open={productOpen} setOpen={setProductOpen} icon={Boxes}>
                  <SubNavLink to="/product">Product</SubNavLink>
                  <SubNavLink to="/product-distributor">Product Distributor</SubNavLink>
                  <SubNavLink to="/product-terlaris">Product Terlaris</SubNavLink>
                  <SubNavLink to="/harga-product">Harga Product</SubNavLink>
                  <SubNavLink to="/jenis">Jenis Product</SubNavLink>
                  <SubNavLink to="/type">Type Product</SubNavLink>
                  <SubNavLink to="/bahan">Bahan Product</SubNavLink>
                </Dropdown>

                <Dropdown title="Transaksi" open={transaksiOpen} setOpen={setTransaksiOpen} icon={Receipt}>
                  <SubNavLink to="/transaksi">Transaksi Daily</SubNavLink>
                  <SubNavLink to="/pesanan">Transaksi Pesanan</SubNavLink>
                  <SubNavLink to="/riwayat-transaksi">Riwayat Transaksi</SubNavLink>
                </Dropdown>

                <Dropdown title="Inventory" open={inventoryOpen} setOpen={setInventoryOpen} icon={Warehouse}>
                  <SubNavLink to="/inventory">Inventory</SubNavLink>
                  <SubNavLink to="/ProductMovement">Product Movement</SubNavLink>
                </Dropdown>

                <Dropdown title="Production" open={productionOpen} setOpen={setProductionOpen} icon={Factory}>
                  <SubNavLink to="/production">Production</SubNavLink>
                  <SubNavLink to="/RiwayatProduction">Riwayat Production</SubNavLink>
                </Dropdown>

                <Dropdown title="Stok Opname" open={stokOpnameOpen} setOpen={setStokOpnameOpen} icon={ClipboardCheck}>
                  <SubNavLink to="/StokOpname">Stok Opname</SubNavLink>
                  <SubNavLink to="/Riwayat-StokOpname">Riwayat SO</SubNavLink>
                </Dropdown>
              </nav>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;