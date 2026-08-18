import { useState, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, Receipt, Wallet, ArrowLeft,
  CheckCircle, X, Calendar, Printer, User, Phone, Mail, ShieldAlert,
} from "lucide-react";
import { useCustomers, useDeleteCustomer } from "../../../hooks/useCustomers";
import { useStatusTransaksiList } from "../../../hooks/useStatusTransaksi";
import { useCustomerFilters, useCustomerModals } from "../../../lib/zustand/customerStore";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin, useUserRole } from "../../../lib/zustand/authStore";
import { cn } from "../../../lib/utils";
import api from "../../../lib/api/axios";
import CustomerForm from "./CustomerForm";
import CustomerDetail from "./CustomerDetail";

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const safeFloat = (v) => { const n = typeof v === "string" ? parseFloat(v) : v; return isNaN(n) ? 0 : n; };
const fmtRp = (v) => new Intl.NumberFormat("id-ID").format(Math.round(safeFloat(v)));
const unfmtRp = (s) => { if (!s) return 0; const c = String(s).replace(/\D/g, ""); return c === "" ? 0 : parseInt(c, 10); };
const fmtProductName = (p) => p ? [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" ") : "-";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const STATUS_DIBATALKAN_ID = 6;

const canCreateCustomer = (role) => ["admin", "admin_toko", "operator"].includes(role);

