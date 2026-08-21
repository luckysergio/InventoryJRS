import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Calendar, TrendingUp, Award, Package, BarChart3,
  RefreshCw, AlertCircle, Medal, Flame, Sparkles, Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const formatTanggal = (tgl, style = "short") => {
  if (!tgl) return "-";
  const date = new Date(tgl);
  if (isNaN(date.getTime())) return "-";

  if (style === "long") {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean);
  return parts.join(" ") || p.kode || "-";
};

const formatNumber = (n) => new Intl.NumberFormat("id-ID").format(Math.round(Number(n) || 0));

// ==========================================
// QUICK FILTER PRESETS
// ==========================================
const QUICK_FILTERS = [
  {
    label: "7 Hari",
    icon: Clock,
    days: 7,
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "30 Hari",
    icon: Calendar,
    days: 30,
    color: "from-indigo-500 to-purple-500",
  },
  {
    label: "90 Hari",
    icon: TrendingUp,
    days: 90,
    color: "from-emerald-500 to-teal-500",
  },
  {
    label: "1 Tahun",
    icon: Award,
    days: 365,
    color: "from-amber-500 to-orange-500",
  },
];

// ==========================================
// TOP 3 BADGE CONFIG
// ==========================================
const TOP_BADGES = {
  0: {
    label: "🥇 Juara 1",
    gradient: "from-yellow-400 via-amber-400 to-yellow-500",
    ring: "ring-yellow-300",
    shadow: "shadow-yellow-400/40",
    icon: Medal,
  },
  1: {
    label: "🥈 Juara 2",
    gradient: "from-slate-300 via-slate-400 to-slate-300",
    ring: "ring-slate-300",
    shadow: "shadow-slate-400/40",
    icon: Medal,
  },
  2: {
    label: "🥉 Juara 3",
    gradient: "from-amber-600 via-orange-500 to-amber-600",
    ring: "ring-amber-400",
    shadow: "shadow-amber-500/40",
    icon: Medal,
  },
};

// ==========================================
// SKELETON CARD COMPONENT
// ==========================================
const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
    <div className="p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4" />
          <div className="h-2.5 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto" />
      <div className="h-2 bg-slate-200 rounded w-full" />
      <div className="h-2 bg-slate-100 rounded w-2/3 mx-auto" />
    </div>
  </div>
);

