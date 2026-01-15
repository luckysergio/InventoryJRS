import {
  X,
  ChevronDown,
  ChevronUp,
  Home,
  Boxes,
  Receipt,
  Warehouse,
  Factory,
  ClipboardCheck,
  PersonStandingIcon,
  Users,
  Handshake,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const [productOpen, setProductOpen] = useState(false);
  const [transaksiOpen, setTransaksiOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [stokOpnameOpen, setStokOpnameOpen] = useState(false);
  const [karyawanOpen, setKaryawanOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;

    const productionRoutes = [
      "/production",
      "/RiwayatProduction",
    ];
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

    // 🔹 Deteksi rute karyawan & jabatan
    const karyawanRoutes = ["/karyawan", "/jabatan"];
    const isKaryawanRoute = karyawanRoutes.some((route) =>
      path === route || path.startsWith(route + "/")
    );

    setProductionOpen(isProductionRoute);
    setProductOpen(isProductRoute);
    setTransaksiOpen(isTransaksiRoute);
    setInventoryOpen(isInventoryRoute);
    setStokOpnameOpen(isStokOpnameRoute);
    setKaryawanOpen(isKaryawanRoute); // 🔹 update state
  }, [location.pathname]);

  const NavLink = ({ children, to, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          }`}
        />
        <span className="font-medium">{children}</span>
      </Link>
    );
  };

  const Dropdown = ({ title, open, setOpen, children, icon: Icon }) => (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          <span className="font-medium">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="ml-8 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
          {children}
        </div>
      )}
    </div>
  );

  const SubNavLink = ({ children, to }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
          isActive
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <aside className="hidden lg:flex lg:w-72 bg-white border-r border-gray-200 flex-col">
        <div className="flex flex-col h-full overflow-y-auto pb-6">
          <div className="px-6 py-6 border-b border-gray-200/50">
            <h1 className="text-xl font-bold text-gray-800 text-center">Jaya Rubber Seal</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavLink to="/dashboard-admin" icon={Home}>
              Dashboard
            </NavLink>

            {/* ✅ MENU CUSTOMER TETAP ADA */}
            <NavLink to="/customer" icon={PersonStandingIcon}>
              Customer
            </NavLink>

            <NavLink to="/distributor" icon={Handshake}>
              Distributor
            </NavLink>

            {/* 🔹 MENU BARU: KARYAWAN */}
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

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-50 w-72 h-full bg-white shadow-2xl transform transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Jaya Rubber Seal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="flex flex-col h-full overflow-y-auto pb-6">
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavLink to="/dashboard-admin" icon={Home}>
              Dashboard
            </NavLink>

            {/* ✅ MENU CUSTOMER TETAP ADA DI MOBILE */}
            <NavLink to="/customer" icon={PersonStandingIcon}>
              Customer
            </NavLink>

            <NavLink to="/distributor" icon={Handshake}>
              Distributor
            </NavLink>

            {/* 🔹 MENU KARYAWAN DI MOBILE */}
            <Dropdown title="Karyawan" open={karyawanOpen} setOpen={setKaryawanOpen} icon={Users}>
              <SubNavLink to="/karyawan">Data Karyawan</SubNavLink>
              <SubNavLink to="/jabatan">Data Jabatan</SubNavLink>
            </Dropdown>

            <Dropdown title="Product" open={productOpen} setOpen={setProductOpen} icon={Boxes}>
              <SubNavLink to="/product">Product</SubNavLink>
              <SubNavLink to="/product-distributor">Product Distributor</SubNavLink>
              <SubNavLink to="/harga-product">Harga Product</SubNavLink>
              <SubNavLink to="/jenis">Jenis Product</SubNavLink>
              <SubNavLink to="/type">Type Product</SubNavLink>
              <SubNavLink to="/bahan">Bahan Product</SubNavLink>
              <SubNavLink to="/product-terlaris">Product Terlaris</SubNavLink>
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
    </>
  );
};

export default Sidebar;