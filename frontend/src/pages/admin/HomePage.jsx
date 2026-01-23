// src/pages/admin/HomePage.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Receipt,
  ShoppingCart,
  Users,
  Package,
  Star,
  Factory,
  Play,
  Clock,
  RefreshCw,
  Calendar,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import api from "../../services/api";

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    transaksiHarian: 0,
    transaksiPesanan: 0,
    customerBelumLunas: 0,
    totalProduct: 0,
    productTerlaris: 0,
    productionAntri: 0,
    productionProduksi: 0,
    productionTotal: 0, // ✅ Tambahkan
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      const res = await api.get("/dashboard");
      const data = res.data.data;
      
      setStats({
        transaksiHarian: data.transaksi_harian || 0,
        transaksiPesanan: data.transaksi_pesanan || 0,
        customerBelumLunas: data.customer_belum_lunas || 0,
        totalProduct: data.total_product || 0,
        productTerlaris: data.product_terlaris || 0,
        productionAntri: data.production_antri || 0,
        productionProduksi: data.production_produksi || 0,
        productionTotal: data.production_total || 0, // ✅ Ambil dari API
      });
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat data",
        text: "Terjadi kesalahan saat mengambil data dashboard",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(false);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const totalTransactions = stats.transaksiHarian + stats.transaksiPesanan;
  const totalProduction = stats.productionAntri + stats.productionProduksi;

  const cardRoutes = [
    { key: 'transaksiHarian', path: '/transaksi' },
    { key: 'transaksiPesanan', path: '/pesanan' },
    { key: 'customerBelumLunas', path: '/customer' },
    { key: 'totalProduct', path: '/allproduct' },
    { key: 'productTerlaris', path: '/product-terlaris' },
    { key: 'productionAntri', path: '/production' },
    { key: 'productionProduksi', path: '/production' },
    { key: 'productionTotal', path: '/production' }, // ✅ Arahkan ke /production
  ];

  const cards = [
    {
      title: "Transaksi Harian",
      value: stats.transaksiHarian,
      icon: <Receipt className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-700",
      description: "Status: Menunggu",
    },
    {
      title: "Transaksi Pesanan",
      value: stats.transaksiPesanan,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-700",
      description: "Status aktif",
    },
    {
      title: "Customer Belum Lunas",
      value: stats.customerBelumLunas,
      icon: <Users className="w-5 h-5" />,
      color: "bg-orange-100 text-orange-700",
      description: "Tagihan terbuka",
    },
    {
      title: "Semua Product",
      value: stats.totalProduct,
      icon: <Package className="w-5 h-5" />,
      color: "bg-green-100 text-green-700",
      description: "Total produk",
    },
    {
      title: "Product Terlaris",
      value: stats.productTerlaris,
      icon: <Star className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-700",
      description: "Pernah terjual",
    },
    {
      title: "Pesanan Menunggu Produksi",
      value: stats.productionTotal,
      icon: <Factory className="w-5 h-5" />,
      color: "bg-indigo-100 text-indigo-700",
      description: "Belum dibuat produksi",
    },
    {
      title: "Production Antri",
      value: stats.productionAntri,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-gray-100 text-gray-700",
      description: "Menunggu produksi",
    },
    {
      title: "Production Produksi",
      value: stats.productionProduksi,
      icon: <Play className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-700",
      description: "Sedang diproduksi",
    },
    
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards - 8 Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cards.map((card, index) => (
            <Link
              key={index}
              to={cardRoutes[index].path}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatNumber(card.value)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;