import { useState, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, CheckCircle, X, Printer, Phone, Mail, Loader2,
} from "lucide-react";
import { useCustomers, useDeleteCustomer } from "../../../hooks/useCustomers";
import { useCustomerFilters, useCustomerModals } from "../../../lib/zustand/customerStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin, useUserRole } from "../../../lib/zustand/authStore";
import { cn } from "../../../lib/utils";
import api from "../../../lib/api/axios";
import CustomerForm from "./CustomerForm";
import CustomerDetail from "./CustomerDetail";
import CustomerTagihanModal from "./CustomerTagihanModal";
import CustomerTagihanDetailModal from "./CustomerTagihanDetailModal";
import CustomerPembayaranModal from "./CustomerPembayaranModal";
import { formatRupiah, formatTanggal, formatProductName } from "../transaksidaily/utils/transaksiUtils";

const canCreateCustomer = (role) => ["admin", "admin_toko", "operator"].includes(role);

const CustomerCard = ({ item, isAdmin, onDetail, onEdit, onDelete, onTagihanHarian, onTagihanPesanan, onPrint, isPrinting }) => {
  const tH = Number(item.tagihan_harian_belum_lunas) || 0;
  const tP = Number(item.tagihan_pesanan_belum_lunas) || 0;
  const hasTag = tH > 0 || tP > 0;
  const initials = item.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full">
      {/* Top Section: Avatar + Name + Contact */}
      <div className="flex flex-col items-center text-center pt-3 px-2 pb-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white mb-2 group-hover:scale-105 transition-transform duration-300">
          {initials}
        </div>

        <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate w-full px-1" title={item.name}>
          {item.name}
        </h3>

        {isAdmin ? (
          <div className="mt-1 space-y-0.5 w-full">
            {item.phone && (
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.phone}</span>
              </div>
            )}
            {item.email && (
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.email}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[10px] text-slate-400 mt-1">(kontak hanya admin)</p>
        )}
      </div>

      {/* Middle Section: Tagihan Badges */}
      <div className="px-2 space-y-1 text-xs min-w-0 flex-1">
        {tH > 0 && (
          <div
            className="flex justify-between items-center pt-2 border-t border-slate-100 cursor-pointer hover:bg-orange-50 rounded px-1 py-1 gap-1 transition-colors"
            onClick={() => onTagihanHarian(item)}
          >
            <span className="text-orange-600 font-medium truncate text-[10px] sm:text-xs">Harian:</span>
            <span className="text-orange-600 font-bold shrink-0 whitespace-nowrap text-[10px] sm:text-xs">{formatRupiah(tH)}</span>
          </div>
        )}
        {tP > 0 && (
          <div
            className="flex justify-between items-center pt-1 cursor-pointer hover:bg-purple-50 rounded px-1 py-1 gap-1 transition-colors"
            onClick={() => onTagihanPesanan(item)}
          >
            <span className="text-purple-600 font-medium truncate text-[10px] sm:text-xs">Pesanan:</span>
            <span className="text-purple-600 font-bold shrink-0 whitespace-nowrap text-[10px] sm:text-xs">{formatRupiah(tP)}</span>
          </div>
        )}
        {!hasTag && (
          <div className="flex justify-between items-center pt-2 border-t border-slate-100 px-1 py-1">
            <span className="text-emerald-600 font-medium text-[10px] sm:text-xs">Lunas</span>
            <CheckCircle size={14} className="text-emerald-600" />
          </div>
        )}
      </div>

      {/* Print Button */}
      {hasTag && (
        <div className="mt-2 mx-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => onPrint(item)}
            disabled={isPrinting}
            className={cn(
              "flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs w-full transition active:scale-95",
              isPrinting
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            )}
          >
            {isPrinting ? (
              <><Loader2 size={12} className="animate-spin" /> <span className="hidden sm:inline">Memuat...</span></>
            ) : (
              <><Printer size={12} /> <span className="hidden sm:inline">Cetak Tagihan</span><span className="sm:hidden">Print</span></>
            )}
          </button>
        </div>
      )}

      {/* Spacer to push actions to bottom */}
      <div className="flex-1 min-h-[4px]" />

      {/* Action Buttons */}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm">
          <button onClick={(e) => { e.stopPropagation(); onDetail(item); }} className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Detail">
            <Mail size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const CustomerPage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveSearch, getQueryParams } = useCustomerFilters();
  const {
    openCreateModal, openEditModal, openTagihanModal, openDetailModal,
  } = useCustomerModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const role = useUserRole();
  const isAdmin = useIsAdmin();
  const canCreate = canCreateCustomer(role);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [printingCustomerId, setPrintingCustomerId] = useState(null);

  const { data, isLoading, isFetching, refetch } = useCustomers(getQueryParams());
  const deleteMut = useDeleteCustomer();

  // Debounced search
  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const customers = data?.customers || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const isFilterActive = hasActiveSearch();

  const sortedCustomers = useMemo(() => {
    const withTag = [], withoutTag = [];
    customers.forEach((c) => {
      const h = Number(c.tagihan_harian_belum_lunas) || 0;
      const p = Number(c.tagihan_pesanan_belum_lunas) || 0;
      (h > 0 || p > 0 ? withTag : withoutTag).push(c);
    });
    withTag.sort((a, b) => a.name.localeCompare(b.name));
    withoutTag.sort((a, b) => a.name.localeCompare(b.name));
    return [...withTag, ...withoutTag];
  }, [customers]);

  const paginationNumbers = useMemo(() => {
    const max = 5, pages = [];
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(lastPage, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [currentPage, lastPage]);

  const handleDelete = async (customer) => {
    const confirmed = await danger("Hapus Customer?", `Apakah Anda yakin ingin menghapus "${customer.name}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;
    try {
      await deleteMut.mutateAsync(customer.id);
      await success("Berhasil!", `Customer "${customer.name}" berhasil dihapus`);
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menghapus customer";
      await (err.response?.status === 422 ? warning : info)(err.response?.status === 422 ? "Tidak Dapat Dihapus" : "Gagal", msg);
    }
  };

  const handlePrintTagihan = async (customer) => {
    setPrintingCustomerId(customer.id);

    try {
      const response = await api.get(`/customers/${customer.id}/tagihan`);
      const details = response.data?.data || [];

      if (details.length === 0) {
        info("Info", "Tidak ada tagihan yang perlu dicetak");
        setPrintingCustomerId(null);
        return;
      }

      let tSub = 0, tDisc = 0, tTag = 0, tPaid = 0;
      const rows = details.map((d) => {
        const sub = Number(d.subtotal) || 0;
        const disc = Number(d.discount) || 0;
        const subAsli = sub + disc;
        const qty = d.qty != null ? Number(d.qty) : 1;
        const paid = Number(d.total_bayar) || 0;
        const sisa = sub - paid;

        tSub += subAsli;
        tDisc += disc;
        tTag += sub;
        tPaid += paid;

        const productName = d.product ? formatProductName(d.product) : "-";
        const productCode = d.product?.kode || "-";
        const tanggal = d.transaksi?.tanggal ? formatTanggal(d.transaksi.tanggal, "short") : "-";

        return `
          <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-size:10px">${tanggal}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-size:10px;">
              <div style="font-weight:600;color:#1e40af;font-family:monospace;margin-bottom:2px">${productCode}</div>
              <div style="word-wrap:break-word">${productName}</div>
            </td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;font-size:10px">${qty}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">Rp ${formatRupiah(subAsli)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">Rp ${formatRupiah(disc)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;font-size:10px;color:#059669">Rp ${formatRupiah(paid)}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:#dc2626;font-weight:600;font-size:10px">Rp ${formatRupiah(sisa)}</td>
          </tr>
        `;
      }).join("");

      const harianDetails = details.filter(d => d.transaksi?.jenis_transaksi === "daily");
      const pesananDetails = details.filter(d => d.transaksi?.jenis_transaksi === "pesanan");

      const harianTotal = harianDetails.reduce((sum, d) => sum + (Number(d.sisa_tagihan) || 0), 0);
      const pesananTotal = pesananDetails.reduce((sum, d) => sum + (Number(d.sisa_tagihan) || 0), 0);

      let summaryHtml = "";
      if (harianDetails.length > 0 && pesananDetails.length > 0) {
        summaryHtml = `
          <div style="margin-top:16px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px">
              <span style="color:#ea580c;font-weight:600">• Tagihan Harian (${harianDetails.length} item):</span>
              <span style="color:#ea580c;font-weight:700">Rp ${formatRupiah(harianTotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px">
              <span style="color:#7c3aed;font-weight:600">• Tagihan Pesanan (${pesananDetails.length} item):</span>
              <span style="color:#7c3aed;font-weight:700">Rp ${formatRupiah(pesananTotal)}</span>
            </div>
          </div>
        `;
      }

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Surat Tagihan - ${customer.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    padding: 20mm;
    color: #1f2937;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #fff;
    line-height: 1.5;
    font-size: 11px;
  }
  @media print {
    body { padding: 15mm; }
    @page { margin: 0; size: A4; }
  }
  h1 { text-align: center; color: #1e40af; margin: 0 0 4px; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .subtitle { text-align: center; color: #64748b; margin-bottom: 20px; font-size: 11px; }
  .salutation { margin-bottom: 16px; font-size: 11px; line-height: 1.6; padding: 12px; background: #f8fafc; border-left: 4px solid #1e40af; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10px; }
  th { background: #1e40af; color: white; font-weight: 600; padding: 8px; text-align: center; text-transform: uppercase; letter-spacing: .3px; font-size: 9px; white-space: nowrap; }
  td { padding: 8px; border: 1px solid #e5e7eb; vertical-align: middle; font-size: 10px; }
  tr:nth-child(even) { background: #f8fafc; }
  td:nth-child(1) { text-align: center; width: 12%; }
  td:nth-child(2) { text-align: left; width: 35%; }
  td:nth-child(3) { text-align: center; width: 6%; }
  td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7) { text-align: right; width: 11.75%; white-space: nowrap; }
  .total-due { font-size: 14px; text-align: center; font-weight: 700; color: #dc2626; margin-top: 8px; padding: 10px; background: #fef2f2; border: 2px dashed #dc2626; border-radius: 6px; }
  .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  .highlight { color: #1e40af; font-weight: 700; }
  .info-box { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 10px; padding: 8px 12px; background: #eff6ff; border-radius: 6px; }
</style>
</head>
<body>
  <h1>SURAT TAGIHAN</h1>
  <div class="subtitle"><strong>JAYA RUBBER SEAL</strong> • Invoice Reminder</div>

  <div class="info-box">
    <div><strong>No. Invoice:</strong> TAGIHAN/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(customer.id).padStart(4, '0')}</div>
    <div><strong>Tanggal:</strong> ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>

  <p class="salutation">
    Kepada Yth.<br>
    <span class="highlight" style="font-size:13px">${customer.name}</span><br>
    ${customer.phone ? `📞 ${customer.phone}` : ""} ${customer.email ? `• ✉ ${customer.email}` : ""}<br><br>
    Bersama ini kami dari <strong>Jaya Rubber Seal</strong> ingin mengingatkan bahwa Bapak/Ibu masih memiliki tagihan yang belum dilunasi, dengan rincian sebagai berikut:
  </p>

  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>Produk</th>
        <th>Qty</th>
        <th>Subtotal</th>
        <th>Diskon</th>
        <th>Dibayar</th>
        <th>Sisa</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${summaryHtml}

  <div class="total-due">
    TOTAL SISA TAGIHAN: Rp ${formatRupiah(tTag - tPaid)}
  </div>

  <div class="footer">
    <p><strong>Mohon segera melakukan pelunasan.</strong></p>
    <p>Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.</p>
    <p style="margin-top:8px;color:#94a3b8">
      Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
</body>
</html>`;

      const w = window.open("", "_blank", "width=900,height=700");
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => {
          w.focus();
          w.print();
        }, 400);
      } else {
        info("Error", "Gagal membuka jendela cetak. Mohon izinkan popup di browser Anda.");
      }
    } catch (err) {
      console.error('Print tagihan error:', err);
      info("Gagal Mencetak", err.response?.data?.message || "Terjadi kesalahan saat memuat data tagihan");
    } finally {
      setPrintingCustomerId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama, no HP, atau email..."
                className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); resetFilters(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && (
                <button
                  onClick={() => { setSearchInput(""); resetFilters(); }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  <X className="w-4 h-4" /> Reset
                </button>
              )}
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <span className={cn("transition-transform", isFetching && "animate-spin")}>↻</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="flex flex-col items-center pt-3 px-2 pb-2">
                <div className="w-12 h-12 bg-slate-200 rounded-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-1" />
                <div className="h-2 bg-slate-200 rounded w-1/2" />
              </div>
              <div className="px-2 space-y-2 pb-3">
                <div className="h-6 bg-slate-200 rounded w-full" />
                <div className="h-6 bg-slate-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">
            {isFilterActive ? "Tidak ada customer yang cocok" : "Belum ada data customer"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive ? "Coba ubah kata kunci pencarian atau reset filter" : "Mulai dengan menambahkan customer baru"}
          </p>
          {isFilterActive && (
            <button
              onClick={() => { setSearchInput(""); resetFilters(); }}
              className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ✅ GRID 5 KOLOM RESPONSIF */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {sortedCustomers.map((item) => (
              <CustomerCard
                key={item.id}
                item={item}
                isAdmin={isAdmin}
                onDetail={openDetailModal}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onTagihanHarian={(c) => openTagihanModal(c, "daily")}
                onTagihanPesanan={(c) => openTagihanModal(c, "pesanan")}
                onPrint={handlePrintTagihan}
                isPrinting={printingCustomerId === item.id}
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pb-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition",
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95"
                )}
              >
                ← Prev
              </button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      1
                    </button>
                    {paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                  </>
                )}
                {paginationNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    disabled={isFetching}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition",
                      currentPage === p
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                      className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                  "px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition",
                  currentPage === lastPage
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95"
                )}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      {canCreate && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 z-40 group"
          aria-label="Tambah Customer"
          title="Tambah Customer"
        >
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Tambah Customer
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
          </div>
        </button>
      )}

      {/* Modals */}
      <CustomerForm />
      <CustomerDetail />
      <CustomerTagihanModal />
      <CustomerTagihanDetailModal />
      <CustomerPembayaranModal />
    </div>
  );
};

export default CustomerPage;