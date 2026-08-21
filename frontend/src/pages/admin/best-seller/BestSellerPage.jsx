import { useState, useMemo, useCallback } from "react";
import {
  Calendar, TrendingUp, Package, BarChart3,
  RefreshCw, AlertCircle, Flame, Sparkles, Clock,
  Filter, X, ShoppingBag, DollarSign, Trophy, ChevronRight,
} from "lucide-react";
import { useBestSellerFilters } from "../../../lib/zustand/bestSellerStore";
import { useBestSellers } from "../../../hooks/useBestSeller";
import { cn } from "../../../lib/utils";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const formatTanggal = (tgl) => {
  if (!tgl) return "-";
  const date = new Date(tgl);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.join(" • ") || p.kode || "-";
};

const formatNumber = (n) => new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));
const formatRupiah = (n) => `Rp ${formatNumber(n)}`;

// ==========================================
// CONFIG
// ==========================================
const MAX_REST_PRODUCTS = 10;

const QUICK_FILTERS = [
  { label: "7H", days: 7 },
  { label: "30H", days: 30 },
  { label: "90H", days: 90 },
  { label: "1TH", days: 365 },
];

const JENIS_OPTIONS = [
  { value: "all", label: "Semua Jenis" },
  { value: "daily", label: "Harian" },
  { value: "pesanan", label: "Pesanan" },
];

// Rank colors: gold, silver, bronze, then slate
const RANK_STYLES = {
  0: {
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-gradient-to-r from-yellow-400 to-amber-500",
    ring: "ring-amber-300/50",
    medal: "🥇",
  },
  1: {
    bg: "bg-gradient-to-br from-slate-50 to-gray-50",
    border: "border-slate-200",
    text: "text-slate-700",
    badge: "bg-gradient-to-r from-slate-300 to-slate-400",
    ring: "ring-slate-300/50",
    medal: "🥈",
  },
  2: {
    bg: "bg-gradient-to-br from-orange-50 to-amber-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-gradient-to-r from-amber-600 to-orange-600",
    ring: "ring-orange-300/50",
    medal: "🥉",
  },
};

// ==========================================
// SKELETON COMPONENTS
// ==========================================
const TopSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
    <div className="h-10 bg-slate-100 rounded-lg w-1/2 mx-auto" />
  </div>
);

const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 bg-slate-200 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-slate-200 rounded w-full" />
        <div className="h-2 bg-slate-100 rounded w-2/3" />
      </div>
    </div>
    <div className="h-6 bg-slate-100 rounded w-1/2" />
  </div>
);

// ==========================================
// TOP 3 CARD COMPONENT
// ==========================================
const Top3Card = ({ item, rank }) => {
  const style = RANK_STYLES[rank];
  const totalQty = Number(item.total_qty) || 0;
  const totalOmzet = Number(item.total_omzet) || 0;
  const totalTransaksi = Number(item.total_transaksi) || 0;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border-2 p-5 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        style.bg,
        style.border,
        "ring-4 ring-transparent hover:ring-4",
        style.ring
      )}
    >
      {/* Medal Badge */}
      <div className="absolute -top-3 -right-3 z-10">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg",
          style.badge
        )}>
          {style.medal}
        </div>
      </div>

      {/* Rank Label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm",
          style.badge
        )}>
          #{rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Best Seller
          </p>
        </div>
      </div>

      {/* Product Info */}
      <div className="mb-4">
        <p className="font-mono text-[10px] text-slate-400 mb-1">
          {item.kode || "-"}
        </p>
        <p className={cn(
          "font-bold leading-tight line-clamp-2",
          style.text,
          rank === 0 ? "text-base" : "text-sm"
        )}>
          {formatProductName(item)}
        </p>
      </div>

      {/* Hero Stats */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Unit Terjual
        </p>
        <p className={cn(
          "font-black",
          style.text,
          rank === 0 ? "text-3xl" : "text-2xl"
        )}>
          {formatNumber(totalQty)}
        </p>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-white/60 rounded-lg px-2 py-1.5">
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
            <DollarSign size={10} />
            <span className="font-semibold uppercase">Omzet</span>
          </div>
          <p className={cn("font-bold text-xs truncate", style.text)}>
            {formatRupiah(totalOmzet)}
          </p>
        </div>
        <div className="bg-white/60 rounded-lg px-2 py-1.5">
          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
            <ShoppingBag size={10} />
            <span className="font-semibold uppercase">Trx</span>
          </div>
          <p className={cn("font-bold text-xs", style.text)}>
            {formatNumber(totalTransaksi)}
          </p>
        </div>
      </div>

      {/* Last Transaction */}
      <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[10px]">
        <span className="text-slate-500 flex items-center gap-1">
          <Clock size={10} />
          Terakhir
        </span>
        <span className="font-medium text-slate-700">
          {formatTanggal(item.transaksi_terakhir)}
        </span>
      </div>
    </div>
  );
};

