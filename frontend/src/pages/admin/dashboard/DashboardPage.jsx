import { useState, useEffect } from "react";
import {
  DollarSign, ShoppingCart, Users, Package, 
  RefreshCw, Activity, Zap, AlertCircle,
  Wifi, WifiOff, Shield, X,
} from "lucide-react";
import { useDashboardFilters } from "../../../lib/zustand/dashboardStore";
import { useDashboardRealtimeState } from "../../../lib/zustand/dashboardStore";
import { 
  useDashboardStats, 
  useRefreshDashboard,
  useLoginLogs,
  useLoginStats,
} from "../../../hooks/useDashboard";
import { useDashboardRealtimeWebSocket } from "../../../hooks/useDashboardRealtime";
import { useDashboardLoginLogs } from "../../../lib/zustand/dashboardStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { formatRupiah } from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";
import PeriodSelector from "./components/PeriodSelector";
import StatsCard from "./components/StatsCard";
import RevenueChart from "./components/RevenueChart";
import TopListCard from "./components/TopListCard";
import ProductionSummary from "./components/ProductionSummary";
import LoginLogsPanel from "./components/LoginLogsPanel";
import DashboardSkeleton from "./components/DashboardSkeleton";
import DashboardError from "./components/DashboardError";

const DashboardPage = () => {
  const { getQueryParams, getPeriodLabel } = useDashboardFilters();
  const refreshDashboard = useRefreshDashboard();
  const { info } = useConfirmDialog();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ Initialize WebSocket
  useDashboardRealtimeWebSocket();
  
  const { connectionStatus, lastEvent, clearLastEvent } = useDashboardRealtimeState();
  const { loginLogs, setLoginLogs } = useDashboardLoginLogs();

  // ✅ Fetch dashboard data
  const { data, isLoading, error, refetch, dataUpdatedAt } = useDashboardStats(getQueryParams());
  const { data: initialLogsData } = useLoginLogs(10);
  const { data: loginStatsData } = useLoginStats();

  const stats = data?.data;
  const chart = data?.chart;
  const metrics = stats?.metrics;

  const isConnected = connectionStatus === 'connected';

  // ✅ Set initial login logs
  useEffect(() => {
    if (initialLogsData?.data && initialLogsData.data.length > 0 && loginLogs.length === 0) {
      setLoginLogs(initialLogsData.data);
    }
  }, [initialLogsData, loginLogs.length, setLoginLogs]);

  // ✅ AUTO-REFETCH saat ada event dashboard.updated
  useEffect(() => {
    if (lastEvent?.type === 'dashboard.updated') {
      console.log('🔄 Auto-refetch triggered by event:', lastEvent.data?.type);
      
      // Refetch dashboard stats
      refetch();
      
      // Auto-clear notification setelah 5 detik
      const timer = setTimeout(() => {
        clearLastEvent();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [lastEvent, refetch, clearLastEvent]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDashboard();
      await refetch();
    } catch (err) {
      await info("Gagal", "Gagal memuat ulang data dashboard.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoadingOrRefreshing = isLoading || isRefreshing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-slate-50 to-sky-50/30 pb-20">
      <div className="space-y-5 animate-fadeIn">
        
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500 rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-blue-200/50">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-8 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 shadow-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-xs sm:text-sm text-white/90 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{getPeriodLabel()}</span>
                  <span className="w-1 h-1 bg-white/50 rounded-full" />
                  <span className="opacity-90">
                    Update:{" "}
                    {dataUpdatedAt
                      ? new Date(dataUpdatedAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </span>
                  <span className="w-1 h-1 bg-white/50 rounded-full" />
                  <ConnectionIndicator status={connectionStatus} />
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isLoadingOrRefreshing}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-50 ring-1 ring-white/30 hover:ring-white/50 hover:shadow-lg active:scale-95"
            >
              <RefreshCw className={cn(
                "w-4 h-4 transition-transform duration-700",
                isLoadingOrRefreshing && "animate-spin"
              )} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* REAL-TIME EVENT NOTIFICATION */}
        {lastEvent && (
          <RealtimeNotification 
            event={lastEvent} 
            onDismiss={clearLastEvent} 
          />
        )}

        <PeriodSelector />

        {/* CONTENT */}
        {isLoadingOrRefreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <DashboardError error={error} onRetry={refetch} />
        ) : (
          <div className="space-y-5 animate-fadeInUp">
            
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Pendapatan"
                value={formatRupiah(metrics?.revenue?.current || 0)}
                previousValue={formatRupiah(metrics?.revenue?.previous || 0)}
                growth={metrics?.revenue?.growth || 0}
                icon={<DollarSign className="w-5 h-5" />}
                accentColor="blue"
              />
              <StatsCard
                title="Jumlah Order"
                value={metrics?.orders?.current || 0}
                previousValue={metrics?.orders?.previous || 0}
                growth={metrics?.orders?.growth || 0}
                icon={<ShoppingCart className="w-5 h-5" />}
                accentColor="sky"
              />
              <StatsCard
                title="Total Customer"
                value={metrics?.customers?.total || 0}
                subtitle={`${metrics?.customers?.new || 0} customer baru`}
                icon={<Users className="w-5 h-5" />}
                accentColor="cyan"
              />
              <StatsCard
                title="Produk Terjual"
                value={metrics?.products?.total_sold || 0}
                subtitle={`${metrics?.products?.low_stock || 0} stok rendah`}
                icon={<Package className="w-5 h-5" />}
                accentColor="indigo"
              />
            </div>

            {/* Login Logs Panel */}
            <LoginLogsPanel 
              logs={loginLogs} 
              isConnected={isConnected}
              stats={loginStatsData?.data}
            />

            {/* Revenue Chart */}
            {chart?.data && chart.data.length > 0 && (
              <RevenueChart data={chart.data} months={chart.months} />
            )}

            {/* Production Summary */}
            {stats?.production && (
              <ProductionSummary production={stats.production} />
            )}

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopListCard
                title="Top 5 Customers"
                icon={<Users className="w-4 h-4" />}
                items={stats?.top_customers || []}
                renderItem={(item, index) => (
                  <TopCustomerItem key={item.id || index} item={item} rank={index + 1} />
                )}
                emptyMessage="Belum ada customer dengan transaksi"
              />
              <TopListCard
                title="Top 5 Produk Terlaris"
                icon={<Package className="w-4 h-4" />}
                items={stats?.top_products || []}
                renderItem={(item, index) => (
                  <TopProductItem key={item.id || index} item={item} rank={index + 1} />
                )}
                emptyMessage="Belum ada produk terjual"
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryMiniCard
                label="Transaksi Harian Aktif"
                value={stats?.transaksi_harian_aktif || 0}
                icon={<Zap className="w-4 h-4" />}
                badge="HARIAN"
                color="blue"
              />
              <SummaryMiniCard
                label="Transaksi Pesanan Aktif"
                value={stats?.transaksi_pesanan_aktif || 0}
                icon={<ShoppingCart className="w-4 h-4" />}
                badge="PESANAN"
                color="sky"
              />
              <SummaryMiniCard
                label="Customer Belum Lunas"
                value={stats?.customer_belum_lunas || 0}
                icon={<AlertCircle className="w-4 h-4" />}
                badge="TAGIHAN"
                color="rose"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Connection Indicator
const ConnectionIndicator = ({ status }) => {
  const config = {
    connected: {
      icon: <Wifi className="w-3 h-3" />,
      text: 'Live',
      color: 'text-emerald-300',
    },
    connecting: {
      icon: <Wifi className="w-3 h-3 animate-pulse" />,
      text: 'Connecting...',
      color: 'text-amber-300',
    },
    disconnected: {
      icon: <WifiOff className="w-3 h-3" />,
      text: 'Offline',
      color: 'text-slate-300',
    },
    error: {
      icon: <WifiOff className="w-3 h-3" />,
      text: 'Error',
      color: 'text-rose-300',
    },
  };

  const c = config[status] || config.disconnected;

  return (
    <span className={cn("flex items-center gap-1.5", c.color)}>
      {c.icon}
      <span>{c.text}</span>
    </span>
  );
};

// Real-time Notification
const RealtimeNotification = ({ event, onDismiss }) => {
  const getMessage = () => {
    if (event.type === 'login.logged') {
      const { success, email, user } = event.data;
      const name = user?.name || email || 'Unknown';
      return success 
        ? `✅ ${name} berhasil login`
        : `❌ Login gagal: ${email}`;
    }
    
    if (event.type === 'dashboard.updated') {
      const typeMap = {
        'transaksi.created': 'Transaksi baru dibuat',
        'transaksi.updated': 'Transaksi diperbarui',
        'transaksi.deleted': 'Transaksi dihapus',
        'transaksi.status_changed': 'Status transaksi berubah',
        'pesanan.created': 'Pesanan baru masuk',
        'pesanan.completed': 'Pesanan diselesaikan',
        'production.created': 'Produksi baru dimulai',
        'production.updated': 'Status produksi berubah',
        'product.created': 'Produk baru ditambahkan',
        'pembayaran.created': 'Pembayaran baru diterima',
      };
      return typeMap[event.data?.type] || 'Data terupdate';
    }
    
    return 'Ada update baru';
  };

  const getIcon = () => {
    if (event.type === 'login.logged') {
      return <Shield className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4" />;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeInUp shadow-sm shadow-blue-100/50">
      <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-md shadow-blue-200">
        <span className="text-white">{getIcon()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-700 font-semibold">Real-time Update</p>
        <p className="text-sm text-slate-700 truncate">{getMessage()}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>
    </div>
  );
};

// TopCustomerItem
const TopCustomerItem = ({ item, rank }) => (
  <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-110",
        rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-200",
        rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200",
        rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-200",
        rank > 3 && "bg-gradient-to-br from-blue-50 to-sky-50 text-blue-600 ring-1 ring-blue-100"
      )}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
        <p className="text-[11px] text-slate-500">{item.total_transactions} transaksi</p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-600">{formatRupiah(item.total_spent || 0)}</p>
    </div>
  </div>
);

// TopProductItem
const TopProductItem = ({ item, rank }) => (
  <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-110",
        rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-200",
        rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200",
        rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-200",
        rank > 3 && "bg-gradient-to-br from-blue-50 to-sky-50 text-blue-600 ring-1 ring-blue-100"
      )}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate font-mono">{item.kode || "-"}</p>
        <p className="text-[11px] text-slate-500 truncate">{item.nama || "-"}</p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-600">{item.total_qty} unit</p>
      <p className="text-[11px] text-slate-500">{formatRupiah(item.total_revenue || 0)}</p>
    </div>
  </div>
);

// SummaryMiniCard
const SummaryMiniCard = ({ label, value, icon, badge, color }) => {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", badge: "bg-sky-100 text-sky-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", badge: "bg-rose-100 text-rose-700" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 overflow-hidden">
      <div className={cn(
        "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70",
        colors.bg
      )} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colors.bg)}>
            <span className={colors.text}>{icon}</span>
          </div>
          <span className={cn("text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider", colors.badge)}>
            {badge}
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
};

export default DashboardPage;