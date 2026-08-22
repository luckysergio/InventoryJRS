import { useState } from "react";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Package, RefreshCw, Activity, Zap, AlertCircle,
} from "lucide-react";
import { useDashboardFilters } from "../../../lib/zustand/dashboardStore";
import { useDashboardStats, useRefreshDashboard } from "../../../hooks/useDashboard";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { formatRupiah } from "../transaksidaily/utils/transaksiUtils";
import { cn } from "../../../lib/utils";
import PeriodSelector from "./components/PeriodSelector";
import StatsCard from "./components/StatsCard";
import RevenueChart from "./components/RevenueChart";
import TopListCard from "./components/TopListCard";
import ProductionSummary from "./components/ProductionSummary";
import DashboardSkeleton from "./components/DashboardSkeleton";
import DashboardError from "./components/DashboardError";

const DashboardPage = () => {
  const { getQueryParams, getPeriodLabel } = useDashboardFilters();
  const refreshDashboard = useRefreshDashboard();
  const { info } = useConfirmDialog();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useDashboardStats(getQueryParams());

  const stats = data?.data;
  const chart = data?.chart;
  const metrics = stats?.metrics;

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
        
        <PeriodSelector />

        {/* ======================================== */}
        {/* CONTENT */}
        {/* ======================================== */}
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

// ==========================================
// TOP LIST ITEMS
// ==========================================
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
        <p className="text-[11px] text-slate-500">
          {item.total_transactions} transaksi
        </p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-600">
        {formatRupiah(item.total_spent || 0)}
      </p>
    </div>
  </div>
);

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
        <p className="text-sm font-semibold text-slate-800 truncate font-mono">
          {item.kode || "-"}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {item.nama || "-"}
        </p>
      </div>
    </div>
    <div className="text-right flex-shrink-0 pl-3">
      <p className="text-sm font-bold text-blue-600">{item.total_qty} unit</p>
      <p className="text-[11px] text-slate-500">{formatRupiah(item.total_revenue || 0)}</p>
    </div>
  </div>
);

// ==========================================
// SUMMARY MINI CARD
// ==========================================
const SummaryMiniCard = ({ label, value, icon, badge, color }) => {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", border: "border-blue-100" },
    sky: { bg: "bg-sky-50", text: "text-sky-600", badge: "bg-sky-100 text-sky-700", border: "border-sky-100" },
    rose: { bg: "bg-rose-50", text: "text-rose-600", badge: "bg-rose-100 text-rose-700", border: "border-rose-100" },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient */}
      <div className={cn(
        "absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-70",
        colors.bg
      )} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", colors.bg)}>
            <span className={colors.text}>{icon}</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider",
            colors.badge
          )}>
            {badge}
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-800 tracking-tight mb-1">
          {value}
        </p>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  );
};

export default DashboardPage;