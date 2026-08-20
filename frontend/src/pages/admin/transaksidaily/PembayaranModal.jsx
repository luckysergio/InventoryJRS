import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Wallet, Loader2, AlertCircle, Receipt, CheckCircle2,
  Calendar, TrendingUp, Package, Sparkles,
} from "lucide-react";
import { useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import { useCreatePembayaran, useUpdateDetailStatus } from "../../../hooks/useTransaksi";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { formatRupiah, unformatRupiah, formatProductName, formatTanggal, STATUS_MAP } from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";

const PembayaranModal = () => {
  // ==========================================
  // 1. SEMUA HOOKS DI ATAS (sebelum conditional return)
  // ==========================================
  const { modals, selectedDetail, closePembayaranModal } = useTransaksiModals();
  const createPembayaranMut = useCreatePembayaran();
  const updateStatusMut = useUpdateDetailStatus();
  const { success, info } = useConfirmDialog();

  const [jumlahBayar, setJumlahBayar] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState({});
  const [justCompleted, setJustCompleted] = useState(false);

  // ✅ Memoize quickAmounts DI ATAS (sebelum early return)
  const quickAmounts = useMemo(() => [
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.50 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1.00, highlight: true },
  ], []);

  // Reset form saat modal buka
  useEffect(() => {
    const isOpen = modals.pembayaran && !!selectedDetail;
    if (isOpen && selectedDetail) {
      const sisa = Number(selectedDetail.sisa_tagihan) || Number(selectedDetail.subtotal) || 0;
      setJumlahBayar(String(sisa));
      setTanggalBayar(new Date().toISOString().split("T")[0]);
      setErrors({});
      setJustCompleted(false);
    }
  }, [modals.pembayaran, selectedDetail]);

  // ==========================================
  // 2. DERIVED VALUES (boleh setelah hooks)
  // ==========================================
  const isOpen = modals.pembayaran && !!selectedDetail;
  const isSubmitting = createPembayaranMut.isPending || updateStatusMut.isPending;
  const detail = selectedDetail;
  const subtotal = detail ? Number(detail.subtotal) || 0 : 0;
  const totalBayar = detail ? Number(detail.total_bayar) || 0 : 0;
  const sisaTagihan = subtotal - totalBayar;
  const jumlahBayarNum = unformatRupiah(jumlahBayar);
  const sisaSetelahBayar = sisaTagihan - jumlahBayarNum;
  const progressPercent = subtotal > 0 ? ((totalBayar + jumlahBayarNum) / subtotal) * 100 : 0;

  // ==========================================
  // 3. HANDLERS (useCallback untuk stabilitas)
  // ==========================================
  const setQuickAmount = useCallback((percentage) => {
    const currentSisa = subtotal - (detail ? Number(detail.total_bayar) || 0 : 0);
    const amount = Math.round(currentSisa * percentage);
    setJumlahBayar(String(amount));
    setErrors((er) => ({ ...er, jumlahBayar: undefined }));
  }, [subtotal, detail]);

  const handleSubmit = useCallback(async () => {
    if (!detail) return;

    if (!jumlahBayarNum || jumlahBayarNum <= 0) {
      setErrors({ jumlahBayar: "Jumlah bayar harus lebih dari 0" });
      return;
    }
    if (jumlahBayarNum > sisaTagihan) {
      setErrors({ jumlahBayar: `Jumlah tidak boleh melebihi sisa tagihan (Rp ${formatRupiah(sisaTagihan)})` });
      return;
    }
    if (!tanggalBayar) {
      setErrors({ tanggalBayar: "Tanggal bayar wajib diisi" });
      return;
    }

    try {
      setJustCompleted(true);

      await createPembayaranMut.mutateAsync({
        transaksi_detail_id: detail.id,
        jumlah_bayar: jumlahBayarNum,
        tanggal_bayar: tanggalBayar,
      });

      // Auto-selesai jika lunas
      if (sisaSetelahBayar <= 0) {
        try {
          await updateStatusMut.mutateAsync({
            detailId: detail.id,
            status_transaksi_id: STATUS_MAP.SELESAI,
          });
        } catch {}
      }

      // Brief delay untuk success animation
      setTimeout(() => {
        closePembayaranModal();
        success(
          "Berhasil!",
          `Pembayaran Rp ${formatRupiah(jumlahBayarNum)} tercatat${sisaSetelahBayar <= 0 ? " • Status: LUNAS ✓" : ""}`
        );
      }, 600);
    } catch (err) {
      setJustCompleted(false);
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  }, [detail, jumlahBayarNum, sisaTagihan, sisaSetelahBayar, tanggalBayar, createPembayaranMut, updateStatusMut, closePembayaranModal, success, info]);

  // Keyboard shortcut: Enter untuk submit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && isOpen && !isSubmitting) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        closePembayaranModal();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, isSubmitting, handleSubmit, closePembayaranModal]);

  // ==========================================
  // 4. EARLY RETURN (setelah SEMUA hooks)
  // ==========================================
  if (!isOpen || !selectedDetail) return null;

  // ==========================================
  // 5. JSX RENDER
  // ==========================================
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && closePembayaranModal()}
    >
      <div className={cn(
        "bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[95vh] flex flex-col",
        justCompleted && "ring-2 ring-green-500"
      )}>
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 via-emerald-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              {justCompleted && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-ping">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Input Pembayaran</h2>
              <p className="text-[11px] text-slate-500">Catat pembayaran untuk detail transaksi</p>
            </div>
          </div>
          <button
            onClick={closePembayaranModal}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Product Info Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200 flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg flex-shrink-0">
                <Package className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-xs text-indigo-700 mb-0.5">
                  {detail.product?.kode || "-"}
                </p>
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                  {formatProductName(detail.product)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Qty: {detail.qty} × Rp {formatRupiah(detail.harga)}
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl p-4 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                <Receipt size={14} className="text-amber-700" />
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Ringkasan Tagihan
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-800">Total Tagihan</span>
                  <span className="text-sm font-semibold text-slate-900">
                    Rp {formatRupiah(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-800">Sudah Dibayar</span>
                  <span className="text-sm font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Rp {formatRupiah(totalBayar)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-200/60">
                  <span className="text-sm font-bold text-amber-900">Sisa Tagihan</span>
                  <span className="text-lg font-bold text-amber-900">
                    Rp {formatRupiah(sisaTagihan)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] text-amber-700 font-medium">Progress Pembayaran</span>
                  <span className="text-[10px] font-bold text-amber-900">
                    {Math.min(Math.round(progressPercent), 100)}%
                  </span>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      progressPercent >= 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-amber-500 to-orange-500"
                    )}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Jumlah Bayar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide items-center gap-1.5">
                <Wallet size={13} className="text-green-600" />
                Jumlah Bayar <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-500 pointer-events-none">
                  <span className="text-xs font-bold">Rp</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={jumlahBayar ? formatRupiah(jumlahBayar) : ""}
                  onChange={(e) => {
                    setJumlahBayar(String(unformatRupiah(e.target.value)));
                    setErrors((er) => ({ ...er, jumlahBayar: undefined }));
                  }}
                  className={cn(
                    "w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none text-base font-bold transition-all",
                    errors.jumlahBayar
                      ? "border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50"
                      : "border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                  )}
                  placeholder="0"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {errors.jumlahBayar && (
                <p className="text-xs text-red-600 flex items-center gap-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.jumlahBayar}
                </p>
              )}

              {/* Quick Amount Buttons */}
              {sisaTagihan > 0 && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {quickAmounts.map((qa) => (
                    <button
                      key={qa.label}
                      type="button"
                      onClick={() => setQuickAmount(qa.value)}
                      disabled={isSubmitting}
                      className={cn(
                        "py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all border",
                        qa.highlight
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent hover:from-green-600 hover:to-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Live Preview Card */}
            {jumlahBayarNum > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border-2 transition-all animate-fadeIn",
                sisaSetelahBayar <= 0
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300"
                  : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      sisaSetelahBayar <= 0 ? "bg-green-100" : "bg-blue-100"
                    )}>
                      {sisaSetelahBayar <= 0 ? (
                        <CheckCircle2 size={14} className="text-green-600" />
                      ) : (
                        <TrendingUp size={14} className="text-blue-600" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wide",
                      sisaSetelahBayar <= 0 ? "text-green-800" : "text-blue-800"
                    )}>
                      {sisaSetelahBayar <= 0 ? "Status: LUNAS" : "Sisa Setelah Bayar"}
                    </span>
                  </div>
                  <span className={cn(
                    "text-lg font-black",
                    sisaSetelahBayar <= 0 ? "text-green-700" : "text-blue-700"
                  )}>
                    {sisaSetelahBayar <= 0 ? "✓" : `Rp ${formatRupiah(sisaSetelahBayar)}`}
                  </span>
                </div>

                {sisaSetelahBayar <= 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-green-600" />
                    <p className="text-[10px] text-green-700 font-medium">
                      Status detail otomatis berubah menjadi "Selesai"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tanggal Bayar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide items-center gap-1.5">
                <Calendar size={13} className="text-indigo-600" />
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                value={tanggalBayar}
                onChange={(e) => {
                  setTanggalBayar(e.target.value);
                  setErrors((er) => ({ ...er, tanggalBayar: undefined }));
                }}
                max={new Date().toISOString().split("T")[0]}
                className={cn(
                  "w-full px-3 py-2.5 border-2 rounded-xl focus:outline-none text-sm font-medium transition-all",
                  errors.tanggalBayar
                    ? "border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50"
                    : "border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                )}
                disabled={isSubmitting}
              />
              {errors.tanggalBayar && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.tanggalBayar}
                </p>
              )}
            </div>

            {/* Riwayat Pembayaran */}
            {detail.pembayarans && detail.pembayarans.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-slate-200 rounded-lg">
                    <Receipt size={12} className="text-slate-600" />
                  </div>
                  <div className="flex items-center justify-between flex-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Riwayat Pembayaran
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                      {detail.pembayarans.length} transaksi
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {detail.pembayarans.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={12} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900">
                            Rp {formatRupiah(p.jumlah_bayar)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {formatTanggal(p.tanggal_bayar, "short")}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
          {/* Summary Strip */}
          <div className="px-5 sm:px-6 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total yang akan dibayar:</span>
            <span className={cn(
              "text-sm font-bold",
              jumlahBayarNum > 0 ? "text-green-700" : "text-slate-400"
            )}>
              Rp {formatRupiah(jumlahBayarNum)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="px-5 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
            <button
              onClick={closePembayaranModal}
              className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !jumlahBayarNum}
              className={cn(
                "flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                justCompleted
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Memproses...</span></>
              ) : justCompleted ? (
                <><CheckCircle2 className="w-4 h-4" /> Berhasil!</>
              ) : (
                <>
                  <Wallet size={16} />
                  <span>Simpan Pembayaran</span>
                  <span className="hidden sm:inline font-mono text-xs opacity-90">
                    ↵ Enter
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1a1; }
      `}</style>
    </div>
  );
};

export default PembayaranModal;