// ==========================================
// CUSTOMER CARD COMPONENT (Serasi dengan halaman lain)
// ==========================================
const CustomerCard = ({ item, isAdmin, onDetail, onEdit, onDelete, onTagihanHarian, onTagihanPesanan, onPrint }) => {
  const tH = Number(item.tagihan_harian_belum_lunas) || 0;
  const tP = Number(item.tagihan_pesanan_belum_lunas) || 0;
  const hasTag = tH > 0 || tP > 0;
  const initials = item.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 flex flex-col h-full">
      {/* Top Section: Avatar + Name + Contact */}
      <div className="flex flex-col items-center text-center pt-4 px-4 pb-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white mb-3 group-hover:scale-105 transition-transform duration-300">
          {initials}
        </div>

        <h3 className="text-sm font-bold text-slate-900 truncate w-full" title={item.name}>
          {item.name}
        </h3>

        {isAdmin ? (
          <div className="mt-1.5 space-y-0.5 w-full">
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.phone || "-"}</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{item.email || "-"}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 mt-1">(kontak hanya admin)</p>
        )}
      </div>

      {/* Middle Section: Tagihan Badges (serasi dengan Product stock badges) */}
      <div className="px-4 space-y-1 text-xs min-w-0 flex-1">
        {tH > 0 && (
          <div
            className="flex justify-between pt-2 border-t border-slate-100 cursor-pointer hover:bg-orange-50 rounded p-1 gap-1 transition-colors"
            onClick={() => onTagihanHarian(item)}
          >
            <span className="text-orange-600 font-medium truncate">Harian:</span>
            <span className="text-orange-600 font-bold shrink-0 whitespace-nowrap">{fmtRp(tH)}</span>
          </div>
        )}
        {tP > 0 && (
          <div
            className="flex justify-between pt-1 cursor-pointer hover:bg-purple-50 rounded p-1 gap-1 transition-colors"
            onClick={() => onTagihanPesanan(item)}
          >
            <span className="text-purple-600 font-medium truncate">Pesanan:</span>
            <span className="text-purple-600 font-bold shrink-0 whitespace-nowrap">{fmtRp(tP)}</span>
          </div>
        )}
        {!hasTag && (
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <span className="text-emerald-600 font-medium">Lunas</span>
            <CheckCircle size={14} className="text-emerald-600" />
          </div>
        )}
      </div>

      {/* Print Button (hanya jika ada tagihan) */}
      {hasTag && (
        <div className="mt-3 mx-4 pt-2 border-t border-slate-100">
          <button
            onClick={() => onPrint(item)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs w-full transition active:scale-95"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Cetak Tagihan</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1 min-h-[8px]" />

      {/* Action Buttons (hover reveal - serasi dengan halaman lain) */}
      {isAdmin && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => onDetail(item)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Detail">
            <User size={14} />
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const CustomerPage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveSearch, getQueryParams } = useCustomerFilters();
  const {
    openCreateModal, openEditModal, openTagihanModal,
    openDetailModal, openBayarModal, modals, selectedItem,
    tagihanFilter, bayarDetail, closeAllModals,
  } = useCustomerModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const role = useUserRole();
  const isAdmin = useIsAdmin();
  const canCreate = canCreateCustomer(role);

  const [searchInput, setSearchInput] = useState(filters.search);
  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useCustomers(getQueryParams());
  const deleteMut = useDeleteCustomer();
  const { data: statuses = [] } = useStatusTransaksiList();
  const statusSelesaiId = useMemo(() => statuses.find((s) => s.nama?.toLowerCase().includes("selesai"))?.id?.toString(), [statuses]);

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
  const from = meta.from || 0;
  const to = meta.to || 0;
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

  // DELETE HANDLER
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

  // PRINT TAGIHAN
  const handlePrintTagihan = (customer) => {
    const details = (customer.transaksi_details || []).filter((d) => {
      if (!d?.transaksi || !d?.product || d.status_transaksi_id === STATUS_DIBATALKAN_ID) return false;
      const sub = safeFloat(d.subtotal);
      const paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0);
      return sub - paid > 0;
    });
    if (details.length === 0) { info("Info", "Tidak ada tagihan yang perlu dicetak"); return; }

    let tSub = 0, tDisc = 0, tTag = 0, tPaid = 0;
    const rows = details.map((d) => {
      const sub = safeFloat(d.subtotal), disc = safeFloat(d.discount), subAsli = sub + disc;
      const qty = d.qty != null ? Number(d.qty) : 1;
      const paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0);
      const sisa = sub - paid;
      tSub += subAsli; tDisc += disc; tTag += sub; tPaid += paid;
      return `<tr><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;font-size:10px">${fmtDate(d.transaksi?.tanggal)}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;font-size:10px;max-width:200px;word-wrap:break-word">${fmtProductName(d.product)}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;font-size:10px">${qty}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">Rp ${fmtRp(subAsli)}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">Rp ${fmtRp(disc)}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;font-size:10px">Rp ${fmtRp(paid)}</td><td style="padding:6px 8px;border:1px solid #e5e7eb;text-align:right;color:#dc2626;font-weight:600;font-size:10px">Rp ${fmtRp(sisa)}</td></tr>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Surat Tagihan - ${customer.name}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');*{box-sizing:border-box}body{font-family:'Inter',sans-serif;padding:20mm;color:#1f2937;width:210mm;min-height:297mm;margin:0 auto;background:#fff;line-height:1.4;font-size:10px}@media print{body{padding:15mm}@page{margin:0;size:A4}}h1{text-align:center;color:#1e40af;margin:0 0 4px;font-size:20px;font-weight:700}.subtitle{text-align:center;color:#64748b;margin-bottom:16px;font-size:11px}.salutation{margin-bottom:16px;font-size:11px;line-height:1.5}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:10px}th{background:#dbeafe;color:#1e40af;font-weight:600;padding:6px 8px;text-align:center;text-transform:uppercase;letter-spacing:.3px;border:1px solid #bfdbfe;font-size:9px;white-space:nowrap}td{padding:6px 8px;border:1px solid #e5e7eb;vertical-align:middle;font-size:10px}td:nth-child(1){text-align:center;width:12%}td:nth-child(2){text-align:left;width:35%;word-break:break-word}td:nth-child(3){text-align:center;width:8%}td:nth-child(4),td:nth-child(5),td:nth-child(6),td:nth-child(7){text-align:right;width:11.25%;white-space:nowrap}.summary{margin-top:16px;padding-top:12px;border-top:2px solid #cbd5e1}.total-due{font-size:13px;text-align:center;font-weight:700;color:#dc2626;margin-top:6px;padding-top:6px;border-top:1px dashed #e5e7eb}.footer{margin-top:24px;text-align:center;color:#64748b;font-size:9px}.highlight{color:#1e40af;font-weight:600}</style></head><body><h1>SURAT TAGIHAN</h1><div class="subtitle">Jaya Rubber Seal</div><p class="salutation">Kepada Yth.<br><span class="highlight">${customer.name}</span><br><br>Bersama ini kami dari <strong>Jaya Rubber Seal</strong> ingin mengingatkan bahwa Bapak/Ibu masih memiliki tagihan yang belum dilunasi.</p><table><thead><tr><th>Tgl</th><th>Produk</th><th>Qty</th><th>Subtotal</th><th>Diskon</th><th>Dibayar</th><th>Sisa</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="total-due">SISA TAGIHAN: Rp ${fmtRp(tTag - tPaid)}</div></div><div class="footer"><p>Mohon segera melakukan pelunasan. Atas perhatiannya, terima kasih.</p><p>Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div></body></html>`;

    const w = window.open("", "_blank", "width=800,height=600");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 250); }
    else info("Error", "Gagal membuka jendela cetak");
  };

  // BAYAR HANDLER
  const [jumlahBayar, setJumlahBayar] = useState("");
  const handleJumlahBayarChange = (raw) => { const c = raw.replace(/\D/g, ""); setJumlahBayar(c === "" ? "" : fmtRp(c)); };

  const handleBayar = async (e) => {
    e.preventDefault();
    if (!bayarDetail) return;
    const jumlah = unfmtRp(jumlahBayar);
    const detail = bayarDetail;
    const prevPaid = (detail.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0);
    const subtotal = safeFloat(detail.subtotal);
    const sisa = subtotal - prevPaid;

    if (!jumlah || jumlah <= 0) { warning("Error", "Jumlah bayar harus lebih dari 0"); return; }
    if (jumlah > sisa) { warning("Error", `Jumlah bayar tidak boleh melebihi sisa tagihan (Rp ${fmtRp(sisa)})`); return; }

    try {
      await api.post("/pembayaran", { transaksi_detail_id: detail.id, jumlah_bayar: jumlah, tanggal_bayar: new Date().toISOString().split("T")[0] });
      const newSisa = sisa - jumlah;
      if (newSisa <= 0 && statusSelesaiId) {
        try { await api.patch(`/transaksi-detail/${detail.id}/status`, { status_transaksi_id: statusSelesaiId }); await success("Berhasil!", "Pembayaran lunas & tagihan diselesaikan"); }
        catch { await success("Berhasil!", "Pembayaran dicatat (gagal auto-selesai)"); }
      } else { await success("Berhasil", "Pembayaran berhasil dicatat"); }
      setJumlahBayar(""); closeAllModals(); refetch();
    } catch { info("Error", "Gagal menyimpan pembayaran"); }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="space-y-4 pb-20">
      {/* STICKY FILTER BAR */}
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/70 backdrop-blur-md border-b border-slate-200/60">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 p-3 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari nama, no HP, atau email..." className="w-full pl-10 pr-8 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all bg-white" />
              {searchInput && <button onClick={() => { setSearchInput(""); resetFilters(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"><X size={14} /></button>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isFilterActive && <button onClick={() => { setSearchInput(""); resetFilters(); }} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"><X className="w-4 h-4" /> Reset</button>}
              <button onClick={() => refetch()} disabled={isFetching} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50" title="Refresh">
                <span className={cn("transition-transform", isFetching && "animate-spin")}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg></span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
              <div className="flex flex-col items-center pt-4 px-4 pb-3">
                <div className="w-14 h-14 bg-slate-200 rounded-full mb-3" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
              <div className="px-4 space-y-2 pb-4">
                <div className="h-6 bg-slate-200 rounded-full w-full" />
                <div className="h-6 bg-slate-200 rounded-full w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold text-lg">{isFilterActive ? "Tidak ada customer yang cocok" : "Belum ada data customer"}</p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">{isFilterActive ? "Coba ubah kata kunci pencarian atau reset filter" : "Mulai dengan menambahkan customer baru"}</p>
          {isFilterActive && <button onClick={() => { setSearchInput(""); resetFilters(); }} className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Reset Filter</button>}
        </div>
      ) : (
        <>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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
              />
            ))}
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pb-4 flex-wrap">
              <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || isFetching} className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}>← Prev</button>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && <><button onClick={() => setCurrentPage(1)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">1</button>{paginationNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}</>}
                {paginationNumbers.map((p) => <button key={p} onClick={() => setCurrentPage(p)} disabled={isFetching} className={cn("w-8 h-8 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === p ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50")}>{p}</button>)}
                {paginationNumbers[paginationNumbers.length - 1] < lastPage && <>{paginationNumbers[paginationNumbers.length - 1] < lastPage - 1 && <span className="px-1 text-slate-400">…</span>}<button onClick={() => setCurrentPage(lastPage)} className="w-8 h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50">{lastPage}</button></>}
              </div>
              <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === lastPage || isFetching} className={cn("px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition", currentPage === lastPage ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-95")}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* FAB */}
      {canCreate && (
        <button onClick={openCreateModal} className="fixed bottom-6 right-6 z-40 group" aria-label="Tambah Customer" title="Tambah Customer">
          <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 active:scale-95 hover:scale-110"><Plus className="w-6 h-6" strokeWidth={2.5} /></div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">Tambah Customer<div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" /></div>
        </button>
      )}

      {/* Modals */}
      <CustomerForm />
      <CustomerDetail />

      {/* MODAL: Tagihan List */}
      {modals.tagihan && selectedItem && (() => {
        const filtered = (selectedItem.transaksi_details || []).filter((d) => {
          if (!d?.transaksi || !d?.product || d.status_transaksi_id === STATUS_DIBATALKAN_ID) return false;
          if (tagihanFilter === "daily" && d.transaksi.jenis_transaksi !== "daily") return false;
          if (tagihanFilter === "pesanan" && d.transaksi.jenis_transaksi !== "pesanan") return false;
          const sub = safeFloat(d.subtotal), paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0);
          return sub - paid > 0;
        });
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modalIn">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="min-w-0"><h2 className="text-lg font-bold text-slate-900 truncate">Tagihan {selectedItem.name}</h2><p className="text-xs text-slate-500">{tagihanFilter === "daily" ? "Transaksi Harian" : tagihanFilter === "pesanan" ? "Transaksi Pesanan" : "Semua Tagihan"}</p></div>
                <button onClick={closeAllModals} className="p-2 hover:bg-slate-100 rounded-full transition flex-shrink-0"><ArrowLeft size={20} className="text-slate-500" /></button>
              </div>
              <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-12"><CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" /><p className="text-slate-500 text-sm">Tidak ada tagihan yang belum lunas</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.map((d) => {
                      const sub = safeFloat(d.subtotal), paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0), sisa = sub - paid;
                      const isDaily = d.transaksi?.jenis_transaksi === "daily";
                      return (
                        <div key={d.id} className="border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition active:scale-[0.98]" onClick={() => openDetailModal(d)}>
                          <div className="flex justify-center mb-2"><span className={cn("px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium", isDaily ? "bg-orange-100 text-orange-800" : "bg-purple-100 text-purple-800")}>{isDaily ? "Harian" : "Pesanan"}</span></div>
                          <p className="font-medium text-slate-900 text-xs sm:text-sm text-center truncate">{d.product?.kode}</p>
                          <p className="text-[10px] text-slate-500 text-center line-clamp-2 mb-1">{fmtProductName(d.product)}</p>
                          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-2"><Calendar size={12} />{fmtDate(d.transaksi?.tanggal)}</div>
                          <div className="flex justify-between text-xs"><span className="text-slate-500">Sisa:</span><span className="font-bold text-red-600 whitespace-nowrap">Rp {fmtRp(sisa)}</span></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Detail Tagihan */}
      {modals.detail && bayarDetail && (() => {
        const d = bayarDetail, sub = safeFloat(d.subtotal), paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0), sisa = sub - paid, lunas = sisa <= 0;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modalIn">
              <div className="p-4 sm:p-5 border-b border-slate-200 sticky top-0 bg-white z-10 text-center">
                <h2 className="text-lg font-bold text-slate-900">Detail Tagihan</h2>
                <p className="text-xs text-slate-500 mt-1 truncate">{selectedItem?.name || ""}</p>
              </div>
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                {d.product && <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="font-medium text-slate-900 text-sm truncate">{d.product?.kode}</p><p className="text-xs text-slate-500 line-clamp-2">{fmtProductName(d.product)}</p><div className="flex items-center justify-center gap-1 my-2 text-[10px] text-slate-400"><Calendar size={12} />{fmtDate(d.transaksi?.tanggal)}</div><p className="text-[10px] text-slate-400">{d.transaksi?.jenis_transaksi === "daily" ? "Harian" : "Pesanan"}</p></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal:</span><span className="font-bold">{fmtRp(sub)}</span></div>
                {(d.pembayarans || []).length > 0 && <div className="bg-blue-50 rounded-xl p-3"><p className="font-medium text-blue-800 flex items-center gap-1 justify-center text-sm"><Receipt size={14} /> Riwayat Pembayaran</p><ul className="mt-2 space-y-1 max-h-24 overflow-y-auto">{d.pembayarans.map((p) => <li key={p.id} className="text-xs text-slate-700 flex justify-between"><span>Rp {fmtRp(p.jumlah_bayar)}</span><span className="text-slate-400">{fmtDate(p.tanggal_bayar)}</span></li>)}</ul></div>}
                <div className="text-center py-2"><p className="text-xs text-slate-500">Dibayar: Rp {fmtRp(paid)} / Rp {fmtRp(sub)}</p>{!lunas && <p className="text-sm font-bold text-red-600 mt-1">Sisa: Rp {fmtRp(sisa)}</p>}</div>
                {!lunas && <button onClick={() => { setJumlahBayar(fmtRp(sisa)); openBayarModal(d); }} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition active:scale-95 text-sm font-medium"><Wallet size={16} /> Bayar Sekarang</button>}
              </div>
              <div className="p-4 border-t border-slate-200"><button onClick={closeAllModals} className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition">Kembali</button></div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Pembayaran */}
      {modals.bayar && bayarDetail && (() => {
        const d = bayarDetail, sub = safeFloat(d.subtotal), paid = (d.pembayarans || []).reduce((s, p) => s + safeFloat(p.jumlah_bayar), 0), sisa = sub - paid;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl animate-modalIn">
              <div className="p-4 sm:p-5 border-b border-slate-200 sticky top-0 bg-white z-10 text-center">
                <h2 className="text-lg font-bold text-slate-900">Pembayaran Tagihan</h2>
                <p className="text-xs text-slate-500 mt-1 truncate">{selectedItem?.name || ""}</p>
              </div>
              <form onSubmit={handleBayar} className="p-4 sm:p-5">
                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-center"><p className="font-medium text-slate-900 text-sm truncate">{d.product?.kode}</p><p className="text-xs text-slate-500 line-clamp-2">{fmtProductName(d.product)}</p></div>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span>Rp {fmtRp(sub)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Sudah Dibayar:</span><span>Rp {fmtRp(paid)}</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t border-slate-200"><span className="text-red-600">Sisa Tagihan:</span><span className="text-red-600">Rp {fmtRp(sisa)}</span></div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-center">Jumlah Bayar (Rp)</label>
                  <input type="text" inputMode="numeric" className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center text-sm font-medium" value={jumlahBayar} onChange={(e) => handleJumlahBayarChange(e.target.value)} placeholder="Masukkan jumlah" required autoFocus />
                </div>
                <div className="flex justify-center gap-3">
                  <button type="button" onClick={() => { setJumlahBayar(""); closeAllModals(); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition">Batal</button>
                  <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition active:scale-95">Bayar</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomerPage;