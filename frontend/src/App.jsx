import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import AOS from 'aos';

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages - eager load (kecil)
import Login from "./pages/login";
import ResetPassword from "./pages/admin/ResetPassword";
import CompanyProfile from "./pages/cuxtomer/CompanyProfile";

// Admin pages - lazy load (code splitting)
const HomePage = lazy(() => import("./pages/admin/HomePage"));
const AllProductsPage = lazy(() => import("./pages/admin/AllProductsPage"));
const UserPage = lazy(() => import("./pages/admin/UserPage"));
const KaryawanPage = lazy(() => import("./pages/admin/KaryawanPage"));
const JabatanPage = lazy(() => import("./pages/admin/JabatanPage"));
const DistributorPage = lazy(() => import("./pages/admin/DistributorPage"));
const DistributorProductPage = lazy(() => import("./pages/admin/DistributorProductPage"));
const ProductCustomerPage = lazy(() => import("./pages/admin/ProductCustomerPage"));
const ProductPage = lazy(() => import("./pages/admin/Product"));
const ProductionPage = lazy(() => import("./pages/admin/ProductionPage"));
const RiwayatProductionPage = lazy(() => import("./pages/admin/RiwayatProductionPage"));
const HargaProductPage = lazy(() => import("./pages/admin/HargaProduct"));
const InventoryPage = lazy(() => import("./pages/admin/InventoryPage"));
const ProductMovementPage = lazy(() => import("./pages/admin/ProductMovementPage"));
const StokOpnamePage = lazy(() => import("./pages/admin/StokOpnamePage"));
const RiwayatSOPage = lazy(() => import("./pages/admin/RiwayatSOPage"));
const BarangKeluarPage = lazy(() => import("./pages/admin/BarangKeluar"));
const JenisPage = lazy(() => import("./pages/admin/JenisProduct"));
const TypePage = lazy(() => import("./pages/admin/TypeProduct"));
const BahanProductPage = lazy(() => import("./pages/admin/BahanProduct"));
const StatusTransaksiPage = lazy(() => import("./pages/admin/StatusTransaksiPage"));
const PlacePage = lazy(() => import("./pages/admin/PlacePage"));
const CustomerPage = lazy(() => import("./pages/admin/Customer"));
const TransaksiPage = lazy(() => import("./pages/admin/DaftarTransaksi"));
const PesananPage = lazy(() => import("./pages/admin/Pesanan"));
const RiwayatTransaksi = lazy(() => import("./pages/admin/RiwayatTransaksi"));

// Error pages - lazy load
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 font-mono">Loading...</p>
    </div>
  </div>
);

// ✅ PERBAIKAN: default roles = [] (bukan null)
// Helper untuk membuat protected route dengan Layout
const ProtectedLayout = ({ children, roles = [] }) => (
  <ProtectedRoute roles={roles}>
    <Layout>
      {children}
    </Layout>
  </ProtectedRoute>
);

function App() {
  // Initialize AOS inside React lifecycle
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
          <Route path="/jayarubberseallogin" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

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
                {({ setNavbarContent }) => (
                  <UserPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/karyawan"
            element={
              <ProtectedLayout roles={["admin"]}>
                {({ setNavbarContent }) => (
                  <KaryawanPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/jabatan"
            element={
              <ProtectedLayout roles={["admin"]}>
                {({ setNavbarContent }) => (
                  <JabatanPage setNavbarContent={setNavbarContent} />
                )}
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
                {({ setNavbarContent }) => (
                  <DistributorPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-distributor"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <DistributorProductPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-customer"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <ProductCustomerPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/customer"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                {({ setNavbarContent }) => (
                  <CustomerPage setNavbarContent={setNavbarContent} />
                )}
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
                {({ setNavbarContent }) => (
                  <AllProductsPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/product"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <ProductPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/harga-product"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <HargaProductPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <InventoryPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-movement"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <ProductMovementPage setNavbarContent={setNavbarContent} />
                )}
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
                {({ setNavbarContent }) => (
                  <RiwayatSOPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/product-terlaris"
            element={
              <ProtectedLayout>
                {({ setNavbarContent }) => (
                  <BarangKeluarPage setNavbarContent={setNavbarContent} />
                )}
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
                {({ setNavbarContent }) => (
                  <RiwayatProductionPage setNavbarContent={setNavbarContent} />
                )}
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
                {({ setNavbarContent }) => (
                  <TransaksiPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/pesanan"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                {({ setNavbarContent }) => (
                  <PesananPage setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />
          <Route
            path="/riwayat-transaksi"
            element={
              <ProtectedLayout roles={["admin", "admin_toko"]}>
                {({ setNavbarContent }) => (
                  <RiwayatTransaksi setNavbarContent={setNavbarContent} />
                )}
              </ProtectedLayout>
            }
          />

          {/* ========================================
              REDIRECTS (untuk backward compatibility)
          ======================================== */}
          <Route path="/stok-barang" element={<Navigate to="/inventory" replace />} />
          <Route path="/Place" element={<Navigate to="/place" replace />} />
          <Route path="/ProductMovement" element={<Navigate to="/product-movement" replace />} />
          <Route path="/StokOpname" element={<Navigate to="/stok-opname" replace />} />
          <Route path="/RiwayatProduction" element={<Navigate to="/riwayat-production" replace />} />
          <Route path="/Riwayat-StokOpname" element={<Navigate to="/riwayat-stok-opname" replace />} />

          {/* ========================================
              404 - Redirect ke home
          ======================================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;