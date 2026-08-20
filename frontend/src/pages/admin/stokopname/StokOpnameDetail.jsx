import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X, Printer, CheckCircle, XCircle, Loader2, AlertCircle,
  Package, Calendar, User, Edit3, Warehouse,
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
import { cn } from "../../../lib/utils";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(" • ") || "-";
};

// Sort BENGKEL first, then TOKO, then others
const sortDetailsByPlace = (details) => {
  const getPriority = (kode) => {
    if (kode === "BENGKEL") return 0;
    if (kode === "TOKO") return 1;
    return 2;
  };
  return [...details].sort((a, b) => {
    const prioA = getPriority(a.inventory?.place?.kode);
    const prioB = getPriority(b.inventory?.place?.kode);
    return prioA - prioB;
  });
};

// ==========================================
// INPUT STOK MODAL (sub-modal)
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">Input Stok Fisik</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={updateMut.isPending}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Product Info */}
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="font-mono font-bold text-xs text-indigo-700 mb-1">{detail.product?.kode || "-"}</p>
            <p className="text-sm font-medium text-slate-800 mb-1">{formatProductName(detail.product)}</p>
            <p className="text-xs text-slate-500">📍 {detail.place?.nama || "-"}</p>
          </div>

          {/* Stok Sistem */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-amber-800 font-medium">Stok Sistem</span>
            <span className="text-lg font-bold text-amber-900">{detail.stok_sistem}</span>
          </div>

          {/* Stok Real Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Stok Fisik <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={stokReal}
              onChange={(e) => { setStokReal(e.target.value); setErrors({}); }}
              className={cn(
                "w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium",
                errors.stokReal ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
              )}
              placeholder="0"
              autoFocus
              disabled={updateMut.isPending}
            />
            {errors.stokReal && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.stokReal}
              </p>
            )}
          </div>

          {/* Selisih Preview */}
          {selisihPreview !== null && (
            <div className={cn(
              "rounded-lg p-3 flex items-center justify-between border",
              selisihPreview > 0 ? "bg-green-50 border-green-200" :
              selisihPreview < 0 ? "bg-red-50 border-red-200" :
              "bg-slate-50 border-slate-200"
            )}>
              <span className="text-sm font-medium">Selisih</span>
              <span className={cn(
                "text-lg font-bold",
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              placeholder="Opsional"
              disabled={updateMut.isPending}
              maxLength={255}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-white">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={updateMut.isPending}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateMut.isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {updateMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan"}
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

  // Fetch detail untuk memastikan data fresh
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

  const sortedDetails = useMemo(
    () => sortDetailsByPlace(opname?.details || []),
    [opname?.details]
  );

  const totalItems = sortedDetails.length;
  const filledItems = sortedDetails.filter((d) => d.stok_real !== null && d.stok_real !== undefined).length;
  const unfilledItems = totalItems - filledItems;
  const totalSelisih = sortedDetails.reduce((sum, d) => sum + (Number(d.selisih) || 0), 0);

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

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate">
                  {opname.keterangan || `JRS/SO/${new Date(opname.tgl_opname).getFullYear()}/${String(new Date(opname.tgl_opname).getMonth() + 1).padStart(2, "0")}/${opname.id}`}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(opname.tgl_opname).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {opname.user?.name || "-"}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-medium",
                    opname.status === "draft" ? "bg-amber-100 text-amber-700" :
                    opname.status === "selesai" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {opname.status === "draft" ? "Draft" : opname.status === "selesai" ? "Selesai" : "Dibatalkan"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeAllModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group flex-shrink-0">
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
            </button>
          </div>

          {/* Stats Bar (only for draft) */}
          {isDraft && (
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-4 text-xs flex-wrap flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Package size={14} className="text-slate-400" />
                <span className="text-slate-600">Total: <strong className="text-slate-900">{totalItems}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-slate-600">Terisi: <strong className="text-green-700">{filledItems}</strong></span>
              </div>
              {unfilledItems > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="text-amber-500" />
                  <span className="text-slate-600">Belum: <strong className="text-amber-700">{unfilledItems}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Details Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {sortedDetails.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Tidak ada item dalam opname ini</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sortedDetails.map((d) => {
                  const hasStokReal = d.stok_real !== null && d.stok_real !== undefined;
                  const selisih = Number(d.selisih) || 0;
                  const isClickable = isDraft;

                  return (
                    <div
                      key={d.id}
                      onClick={() => isClickable && openInputStokModal({
                        ...d,
                        product: d.product || d.inventory?.product,
                        place: d.place || d.inventory?.place,
                      })}
                      className={cn(
                        "border rounded-xl p-3 transition-all",
                        isClickable
                          ? "bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer group"
                          : "bg-slate-50"
                      )}
                    >
                      {/* Product Info */}
                      <div className="text-center mb-2">
                        <p className="font-mono font-bold text-[10px] text-indigo-600 truncate">
                          {d.product?.kode || d.inventory?.product?.kode || "-"}
                        </p>
                        <p className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-tight mt-1">
                          {formatProductName(d.product || d.inventory?.product)}
                        </p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full mt-1.5">
                          <Warehouse size={10} className="text-slate-500" />
                          <span className="text-[10px] font-medium text-slate-600">
                            {d.place?.nama || d.inventory?.place?.nama || "-"}
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Sistem</span>
                          <span className="font-medium text-slate-900">{d.stok_sistem}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Fisik</span>
                          <span className={cn(
                            "font-semibold",
                            hasStokReal ? "text-indigo-700" : "text-slate-400 italic"
                          )}>
                            {hasStokReal ? d.stok_real : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Selisih</span>
                          <span className={cn(
                            "font-semibold",
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
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="text-[10px] text-slate-500 italic line-clamp-2 text-center">
                            "{d.keterangan}"
                          </p>
                        </div>
                      )}

                      {isClickable && !hasStokReal && (
                        <div className="mt-2 pt-2 border-t border-dashed border-slate-200 text-center">
                          <span className="text-[10px] text-indigo-600 font-medium group-hover:underline">
                            + Input Stok Fisik
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
          <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap gap-2 bg-white flex-shrink-0">
            <button
              onClick={() => printStokOpname(opname, "draft")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={closeAllModals} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              Tutup
            </button>

            {isDraft && isAdmin && (
              <>
                <div className="flex-1" />
                <button
                  onClick={handleBatalkan}
                  disabled={batalMut.isPending || selesaiMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {batalMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Batalkan
                </button>
                <button
                  onClick={handleSelesai}
                  disabled={selesaiMut.isPending || batalMut.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
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