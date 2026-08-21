import { useState, useEffect } from 'react';
import { X, Loader2, Camera, Upload } from 'lucide-react';
import { useProductionModals } from '../../../lib/zustand/productionStore';
import { useUploadProductPhotos, useUpdateProductionStatus } from '../../../hooks/useProductions';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { cn } from '../../../lib/utils';

// ==========================================
// PRODUCTION UPLOAD FOTO MODAL
// ==========================================
const ProductionUploadFotoModal = () => {
  const { modals, selectedProduction, selectedProductId, closeUploadFotoModal } = useProductionModals();
  const uploadMut = useUploadProductPhotos();
  const updateStatusMut = useUpdateProductionStatus();
  const { warning, success, info } = useConfirmDialog();

  const [fotoForm, setFotoForm] = useState({
    foto_depan: null,
    foto_samping: null,
    foto_atas: null,
  });

  const [previews, setPreviews] = useState({});
  const [errors, setErrors] = useState({});

  const isOpen = modals.uploadFoto && selectedProduction && selectedProductId;

  // Reset form saat modal buka
  useEffect(() => {
    if (isOpen) {
      setFotoForm({ foto_depan: null, foto_samping: null, foto_atas: null });
      setPreviews({});
      setErrors({});
    }
  }, [isOpen]);

  // ESC key handler + body scroll lock
  useEffect(() => {
    const handleEsc = (e) => {
      const isSubmitting = uploadMut.isPending || updateStatusMut.isPending;
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        closeUploadFotoModal();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, uploadMut.isPending, updateStatusMut.isPending, closeUploadFotoModal]);

  // Cleanup preview URLs saat unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (key, file) => {
    // Validate file size (10MB)
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors((er) => ({ ...er, [key]: 'Ukuran file maksimal 10MB' }));
      return;
    }

    // Validate file type
    if (file && !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((er) => ({ ...er, [key]: 'Format harus JPG, PNG, atau WebP' }));
      return;
    }

    // Revoke old preview
    if (previews[key]) URL.revokeObjectURL(previews[key]);

    setFotoForm({ ...fotoForm, [key]: file });
    setErrors((er) => ({ ...er, [key]: undefined }));

    if (file) {
      setPreviews({ ...previews, [key]: URL.createObjectURL(file) });
    } else {
      setPreviews((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasAny = fotoForm.foto_depan || fotoForm.foto_samping || fotoForm.foto_atas;
    if (!hasAny) {
      await warning('Validasi', 'Pilih minimal 1 foto untuk diupload.');
      return;
    }

    // Check validation errors
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      const firstError = Object.values(errors).find(Boolean);
      await warning('Validasi Gagal', firstError);
      return;
    }

    const formData = new FormData();
    if (fotoForm.foto_depan) formData.append('foto_depan', fotoForm.foto_depan);
    if (fotoForm.foto_samping) formData.append('foto_samping', fotoForm.foto_samping);
    if (fotoForm.foto_atas) formData.append('foto_atas', fotoForm.foto_atas);

    try {
      // Step 1: Upload foto
      await uploadMut.mutateAsync({
        productId: selectedProductId,
        formData,
      });

      // Step 2: Update status ke selesai
      await updateStatusMut.mutateAsync({
        id: selectedProduction,
        data: { status: 'selesai' },
      });

      await success(
        'Berhasil!',
        'Foto diupload & status produksi diubah menjadi Selesai.'
      );
      closeUploadFotoModal();
    } catch (error) {
      if (error.response?.status === 422) {
        const errorData = error.response.data?.errors || {};
        const msg = Object.values(errorData).flat().join('\n');
        await warning('Validasi Gagal', msg || error.response.data?.message || 'Data tidak valid.');
      } else {
        await info(
          'Gagal Mengupload Foto',
          error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'
        );
      }
    }
  };

  if (!isOpen) return null;

  const isSubmitting = uploadMut.isPending || updateStatusMut.isPending;
  const fields = [
    { key: 'foto_depan', label: 'Foto Depan', emoji: '📷' },
    { key: 'foto_samping', label: 'Foto Samping', emoji: '📸' },
    { key: 'foto_atas', label: 'Foto Atas', emoji: '🔝' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && closeUploadFotoModal()}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Lengkapi Foto Produk</h2>
              <p className="text-[11px] text-slate-500">Upload foto sebelum produksi diselesaikan</p>
            </div>
          </div>
          <button
            onClick={closeUploadFotoModal}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800">
              <strong>💡 Catatan:</strong> Foto akan dikompresi otomatis (WebP, max 1200px) untuk menghemat storage.
            </div>

            {/* Upload Fields */}
            {fields.map(({ key, label, emoji }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  <span>{emoji}</span>
                  <span>{label}</span>
                </label>

                {previews[key] ? (
                  <div className={cn(
                    'relative border-2 rounded-xl overflow-hidden bg-slate-50',
                    errors[key] ? 'border-red-300' : 'border-emerald-200'
                  )}>
                    <img
                      src={previews[key]}
                      alt={label}
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleFileChange(key, null)}
                      disabled={isSubmitting}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
                      title="Hapus foto"
                    >
                      <X size={12} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-[10px] text-white truncate font-medium">
                        {fotoForm[key]?.name}
                      </p>
                      <p className="text-[9px] text-white/80 truncate">
                        {(fotoForm[key]?.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <label className={cn(
                    'flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all',
                    'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50',
                    errors[key] && 'border-red-300 bg-red-50/50',
                    isSubmitting && 'opacity-50 cursor-not-allowed'
                  )}>
                    <Upload className={cn(
                      'w-6 h-6',
                      errors[key] ? 'text-red-400' : 'text-slate-400'
                    )} />
                    <div className="text-center">
                      <p className="text-xs font-medium text-slate-700">
                        Klik untuk pilih foto
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        JPG, PNG, WebP (max 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleFileChange(key, e.target.files[0])}
                      disabled={isSubmitting}
                    />
                  </label>
                )}

                {errors[key] && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <X size={10} />
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0 p-4 sm:p-5 flex gap-2 sm:gap-3">
          <button
            type="button"
            onClick={closeUploadFotoModal}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30'
            )}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
            ) : (
              <><Camera size={16} /> Upload & Selesai</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionUploadFotoModal;