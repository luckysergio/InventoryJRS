import { useState, useMemo } from "react";
import {
  X, RefreshCw, Package, Calendar, User, Printer, Filter,
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
// RIWAYAT CARD
// ==========================================
const RiwayatCard = ({ opname, onPrint }) => {
  // ✅ NORMALIZE details agar d.product & d.place tersedia (flat)
  const details = normalizeDetails(opname.details || []);
  const totalItems = details.length;
  const totalSelisih = getTotalSelisih(details);

  const statusConfig = {
    selesai: { bg: "bg-green-100", text: "text-green-700", label: "Selesai" },
    dibatalkan: { bg: "bg-red-100", text: "text-red-700", label: "Dibatalkan" },
  };
  const cfg = statusConfig[opname.status] || statusConfig.selesai;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {getOpnameLabel(opname)}
              </h3>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(opname.tgl_opname).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <User size={11} />
                {opname.user?.name || "-"}
              </span>
              <span className="flex items-center gap-1">
                <Package size={11} />
                {totalItems} item
              </span>
              {totalSelisih !== 0 && (
                <span className={cn("font-medium", totalSelisih > 0 ? "text-green-600" : "text-red-600")}>
                  Selisih: {totalSelisih > 0 ? "+" : ""}{totalSelisih}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onPrint(opname)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs rounded-lg transition-colors flex-shrink-0"
          >
            <Printer size={14} /> Cetak
          </button>
        </div>
      </div>

      {details.length > 0 && (
        <div className="p-4 bg-slate-50/50">
          <div className="flex flex-wrap gap-1.5">
            {details.slice(0, 8).map((d) => {
              const selisih = Number(d.selisih) || 0;
              // ✅ Gunakan d.product?.kode (hasil normalize), BUKAN d.inventory?.product?.kode
              const productCode = d.product?.kode || "?";
              const productName = formatProductName(d.product);
              return (
                <span
                  key={d.id}
                  title={productName}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                    selisih === 0 ? "bg-slate-200 text-slate-700" :
                    selisih > 0 ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}
                >
                  {productCode}
                  {selisih !== 0 && ` (${selisih > 0 ? "+" : ""}${selisih})`}
                </span>
              );
            })}
            {details.length > 8 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                +{details.length - 8} lainnya
              </span>
            )}
          </div>
        </div>
      )}
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

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  return (
    <div className="space-y-4 pb-20">
      {/* Sticky Filter Bar */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Date From */}
            <div className="relative flex-1 min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.dari}
                onChange={(e) => setDari(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {/* Date To */}
            <div className="relative flex-1 min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.sampai}
                onChange={(e) => setSampai(e.target.value)}
                min={filters.dari || undefined}
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {/* Status */}
            <div className="relative flex-shrink-0 min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={filters.status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>
            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button onClick={resetFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50">
                <span className={cn("transition-transform", isFetching && "animate-spin")}>
                  <RefreshCw className="w-4 h-4" />
                </span>
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
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded-full w-12" />
                <div className="h-6 bg-slate-200 rounded-full w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : opnames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            {isFilterActive ? "Tidak ada riwayat yang cocok" : "Belum Ada Riwayat"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? "Coba ubah filter tanggal atau status"
              : "Riwayat stok opname akan muncul setelah ada opname yang diselesaikan atau dibatalkan"}
          </p>
          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opnames.map((op) => (
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
                className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">1</button>
                    {paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                  </>
                )}
                {paginationNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={cn("w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === p ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50")}
                  >
                    {p}
                  </button>
                ))}
                {paginationNumbers[paginationNumbers.length - 1] < lastPage && (
                  <>
                    {paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-1 text-slate-400">…</span>}
                    <button onClick={() => setCurrentPage(lastPage)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">{lastPage}</button>
                  </>
                )}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === lastPage || isFetching}
                className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === lastPage ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}
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