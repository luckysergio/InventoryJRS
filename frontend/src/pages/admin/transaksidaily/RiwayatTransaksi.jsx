import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  X, RefreshCw, Receipt, Calendar, User, Printer,
  Download, CheckCircle2, XCircle, Layers, Package,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import { useTransaksis } from "../../../hooks/useTransaksi";
import { useTransaksiRiwayatFilters, useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import { useCustomersDropdown } from "../../../hooks/useMasterData";
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
  getInvoiceNumber,
  getJenisConfig,
  getStatusConfig,
  normalizeDetails,
} from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";
import TransaksiDetail from "./TransaksiDetail";
import PembayaranModal from "./PembayaranModal";
import InvoiceSimplePrint from "../../../components/InvoiceSimplePrint";

// ==========================================
// RIWAYAT CARD (dengan includeCompleted={true} untuk print)
// ==========================================
const RiwayatCard = ({ transaksi, onOpenDetail }) => {
  const details = normalizeDetails(transaksi.details || []);
  const jenisCfg = getJenisConfig(transaksi.jenis_transaksi);
  const totalTagihan = Number(transaksi.total) || 0;
  const totalBayar = Number(transaksi.total_bayar) || 0;
  const sisaTagihan = Math.max(totalTagihan - totalBayar, 0);
  const isLunas = sisaTagihan <= 0;

  const activeStatuses = details.map((d) => d.status_transaksi_id);
  const isAllCancelled = activeStatuses.length > 0 && activeStatuses.every((s) => s === 6);
  const hasSelesai = activeStatuses.some((s) => s === 5);
  const hasProduksi = activeStatuses.some((s) => s === 2);

  const overallStatus = isAllCancelled ? 6 : hasSelesai ? 5 : hasProduksi ? 2 : 1;
  const statusCfg = getStatusConfig(overallStatus);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: getInvoiceNumber(transaksi).replace(/\//g, "-"),
  });

  return (
    <>
      <div
        onClick={() => onOpenDetail(transaksi)}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col h-full group"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <p className="font-mono font-bold text-xs text-indigo-700 truncate">
                {getInvoiceNumber(transaksi)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide font-semibold">
                Invoice {transaksi.jenis_transaksi === 'pesanan' ? 'Pesanan' : 'Harian'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrint();
              }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded transition flex-shrink-0"
              title="Cetak Invoice"
            >
              <Printer size={10} /> Cetak
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {formatTanggal(transaksi.tanggal, "short")}
            </span>
            <span className="flex items-center gap-1">
              <User size={10} />
              <span className="truncate max-w-[120px]">{transaksi.customer?.name || "Umum"}</span>
            </span>
          </div>

          <div className="flex gap-1.5 flex-wrap mt-2">
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-semibold", jenisCfg.bg, jenisCfg.text)}>
              {jenisCfg.label}
            </span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold border", statusCfg.bg, statusCfg.text, statusCfg.border)}>
              {statusCfg.icon} {statusCfg.label}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 border-b border-slate-100">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Tagihan</span>
              <span className="font-bold text-slate-900">Rp {formatRupiah(totalTagihan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sudah Dibayar</span>
              <span className="font-semibold text-green-600">Rp {formatRupiah(totalBayar)}</span>
            </div>
            {sisaTagihan > 0 && (
              <div className="flex justify-between pt-1.5 border-t border-slate-100">
                <span className="text-slate-500">Sisa Tagihan</span>
                <span className="font-bold text-red-600">Rp {formatRupiah(sisaTagihan)}</span>
              </div>
            )}
            {isLunas && (
              <div className="flex items-center justify-center gap-1.5 pt-2 text-green-600 font-semibold bg-green-50 rounded-lg py-1.5">
                <CheckCircle2 size={14} />
                <span>LUNAS</span>
              </div>
            )}
          </div>
        </div>

        {/* Products Preview */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto max-h-[200px]">
          {details.slice(0, 4).map((d) => {
            const dStatus = getStatusConfig(d.status_transaksi_id);
            return (
              <div key={d.id} className="flex items-center gap-2 text-[10px] p-2 bg-slate-50 rounded-lg">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dStatus.bg.replace("-100", "-500").replace("bg-", "bg-"))} />
                <span className="font-mono font-bold text-slate-700 truncate">{d.product?.kode || "?"}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 truncate flex-1">{d.qty}× Rp {formatRupiah(d.harga)}</span>
                <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold", dStatus.bg, dStatus.text)}>
                  {dStatus.icon}
                </span>
              </div>
            );
          })}
          {details.length > 4 && (
            <p className="text-[10px] text-indigo-600 font-medium text-center pt-1">
              +{details.length - 4} item lainnya • Klik untuk detail
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-700">
            <Receipt size={12} />
            <span>Lihat Detail Lengkap</span>
          </div>
        </div>
      </div>

      {/* ✅ FIXED: includeCompleted={true} agar detail status 5 & 6 tetap tampil di print */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", padding: "20mm" }}>
        <InvoiceSimplePrint 
          ref={printRef} 
          transaksi={transaksi} 
          includeCompleted={true}
        />
      </div>
    </>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const RiwayatTransaksiPage = () => {
  const {
    filters, currentPage, setJenis, setStatus, setCustomerId,
    setDari, setSampai, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams,
  } = useTransaksiRiwayatFilters();
  const { openDetailModal } = useTransaksiModals();
  const { data: customers = [] } = useCustomersDropdown();

  const queryParams = getQueryParams();
  const { data, isLoading, isFetching, refetch, error } = useTransaksis(queryParams);

  const transaksis = data?.transaksis || [];

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

  const exportToExcel = () => {
    if (transaksis.length === 0) return;

    const rows = [];
    transaksis.forEach((t) => {
      const details = normalizeDetails(t.details || []);
      details.forEach((d) => {
        const sudahBayar = Number(d.total_bayar) || 0;
        const subtotal = Number(d.subtotal) || 0;
        rows.push({
          "No Invoice": getInvoiceNumber(t),
          "Customer": t.customer?.name || "Umum",
          "Tanggal": formatTanggal(t.tanggal, "long"),
          "Jenis": t.jenis_transaksi === "daily" ? "Harian" : "Pesanan",
          "Kode Produk": d.product?.kode || "-",
          "Nama Produk": formatProductName(d.product),
          "Qty": d.qty,
          "Harga Satuan": Number(d.harga) || 0,
          "Diskon": Number(d.discount) || 0,
          "Subtotal": subtotal,
          "Total Bayar": sudahBayar,
          "Sisa Tagihan": Math.max(subtotal - sudahBayar, 0),
          "Catatan": d.catatan || "",
          "Status": d.status_transaksi_id === 5 ? "Selesai" : d.status_transaksi_id === 6 ? "Dibatalkan" : "Aktif",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Riwayat-Transaksi-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-20">

      {/* Sticky Filter */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm space-y-2">
          {/* Row: Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.dari}
                onChange={(e) => setDari(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative flex-1 min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.sampai}
                onChange={(e) => setSampai(e.target.value)}
                min={filters.dari || undefined}
                className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filters.jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[100px]"
            >
              <option value="all">Semua Jenis</option>
              <option value="daily">Harian</option>
              <option value="pesanan">Pesanan</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[110px]"
            >
              <option value="all">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
            <select
              value={filters.customer_id}
              onChange={(e) => setCustomerId(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
            >
              <option value="">Semua Customer</option>
              {customers.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {isFilterActive && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors">
                <X className="w-3 h-3" /> Reset
              </button>
            )}
            <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50">
              <span className={cn("transition-transform", isFetching && "animate-spin")}>
                <RefreshCw className="w-3 h-3" />
              </span>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {transaksis.length > 0 && (
              <button onClick={exportToExcel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900">Gagal Memuat Data</p>
            <p className="text-xs text-red-700 mt-0.5">
              {error.response?.data?.message || error.message || "Terjadi kesalahan pada server"}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors flex-shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
              <div className="h-12 bg-slate-200 rounded-t-lg mb-3" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-16 bg-slate-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : transaksis.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            {isFilterActive ? "Tidak Ada Hasil" : "Belum Ada Riwayat"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? `Tidak ada transaksi yang cocok dengan filter Anda`
              : "Riwayat transaksi akan muncul setelah ada yang diselesaikan atau dibatalkan"}
          </p>
          {isFilterActive && (
            <button onClick={resetFilters} className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {transaksis.map((t) => (
              <RiwayatCard
                key={t.id}
                transaksi={t}
                onOpenDetail={openDetailModal}
              />
            ))}
          </div>

          {/* Pagination */}
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

      <TransaksiDetail />
      <PembayaranModal />
    </div>
  );
};

export default RiwayatTransaksiPage;