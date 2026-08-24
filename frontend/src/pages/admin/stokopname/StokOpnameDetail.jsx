import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X, Printer, CheckCircle, XCircle, Loader2, AlertCircle,
  Package, Calendar, User, Warehouse, Sparkles, Edit3,
} from "lucide-react";
import { useStokOpnameModals } from "../../../lib/zustand/stokOpnameStore";
import {
  useUpdateDetailStokOpname,
  useSelesaiStokOpname,
  useBatalkanStokOpname,
  useStokOpnameDetail,
} from "../../../hooks/useStokOpname";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { useIsAdmin } from "../../../lib/zustand/authStore";
import { printStokOpname } from "./utils/printStokOpname";
// ✅ FIX: Import utility dari utils file, BUKAN dari store
import {
  normalizeDetails,
  sortDetailsByPlace,
  formatProductName,
  getOpnameLabel,
} from "./utils/stokOpnameUtils";
import { cn } from "../../../lib/utils";

// ==========================================
// INPUT STOK MODAL
// ==========================================
const InputStokModal = ({ opnameId, detail, onClose, onUpdate }) => {
  const updateMut = useUpdateDetailStokOpname();
  const { success, info } = useConfirmDialog();

  const [stokReal, setStokReal] = useState(detail?.stok_real ?? "");
  const [keterangan, setKeterangan] = useState(detail?.keterangan ?? "");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (detail) {
      setStokReal(detail.stok_real ?? "");
      setKeterangan(detail.keterangan ?? "");
      setErrors({});
    }
  }, [detail]);

  if (!detail) return null;

  const selisihPreview = stokReal !== "" && stokReal !== null
    ? Number(stokReal) - Number(detail.stok_sistem)
    : null;

  const handleSubmit = async () => {
    if (stokReal === "" || stokReal === null) {
      setErrors({ stokReal: "Stok fisik wajib diisi" });
      return;
    }
    const realNum = Number(stokReal);
    if (isNaN(realNum) || realNum < 0) {
      setErrors({ stokReal: "Stok fisik harus ≥ 0" });
      return;
    }

    try {
      await updateMut.mutateAsync({
        opnameId,
        data: {
          inventory_id: detail.inventory_id,
          stok_real: realNum,
          keterangan: keterangan.trim() || null,
        },
      });
      onUpdate();
      onClose();
      await success("Berhasil!", "Stok fisik berhasil disimpan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  // ✅ Normalize product & place
  const product = detail.product || detail.inventory?.product;
  const place = detail.place || detail.inventory?.place;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Input Stok Fisik</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={updateMut.isPending}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200/60">
            <p className="font-mono font-bold text-xs text-indigo-700 mb-1 tracking-wide">
              {product?.kode || "-"}
            </p>
            <p className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2">
              {formatProductName(product)}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full">
              <Warehouse size={11} className="text-slate-500" />
              <span className="text-[11px] font-medium text-slate-600">{place?.nama || "-"}</span>
            </div>
          </div>

          {/* Stok Sistem */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Package className="w-4 h-4 text-amber-700" />
              </div>
              <span className="text-sm text-amber-900 font-semibold">Stok Sistem</span>
            </div>
            <span className="text-2xl font-bold text-amber-900">{detail.stok_sistem}</span>
          </div>

          {/* Stok Real Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Stok Fisik <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={stokReal}
              onChange={(e) => { setStokReal(e.target.value); setErrors({}); }}
              className={cn(
                "w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 text-lg font-bold transition-all",
                errors.stokReal ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 focus:border-transparent"
              )}
              placeholder="0"
              autoFocus
              disabled={updateMut.isPending}
            />
            {errors.stokReal && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.stokReal}
              </p>
            )}
          </div>

          {/* Selisih Preview */}
          {selisihPreview !== null && (
            <div className={cn(
              "rounded-xl p-4 flex items-center justify-between border transition-all",
              selisihPreview > 0 ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" :
              selisihPreview < 0 ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200" :
              "bg-slate-50 border-slate-200"
            )}>
              <span className="text-sm font-semibold text-slate-700">Selisih</span>
              <span className={cn(
                "text-xl font-bold",
                selisihPreview > 0 ? "text-green-700" :
                selisihPreview < 0 ? "text-red-700" :
                "text-slate-700"
              )}>
                {selisihPreview > 0 ? "+" : ""}{selisihPreview}
              </span>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Keterangan
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none transition-all"
              placeholder="Opsional: rusak, hilang, dll"
              disabled={updateMut.isPending}
              maxLength={255}
            />
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex gap-2.5 bg-white/95 backdrop-blur-sm flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors" disabled={updateMut.isPending}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMut.isPending}
            className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/30 active:scale-[0.98]"
          >
            {updateMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><CheckCircle className="w-4 h-4" /> Simpan</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MAIN DETAIL MODAL
// ==========================================
const StokOpnameDetail = () => {
  const { modals, selectedOpname, closeAllModals, openInputStokModal, closeInputStokModal, selectedDetail } = useStokOpnameModals();
  const selesaiMut = useSelesaiStokOpname();
  const batalMut = useBatalkanStokOpname();
  const { success, danger, info, warning } = useConfirmDialog();
  const isAdmin = useIsAdmin();

  const isOpen = modals.detail && !!selectedOpname;

  const { data: opnameDetail, refetch } = useStokOpnameDetail(selectedOpname?.id);
  const opname = opnameDetail || selectedOpname;

  const handleEscKey = useCallback((e) => {
    if (e.key === "Escape" && isOpen && !modals.inputStok) closeAllModals();
  }, [isOpen, closeAllModals, modals.inputStok]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscKey]);

  const details = useMemo(
    () => sortDetailsByPlace(opname?.details || []),
    [opname?.details]
  );

  const totalItems = details.length;
  const filledItems = details.filter((d) => d.stok_real !== null && d.stok_real !== undefined).length;
  const unfilledItems = totalItems - filledItems;
  const progress = totalItems > 0 ? (filledItems / totalItems) * 100 : 0;

  const handleSelesai = async () => {
    if (unfilledItems > 0) {
      const confirmed = await warning(
        "Item Belum Lengkap",
        `${unfilledItems} item belum diisi stok fisiknya. Lanjutkan selesaikan opname?`,
        "Ya, Selesaikan",
        "Batal"
      );
      if (!confirmed) return;
    } else {
      const confirmed = await danger(
        "Selesaikan Opname?",
        "Setelah diselesaikan, data tidak bisa diubah lagi. Stok akan disesuaikan otomatis.",
        "Ya, Selesaikan",
        "Batal"
      );
      if (!confirmed) return;
    }

    try {
      await selesaiMut.mutateAsync(opname.id);
      closeAllModals();
      await success("Berhasil!", "Stok opname diselesaikan dan stok disesuaikan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleBatalkan = async () => {
    const confirmed = await danger(
      "Batalkan Opname?",
      "Semua data pada opname ini akan dibatalkan dan tidak dapat dipulihkan.",
      "Ya, Batalkan",
      "Tidak"
    );
    if (!confirmed) return;

    try {
      await batalMut.mutateAsync(opname.id);
      closeAllModals();
      await success("Dibatalkan", "Stok opname berhasil dibatalkan");
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !modals.inputStok) closeAllModals();
  };

  if (!isOpen || !opname) return null;

  const isDraft = opname.status === "draft";
  const statusConfig = {
    draft: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200", label: "Draft" },
    selesai: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200", label: "Selesai" },
    dibatalkan: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200", label: "Dibatalkan" },
  };
  const statusCfg = statusConfig[opname.status] || statusConfig.draft;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full sm:max-w-6xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {getOpnameLabel(opname)}
                  </h2>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1",
                    statusCfg.bg, statusCfg.text, statusCfg.ring
                  )}>
                    {statusCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(opname.tgl_opname).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {opname.user?.name || "-"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeAllModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group flex-shrink-0">
              <X className="w-5 h-5 text-slate-500 group-hover:rotate-90 transition-all duration-200" />
            </button>
          </div>

          {/* Stats Bar (only for draft) */}
          {isDraft && (
            <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Package size={13} className="text-slate-400" />
                    <span className="text-slate-600">Total: <strong className="text-slate-900">{totalItems}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-500" />
                    <span className="text-slate-600">Terisi: <strong className="text-green-700">{filledItems}</strong></span>
                  </div>
                  {unfilledItems > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={13} className="text-amber-500" />
                      <span className="text-slate-600">Belum: <strong className="text-amber-700">{unfilledItems}</strong></span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    progress === 100 ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            {details.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Tidak ada item dalam opname ini</p>
                <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah opname dibuat</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {details.map((d) => {
                  // ✅ Normalize product & place
                  const product = d.product || d.inventory?.product;
                  const place = d.place || d.inventory?.place;

                  const hasStokReal = d.stok_real !== null && d.stok_real !== undefined;
                  const selisih = Number(d.selisih) || 0;
                  const isClickable = isDraft;

                  return (
                    <div
                      key={d.id}
                      onClick={() => isClickable && openInputStokModal({ ...d, product, place })}
                      className={cn(
                        "border rounded-2xl p-3.5 transition-all duration-300 relative overflow-hidden",
                        isClickable
                          ? "bg-white hover:border-indigo-300 hover:shadow-lg cursor-pointer group active:scale-[0.98]"
                          : "bg-slate-50"
                      )}
                    >
                      {/* Progress indicator di top */}
                      {hasStokReal && (
                        <div className={cn(
                          "absolute top-0 left-0 right-0 h-0.5",
                          selisih === 0 ? "bg-slate-300" :
                          selisih > 0 ? "bg-gradient-to-r from-green-400 to-emerald-500" :
                          "bg-gradient-to-r from-red-400 to-rose-500"
                        )} />
                      )}

                      {/* Product Info */}
                      <div className="mb-2.5">
                        <p className="font-mono font-bold text-[10px] text-indigo-600 truncate tracking-wide">
                          {product?.kode || "-"}
                        </p>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[32px] leading-tight mt-1">
                          {formatProductName(product)}
                        </p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full mt-1.5">
                          <Warehouse size={9} className="text-slate-500" />
                          <span className="text-[10px] font-medium text-slate-600">
                            {place?.nama || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Sistem</span>
                          <span className="font-semibold text-slate-900">{d.stok_sistem}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Fisik</span>
                          <span className={cn(
                            "font-bold",
                            hasStokReal ? "text-indigo-700" : "text-slate-400 italic"
                          )}>
                            {hasStokReal ? d.stok_real : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Selisih</span>
                          <span className={cn(
                            "font-bold",
                            !hasStokReal ? "text-slate-400" :
                            selisih > 0 ? "text-green-600" :
                            selisih < 0 ? "text-red-600" :
                            "text-slate-700"
                          )}>
                            {!hasStokReal ? "—" : `${selisih > 0 ? "+" : ""}${selisih}`}
                          </span>
                        </div>
                      </div>

                      {d.keterangan && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                          <p className="text-[10px] text-slate-500 italic line-clamp-2 text-center">
                            "{d.keterangan}"
                          </p>
                        </div>
                      )}

                      {isClickable && !hasStokReal && (
                        <div className="mt-2.5 pt-2.5 border-t border-dashed border-indigo-200 text-center group-hover:bg-indigo-50/50 transition-colors -mx-3.5 px-3.5 -mb-3.5 pb-3 rounded-b-2xl">
                          <span className="text-[11px] text-indigo-600 font-bold group-hover:underline flex items-center justify-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Input Stok Fisik
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2 bg-white/95 backdrop-blur-sm flex-shrink-0">
            <button
              onClick={() => printStokOpname(opname, isDraft ? "draft" : "riwayat")}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={closeAllModals} className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Tutup
            </button>

            {isDraft && isAdmin && (
              <>
                <div className="flex-1" />
                <button
                  onClick={handleBatalkan}
                  disabled={batalMut.isPending || selesaiMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50 border border-red-200"
                >
                  {batalMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Batalkan
                </button>
                <button
                  onClick={handleSelesai}
                  disabled={selesaiMut.isPending || batalMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 active:scale-[0.98]"
                >
                  {selesaiMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Selesaikan
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modal for input stok */}
      {modals.inputStok && selectedDetail && (
        <InputStokModal
          opnameId={opname.id}
          detail={selectedDetail}
          onClose={closeInputStokModal}
          onUpdate={() => refetch()}
        />
      )}
    </>
  );
};

export default StokOpnameDetail;