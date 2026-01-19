import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";
import Register from "./pages/Register";

// Dashboard
import Dashboard from "./pages/admin/Dashboard";

import UserPage from "./pages/admin/UserPage";
import KaryawanPage from "./pages/admin/KaryawanPage";
import JabatanPage from "./pages/admin/JabatanPage";
import DistributorPage from "./pages/admin/DistributorPage";
import DistributorProductPage from "./pages/admin/DistributorProductPage";

// Inventory
import ProductPage from "./pages/admin/Product";
import ProductionPage from "./pages/admin/ProductionPage";
import RiwayatProductionPage from "./pages/admin/RiwayatProductionPage";
import HargaProductPage from "./pages/admin/HargaProduct";
import InventoryPage from "./pages/admin/InventoryPage";
import ProductMovementPage from "./pages/admin/ProductMovementPage";
import StokOpnamePage from "./pages/admin/StokOpnamePage";
import RiwayatSOPage from "./pages/admin/RiwayatSOPage";
import BarangKeluarPage from "./pages/admin/BarangKeluar";

// Master Data
import JenisPage from "./pages/admin/JenisProduct";
import TypePage from "./pages/admin/TypeProduct";
import BahanProductPage from "./pages/admin/BahanProduct";
import StatusTransaksiPage from "./pages/admin/StatusTransaksiPage";
import PlacePage from "./pages/admin/PlacePage";

import CustomerPage from "./pages/admin/Customer";

// Transaksi
import TransaksiPage from "./pages/admin/DaftarTransaksi";
import PesananPage from "./pages/admin/Pesanan";
import RiwayatTransaksi from "./pages/admin/RiwayatTransaksi";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard-admin"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <UserPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/karyawan"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <KaryawanPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/jabatan"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <JabatanPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/distributor"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <DistributorPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/product-distributor"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <DistributorProductPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Master Data */}
        <Route
          path="/jenis"
          element={
            <ProtectedRoute>
              <Layout>
                <JenisPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/type"
          element={
            <ProtectedRoute>
              <Layout>
                <TypePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bahan"
          element={
            <ProtectedRoute>
              <Layout>
                <BahanProductPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <CustomerPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/status-transaksi"
          element={
            <ProtectedRoute>
              <Layout>
                <StatusTransaksiPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Place"
          element={
            <ProtectedRoute>
              <Layout>
                <PlacePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Inventory */}
        <Route
          path="/product"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <ProductPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/production"
          element={
            <ProtectedRoute>
              <Layout>
                <ProductionPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/RiwayatProduction"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <RiwayatProductionPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <InventoryPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ProductMovement"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <ProductMovementPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/StokOpname"
          element={
            <ProtectedRoute>
              <Layout>
                <StokOpnamePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/Riwayat-StokOpname"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <RiwayatSOPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/harga-product"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <HargaProductPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stok-barang"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/product-terlaris"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <BarangKeluarPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transaksi"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <TransaksiPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pesanan"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <PesananPage setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/riwayat-transaksi"
          element={
            <ProtectedRoute>
              <Layout>
                {({ setNavbarContent }) => (
                  <RiwayatTransaksi setNavbarContent={setNavbarContent} />
                )}
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
