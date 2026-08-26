import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import AOS from "aos";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ConfirmDialog from "./components/ui/ConfirmDialog";
import { useAuthStore } from "./lib/zustand/authStore";

import Login from "./pages/login";
import ResetPassword from "./pages/admin/ResetPassword";

// ==========================================
// CUSTOMER / PUBLIC (Lazy)
// ==========================================
const CustomerLayout = lazy(() => import("./pages/customer/components/Layout"));
const HomePage = lazy(() => import("./pages/customer/HomePage"));
const ProductsPage = lazy(() => import("./pages/customer/ProductsPage"));
// const ProductCustomPage = lazy(() => import("./pages/customer/ProductCustom"));
// const BlogPage = lazy(() => import("./pages/customer/BlogPage"));
// const TentangPage = lazy(() => import("./pages/customer/TentangPage"));

// ==========================================
// ADMIN (Lazy)
// ==========================================
const DashboardPage = lazy(() => import("./pages/admin/dashboard/DashboardPage"));
const UserPage = lazy(() => import("./pages/admin/users/UserPage"));
const KaryawanPage = lazy(() => import("./pages/admin/karyawan/KaryawanPage"));
const JabatanPage = lazy(() => import("./pages/admin/jabatan/JabatanPage"));
const DistributorPage = lazy(() => import("./pages/admin/distributor/DistributorPage"));
const DistributorProductPage = lazy(() => import("./pages/admin/productdistributor/DistributorProductPage"));
const ProductCustomerPage = lazy(() => import("./pages/admin/productcustomer/ProductCustomerPage"));
const CustomerPage = lazy(() => import("./pages/admin/customer/Customer"));
const AllProductsPage = lazy(() => import("./pages/admin/AllProductsPage"));
const ProductPage = lazy(() => import("./pages/admin/product/Product"));
const HargaProductPage = lazy(() => import("./pages/admin/hargaproduct/HargaProduct"));
const BestSellerPage = lazy(() => import("./pages/admin/best-seller/BestSellerPage"));
const JenisPage = lazy(() => import("./pages/admin/jenisproduct/JenisProduct"));
const TypePage = lazy(() => import("./pages/admin/typeproduct/TypeProduct"));
const BahanProductPage = lazy(() => import("./pages/admin/bahanproduct/BahanProduct"));
const StatusTransaksiPage = lazy(() => import("./pages/admin/statustransaksi/StatusTransaksiPage"));
const PlacePage = lazy(() => import("./pages/admin/places/PlacePage"));
const InventoryPage = lazy(() => import("./pages/admin/inventory/InventoryPage"));
const ProductMovementPage = lazy(() => import("./pages/admin/productmovement/ProductMovementPage"));
const StokOpnamePage = lazy(() => import("./pages/admin/stokopname/StokOpnamePage"));
const RiwayatSOPage = lazy(() => import("./pages/admin/stokopname/RiwayatSOPage"));
const ProductionPage = lazy(() => import("./pages/admin/production/ProductionPage"));
const RiwayatProductionPage = lazy(() => import("./pages/admin/production/RiwayatProductionPage"));
const TransaksiPage = lazy(() => import("./pages/admin/transaksidaily/DaftarTransaksi"));
const PesananPage = lazy(() => import("./pages/admin/pesanan/Pesanan"));
const RiwayatTransaksi = lazy(() => import("./pages/admin/transaksidaily/RiwayatTransaksi"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  </div>
);

const ProtectedLayout = ({ children, roles = [] }) => (
  <ProtectedRoute roles={roles}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const GuestRoute = ({ children }) => {
  const { token, isAuthenticated } = useAuthStore();
  if (token || isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic',
      offset: 80,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ==========================================
              PUBLIC / CUSTOMER — DIBUNGKUS CustomerLayout
              (Ini yang bikin Navbar + Footer MUNCUL)
              ========================================== */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            {/* <Route path="/products/custom" element={<ProductCustomPage />} /> */}
            {/* <Route path="/blog" element={<BlogPage />} /> */}
            {/* <Route path="/tentang" element={<TentangPage />} /> */}
          </Route>

          {/* AUTH */}
          <Route path="/jayarubberseallogin" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          <Route path="/403" element={<ForbiddenPage />} />

          {/* ADMIN */}
          <Route path="/dashboard" element={<ProtectedLayout roles={["admin", "admin_toko", "operator"]}><DashboardPage /></ProtectedLayout>} />
          <Route path="/user" element={<ProtectedLayout roles={["admin"]}><UserPage /></ProtectedLayout>} />
          <Route path="/karyawan" element={<ProtectedLayout roles={["admin"]}><KaryawanPage /></ProtectedLayout>} />
          <Route path="/jabatan" element={<ProtectedLayout roles={["admin"]}><JabatanPage /></ProtectedLayout>} />
          <Route path="/distributor" element={<ProtectedLayout><DistributorPage /></ProtectedLayout>} />
          <Route path="/product-distributor" element={<ProtectedLayout><DistributorProductPage /></ProtectedLayout>} />
          <Route path="/product-customer" element={<ProtectedLayout><ProductCustomerPage /></ProtectedLayout>} />
          <Route path="/customer" element={<ProtectedLayout roles={["admin", "admin_toko"]}><CustomerPage /></ProtectedLayout>} />
          <Route path="/jenis" element={<ProtectedLayout roles={["admin"]}><JenisPage /></ProtectedLayout>} />
          <Route path="/type" element={<ProtectedLayout roles={["admin"]}><TypePage /></ProtectedLayout>} />
          <Route path="/bahan" element={<ProtectedLayout roles={["admin"]}><BahanProductPage /></ProtectedLayout>} />
          <Route path="/status-transaksi" element={<ProtectedLayout roles={["admin"]}><StatusTransaksiPage /></ProtectedLayout>} />
          <Route path="/place" element={<ProtectedLayout roles={["admin"]}><PlacePage /></ProtectedLayout>} />
          <Route path="/allproduct" element={<ProtectedLayout><AllProductsPage /></ProtectedLayout>} />
          <Route path="/product" element={<ProtectedLayout><ProductPage /></ProtectedLayout>} />
          <Route path="/product-terlaris" element={<ProtectedLayout><BestSellerPage /></ProtectedLayout>} />
          <Route path="/harga-product" element={<ProtectedLayout><HargaProductPage /></ProtectedLayout>} />
          <Route path="/inventory" element={<ProtectedLayout><InventoryPage /></ProtectedLayout>} />
          <Route path="/product-movement" element={<ProtectedLayout><ProductMovementPage /></ProtectedLayout>} />
          <Route path="/stok-opname" element={<ProtectedLayout><StokOpnamePage /></ProtectedLayout>} />
          <Route path="/riwayat-stok-opname" element={<ProtectedLayout><RiwayatSOPage /></ProtectedLayout>} />
          <Route path="/production" element={<ProtectedLayout><ProductionPage /></ProtectedLayout>} />
          <Route path="/riwayat-production" element={<ProtectedLayout><RiwayatProductionPage /></ProtectedLayout>} />
          <Route path="/transaksi" element={<ProtectedLayout roles={["admin", "admin_toko"]}><TransaksiPage /></ProtectedLayout>} />
          <Route path="/pesanan" element={<ProtectedLayout roles={["admin", "admin_toko"]}><PesananPage /></ProtectedLayout>} />
          <Route path="/riwayat-transaksi" element={<ProtectedLayout roles={["admin", "admin_toko"]}><RiwayatTransaksi /></ProtectedLayout>} />

          {/* REDIRECTS */}
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/stok-barang" element={<Navigate to="/inventory" replace />} />
          <Route path="/Place" element={<Navigate to="/place" replace />} />
          <Route path="/ProductMovement" element={<Navigate to="/product-movement" replace />} />
          <Route path="/StokOpname" element={<Navigate to="/stok-opname" replace />} />
          <Route path="/RiwayatProduction" element={<Navigate to="/riwayat-production" replace />} />
          <Route path="/Riwayat-StokOpname" element={<Navigate to="/riwayat-stok-opname" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ConfirmDialog />
      </Suspense>
    </BrowserRouter>
  );
}

export default App;