import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import AOS from "aos";

// Core Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// ============================================
// PUBLIC PAGES (Eager Load - Small Size)
// ============================================
import Login from "./pages/login";
import ResetPassword from "./pages/admin/ResetPassword";
import CompanyProfile from "./pages/cuxtomer/CompanyProfile";

// ============================================
// ADMIN PAGES (Lazy Load - Code Splitting)
// ============================================

// Dashboard
const HomePage = lazy(() => import("./pages/admin/HomePage"));

// User Management
const UserPage = lazy(() => import("./pages/admin/users/UserPage"));
const KaryawanPage = lazy(() => import("./pages/admin/KaryawanPage"));
const JabatanPage = lazy(() => import("./pages/admin/JabatanPage"));

// Customer & Distributor
const DistributorPage = lazy(() => import("./pages/admin/DistributorPage"));
const DistributorProductPage = lazy(() => import("./pages/admin/DistributorProductPage"));
const ProductCustomerPage = lazy(() => import("./pages/admin/ProductCustomerPage"));
const CustomerPage = lazy(() => import("./pages/admin/Customer"));

// Product & Inventory
const AllProductsPage = lazy(() => import("./pages/admin/AllProductsPage"));
const ProductPage = lazy(() => import("./pages/admin/Product"));
const HargaProductPage = lazy(() => import("./pages/admin/HargaProduct"));
const InventoryPage = lazy(() => import("./pages/admin/InventoryPage"));
const ProductMovementPage = lazy(() => import("./pages/admin/ProductMovementPage"));
const BarangKeluarPage = lazy(() => import("./pages/admin/BarangKeluar"));

// Master Data
const JenisPage = lazy(() => import("./pages/admin/JenisProduct"));
const TypePage = lazy(() => import("./pages/admin/TypeProduct"));
const BahanProductPage = lazy(() => import("./pages/admin/BahanProduct"));
const StatusTransaksiPage = lazy(() => import("./pages/admin/StatusTransaksiPage"));
const PlacePage = lazy(() => import("./pages/admin/PlacePage"));

// Production
const ProductionPage = lazy(() => import("./pages/admin/ProductionPage"));
const RiwayatProductionPage = lazy(() => import("./pages/admin/RiwayatProductionPage"));

// Stok Opname
const StokOpnamePage = lazy(() => import("./pages/admin/StokOpnamePage"));
const RiwayatSOPage = lazy(() => import("./pages/admin/RiwayatSOPage"));

// Transaksi
const TransaksiPage = lazy(() => import("./pages/admin/DaftarTransaksi"));
const PesananPage = lazy(() => import("./pages/admin/Pesanan"));
const RiwayatTransaksi = lazy(() => import("./pages/admin/RiwayatTransaksi"));

// ============================================
// ERROR PAGES (Lazy Load)
// ============================================
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ============================================
// LOADING COMPONENT
// ============================================
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

// ============================================
// HELPER: PROTECTED LAYOUT WRAPPER
// ============================================
const ProtectedLayout = ({ children, roles = [] }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

// ============================================
// HELPER: GUEST ROUTE (Redirect jika sudah login)
// ============================================
const GuestRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (token && user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ========================================
              PUBLIC ROUTES
          ======================================== */}
          <Route path="/" element={<CompanyProfile />} />

          <Route
            path="/jayarubberseallogin"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />

          {/* ========================================
              ERROR PAGES
          ======================================== */}
          <Route path="/403" element={<ForbiddenPage />} />

          {/* ========================================
              DASHBOARD
          ======================================== */}
          <Route
            path="/home"
            element={
              <ProtectedLayout>
                <HomePage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              USER MANAGEMENT (Admin Only)
          ======================================== */}
          <Route
            path="/user"
            element={
              <ProtectedLayout roles={["admin"]}>
                <UserPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/karyawan"
            element={
              <ProtectedLayout roles={["admin"]}>
                <KaryawanPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/jabatan"
            element={
              <ProtectedLayout roles={["admin"]}>
                <JabatanPage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              DISTRIBUTOR & CUSTOMER
          ======================================== */}
          <Route
            path="/distributor"
            element={
              <ProtectedLayout>
                <DistributorPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-distributor"
            element={
              <ProtectedLayout>
                <DistributorProductPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-customer"
            element={
              <ProtectedLayout>
                <ProductCustomerPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                <CustomerPage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              MASTER DATA (Admin Only)
          ======================================== */}
          <Route
            path="/jenis"
            element={
              <ProtectedLayout roles={["admin"]}>
                <JenisPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/type"
            element={
              <ProtectedLayout roles={["admin"]}>
                <TypePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/bahan"
            element={
              <ProtectedLayout roles={["admin"]}>
                <BahanProductPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/status-transaksi"
            element={
              <ProtectedLayout roles={["admin"]}>
                <StatusTransaksiPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/place"
            element={
              <ProtectedLayout roles={["admin"]}>
                <PlacePage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              PRODUCT & INVENTORY
          ======================================== */}
          <Route
            path="/allproduct"
            element={
              <ProtectedLayout>
                <AllProductsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/product"
            element={
              <ProtectedLayout>
                <ProductPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/harga-product"
            element={
              <ProtectedLayout>
                <HargaProductPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-movement"
            element={
              <ProtectedLayout>
                <ProductMovementPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/stok-opname"
            element={
              <ProtectedLayout>
                <StokOpnamePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/riwayat-stok-opname"
            element={
              <ProtectedLayout>
                <RiwayatSOPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-terlaris"
            element={
              <ProtectedLayout>
                <BarangKeluarPage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              PRODUCTION
          ======================================== */}
          <Route
            path="/production"
            element={
              <ProtectedLayout>
                <ProductionPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/riwayat-production"
            element={
              <ProtectedLayout>
                <RiwayatProductionPage />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              TRANSAKSI
          ======================================== */}
          <Route
            path="/transaksi"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                <TransaksiPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/pesanan"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                <PesananPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/riwayat-transaksi"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                <RiwayatTransaksi />
              </ProtectedLayout>
            }
          />

          {/* ========================================
              REDIRECTS (Backward Compatibility)
          ======================================== */}
          <Route path="/stok-barang" element={<Navigate to="/inventory" replace />} />
          <Route path="/Place" element={<Navigate to="/place" replace />} />
          <Route path="/ProductMovement" element={<Navigate to="/product-movement" replace />} />
          <Route path="/StokOpname" element={<Navigate to="/stok-opname" replace />} />
          <Route path="/RiwayatProduction" element={<Navigate to="/riwayat-production" replace />} />
          <Route path="/Riwayat-StokOpname" element={<Navigate to="/riwayat-stok-opname" replace />} />

          {/* ========================================
              404 - NOT FOUND
          ======================================== */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;