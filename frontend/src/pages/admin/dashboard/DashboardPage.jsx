import { useState, useEffect, memo } from "react";
import {
  DollarSign, ShoppingCart, Users, Package,
  Activity, Zap, AlertCircle,
  Wifi, WifiOff, Shield, X,
} from "lucide-react";
import { useDashboardFilters } from "../../../lib/zustand/dashboardStore";
import { useDashboardRealtimeState } from "../../../lib/zustand/dashboardStore";
import {
  useDashboardStats,
  useLoginLogs,
  useLoginStats,
} from "../../../hooks/useDashboard";
import { useDashboardRealtimeWebSocket } from "../../../hooks/useDashboardRealtime";
import { useDashboardLoginLogs } from "../../../lib/zustand/dashboardStore";
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
  const { getQueryParams } = useDashboardFilters();

  // ✅ Initialize WebSocket
  useDashboardRealtimeWebSocket();

  const { connectionStatus, lastEvent, clearLastEvent } = useDashboardRealtimeState();
  const { loginLogs, setLoginLogs } = useDashboardLoginLogs();

  // ✅ Fetch dashboard data
  const { data, isLoading, error, refetch } = useDashboardStats(getQueryParams());
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
      refetch();

      const timer = setTimeout(() => {
        clearLastEvent();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lastEvent, refetch, clearLastEvent]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50/40 via-slate-50 to-sky-50/30 pb-20">
      <div className="space-y-5 animate-fadeIn">

        {/* REAL-TIME EVENT NOTIFICATION */}
        {lastEvent && (
          <RealtimeNotification
            event={lastEvent}
            onDismiss={clearLastEvent}
          />
        )}

        <PeriodSelector />

        {/* CONTENT */}
        {isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <DashboardError error={error} onRetry={refetch} />
        ) : (
          <div className="space-y-5 animate-fadeInUp">

            {/* Metrics Cards */}
            <section aria-label="Statistik Utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Pendapatan"
                value={formatRupiah(metrics?.revenue?.current || 0)}
                previousValue={formatRupiah(metrics?.revenue?.previous || 0)}
                growth={metrics?.revenue?.growth || 0}
                icon={<DollarSign className="w-5 h-5" aria-hidden="true" />}
                accentColor="blue"
              />
              <StatsCard
                title="Jumlah Order"
                value={metrics?.orders?.current || 0}
                previousValue={metrics?.orders?.previous || 0}
                growth={metrics?.orders?.growth || 0}
                icon={<ShoppingCart className="w-5 h-5" aria-hidden="true" />}
                accentColor="sky"
              />
              <StatsCard
                title="Total Customer"
                value={metrics?.customers?.total || 0}
                subtitle={`${metrics?.customers?.new || 0} customer baru`}
                icon={<Users className="w-5 h-5" aria-hidden="true" />}
                accentColor="cyan"
              />
              <StatsCard
                title="Produk Terjual"
                value={metrics?.products?.total_sold || 0}
                subtitle={`${metrics?.products?.low_stock || 0} stok rendah`}
                icon={<Package className="w-5 h-5" aria-hidden="true" />}
                accentColor="indigo"
              />
            </section>

            {/* Login Logs Panel */}
            <LoginLogsPanel
              logs={loginLogs}
              isConnected={isConnected}
              stats={loginStatsData?.data}
            />

            {/* Revenue Chart */}
            {chart?.data && chart.data.length > 0 && (
              <section aria-label="Grafik Pendapatan">
                <RevenueChart data={chart.data} months={chart.months} />
              </section>
            )}

            {/* Production Summary */}
            {stats?.production && (
              <section aria-label="Ringkasan Produksi">
                <ProductionSummary production={stats.production} />
              </section>
            )}

            {/* Top Lists */}
            <section aria-label="Daftar Teratas" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopListCard
                title="Top 5 Customers"
                icon={<Users className="w-4 h-4" aria-hidden="true" />}
                items={stats?.top_customers || []}
                renderItem={(item, index) => (
                  <TopCustomerItem key={item.id || index} item={item} rank={index + 1} />
                )}
                emptyMessage="Belum ada customer dengan transaksi"
              />
              <TopListCard
                title="Top 5 Produk Terlaris"
                icon={<Package className="w-4 h-4" aria-hidden="true" />}
                items={stats?.top_products || []}
                renderItem={(item, index) => (
                  <TopProductItem key={item.id || index} item={item} rank={index + 1} />
                )}
                emptyMessage="Belum ada produk terjual"
              />
            </section>

            {/* Summary Cards */}
            <section aria-label="Ringkasan Transaksi" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryMiniCard
                label="Transaksi Harian Aktif"
                value={stats?.transaksi_harian_aktif || 0}
                icon={<Zap className="w-4 h-4" aria-hidden="true" />}
                badge="HARIAN"
                color="blue"
              />
              <SummaryMiniCard
                label="Transaksi Pesanan Aktif"
                value={stats?.transaksi_pesanan_aktif || 0}
                icon={<ShoppingCart className="w-4 h-4" aria-hidden="true" />}
                badge="PESANAN"
                color="sky"
              />
              <SummaryMiniCard
                label="Customer Belum Lunas"
                value={stats?.customer_belum_lunas || 0}
                icon={<AlertCircle className="w-4 h-4" aria-hidden="true" />}
                badge="TAGIHAN"
                color="rose"
              />
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

// Connection Indicator (Memoized)
const ConnectionIndicator = memo(({ status }) => {
  const config = {
    connected: {
      icon: <Wifi className="w-3 h-3" aria-hidden="true" />,
      text: 'Live',
      color: 'text-emerald-600',
    },
    connecting: {
      icon: <Wifi className="w-3 h-3 animate-pulse" aria-hidden="true" />,
      text: 'Connecting...',
      color: 'text-amber-600',
    },
    disconnected: {
      icon: <WifiOff className="w-3 h-3" aria-hidden="true" />,
      text: 'Offline',
      color: 'text-slate-500',
    },
    error: {
      icon: <WifiOff className="w-3 h-3" aria-hidden="true" />,
      text: 'Error',
      color: 'text-rose-600',
    },
  };

  const c = config[status] || config.disconnected;

  return (
    <span className={cn("flex items-center gap-1.5", c.color)} role="status" aria-live="polite">
      {c.icon}
      <span>{c.text}</span>
    </span>
  );
});

ConnectionIndicator.displayName = 'ConnectionIndicator';

// Real-time Notification (Memoized)
const RealtimeNotification = memo(({ event, onDismiss }) => {
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
      return <Shield className="w-4 h-4" aria-hidden="true" />;
    }
    return <Activity className="w-4 h-4" aria-hidden="true" />;
  };

  return (
    <div
      className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 animate-fadeInUp shadow-sm shadow-blue-100/50"
      role="alert"
      aria-live="polite"
    >
      <div className="p-2 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl shadow-md shadow-blue-200">
        <span className="text-white">{getIcon()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-800 font-semibold">Real-time Update</p>
        <p className="text-sm text-slate-800 truncate">{getMessage()}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Tutup notifikasi"
        type="button"
      >
        <X className="w-4 h-4 text-slate-600" aria-hidden="true" />
      </button>
    </div>
  );
});

RealtimeNotification.displayName = 'RealtimeNotification';

// TopCustomerItem (Memoized)
const TopCustomerItem = memo(({ item, rank }) => (
  <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-110",
        rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-200",
        rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200",
        rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-200",
        rank > 3 && "bg-gradient-to-br from-blue-50 to-sky-50 text-blue-700 ring-1 ring-blue-100"
      )} aria-label={`Peringkat ${rank}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
        <p className="text-[11px] text-slate-600">{item.total_transactions} transaksi</p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-700">{formatRupiah(item.total_spent || 0)}</p>
    </div>
  </div>
));

TopCustomerItem.displayName = 'TopCustomerItem';

// TopProductItem (Memoized)
const TopProductItem = memo(({ item, rank }) => (
  <div className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-blue-50/50 transition-colors duration-200">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-110",
        rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md shadow-amber-200",
        rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-md shadow-slate-200",
        rank === 3 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md shadow-orange-200",
        rank > 3 && "bg-gradient-to-br from-blue-50 to-sky-50 text-blue-700 ring-1 ring-blue-100"
      )} aria-label={`Peringkat ${rank}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate font-mono">{item.kode || "-"}</p>
        <p className="text-[11px] text-slate-600 truncate">{item.nama || "-"}</p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-700">{item.total_qty} unit</p>
      <p className="text-[11px] text-slate-600">{formatRupiah(item.total_revenue || 0)}</p>
    </div>
  </div>
));

TopProductItem.displayName = 'TopProductItem';

// SummaryMiniCard (Memoized)
const SummaryMiniCard = memo(({ label, value, icon, badge, color }) => {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
    sky: { bg: "bg-sky-50", text: "text-sky-700", badge: "bg-sky-100 text-sky-800" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", badge: "bg-rose-100 text-rose-800" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <article className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 overflow-hidden">
      <div className={cn(
        "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70",
        colors.bg
      )} aria-hidden="true" />
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
        <p className="text-xs text-slate-600 font-medium">{label}</p>
      </div>
    </article>
  );
});

SummaryMiniCard.displayName = 'SummaryMiniCard';

export default DashboardPage;