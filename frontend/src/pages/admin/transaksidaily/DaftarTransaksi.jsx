import { useState, useMemo, useCallback } from "react";
import {
  Search, X, RefreshCw, Plus, Receipt, Wallet, Calendar,
  User, Printer, Pencil, AlertCircle, Eye, EyeOff,
} from "lucide-react";
import { useTransaksis } from "../../../hooks/useTransaksi";
import { useTransaksiAktifFilters, useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
  getInvoiceNumber,
  normalizeDetails,
} from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";
import TransaksiForm from "./TransaksiForm";
import TransaksiDetail from "./TransaksiDetail";
import PembayaranModal from "./PembayaranModal";
import InvoiceSimplePrint from "../../../components/InvoiceSimplePrint";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

// ==========================================
// HELPER: Cek apakah transaksi punya detail belum lunas
// ==========================================
const hasUnpaidDetails = (transaksi) => {
  const details = normalizeDetails(transaksi.details || []);
  return details.some((d) => {
    const sisa = Number(d.sisa_tagihan) || 0;
    return sisa > 0;
  });
};

// ==========================================
// AKTIF CARD (SIMPLIFIED - hanya tampil jika ada sisa)
// ==========================================
const TransaksiAktifCard = ({ transaksi, isAdmin, onOpenDetail, onEdit, onBayar }) => {
  const allDetails = normalizeDetails(transaksi.details || []);

  // ✅ Hanya tampilkan detail yang BELUM lunas
  const details = allDetails.filter((d) => {
    const sisa = Number(d.sisa_tagihan) || 0;
    return sisa > 0;
  });

  const totalTagihan = Number(transaksi.total) || 0;
  const sisaTagihan = Number(transaksi.sisa_tagihan) || 0;
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: getInvoiceNumber(transaksi).replace(/\//g, "-"),
  });

  // Jika tidak ada detail belum lunas, jangan render (should not happen because of parent filter)
  if (details.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-mono font-bold text-xs text-indigo-700 truncate">
              {getInvoiceNumber(transaksi)}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {formatTanggal(transaksi.tanggal)}
              </span>
              <span className="flex items-center gap-1">
                <User size={10} />
                <span className="truncate max-w-[120px]">{transaksi.customer?.name || "Umum"}</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded transition flex-shrink-0"
          >
            <Printer size={10} /> Cetak
          </button>
        </div>

        {/* Total */}
        <div className="text-center py-2">
          <p className="text-xs text-slate-500">Sisa Tagihan</p>
          <p className="text-lg font-bold text-red-600">Rp {formatRupiah(sisaTagihan)}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            dari Rp {formatRupiah(totalTagihan)}
          </p>
        </div>
      </div>

      {/* Details List - Hanya yang belum lunas */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar">
        {details.map((d) => {
          const sisa = Number(d.sisa_tagihan) || 0;
          const sudahBayar = Number(d.total_bayar) || 0;

          return (
            <div key={d.id} className="p-2.5 border border-slate-200 rounded-lg bg-slate-50 text-xs">
              <p className="font-medium text-slate-800 line-clamp-2 text-center text-[11px] mb-2">
                {formatProductName(d.product)}
              </p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Qty</span>
                  <span className="font-medium">{d.qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Harga</span>
                  <span className="font-medium">Rp {formatRupiah(d.harga)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Tagihan</span>
                  <span>Rp {formatRupiah(d.subtotal)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Dibayar</span>
                  <span className="font-medium text-green-600">Rp {formatRupiah(sudahBayar)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600">
                  <span>Sisa</span>
                  <span>Rp {formatRupiah(sisa)}</span>
                </div>
              </div>

              {d.catatan && (
                <p className="text-[9px] italic text-slate-500 mt-1.5 text-center line-clamp-1">
                  "{d.catatan}"
                </p>
              )}

              <div className="mt-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => onBayar(d)}
                  className="w-full flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1.5 rounded text-[10px] hover:bg-green-200 transition font-medium"
                >
                  <Wallet size={11} /> Bayar Sisa Rp {formatRupiah(sisa)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-100 flex gap-2 bg-white">
        <button
          onClick={() => onOpenDetail(transaksi)}
          className="flex-1 flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] px-2 py-2 rounded-lg transition font-medium"
        >
          <Receipt size={11} /> Detail ({allDetails.length})
        </button>
        {isAdmin && (
          <button
            onClick={() => onEdit(transaksi)}
            className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-3 py-2 rounded-lg transition font-medium"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {/* Hidden Print */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", padding: "20mm" }}>
        <InvoiceSimplePrint ref={printRef} transaksi={transaksi} />
      </div>
    </div>
  );
};

// ==========================================
// MAIN PAGE
// ==========================================
const TransaksiPage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveFilters, getQueryParams } = useTransaksiAktifFilters();
  const { openFormModal, openDetailModal, openPembayaranModal } = useTransaksiModals();
  const isAdmin = useIsAdmin();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [showPaid, setShowPaid] = useState(false); // Toggle untuk tampilkan/sembunyikan transaksi lunas

  const { data, isLoading, isFetching, refetch, error } = useTransaksis(getQueryParams());

  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const allTransaksis = data?.transaksis || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveFilters();

  // ✅ FILTER: Pisahkan transaksi yang punya detail belum lunas
  const { unpaidTransaksis, paidTransaksis } = useMemo(() => {
    const unpaid = [];
    const paid = [];

    allTransaksis.forEach((t) => {
      if (hasUnpaidDetails(t)) {
        unpaid.push(t);
      } else {
        paid.push(t);
      }
    });

    return { unpaidTransaksis: unpaid, paidTransaksis: paid };
  }, [allTransaksis]);

  // Tampilkan unpaid + (paid jika showPaid = true)
  const transaksis = showPaid
    ? [...unpaidTransaksis, ...paidTransaksis]
    : unpaidTransaksis;

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
      {/* Sticky Filter */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari berdasarkan nama customer..."
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>
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

      {/* ✅ Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-fadeIn">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
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
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-slate-200 rounded w-full mb-3" />
              <div className="space-y-2">
                <div className="h-12 bg-slate-100 rounded" />
                <div className="h-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : transaksis.length === 0 && !isFilterActive ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-10 h-10 text-indigo-600" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            {unpaidTransaksis.length === 0 && paidTransaksis.length > 0
              ? "Semua Transaksi Sudah Lunas 🎉"
              : "Belum Ada Transaksi Aktif"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {unpaidTransaksis.length === 0 && paidTransaksis.length > 0
              ? `Ada ${paidTransaksis.length} transaksi yang sudah lunas. Klik tombol di bawah untuk melihat.`
              : "Transaksi dengan status Proses akan muncul di sini"}
          </p>
          {unpaidTransaksis.length === 0 && paidTransaksis.length > 0 && (
            <button
              onClick={() => setShowPaid(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Eye size={16} /> Lihat Transaksi Lunas
            </button>
          )}
          {!isFilterActive && unpaidTransaksis.length === 0 && paidTransaksis.length === 0 && isAdmin && (
            <button
              onClick={() => openFormModal()}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all flex items-center gap-2 mx-auto"
            >
              <Plus size={16} /> Buat Transaksi
            </button>
          )}
        </div>
      ) : transaksis.length === 0 && isFilterActive ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">Tidak Ada Hasil</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Tidak ada transaksi yang cocok dengan pencarian "<span className="font-semibold">{searchInput}</span>"
          </p>
          <button
            onClick={() => {
              setSearchInput("");
              resetFilters();
            }}
            className="mt-4 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-all"
          >
            Reset Pencarian
          </button>
        </div>
      ) : (
        <>
          {/* Info Bar - Jumlah Transaksi & Toggle Lunas */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            {paidTransaksis.length > 0 && !isFilterActive && (
              <button
                onClick={() => setShowPaid(!showPaid)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                  showPaid
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
              >
                {showPaid ? <EyeOff size={13} /> : <Eye size={13} />}
                {showPaid ? "Sembunyikan Lunas" : `Tampilkan ${paidTransaksis.length} Lunas`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {transaksis.map((t) => (
              <TransaksiAktifCard
                key={t.id}
                transaksi={t}
                isAdmin={isAdmin}
                onOpenDetail={openDetailModal}
                onEdit={(tr) => openFormModal(tr)}
                onBayar={openPembayaranModal}
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

      {/* FAB */}
      {isAdmin && (
        <button onClick={() => openFormModal()} className="fixed bottom-6 right-6 z-40 group" aria-label="Buat Transaksi">
          <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Transaksi Baru
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
          </div>
        </button>
      )}

      <TransaksiForm />
      <TransaksiDetail />
      <PembayaranModal />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}</style>
    </div>
  );
};

export default TransaksiPage;