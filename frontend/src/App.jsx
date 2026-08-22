import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import AOS from "aos";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

// Layouts & Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfirmDialog from "./components/ui/ConfirmDialog";

// Zustand Store
import { useAuthStore } from "./lib/zustand/authStore";

// ==========================================
// PUBLIC PAGES (Eager Load - No Auth)
// ==========================================
import Login from "./pages/login";
import ResetPassword from "./pages/admin/ResetPassword";
import CompanyProfile from "./pages/cuxtomer/CompanyProfile";

// ==========================================
// PROTECTED PAGES (Lazy Load - Code Splitting)
// ==========================================

// 📊 Dashboard
const DashboardPage = lazy(() => import("./pages/admin/dashboard/DashboardPage"));

// 👥 Users & Access Management (Admin Only)
const UserPage = lazy(() => import("./pages/admin/users/UserPage"));
const KaryawanPage = lazy(() => import("./pages/admin/karyawan/KaryawanPage"));
const JabatanPage = lazy(() => import("./pages/admin/jabatan/JabatanPage"));

// 🏪 Customer & Distributor
const DistributorPage = lazy(() => import("./pages/admin/distributor/DistributorPage"));
const DistributorProductPage = lazy(() => import("./pages/admin/productdistributor/DistributorProductPage"));
const ProductCustomerPage = lazy(() => import("./pages/admin/productcustomer/ProductCustomerPage"));
const CustomerPage = lazy(() => import("./pages/admin/customer/Customer"));

// 📦 Products & Master Data
const AllProductsPage = lazy(() => import("./pages/admin/AllProductsPage"));
const ProductPage = lazy(() => import("./pages/admin/product/Product"));
const HargaProductPage = lazy(() => import("./pages/admin/hargaproduct/HargaProduct"));
const BestSellerPage = lazy(() => import("./pages/admin/best-seller/BestSellerPage"));

// 📚 Product Categories (Admin Only)
const JenisPage = lazy(() => import("./pages/admin/jenisproduct/JenisProduct"));
const TypePage = lazy(() => import("./pages/admin/typeproduct/TypeProduct"));
const BahanProductPage = lazy(() => import("./pages/admin/bahanproduct/BahanProduct"));
const StatusTransaksiPage = lazy(() => import("./pages/admin/statustransaksi/StatusTransaksiPage"));
const PlacePage = lazy(() => import("./pages/admin/places/PlacePage"));

// 📋 Inventory & Movement
const InventoryPage = lazy(() => import("./pages/admin/inventory/InventoryPage"));
const ProductMovementPage = lazy(() => import("./pages/admin/productmovement/ProductMovementPage"));
const StokOpnamePage = lazy(() => import("./pages/admin/stokopname/StokOpnamePage"));
const RiwayatSOPage = lazy(() => import("./pages/admin/stokopname/RiwayatSOPage"));

// 🏭 Production
const ProductionPage = lazy(() => import("./pages/admin/production/ProductionPage"));
const RiwayatProductionPage = lazy(() => import("./pages/admin/production/RiwayatProductionPage"));

// 💰 Transactions & Orders
const TransaksiPage = lazy(() => import("./pages/admin/transaksidaily/DaftarTransaksi"));
const PesananPage = lazy(() => import("./pages/admin/pesanan/Pesanan"));
const RiwayatTransaksi = lazy(() => import("./pages/admin/transaksidaily/RiwayatTransaksi"));

// ❌ Error Pages
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// ==========================================
// COMPONENTS
// ==========================================

/**
 * Loading fallback untuk lazy-loaded routes
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

/**
 * Wrapper untuk protected route dengan layout
 * @param {React.ReactNode} children - Page component
 * @param {string[]} roles - Array of allowed roles
 */
