import { useEffect, useCallback, useState } from "react";
import { X, Tag, Package, Warehouse, Calendar, Pencil, Image as ImageIcon, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useProductModals } from "../../../lib/zustand/productStore";
import { cn } from "../../../lib/utils";

const ASSET_URL = import.meta.env.VITE_ASSET_URL || '';
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value || 0);

const ProductDetail = () => {
  const { modals, selectedProduct, closeAllModals, openEditModal } = useProductModals();
  const isOpen = modals.detail;

  // ✅ STATE LIGHTBOX
  const [lightboxImage, setLightboxImage] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ✅ HOOKS - SEMUA HARUS DI ATAS, SEBELUM EARLY RETURN
  
  const handleEscKey = useCallback((e) => {
    if (e.key === "Escape" && isOpen) closeAllModals();
  }, [isOpen, closeAllModals]);

  // ✅ Pindahkan komputasi fotoUrls ke atas (dengan fallback array kosong)
  const fotoUrls = selectedProduct
    ? [
        selectedProduct.foto_depan_url || (selectedProduct.foto_depan ? `${ASSET_URL}/storage/${selectedProduct.foto_depan}` : null),
        selectedProduct.foto_samping_url || (selectedProduct.foto_samping ? `${ASSET_URL}/storage/${selectedProduct.foto_samping}` : null),
        selectedProduct.foto_atas_url || (selectedProduct.foto_atas ? `${ASSET_URL}/storage/${selectedProduct.foto_atas}` : null),
      ].filter(Boolean)
    : [];

  const nextImage = useCallback(() => {
    if (fotoUrls.length === 0) return;
    const nextIdx = (lightboxIndex + 1) % fotoUrls.length;
    setLightboxIndex(nextIdx);
    setLightboxImage(fotoUrls[nextIdx]);
  }, [lightboxIndex, fotoUrls]);

  const prevImage = useCallback(() => {
    if (fotoUrls.length === 0) return;
    const prevIdx = (lightboxIndex - 1 + fotoUrls.length) % fotoUrls.length;
    setLightboxIndex(prevIdx);
    setLightboxImage(fotoUrls[prevIdx]);
  }, [lightboxIndex, fotoUrls]);

  // ✅ useEffect untuk modal utama
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

  // ✅ useEffect untuk lightbox keyboard
  useEffect(() => {
    if (!lightboxImage) return;

    const handleLightboxKey = (e) => {
      if (e.key === "Escape") setLightboxImage(null);
      if (e.key === "ArrowRight" && fotoUrls.length > 1) nextImage();
      if (e.key === "ArrowLeft" && fotoUrls.length > 1) prevImage();
    };

    document.addEventListener("keydown", handleLightboxKey);
    return () => document.removeEventListener("keydown", handleLightboxKey);
  }, [lightboxImage, fotoUrls.length, nextImage, prevImage]);

  // ✅ EARLY RETURN - DILETAKKAN SETELAH SEMUA HOOKS
  if (!isOpen || !selectedProduct) return null;

  const qtyToko = Number(selectedProduct.qty_toko) || 0;
  const qtyBengkel = Number(selectedProduct.qty_bengkel) || 0;
  const totalQty = qtyToko + qtyBengkel;

  const handleEdit = () => {
    closeAllModals();
    setTimeout(() => openEditModal(selectedProduct), 150);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) closeAllModals();
  };

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxImage(fotoUrls[idx]);
  };

  const closeLightbox = () => setLightboxImage(null);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[85vh] flex flex-col">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 px-5 py-3.5 border-b border-slate-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm flex-shrink-0">
                <Package className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 truncate">Detail Product</h2>
            </div>
            <button
              onClick={closeAllModals}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"
            >
              <X className="w-4 h-4 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* ✅ Photo Gallery - INTERACTIVE */}
            <div className="px-5 pt-5 pb-3">
              {fotoUrls.length > 0 ? (
                <div className="flex justify-center gap-3">
                  {fotoUrls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => openLightbox(idx)}
                      className="group/thumb relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      title="Klik untuk perbesar"
                      type="button"
                    >
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                  <ImageIcon className="w-8 h-8 text-slate-300" />
                </div>
              )}
              {fotoUrls.length > 0 && (
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  💡 Klik foto untuk memperbesar
                </p>
              )}
            </div>

            {/* Product Info */}
            <div className="px-5 pb-4 text-center">
              <h3 className="text-xl font-bold text-slate-900">{selectedProduct.kode}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {[selectedProduct.jenis?.nama, selectedProduct.type?.nama, selectedProduct.bahan?.nama, selectedProduct.ukuran]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>

            {/* Price & Stock Cards */}
            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <p className="text-xs text-emerald-600 font-medium mb-1">Harga Umum</p>
                <p className="text-lg font-bold text-emerald-700">{formatRupiah(selectedProduct.harga_umum)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Stok</p>
                <p className={cn("text-lg font-bold", totalQty < 20 ? "text-red-600" : "text-blue-700")}>
                  {totalQty} Unit
                </p>
              </div>
            </div>

            {/* Detail Items */}
            <div className="px-5 pb-5 space-y-2">
              <InfoItem
                icon={Tag}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                label="Spesifikasi"
                value={`${selectedProduct.jenis?.nama || "-"} ${selectedProduct.type?.nama ? `- ${selectedProduct.type.nama}` : ""} ${selectedProduct.bahan?.nama ? `(${selectedProduct.bahan.nama})` : ""} | ${selectedProduct.ukuran}`}
              />

              <div className="grid grid-cols-2 gap-2">
                <InfoItem icon={Warehouse} iconBg="bg-amber-100" iconColor="text-amber-600" label="Stok Toko" value={String(qtyToko)} compact />
                <InfoItem icon={Warehouse} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="Stok Bengkel" value={String(qtyBengkel)} compact />
              </div>

              {selectedProduct.keterangan && (
                <InfoItem
                  icon={Calendar}
                  iconBg="bg-slate-100"
                  iconColor="text-slate-600"
                  label="Keterangan"
                  value={selectedProduct.keterangan}
                  breakAll
                />
              )}
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="sticky bottom-0 px-5 py-3.5 border-t border-slate-200/60 bg-white flex gap-2 flex-shrink-0">
            <button
              onClick={closeAllModals}
              className="flex-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95"
            >
              Tutup
            </button>
            <button
              onClick={handleEdit}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* ✅ LIGHTBOX MODAL - FULLSCREEN IMAGE VIEW  */}
      {/* ========================================== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fadeIn"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Preview gambar produk"
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Tutup preview"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            {lightboxIndex + 1} / {fotoUrls.length}
          </div>

          {/* Prev Button */}
          {fotoUrls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next Button */}
          {fotoUrls.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Foto berikutnya"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Main Image */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={lightboxImage}
              src={lightboxImage}
              alt={`Preview foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-modalIn"
            />
          </div>

          {/* Bottom Thumbnails */}
          {fotoUrls.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {fotoUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); openLightbox(idx); }}
                  className={cn(
                    "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                    idx === lightboxIndex
                      ? "border-white scale-110 shadow-lg"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

const InfoItem = ({ icon: Icon, iconBg, iconColor, label, value, breakAll, compact }) => (
  <div className={cn("flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg transition-colors group", compact && "py-2")}>
    <div className={cn("rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform", iconBg, compact ? "p-1" : "p-1.5")}>
      <Icon className={cn(iconColor, compact ? "w-3 h-3" : "w-3.5 h-3.5")} />
    </div>
    <div className="flex-1 min-w-0">
      <p className={cn("text-slate-500 font-medium uppercase tracking-wide", compact ? "text-[9px]" : "text-[11px]")}>{label}</p>
      <p className={cn("font-medium text-slate-900", compact ? "text-xs" : "text-sm", breakAll ? "break-all" : "truncate")}>{value}</p>
    </div>
  </div>
);

export default ProductDetail;