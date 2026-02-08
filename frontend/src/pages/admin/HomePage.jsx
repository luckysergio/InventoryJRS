import { useEffect, useState, useCallback, useRef } from "react";
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
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import api from "../../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

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
    productionTotal: 0,
    totalRevenue: 0,
    totalRevenueToday: 0,
    totalRevenueMonth: 0,
    yesterdayRevenue: 0,
    totalOrders: 0,
    totalOrdersToday: 0,
    totalOrdersMonth: 0,
    totalCustomers: 0,
    availableProducts: 0,
    lowStockProducts: 0,
    percentageIncreaseMonth: 0,
    percentageIncreaseToday: 0,
    currentMonth: "",
    todayDate: "",
    topCustomers: [],
    transactionByType: [],
    revenueChart: [],
    salesAnalytics: [],
    topProducts: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartMonths, setChartMonths] = useState(6);
  const [chartData, setChartData] = useState([]);
  const [selectedChartType, setSelectedChartType] = useState("revenue");

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "kasir"; // default ke kasir jika tidak ada role

  const fetchData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setRefreshing(true);

        const res = await api.get("/dashboard/stats", {
          params: { months: chartMonths },
        });
        const data = res.data.data;

        setStats({
          ...data,
          transaksiHarian: data.transaksi_harian || 0,
          transaksiPesanan: data.transaksi_pesanan || 0,
          customerBelumLunas: data.customer_belum_lunas || 0,
          totalProduct: data.total_product || 0,
          productTerlaris: data.product_terlaris || 0,
          productionAntri: data.production_antri || 0,
          productionProduksi: data.production_produksi || 0,
          productionTotal: data.production_total || 0,
          totalRevenue: data.total_revenue || 0,
          totalRevenueToday: data.total_revenue_today || 0,
          totalRevenueMonth: data.total_revenue_month || 0,
          yesterdayRevenue: data.yesterday_revenue || 0,
          totalOrders: data.total_orders || 0,
          totalOrdersToday: data.total_orders_today || 0,
          totalOrdersMonth: data.total_orders_month || 0,
          totalCustomers: data.total_customers || 0,
          availableProducts: data.available_products || 0,
          lowStockProducts: data.low_stock_products || 0,
          percentageIncreaseMonth: data.percentage_increase_month || 0,
          percentageIncreaseToday: data.percentage_increase_today || 0,
          currentMonth: data.current_month || "",
          todayDate: data.today_date || "",
          topCustomers: data.top_customers || [],
          transactionByType: data.transaction_by_type || [],
          revenueChart: data.revenue_chart || [],
          salesAnalytics: data.sales_analytics || [],
          topProducts: data.top_products || [],
        });

        if (data.revenue_chart && data.revenue_chart.length > 0) {
          setChartData(data.revenue_chart);
        }
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
    },
    [chartMonths],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(false);
  };

  const handleChartMonthChange = (months) => {
    // Maksimal 12 bulan
    if (months > 12) months = 12;
    if (months < 1) months = 1;
    setChartMonths(months);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filter cards berdasarkan role
  const getCardsByRole = () => {
    const allCards = [
      {
        title: "Semua Product",
        value: stats.totalProduct,
        icon: <Package className="w-5 h-5" />,
        color: "bg-green-100 text-green-700",
        description: "Total produk",
        trend: "+12%",
        trendUp: true,
        path: "/allproduct",
        roles: ["admin", "kasir", "operator"],
      },
      {
        title: "Product Terlaris",
        value: stats.productTerlaris,
        icon: <Star className="w-5 h-5" />,
        color: "bg-yellow-100 text-yellow-700",
        description: "Pernah terjual",
        trend: "+8%",
        trendUp: true,
        path: "/product-terlaris",
        roles: ["admin", "kasir", "operator"],
      },
      {
        title: "Transaksi Harian",
        value: stats.transaksiHarian,
        icon: <Receipt className="w-5 h-5" />,
        color: "bg-blue-100 text-blue-700",
        description: "Status: Menunggu",
        trend: "+5%",
        trendUp: true,
        path: "/transaksi",
        roles: ["admin", "kasir"],
      },
      {
        title: "Transaksi Pesanan",
        value: stats.transaksiPesanan,
        icon: <ShoppingCart className="w-5 h-5" />,
        color: "bg-purple-100 text-purple-700",
        description: "Status aktif",
        trend: "+15%",
        trendUp: true,
        path: "/pesanan",
        roles: ["admin", "kasir"],
      },
      {
        title: "Customer Belum Lunas",
        value: stats.customerBelumLunas,
        icon: <Users className="w-5 h-5" />,
        color: "bg-orange-100 text-orange-700",
        description: "Tagihan terbuka",
        trend: "-3%",
        trendUp: false,
        path: "/customer",
        roles: ["admin", "kasir"],
      },
      {
        title: "Pesanan Menunggu Produksi",
        value: stats.productionTotal,
        icon: <Factory className="w-5 h-5" />,
        color: "bg-indigo-100 text-indigo-700",
        description: "Belum dibuat produksi",
        trend: "+20%",
        trendUp: true,
        path: "/production",
        roles: ["admin", "operator"],
      },
      {
        title: "Production Antri",
        value: stats.productionAntri,
        icon: <Clock className="w-5 h-5" />,
        color: "bg-gray-100 text-gray-700",
        description: "Menunggu produksi",
        trend: "+7%",
        trendUp: true,
        path: "/production",
        roles: ["admin", "operator"],
      },
      {
        title: "Production Produksi",
        value: stats.productionProduksi,
        icon: <Play className="w-5 h-5" />,
        color: "bg-blue-100 text-blue-700",
        description: "Sedang diproduksi",
        trend: "+10%",
        trendUp: true,
        path: "/production",
        roles: ["admin", "operator"],
      },
    ];

    return allCards.filter((card) => card.roles.includes(role));
  };

  const cards = getCardsByRole();

  const revenueCards = [
    {
      title: "Total Pendapatan",
      value: formatCurrency(stats.totalRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-emerald-100 text-emerald-700",
      description: "Seluruh waktu",
      trend: `${stats.percentageIncreaseMonth}%`,
      trendUp: stats.percentageIncreaseMonth > 0,
    },
    {
      title: "Pendapatan Bulan Ini",
      value: formatCurrency(stats.totalRevenueMonth),
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-700",
      description: stats.currentMonth,
      trend: `${stats.percentageIncreaseMonth}%`,
      trendUp: stats.percentageIncreaseMonth > 0,
    },
    {
      title: "Pendapatan Hari Ini",
      value: formatCurrency(stats.totalRevenueToday),
      icon: <Zap className="w-5 h-5" />,
      color: "bg-amber-100 text-amber-700",
      description: stats.todayDate,
      trend: `${stats.percentageIncreaseToday}%`,
      trendUp: stats.percentageIncreaseToday > 0,
    },
    {
      title: "Total Order",
      value: formatNumber(stats.totalOrders),
      icon: <Activity className="w-5 h-5" />,
      color: "bg-violet-100 text-violet-700",
      description: "Semua transaksi",
      trend: "+12%",
      trendUp: true,
    },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  const prepareSalesAnalyticsData = () => {
    return stats.salesAnalytics.map((item) => ({
      name: item.status,
      value: Number(item.total), // ubah ke number
      percentage: Number(item.percentage), // ubah ke number
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}

          {role === "admin" && (
            <>
              {/* Revenue Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
                  >
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </>
          )}

          {/* Main Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(cards.length || 4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg p-6 animate-pulse"
              >
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Revenue Stats - Hanya untuk Admin */}
        {role === "admin" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {revenueCards.map((card, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${card.color}`}>
                      {card.icon}
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${card.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {card.trendUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {card.trend}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts Section - Hanya untuk Admin */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Analisis Pendapatan
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Grafik pendapatan dan order dalam {chartMonths} bulan
                    terakhir
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedChartType("revenue")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChartType === "revenue" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Pendapatan
                    </button>
                    <button
                      onClick={() => setSelectedChartType("orders")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedChartType === "orders" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      Order
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChartMonthChange(3)}
                      className={`px-3 py-1 text-xs rounded-lg ${chartMonths === 3 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      3 Bulan
                    </button>
                    <button
                      onClick={() => handleChartMonthChange(6)}
                      className={`px-3 py-1 text-xs rounded-lg ${chartMonths === 6 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      6 Bulan
                    </button>
                    <button
                      onClick={() => handleChartMonthChange(12)}
                      className={`px-3 py-1 text-xs rounded-lg ${chartMonths === 12 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      12 Bulan
                    </button>
                  </div>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedChartType === "revenue" ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis
                          stroke="#666"
                          fontSize={12}
                          tickFormatter={(value) =>
                            `Rp${formatNumber(value / 1000)}k`
                          }
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrency(value),
                            "Pendapatan",
                          ]}
                          labelFormatter={(label) => `Bulan: ${label}`}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Pendapatan"
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                          formatter={(value) => [
                            formatNumber(value),
                            "Jumlah Order",
                          ]}
                          labelFormatter={(label) => `Bulan: ${label}`}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="orders"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Jumlah Order"
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Tidak ada data untuk ditampilkan
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Analytics - Hanya untuk Admin */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Sales Analytics */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Analisis Penjualan
                  </h3>
                  <span className="text-sm text-gray-500">
                    Berdasarkan Status
                  </span>
                </div>

                {stats.salesAnalytics.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={prepareSalesAnalyticsData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareSalesAnalyticsData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [formatNumber(value), "Jumlah"]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Tidak ada data analisis penjualan
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Customers */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Top 5 Customers
                  </h3>
                  <span className="text-sm text-gray-500">
                    Berdasarkan Transaksi
                  </span>
                </div>

                <div className="space-y-4">
                  {stats.topCustomers.length > 0 ? (
                    stats.topCustomers.map((customer, index) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.total_transactions} transaksi
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(customer.total_spent)}
                          </p>
                          <p className="text-xs text-gray-500">total belanja</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada data customer</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Stats Grid - Semua role */}
        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className="block bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    {card.icon}
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${card.trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {card.trendUp ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {card.trend}
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(card.value)}
                </p>
                <p className="text-xs text-gray-500 mt-2">{card.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Tidak Ada Akses
            </h3>
            <p className="text-gray-600 mt-2">
              Anda tidak memiliki akses ke dashboard ini.
            </p>
          </div>
        )}

        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Stok Rendah</h3>
                <p className="text-sm text-gray-600">
                  {stats.lowStockProducts} produk memiliki stok kurang dari 20
                  unit
                </p>
              </div>
            </div>

            <Link
              to="/inventory"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Cek Stok
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
