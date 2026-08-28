import { useState, useMemo, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Search, CheckCircle, X, Printer, Phone, Mail, Loader2,
  User, AlertTriangle, TrendingUp, FileText, ChevronLeft, ChevronRight, RefreshCw,
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

const canCreateCustomer = (role) => ["admin", "admin_toko"].includes(role);
const canEditCustomer = (role) => role === "admin";
const canDeleteCustomer = (role) => role === "admin";

const getTagihanLevel = (total) => {
  if (total === 0) return { level: "lunas", color: "emerald", label: "Lunas" };
  if (total <= 500000) return { level: "low", color: "amber", label: "Kecil" };
  if (total <= 2000000) return { level: "medium", color: "orange", label: "Sedang" };
  return { level: "high", color: "red", label: "Besar" };
};

const getTagihanPercentage = (total, max = 20000000) => Math.min(100, (total / max) * 100);

const CustomerCard = ({
  item, canEdit, canDelete,
  onDetail, onEdit, onDelete,
  onTagihanHarian, onTagihanPesanan,
  onPrint, isPrinting,
}) => {
  const tH = Number(item.tagihan_harian_belum_lunas) || 0;
  const tP = Number(item.tagihan_pesanan_belum_lunas) || 0;
  const totalTagihan = tH + tP;
  const hasTag = totalTagihan > 0;
  const tagihanInfo = getTagihanLevel(totalTagihan);
  const tagihanPercent = getTagihanPercentage(totalTagihan);

  const barGradient = hasTag
    ? tagihanInfo.color === "red" ? "from-red-400 to-rose-500" :
      tagihanInfo.color === "orange" ? "from-orange-400 to-red-500" :
      "from-amber-400 to-orange-500"
    : "from-emerald-400 to-teal-500";

  const actionCount = 2 + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
  const gridCols = actionCount === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <div
      className={cn(
        "group relative bg-white border-2 rounded-2xl shadow-sm transition-all duration-300 overflow-hidden flex flex-col",
        hasTag ? "border-orange-200 hover:border-orange-400" : "border-emerald-200 hover:border-emerald-400",
        "hover:shadow-lg hover:-translate-y-0.5"
      )}
    >
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight line-clamp-2">
              {item.name}
            </h3>

            <div className="mt-1.5 space-y-0.5">
              {item.phone && (
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
                  <Phone size={10} className="flex-shrink-0" />
                  <span className="truncate">{item.phone}</span>
                </div>
              )}
              {item.email && (
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
                  <Mail size={10} className="flex-shrink-0" />
                  <span className="truncate">{item.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {hasTag && (
          <div className="mt-3 space-y-1">
            {tH > 0 && (
              <button
                onClick={() => onTagihanHarian(item)}
                className="w-full flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                <span className="text-[10px] sm:text-[11px] font-medium text-orange-700 flex items-center gap-1">
                  <FileText size={10} /> Harian
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-orange-700">
                  {formatRupiah(tH)}
                </span>
              </button>
            )}
            {tP > 0 && (
              <button
                onClick={() => onTagihanPesanan(item)}
                className="w-full flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <span className="text-[10px] sm:text-[11px] font-medium text-purple-700 flex items-center gap-1">
                  <FileText size={10} /> Pesanan
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-700">
                  {formatRupiah(tP)}
                </span>
              </button>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                {hasTag ? "Total Tagihan" : "Status"}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                {hasTag ? (
                  <span className={cn(
                    "text-2xl sm:text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent",
                    tagihanInfo.color === "red" ? "from-red-600 to-rose-600" :
                    tagihanInfo.color === "orange" ? "from-orange-600 to-red-600" :
                    "from-amber-600 to-orange-600"
                  )}>
                    {formatRupiah(totalTagihan)}
                  </span>
                ) : (
                  <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    LUNAS
                  </span>
                )}
              </div>
            </div>
          </div>

          {hasTag && (
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
                  barGradient
                )}
                style={{ width: `${tagihanPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className={cn(
        "grid border-t-2 border-slate-100 bg-gradient-to-b from-slate-50/50 to-white",
        gridCols
      )}>
        {/* DETAIL */}
        <button
          onClick={() => onDetail(item)}
          className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-blue-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
          title="Detail Customer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 group-hover/btn:bg-blue-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
            <User size={16} className="text-blue-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 group-hover/btn:text-blue-800 uppercase tracking-wide">
            Detail
          </span>
        </button>

        {/* PRINT */}
        <button
          onClick={() => hasTag && onPrint(item)}
          disabled={!hasTag || isPrinting}
          className={cn(
            "group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 transition-all duration-200",
            (canEdit || canDelete) && "border-r border-slate-100",
            !hasTag || isPrinting
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-orange-50 active:scale-95"
          )}
          title={hasTag ? "Cetak Surat Tagihan" : "Tidak ada tagihan untuk dicetak"}
        >
          <div className={cn(
            "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm",
            !hasTag
              ? "bg-slate-100"
              : "bg-orange-100 group-hover/btn:bg-orange-500 group-hover/btn:shadow-md group-hover/btn:scale-110"
          )}>
            {isPrinting ? (
              <Loader2 size={16} className="text-orange-600 animate-spin" strokeWidth={2.5} />
            ) : (
              <Printer size={16} className="text-orange-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            )}
          </div>
          <span className={cn(
            "text-[9px] sm:text-[10px] font-bold uppercase tracking-wide",
            !hasTag ? "text-slate-400" : "text-orange-700 group-hover/btn:text-orange-800"
          )}>
            Print
          </span>
        </button>

        {/* EDIT (ADMIN ONLY) */}
        {canEdit && (
          <button
            onClick={() => onEdit(item)}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-indigo-50 active:scale-95 transition-all duration-200 border-r border-slate-100"
            title="Edit Customer"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 group-hover/btn:bg-indigo-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Pencil size={16} className="text-indigo-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-700 group-hover/btn:text-indigo-800 uppercase tracking-wide">
              Edit
            </span>
          </button>
        )}

        {/* DELETE (ADMIN ONLY) */}
        {canDelete && (
          <button
            onClick={() => onDelete(item)}
            className="group/btn flex flex-col items-center justify-center gap-1 py-3 sm:py-3.5 px-2 hover:bg-red-50 active:scale-95 transition-all duration-200"
            title={hasTag ? `Hati-hati! Customer masih punya tagihan ${formatRupiah(totalTagihan)}` : "Hapus Customer"}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 group-hover/btn:bg-red-500 flex items-center justify-center transition-all duration-200 shadow-sm group-hover/btn:shadow-md group-hover/btn:scale-110">
              <Trash2 size={16} className="text-red-600 group-hover/btn:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-red-700 group-hover/btn:text-red-800 uppercase tracking-wide">
              Hapus
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

const CustomerPage = () => {
  const { filters, currentPage, setSearch, setCurrentPage, resetFilters, hasActiveSearch, getQueryParams } = useCustomerFilters();
  const { openCreateModal, openEditModal, openTagihanModal, openDetailModal } = useCustomerModals();
  const { danger, success, info, warning } = useConfirmDialog();

  const role = useUserRole();

  const canCreate = canCreateCustomer(role);
  const canEdit = canEditCustomer(role);
  const canDelete = canDeleteCustomer(role);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [printingCustomerId, setPrintingCustomerId] = useState(null);

  const { data, isLoading, isFetching, isPlaceholderData, refetch } = useCustomers(getQueryParams());
  const deleteMut = useDeleteCustomer();

  const [debounceTimer, setDebounceTimer] = useState(null);
  const handleSearchChange = useCallback((val) => {
    setSearchInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setSearch(val), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, setSearch]);

  const handleResetFilters = useCallback(() => {
    resetFilters();
    setSearchInput("");
    if (debounceTimer) clearTimeout(debounceTimer);
  }, [resetFilters, debounceTimer]);

  const customers = data?.customers || [];
  const meta = data?.meta || {};
  const lastPage = meta.last_page || 1;
  const isFilterActive = hasActiveSearch();

  const sortedCustomers = useMemo(() => {
    const withTag = [], withoutTag = [];
    customers.forEach((c) => {
      const h = Number(c.tagihan_harian_belum_lunas) || 0;
      const p = Number(c.tagihan_pesanan_belum_lunas) || 0;
      (h > 0 || p > 0 ? withTag : withoutTag).push(c);
    });
    withTag.sort((a, b) => {
      const totalA = (Number(a.tagihan_harian_belum_lunas) || 0) + (Number(a.tagihan_pesanan_belum_lunas) || 0);
      const totalB = (Number(b.tagihan_harian_belum_lunas) || 0) + (Number(b.tagihan_pesanan_belum_lunas) || 0);
      return totalB - totalA;
    });
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
    if (!canDelete) {
      await info("Akses Ditolak", "Hanya admin yang dapat menghapus customer");
      return;
    }

    const totalTagihan = (Number(customer.tagihan_harian_belum_lunas) || 0) + (Number(customer.tagihan_pesanan_belum_lunas) || 0);

    if (totalTagihan > 0) {
      const confirmed = await danger(
        "⚠️ Customer Masih Punya Tagihan!",
        `Customer "${customer.name}" masih memiliki tagihan sebesar Rp ${formatRupiah(totalTagihan)}. Apakah Anda yakin ingin menghapus? Semua riwayat tagihan akan hilang.`
      );
      if (!confirmed) return;
    } else {
      const confirmed = await danger(
        "Hapus Customer?",
        `Apakah Anda yakin ingin menghapus "${customer.name}"? Tindakan ini tidak dapat dibatalkan.`
      );
      if (!confirmed) return;
    }

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

  const skeletonActionCount = 2 + (canEdit ? 1 : 0) + (canDelete ? 1 : 0);
  const skeletonGridCols = skeletonActionCount === 4 ? "grid-cols-4" : "grid-cols-2";

  return (
    <div className="space-y-4 pb-20">
      <div className="sticky top-4 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 pb-3 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200/80 p-3 shadow-md">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari nama, no HP, atau email..."
                className="w-full pl-10 pr-9 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm transition-all bg-white hover:border-slate-300"
              />
              {searchInput && (
                <button
                  onClick={handleResetFilters}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 sm:flex-shrink-0 hover:border-slate-300"
              title="Refresh"
            >
              <span className={cn("transition-transform", isFetching && "animate-spin")}>
                <RefreshCw className="w-4 h-4" />
              </span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden animate-pulse">
              <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="h-6 w-24 bg-slate-200 rounded-full" />
                <div className="h-4 w-12 bg-slate-200 rounded-full" />
              </div>

              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-slate-200 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="h-7 bg-slate-200 rounded-lg w-full" />
                  <div className="h-7 bg-slate-200 rounded-lg w-full" />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="h-8 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 rounded-full w-full" />
                </div>
              </div>

              <div className={cn("grid border-t-2 border-slate-100", skeletonGridCols)}>
                <div className="h-16 bg-slate-50 border-r border-slate-100" />
                <div className={cn("h-16 bg-slate-50", (canEdit || canDelete) && "border-r border-slate-100")} />
                {canEdit && <div className="h-16 bg-slate-50 border-r border-slate-100" />}
                {canDelete && <div className="h-16 bg-slate-50" />}
              </div>
            </div>
          ))}
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4">
            {isFilterActive ? (
              <X className="w-10 h-10 text-slate-400" />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <p className="text-slate-900 font-bold text-lg">
            {isFilterActive ? "Tidak ada customer yang cocok" : "Belum ada data customer"}
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            {isFilterActive
              ? "Coba ubah kata kunci pencarian atau reset filter"
              : "Mulai dengan menambahkan customer baru untuk mencatat transaksi"}
          </p>
          {isFilterActive ? (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <X size={14} />
              Reset Filter
            </button>
          ) : (
            canCreate && (
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg transition-all inline-flex items-center gap-2 shadow-md shadow-orange-500/20 hover:shadow-lg"
              >
                <Plus size={16} strokeWidth={2.5} />
                Tambah Customer Pertama
              </button>
            )
          )}
        </div>
      ) : (
        <div className={cn(
          "transition-opacity",
          isPlaceholderData && "opacity-60"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {sortedCustomers.map((item) => (
              <CustomerCard
                key={item.id}
                item={item}
                canEdit={canEdit}
                canDelete={canDelete}
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
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-6 pb-4 flex-wrap">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn(
                  "px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition active:scale-95",
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                )}
              >
                <ChevronLeft size={16} className="inline sm:hidden" />
                <span className="hidden sm:inline">← Prev</span>
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {paginationNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={isFetching}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-95"
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
                      "w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-bold transition active:scale-95",
                      currentPage === p
                        ? "bg-gradient-to-br from-orange-600 to-red-600 text-white shadow-md shadow-orange-500/30"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
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
                      disabled={isFetching}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition active:scale-95"
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
                  "px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition active:scale-95",
                  currentPage === lastPage
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
                )}
              >
                <ChevronRight size={16} className="inline sm:hidden" />
                <span className="hidden sm:inline">Next →</span>
              </button>
            </div>
          )}
        </div>
      )}

      {canCreate && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 z-40 group"
          aria-label="Tambah Customer"
          title="Tambah Customer"
        >
          <span className="absolute inset-0 rounded-full bg-orange-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
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