import { useState, useEffect, useMemo, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import {
  X, Wallet, Loader2, AlertCircle, Receipt, CheckCircle2,
  Calendar, TrendingUp, Package, Sparkles,
} from "lucide-react";
import { usePesananModals } from "../../../lib/zustand/pesananStore";
import { useCreatePembayaranPesanan, useCompletePesananDetail } from "../../../hooks/usePesanan";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { masterKeys } from "../../../hooks/useMasterData";
import { formatRupiah, unformatRupiah, formatProductName, formatTanggal, PESANAN_STATUS_MAP } from "./utils/pesananUtils";
import { cn } from "../../../lib/utils";

const PembayaranPesananModal = () => {
  const { modals, selectedDetail, closePembayaranModal } = usePesananModals();
  const createMut = useCreatePembayaranPesanan();
  const completeMut = useCompletePesananDetail();
  const { success, info } = useConfirmDialog();
  const queryClient = useQueryClient();

  const [jumlahBayar, setJumlahBayar] = useState("");
  const [tanggalBayar, setTanggalBayar] = useState(new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState({});
  const [justCompleted, setJustCompleted] = useState(false);

  const quickAmounts = useMemo(() => [
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.50 },
    { label: "75%", value: 0.75 },
    { label: "100%", value: 1.00, highlight: true },
  ], []);

  useEffect(() => {
    if (modals.pembayaran && selectedDetail) {
      const sisa = Number(selectedDetail.sisa_tagihan) || Number(selectedDetail.subtotal) || 0;
      setJumlahBayar(String(sisa));
      setTanggalBayar(new Date().toISOString().split("T")[0]);
      setErrors({});
      setJustCompleted(false);
    }
  }, [modals.pembayaran, selectedDetail]);

  const isOpen = modals.pembayaran && !!selectedDetail;
  const isSubmitting = createMut.isPending || completeMut.isPending;
  const detail = selectedDetail;
  const subtotal = detail ? Number(detail.subtotal) || 0 : 0;
  const totalBayar = detail ? Number(detail.total_bayar) || 0 : 0;
  const sisaTagihan = subtotal - totalBayar;
  const jumlahBayarNum = unformatRupiah(jumlahBayar);
  const sisaSetelahBayar = sisaTagihan - jumlahBayarNum;

  const progressPercent = subtotal > 0 ? Math.min(((totalBayar + jumlahBayarNum) / subtotal) * 100, 100) : 0;

  const activeQuickPercent = useMemo(() => {
    if (!detail || jumlahBayarNum <= 0) return null;
    const sisa = subtotal - totalBayar;
    if (sisa <= 0) return null;
    for (const qa of quickAmounts) {
      if (Math.abs(jumlahBayarNum - Math.round(sisa * qa.value)) <= 1) return qa.value;
    }
    return null;
  }, [detail, jumlahBayarNum, subtotal, totalBayar, quickAmounts]);

  const setQuickAmount = useCallback((percentage) => {
    const sisa = subtotal - totalBayar;
    setJumlahBayar(String(Math.round(sisa * percentage)));
    setErrors((er) => ({ ...er, jumlahBayar: undefined }));
  }, [subtotal, totalBayar]);

  // ✅ FIXED: Gunakan setQueryData dengan UPDATER FUNCTION
  // Ini memastikan kita selalu menggunakan data TERBARU dari cache
  const updatePesananCache = useCallback((detailId, jumlahBayarBaru, tglBayar) => {
    const queryCache = queryClient.getQueryCache();
    const pesananQueries = queryCache.findAll({ queryKey: masterKeys.pesanan.all, exact: false });

    pesananQueries.forEach((query) => {
      // ✅ Gunakan updater function (oldData) => ... 
      // Ini menghindarkan race condition dengan refetch
      queryClient.setQueryData(query.queryKey, (oldData) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: oldData.data.map((pesanan) => {
            const detailIndex = pesanan.details?.findIndex((d) => d.id === detailId);
            if (detailIndex === -1 || detailIndex === undefined) return pesanan;

            const updatedDetails = [...pesanan.details];
            const d = updatedDetails[detailIndex];

            // Cek apakah pembayaran ini sudah ada (hindari duplikasi)
            const existingPembayaran = (d.pembayarans || []).find(
              (p) => p.jumlah_bayar === jumlahBayarBaru && p.tanggal_bayar === tglBayar
            );
            
            let updatedPembayarans = d.pembayarans || [];
            if (!existingPembayaran) {
              const newPembayaran = {
                id: Date.now() + Math.random(), // Unique temp ID
                transaksi_detail_id: detailId,
                jumlah_bayar: jumlahBayarBaru,
                tanggal_bayar: tglBayar,
              };
              updatedPembayarans = [...updatedPembayarans, newPembayaran];
            }

            const newTotalBayar = updatedPembayarans.reduce(
              (sum, p) => sum + Number(p.jumlah_bayar || 0), 0
            );
            const newSisaTagihan = Math.max(Number(d.subtotal || 0) - newTotalBayar, 0);

            updatedDetails[detailIndex] = {
              ...d,
              pembayarans: updatedPembayarans,
              total_bayar: newTotalBayar,
              sisa_tagihan: newSisaTagihan,
              status_transaksi_id: newSisaTagihan <= 0 
                ? PESANAN_STATUS_MAP.SELESAI 
                : d.status_transaksi_id,
            };

            return {
              ...pesanan,
              details: updatedDetails,
              sisa_tagihan: updatedDetails.reduce(
                (sum, det) => sum + Number(det.sisa_tagihan || 0), 0
              ),
            };
          }),
        };
      });
    });
  }, [queryClient]);

  const handleSubmit = useCallback(async () => {
    if (!detail) return;
    if (!jumlahBayarNum || jumlahBayarNum <= 0) { 
      setErrors({ jumlahBayar: "Jumlah harus > 0" }); 
      return; 
    }
    if (jumlahBayarNum > sisaTagihan) { 
      setErrors({ jumlahBayar: `Maksimum Rp ${formatRupiah(sisaTagihan)}` }); 
      return; 
    }
    if (!tanggalBayar) { 
      setErrors({ tanggalBayar: "Wajib diisi" }); 
      return; 
    }

    try {
      setJustCompleted(true);

      // 1. POST ke server DULU
      await createMut.mutateAsync({
        transaksi_detail_id: detail.id,
        jumlah_bayar: jumlahBayarNum,
        tanggal_bayar: tanggalBayar,
      });

      // 2. Optimistic update SETELAH POST berhasil
      // Gunakan updater function agar selalu pakai data terbaru
      updatePesananCache(detail.id, jumlahBayarNum, tanggalBayar);

      // 3. Jika lunas, update status
      if (sisaSetelahBayar <= 0) {
        try { 
          await completeMut.mutateAsync(detail.id); 
        } catch (e) {
          console.warn('Complete failed, but payment recorded:', e);
        }
      }

      // 4. Close modal & show success
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
  }, [
    detail, jumlahBayarNum, sisaTagihan, sisaSetelahBayar, tanggalBayar,
    createMut, completeMut, closePembayaranModal, success, info, updatePesananCache
  ]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && isOpen && !isSubmitting) { 
        e.preventDefault(); 
        handleSubmit(); 
      }
      if (e.key === "Escape" && isOpen && !isSubmitting) closePembayaranModal();
    };
    if (isOpen) { 
      document.addEventListener("keydown", handleKeyDown); 
      return () => document.removeEventListener("keydown", handleKeyDown); 
    }
  }, [isOpen, isSubmitting, handleSubmit, closePembayaranModal]);

  if (!isOpen || !selectedDetail) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn" 
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && closePembayaranModal()}
    >
      <div className={cn(
        "bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[95vh] flex flex-col", 
        justCompleted && "ring-2 ring-green-500"
      )}>
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-green-50 via-emerald-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Input Pembayaran Pesanan</h2>
              <p className="text-[11px] text-slate-500">Catat pembayaran untuk detail pesanan</p>
            </div>
          </div>
          <button 
            onClick={closePembayaranModal} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Product Info */}
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

            {/* Summary */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-white rounded-2xl p-4 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                <Receipt size={14} className="text-amber-700" />
                <span className="text-xs font-bold text-amber-900 uppercase">Ringkasan</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-amber-800">Total Tagihan</span>
                  <span className="text-sm font-semibold">Rp {formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-amber-800">Sudah Dibayar</span>
                  <span className="text-sm font-semibold text-green-700">Rp {formatRupiah(totalBayar)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-200/60">
                  <span className="text-sm font-bold text-amber-900">Sisa Tagihan</span>
                  <span className="text-lg font-bold text-amber-900">Rp {formatRupiah(sisaTagihan)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[10px] text-amber-700 font-medium">Progress</span>
                  <span className="text-[10px] font-bold text-amber-900">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500", 
                      progressPercent >= 100 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                        : "bg-gradient-to-r from-amber-500 to-orange-500"
                    )} 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Jumlah Bayar */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Jumlah Bayar <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
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
                    "w-full pl-12 pr-4 py-3 border-2 rounded-xl text-base font-bold", 
                    errors.jumlahBayar 
                      ? "border-red-300 bg-red-50" 
                      : "border-slate-200 focus:ring-2 focus:ring-green-500"
                  )} 
                  placeholder="0" 
                  autoFocus 
                  disabled={isSubmitting} 
                />
              </div>
              {errors.jumlahBayar && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.jumlahBayar}
                </p>
              )}

              {sisaTagihan > 0 && (
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {quickAmounts.map((qa) => {
                    const isActive = activeQuickPercent === qa.value;
                    return (
                      <button 
                        key={qa.label} 
                        type="button" 
                        onClick={() => setQuickAmount(qa.value)} 
                        disabled={isSubmitting} 
                        className={cn(
                          "py-1.5 px-2 text-[11px] font-semibold rounded-lg transition-all border relative", 
                          isActive 
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-transparent shadow-md scale-105" 
                            : qa.highlight 
                              ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200" 
                              : "bg-white text-slate-700 border-slate-200"
                        )}
                      >
                        {qa.label}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-green-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live Preview */}
            {jumlahBayarNum > 0 && (
              <div className={cn(
                "rounded-2xl p-4 border-2", 
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
                      {sisaSetelahBayar <= 0 
                        ? <CheckCircle2 size={14} className="text-green-600" /> 
                        : <TrendingUp size={14} className="text-blue-600" />
                      }
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase", 
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
                      Status otomatis berubah ke "Selesai"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
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
                  "w-full px-3 py-2.5 border-2 rounded-xl text-sm font-medium", 
                  errors.tanggalBayar 
                    ? "border-red-300 bg-red-50" 
                    : "border-slate-200 focus:ring-2 focus:ring-green-500"
                )} 
                disabled={isSubmitting} 
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0">
          <div className="px-5 sm:px-6 py-2 bg-white border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total yang akan dibayar:</span>
            <span className={cn(
              "text-sm font-bold", 
              jumlahBayarNum > 0 ? "text-green-700" : "text-slate-400"
            )}>
              Rp {formatRupiah(jumlahBayarNum)}
            </span>
          </div>
          <div className="px-5 sm:px-6 py-3 flex gap-2">
            <button 
              onClick={closePembayaranModal} 
              className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" 
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !jumlahBayarNum} 
              className={cn(
                "flex-[2] px-6 py-3 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all", 
                justCompleted 
                  ? "bg-gradient-to-r from-green-500 to-emerald-500" 
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Memproses...</span>
                </>
              ) : justCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Berhasil!
                </>
              ) : (
                <>
                  <Wallet size={16} />
                  <span>Simpan Pembayaran</span>
                  <span className="hidden sm:inline font-mono text-xs opacity-90">↵</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PembayaranPesananModal;