// ==========================================
// PRODUCT CARD COMPONENT
// ==========================================
const ProductCard = ({ item, rank }) => {
  const isTop3 = rank < 3;
  const badge = TOP_BADGES[rank];
  const totalQty = Number(item.total_qty) || 0;

  return (
    <div
      className={cn(
        "group relative bg-white border rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full",
        isTop3
          ? "border-transparent shadow-lg hover:shadow-2xl hover:-translate-y-1"
          : "border-slate-200 hover:border-blue-300 hover:shadow-lg"
      )}
      style={isTop3 ? {
        backgroundImage: `linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.05))`,
      } : undefined}
    >
      {/* Top 3 Gradient Border */}
      {isTop3 && (
        <div className={cn(
          "absolute inset-0 rounded-xl pointer-events-none",
          "bg-gradient-to-br opacity-40 group-hover:opacity-60 transition-opacity"
        )}
          style={{
            backgroundImage: `linear-gradient(135deg, ${
              rank === 0 ? "#fbbf24, #f59e0b" :
              rank === 1 ? "#cbd5e1, #94a3b8" :
              "#d97706, #ea580c"
            })`,
            padding: "2px",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
      )}

      {/* Top 3 Badge (Absolute) */}
      {isTop3 && badge && (
        <div className={cn(
          "absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold text-white shadow-md bg-gradient-to-r",
          badge.gradient,
          badge.shadow
        )}>
          <badge.icon size={12} className="text-white" strokeWidth={2.5} />
          <span>{badge.label}</span>
        </div>
      )}

      {/* Rank Number (Non Top 3) */}
      {!isTop3 && (
        <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
          #{rank + 1}
        </div>
      )}

      {/* Content */}
      <div className="relative p-4 pt-10 flex flex-col h-full">
        {/* Product Icon + Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className={cn(
            "p-2 rounded-lg flex-shrink-0",
            isTop3 ? "bg-gradient-to-br from-amber-100 to-yellow-100" : "bg-indigo-100"
          )}>
            <Package className={cn(
              "w-5 h-5",
              isTop3 ? "text-amber-700" : "text-indigo-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] text-slate-400 mb-0.5">
              {item.kode || "-"}
            </p>
            <p className={cn(
              "font-semibold text-sm text-slate-900 line-clamp-2 leading-tight",
              isTop3 && "text-[15px]"
            )}>
              {formatProductName(item)}
            </p>
          </div>
        </div>

        {/* Total Qty Display (Hero Section) */}
        <div className={cn(
          "rounded-xl p-3 my-2 text-center",
          isTop3
            ? "bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200"
            : "bg-slate-50 border border-slate-100"
        )}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className={cn(
              "w-3.5 h-3.5",
              isTop3 ? "text-amber-600" : "text-slate-500"
            )} />
            <p className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              isTop3 ? "text-amber-700" : "text-slate-500"
            )}>
              Total Keluar
            </p>
          </div>
          <p className={cn(
            "font-black",
            isTop3 ? "text-2xl text-amber-700" : "text-xl text-slate-900"
          )}>
            {formatNumber(totalQty)}
          </p>
          <p className="text-[9px] text-slate-400 mt-0.5">unit terjual</p>
        </div>

        {/* Progress Bar Visual */}
        <div className="mb-2">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isTop3
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-blue-400 to-indigo-500"
              )}
              style={{ width: `${Math.min(100, (totalQty / 100) * 10)}%` }}
            />
          </div>
        </div>

        {/* Last Transaction */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock size={10} />
              Terakhir keluar
            </span>
            <span className="text-slate-700 font-medium">
              {formatTanggal(item.transaksi_terakhir, "short")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const BarangKeluarPage = () => {
  const [produkTerpopuler, setProdukTerpopuler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  // Fetch data
  const fetchBestSeller = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
        setError(null);
      } else {
        setIsFetching(true);
      }

      const params = {};
      if (filterDari) params.dari = filterDari;
      if (filterSampai) params.sampai = filterSampai;

      const res = await api.get("products/best-seller", { params });
      setProdukTerpopuler(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Best seller fetch error:", err);
      setError(err.response?.data?.message || "Gagal memuat data produk terlaris");
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: err.response?.data?.message || "Terjadi kesalahan saat memuat produk terlaris",
        timer: 3000,
        showConfirmButton: false,
      });
      setProdukTerpopuler([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [filterDari, filterSampai]);

  useEffect(() => {
    fetchBestSeller();
  }, [fetchBestSeller]);

  // Summary stats
  const stats = useMemo(() => {
    if (!produkTerpopuler.length) {
      return { totalProduk: 0, totalQty: 0, periodeLabel: "-" };
    }

    const totalQty = produkTerpopuler.reduce(
      (sum, p) => sum + (Number(p.total_qty) || 0), 0
    );

    let periodeLabel = "Semua Waktu";
    if (filterDari && filterSampai) {
      periodeLabel = `${formatTanggal(filterDari)} - ${formatTanggal(filterSampai)}`;
    } else if (filterDari) {
      periodeLabel = `Mulai ${formatTanggal(filterDari)}`;
    } else if (filterSampai) {
      periodeLabel = `Sampai ${formatTanggal(filterSampai)}`;
    }

    return {
      totalProduk: produkTerpopuler.length,
      totalQty,
      periodeLabel,
    };
  }, [produkTerpopuler, filterDari, filterSampai]);

  // Quick filter handler
  const handleQuickFilter = (days) => {
    const today = new Date();
    const dari = new Date();
    dari.setDate(today.getDate() - days);

    setFilterDari(dari.toISOString().split("T")[0]);
    setFilterSampai(today.toISOString().split("T")[0]);
  };

  // Reset filter
  const handleReset = () => {
    setFilterDari("");
    setFilterSampai("");
  };

  const hasActiveFilter = Boolean(filterDari || filterSampai);

  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm space-y-3">
          {/* Quick Filter Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap mr-1">
              Cepat:
            </span>
            {QUICK_FILTERS.map((qf) => {
              const Icon = qf.icon;
              return (
                <button
                  key={qf.days}
                  onClick={() => handleQuickFilter(qf.days)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap border",
                    "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                  )}
                >
                  <Icon size={11} className="text-slate-500" />
                  {qf.label}
                </button>
              );
            })}
          </div>

          {/* Date Range + Actions */}
          <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filterDari}
                onChange={(e) => setFilterDari(e.target.value)}
                max={filterSampai || undefined}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white transition-all"
                placeholder="Dari tanggal"
              />
            </div>

            <div className="flex items-center justify-center text-slate-400 text-xs font-medium px-2">
              s/d
            </div>

            <div className="relative flex-1 min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filterSampai}
                onChange={(e) => setFilterSampai(e.target.value)}
                min={filterDari || undefined}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white transition-all"
                placeholder="Sampai tanggal"
              />
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {hasActiveFilter && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors whitespace-nowrap"
                >
                  × Reset
                </button>
              )}
              <button
                onClick={() => fetchBestSeller(false)}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <span className={cn("transition-transform", isFetching && "animate-spin")}>
                  <RefreshCw className="w-4 h-4" />
                </span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchBestSeller()}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex-shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      {!loading && produkTerpopuler.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                Total Produk
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(stats.totalProduk)}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                Total Unit Terjual
              </p>
              <p className="text-xl font-bold text-slate-900">
                {formatNumber(stats.totalQty)}
              </p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
                Periode
              </p>
              <p className="text-sm font-bold text-slate-900 truncate">
                {stats.periodeLabel}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      {!loading && produkTerpopuler.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg shadow-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Produk Terlaris
            </h2>
            <p className="text-xs text-slate-500">
              {produkTerpopuler.length} produk dengan penjualan tertinggi
            </p>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : produkTerpopuler.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            Belum Ada Data Penjualan
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {hasActiveFilter
              ? "Tidak ada produk terjual pada periode yang dipilih. Coba ubah filter tanggal."
              : "Produk terlaris akan muncul di sini setelah ada transaksi penjualan."}
          </p>
          {hasActiveFilter && (
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM (Highlight Section) */}
          {produkTerpopuler.length >= 3 && (
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                  🏆 Top 3 Best Seller
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {produkTerpopuler.slice(0, 3).map((item, index) => (
                  <ProductCard key={item.id} item={item} rank={index} />
                ))}
              </div>
            </div>
          )}

          {/* REST OF PRODUCTS (Rank 4+) */}
          {produkTerpopuler.length > 3 && (
            <>
              <div className="flex items-center gap-2 px-1 pt-2">
                <div className="p-1.5 bg-slate-100 rounded-lg">
                  <Package className="w-4 h-4 text-slate-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  Produk Terlaris Lainnya
                </h3>
                <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
                  {produkTerpopuler.length - 3} produk
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {produkTerpopuler.slice(3).map((item, index) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    rank={index + 3}
                  />
                ))}
              </div>
            </>
          )}

          {/* Jika kurang dari 3 produk, tampilkan semua di grid biasa */}
          {produkTerpopuler.length < 3 && produkTerpopuler.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {produkTerpopuler.map((item, index) => (
                <ProductCard key={item.id} item={item} rank={index} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BarangKeluarPage;