// ==========================================
// PRODUCT CARD (Rest) - Compact
// ==========================================
const ProductCard = ({ item, rank }) => {
  const totalQty = Number(item.total_qty) || 0;
  const totalOmzet = Number(item.total_omzet) || 0;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header: Rank + Product */}
      <div className="flex items-start gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 flex-shrink-0">
          #{rank + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] text-slate-400 truncate">
            {item.kode || "-"}
          </p>
          <p className="font-semibold text-xs text-slate-900 line-clamp-2 leading-tight mt-0.5">
            {formatProductName(item)}
          </p>
        </div>
      </div>

      {/* Hero Qty */}
      <div className="bg-slate-50 rounded-lg px-3 py-2 my-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <TrendingUp size={11} className="text-slate-500" />
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Terjual
            </span>
          </div>
          <p className="font-bold text-sm text-slate-900">
            {formatNumber(totalQty)}
          </p>
        </div>
      </div>

      {/* Omzet */}
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-slate-500 flex items-center gap-1">
          <DollarSign size={10} />
          Omzet
        </span>
        <span className="font-semibold text-slate-700 truncate">
          {formatRupiah(totalOmzet)}
        </span>
      </div>

      {/* Last Transaction */}
      <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
        <span className="text-slate-400 flex items-center gap-1">
          <Clock size={9} />
          {formatTanggal(item.transaksi_terakhir)}
        </span>
        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const BestSellerPage = () => {
  const {
    filters,
    setDari,
    setSampai,
    setJenis,
    setFilterRange,
    resetFilters,
    hasActiveFilters,
    getQueryParams,
    getPeriodeLabel,
  } = useBestSellerFilters();

  const [isFetching, setIsFetching] = useState(false);
  const { data, isLoading, error, refetch } = useBestSellers(getQueryParams());

  const products = data?.products || [];
  const meta = data?.meta || {};

  // Summary stats
  const stats = useMemo(() => {
    if (!products.length) return { totalProduk: 0, totalQty: 0, totalOmzet: 0 };
    return {
      totalProduk: products.length,
      totalQty: products.reduce((sum, p) => sum + (Number(p.total_qty) || 0), 0),
      totalOmzet: products.reduce((sum, p) => sum + (Number(p.total_omzet) || 0), 0),
    };
  }, [products]);

  // Handlers
  const handleQuickFilter = useCallback((days) => {
    const today = new Date();
    const dari = new Date();
    dari.setDate(today.getDate() - days);
    setFilterRange(
      dari.toISOString().split("T")[0],
      today.toISOString().split("T")[0]
    );
  }, [setFilterRange]);

  const handleRefresh = useCallback(async () => {
    setIsFetching(true);
    try {
      await refetch();
    } finally {
      setIsFetching(false);
    }
  }, [refetch]);

  const isFilterActive = hasActiveFilters();
  const top3 = products.slice(0, 3);
  const rest = products.slice(3, 3 + MAX_REST_PRODUCTS); // Max 10 products
  const hiddenCount = Math.max(0, products.length - 3 - MAX_REST_PRODUCTS);

  return (
    <div className="space-y-5 pb-20 min-h-screen bg-slate-50/30">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="space-y-2.5">
          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap flex items-center gap-1 mr-1">
              <Flame size={10} className="text-orange-500" />
              Cepat
            </span>
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.days}
                onClick={() => handleQuickFilter(qf.days)}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-full bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-95 transition-all whitespace-nowrap"
              >
                {qf.label}
              </button>
            ))}
          </div>

          {/* Date Range + Jenis */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Dari */}
            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filters.dari}
                onChange={(e) => setDari(e.target.value)}
                max={filters.sampai || undefined}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all"
              />
            </div>

            {/* Separator (desktop only) */}
            <div className="hidden sm:flex items-center text-slate-400 text-xs font-medium">
              s/d
            </div>

            {/* Sampai */}
            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filters.sampai}
                onChange={(e) => setSampai(e.target.value)}
                min={filters.dari || undefined}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all"
              />
            </div>

            {/* Jenis */}
            <div className="relative sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all appearance-none cursor-pointer"
              >
                {JENIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors whitespace-nowrap"
                  title="Reset filter"
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading || isFetching}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
            <p className="text-xs text-red-700 mt-0.5">
              {error.response?.data?.message || error.message || "Terjadi kesalahan"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex-shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* SUMMARY CARDS (Compact) */}
      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={BarChart3}
            gradient="from-blue-500 to-indigo-600"
            label="Produk"
            value={formatNumber(stats.totalProduk)}
          />
          <StatCard
            icon={TrendingUp}
            gradient="from-emerald-500 to-teal-600"
            label="Unit Terjual"
            value={formatNumber(stats.totalQty)}
          />
          <StatCard
            icon={DollarSign}
            gradient="from-amber-500 to-orange-600"
            label="Total Omzet"
            value={formatRupiah(stats.totalOmzet)}
            truncate
          />
          <StatCard
            icon={Calendar}
            gradient="from-purple-500 to-pink-600"
            label="Periode"
            value={getPeriodeLabel()}
            truncate
          />
        </div>
      )}

      {/* CONTENT */}
      {isLoading ? (
        <>
          {/* Top 3 Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <TopSkeleton key={i} />)}
          </div>
          {/* Rest Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[...Array(10)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </>
      ) : products.length === 0 ? (
        <EmptyState isFilterActive={isFilterActive} onReset={resetFilters} />
      ) : (
        <div className="space-y-6">
          {/* TOP 3 PODIUM */}
          {top3.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm shadow-amber-500/30">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Top 3 Best Seller</h2>
                  <Sparkles size={14} className="text-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map((item, index) => (
                  <Top3Card key={item.id} item={item} rank={index} />
                ))}
              </div>
            </section>
          )}

          {/* REST PRODUCTS (Max 10, 5 per row) */}
          {rest.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg shadow-sm">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Produk Terlaris Lainnya
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Menampilkan {rest.length} produk
                      {hiddenCount > 0 && ` • ${hiddenCount} lainnya disembunyikan`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  #{top3.length + 1} - #{top3.length + rest.length}
                </span>
              </div>

              {/* 5 per row di desktop, 3 di tablet, 2 di mobile */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {rest.map((item, index) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    rank={index + 3}
                  />
                ))}
              </div>

              {hiddenCount > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-500">
                    Dan {hiddenCount} produk lainnya. Atur filter untuk melihat lebih spesifik.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// HELPER COMPONENTS
// ==========================================
const StatCard = ({ icon: Icon, gradient, label, value, truncate = false }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
    <div className={cn(
      "p-2 rounded-lg shadow-sm flex-shrink-0 bg-gradient-to-br",
      gradient
    )}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
        {label}
      </p>
      <p className={cn(
        "font-bold text-slate-900",
        truncate ? "text-sm truncate" : "text-lg"
      )}>
        {value}
      </p>
    </div>
  </div>
);

const EmptyState = ({ isFilterActive, onReset }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
      <BarChart3 className="w-8 h-8 text-slate-400" />
    </div>
    <p className="text-slate-900 font-semibold text-base">Belum Ada Data Penjualan</p>
    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
      {isFilterActive
        ? "Tidak ada produk terjual pada periode yang dipilih."
        : "Produk terlaris akan muncul setelah ada transaksi selesai."}
    </p>
    {isFilterActive && (
      <button
        onClick={onReset}
        className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <X size={14} />
        Reset Filter
      </button>
    )}
  </div>
);

export default BestSellerPage;