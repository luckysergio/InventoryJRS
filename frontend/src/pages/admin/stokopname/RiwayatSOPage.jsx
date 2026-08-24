import { useMemo } from "react";
import {
  X, RefreshCw, Package, Calendar, User, Printer, Filter,
  History, TrendingUp, CheckCircle, XCircle, ChevronRight,
} from "lucide-react";
import { useStokOpnames } from "../../../hooks/useStokOpname";
import { useStokOpnameRiwayatFilters } from "../../../lib/zustand/stokOpnameStore";
import { printStokOpname } from "./utils/printStokOpname";
import {
  normalizeDetails,
  getOpnameLabel,
  getTotalSelisih,
  formatProductName,
} from "./utils/stokOpnameUtils";
import { cn } from "../../../lib/utils";

// ==========================================
// STATS CARD
// ==========================================
const StatsCard = ({ icon: Icon, label, value, gradient, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl border border-slate-200/60 p-4 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center gap-3">
      <div className={cn(
        "relative p-2.5 rounded-xl shadow-sm transition-transform group-hover:scale-110",
        iconBg
      )}>
        <div className={cn("absolute inset-0 rounded-xl opacity-40 blur-md", gradient)} />
        <Icon className={cn("relative w-4 h-4", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide truncate">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  </div>
);

// ==========================================
// RIWAYAT CARD — Modern Design
// ==========================================
const RiwayatCard = ({ opname, onPrint }) => {
  const details = normalizeDetails(opname.details || []);
  const totalItems = details.length;
  const totalSelisih = getTotalSelisih(details);

  // Group by place untuk badge
  const placeCounts = useMemo(() => {
    const counts = {};
    details.forEach((d) => {
      const kode = d.place?.kode || "LAINNYA";
      counts[kode] = (counts[kode] || 0) + 1;
    });
    return counts;
  }, [details]);

  const statusConfig = {
    selesai: {
      gradient: "from-green-400 via-emerald-500 to-teal-500",
      bg: "bg-green-50",
      text: "text-green-700",
      ring: "ring-green-200",
      icon: CheckCircle,
      label: "Selesai",
    },
    dibatalkan: {
      gradient: "from-red-400 via-rose-500 to-pink-500",
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-200",
      icon: XCircle,
      label: "Dibatalkan",
    },
  };
  const cfg = statusConfig[opname.status] || statusConfig.selesai;
  const StatusIcon = cfg.icon;

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5">
      {/* Gradient top accent */}
      <div className={cn("h-1 w-full bg-gradient-to-r", cfg.gradient)} />

      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mb-1.5 group-hover:text-indigo-600 transition-colors">
              {getOpnameLabel(opname)}
            </h3>
            <div className="flex items-center gap-2.5 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {new Date(opname.tgl_opname).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1 truncate">
                <User size={10} />
                <span className="truncate max-w-[120px]">{opname.user?.name || "-"}</span>
              </span>
            </div>
          </div>

          {/* Status pill */}
          <div className={cn(
            "flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ring-1",
            cfg.bg, cfg.text, cfg.ring
          )}>
            <StatusIcon size={10} />
            {cfg.label}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
              Total Item
            </p>
            <p className="text-lg font-bold text-slate-900">{totalItems}</p>
          </div>
          <div className={cn(
            "rounded-xl p-2.5 text-center",
            totalSelisih === 0 ? "bg-slate-50" :
            totalSelisih > 0 ? "bg-green-50" : "bg-red-50"
          )}>
            <p className={cn(
              "text-[10px] font-semibold uppercase tracking-wide mb-0.5",
              totalSelisih === 0 ? "text-slate-500" :
              totalSelisih > 0 ? "text-green-700" : "text-red-700"
            )}>
              Selisih
            </p>
            <p className={cn(
              "text-lg font-bold",
              totalSelisih === 0 ? "text-slate-900" :
              totalSelisih > 0 ? "text-green-700" : "text-red-700"
            )}>
              {totalSelisih > 0 ? "+" : ""}{totalSelisih}
            </p>
          </div>
        </div>

        {/* Place Badges */}
        {Object.keys(placeCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(placeCounts).map(([kode, count]) => (
              <span
                key={kode}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1",
                  kode === "TOKO"
                    ? "bg-blue-50 text-blue-700 ring-blue-200"
                    : kode === "BENGKEL"
                    ? "bg-purple-50 text-purple-700 ring-purple-200"
                    : "bg-slate-50 text-slate-700 ring-slate-200"
                )}
              >
                {kode === "TOKO" ? "🏪" : kode === "BENGKEL" ? "🔧" : "📦"}
                {kode}
                <span className="font-normal opacity-75">· {count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Preview Items */}
        {details.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {details.slice(0, 6).map((d) => {
              const selisih = Number(d.selisih) || 0;
              const productCode = d.product?.kode || "?";
              const productName = formatProductName(d.product);
              return (
                <span
                  key={d.id}
                  title={productName}
                  className={cn(
                    "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold",
                    selisih === 0 ? "bg-slate-100 text-slate-600" :
                    selisih > 0 ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}
                >
                  {productCode}
                  {selisih !== 0 && ` (${selisih > 0 ? "+" : ""}${selisih})`}
                </span>
              );
            })}
            {details.length > 6 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500">
                +{details.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Print Action */}
        <button
          onClick={() => onPrint(opname)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-all border border-slate-200 hover:border-slate-300 group/btn"
        >
          <Printer size={13} className="group-hover/btn:text-slate-900" />
          Cetak Laporan
          <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const RiwayatSOPage = () => {
  const { filters, currentPage, setStatus, setDari, setSampai, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useStokOpnameRiwayatFilters();
  const { data, isLoading, isFetching, refetch } = useStokOpnames(getQueryParams());

  const opnames = data?.opnames || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  // Safety filter: buang draft
  const filteredOpnames = useMemo(() => {
    return opnames.filter((op) => op.status !== "draft");
  }, [opnames]);

  // Stats
  const stats = useMemo(() => {
    const selesai = filteredOpnames.filter((o) => o.status === "selesai").length;
    const dibatalkan = filteredOpnames.filter((o) => o.status === "dibatalkan").length;
    const totalItems = filteredOpnames.reduce((sum, o) => sum + (o.details?.length || 0), 0);
    return { total: filteredOpnames.length, selesai, dibatalkan, totalItems };
  }, [filteredOpnames]);

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  return (
    <div className="space-y-4 pb-24">

      {/* Stats Overview */}
      {!isLoading && filteredOpnames.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            icon={History}
            label="Total Riwayat"
            value={stats.total}
            gradient="bg-gradient-to-br from-slate-500 to-slate-700"
            iconBg="bg-slate-100"
            iconColor="text-slate-700"
          />
          <StatsCard
            icon={CheckCircle}
            label="Selesai"
            value={stats.selesai}
            gradient="bg-gradient-to-br from-green-400 to-emerald-500"
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatsCard
            icon={XCircle}
            label="Dibatalkan"
            value={stats.dibatalkan}
            gradient="bg-gradient-to-br from-red-400 to-rose-500"
            iconBg="bg-red-50"
            iconColor="text-red-600"
          />
          <StatsCard
            icon={TrendingUp}
            label="Total Item"
            value={stats.totalItems.toLocaleString("id-ID")}
            gradient="bg-gradient-to-br from-blue-400 to-cyan-500"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
        </div>
      )}

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 sm:top-20 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-gradient-to-b from-slate-50/95 via-slate-50/90 to-slate-50/0 backdrop-blur-md">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-2.5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
            <div className="relative min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.dari}
                onChange={(e) => setDari(e.target.value)}
                placeholder="Dari tanggal"
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.sampai}
                onChange={(e) => setSampai(e.target.value)}
                min={filters.dari || undefined}
                placeholder="Sampai tanggal"
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50/50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Semua</option>
                <option value="selesai">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>
            <div className="flex gap-2">
              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 transition-transform", isFetching && "animate-spin")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
              <div className="h-1 bg-slate-200 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="h-5 bg-slate-200 rounded-full w-20 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                  <div className="h-14 bg-slate-100 rounded-xl animate-pulse" />
                </div>
                <div className="h-9 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOpnames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full blur-2xl opacity-20 scale-150" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center ring-1 ring-slate-200">
              <History className="w-10 h-10 text-slate-400" />
            </div>
          </div>
          <p className="text-slate-900 font-bold text-lg mb-1">
            {isFilterActive ? "Tidak Ada Riwayat yang Cocok" : "Belum Ada Riwayat"}
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            {isFilterActive
              ? "Coba ubah filter tanggal atau status"
              : "Riwayat stok opname akan muncul setelah ada opname yang diselesaikan atau dibatalkan"}
          </p>
          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOpnames.map((op) => (
              <RiwayatCard
                key={op.id}
                opname={op}
                onPrint={(o) => printStokOpname(o, "riwayat")}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pb-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                )}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 rounded-lg text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      1
                    </button>
                    {paginationNumbers[0] > 2 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                  </>
                )}
                {paginationNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs sm:text-sm font-bold transition-all",
                      currentPage === p
                        ? "bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md shadow-slate-500/30"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {p}
                  </button>
                ))}
                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                  <>
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && (
                      <span className="px-1 text-slate-400">…</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(lastPage)}
                      className="w-8 h-8 rounded-lg text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      {lastPage}
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === lastPage || isFetching}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                  currentPage === lastPage
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
                )}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RiwayatSOPage;