const ProtectedLayout = ({ children, roles = [] }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

/**
 * Wrapper untuk guest-only routes (redirect jika sudah login)
 */
const GuestRoute = ({ children }) => {
  const { token, isAuthenticated } = useAuthStore();
  
  if (token || isAuthenticated) {
    // Redirect ke dashboard (bukan /home yang tidak exist)
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  // Initialize AOS animation once
  useEffect(() => {
    AOS.init({ 
      duration: 800, 
      once: true,
      easing: 'ease-out-cubic'
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            
            {/* ======================================== */}
            {/* PUBLIC ROUTES (No Authentication)        */}
            {/* ======================================== */}
            <Route path="/" element={<CompanyProfile />} />
            <Route path="/jayarubberseallogin" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />

            {/* ======================================== */}
            {/* ERROR ROUTES                             */}
            {/* ======================================== */}
            <Route path="/403" element={<ForbiddenPage />} />

            {/* ======================================== */}
            {/* DASHBOARD                                */}
            {/* ✅ Roles: admin, admin_toko, operator    */}
            {/* ======================================== */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout roles={["admin", "admin_toko", "operator"]}>
                  <DashboardPage />
                </ProtectedLayout>
              }
            />

            {/* ======================================== */}
            {/* USER & ACCESS MANAGEMENT (Admin Only)    */}
            {/* ======================================== */}
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

            {/* ======================================== */}
            {/* CUSTOMER & DISTRIBUTOR                   */}
            {/* ======================================== */}
            <Route
              path="/distributor"
              element={<ProtectedLayout><DistributorPage /></ProtectedLayout>}
            />
            <Route
              path="/product-distributor"
              element={<ProtectedLayout><DistributorProductPage /></ProtectedLayout>}
            />
            <Route
              path="/product-customer"
              element={<ProtectedLayout><ProductCustomerPage /></ProtectedLayout>}
            />
            <Route
              path="/customer"
              element={
                <ProtectedLayout roles={["admin", "admin_toko"]}>
                  <CustomerPage />
                </ProtectedLayout>
              }
            />

            {/* ======================================== */}
            {/* PRODUCT MASTER DATA (Admin Only)         */}
            {/* ======================================== */}
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

            {/* ======================================== */}
            {/* PRODUCTS & INVENTORY                     */}
            {/* ======================================== */}
            <Route
              path="/allproduct"
              element={<ProtectedLayout><AllProductsPage /></ProtectedLayout>}
            />
            <Route
              path="/product"
              element={<ProtectedLayout><ProductPage /></ProtectedLayout>}
            />
            <Route
              path="/product-terlaris"
              element={<ProtectedLayout><BestSellerPage /></ProtectedLayout>}
            />
            <Route
              path="/harga-product"
              element={<ProtectedLayout><HargaProductPage /></ProtectedLayout>}
            />
            <Route
              path="/inventory"
              element={<ProtectedLayout><InventoryPage /></ProtectedLayout>}
            />
            <Route
              path="/product-movement"
              element={<ProtectedLayout><ProductMovementPage /></ProtectedLayout>}
            />
            <Route
              path="/stok-opname"
              element={<ProtectedLayout><StokOpnamePage /></ProtectedLayout>}
            />
            <Route
              path="/riwayat-stok-opname"
              element={<ProtectedLayout><RiwayatSOPage /></ProtectedLayout>}
            />

            {/* ======================================== */}
            {/* PRODUCTION                               */}
            {/* ======================================== */}
            <Route
              path="/production"
              element={<ProtectedLayout><ProductionPage /></ProtectedLayout>}
            />
            <Route
              path="/riwayat-production"
              element={<ProtectedLayout><RiwayatProductionPage /></ProtectedLayout>}
            />

            {/* ======================================== */}
            {/* TRANSACTIONS & ORDERS                    */}
            {/* ======================================== */}
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

            {/* ======================================== */}
            {/* LEGACY REDIRECTS (Backward Compatibility) */}
            {/* ======================================== */}
            <Route path="/home" element={<Navigate to="/dashboard" replace />} />
            <Route path="/stok-barang" element={<Navigate to="/inventory" replace />} />
            <Route path="/Place" element={<Navigate to="/place" replace />} />
            <Route path="/ProductMovement" element={<Navigate to="/product-movement" replace />} />
            <Route path="/StokOpname" element={<Navigate to="/stok-opname" replace />} />
            <Route path="/RiwayatProduction" element={<Navigate to="/riwayat-production" replace />} />
            <Route path="/Riwayat-StokOpname" element={<Navigate to="/riwayat-stok-opname" replace />} />

            {/* ======================================== */}
            {/* CATCH-ALL (404)                          */}
            {/* ======================================== */}
            <Route path="*" element={<NotFoundPage />} />
            
          </Routes>
          
          {/* ======================================== */}
          {/* GLOBAL DIALOG (Modal Konfirmasi)         */}
          {/* ======================================== */}
          <ConfirmDialog />
          
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;