import { useState, useMemo } from 'react';
import { Plus, Clock, Play, Package } from 'lucide-react';
import {
  useProductions,
  usePesananProduksi,
  useUpdateProductionStatus,
  useDeleteProduction,
} from '../../../hooks/useProductions';
import { useProductionModals, useProductionStore } from '../../../lib/zustand/productionStore';
import { useUserRole } from '../../../lib/zustand/authStore';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import ProductionCard from './ProductionCard';
import PesananCard from './PesananCard';
import ProductionForm from './ProductionForm';
import ProductionUploadFotoModal from './ProductionUploadFotoModal';
import PesananCreationModal from './PesananCreationModal';

// ==========================================
// UTILITY
// ==========================================
/**
 * Cek apakah produk sudah punya 3 foto lengkap (depan, samping, atas).
 * Digunakan untuk pre-check sebelum submit "selesai" agar tidak trigger 422.
 */
const hasAllProductPhotos = (product) => {
  if (!product) return false;
  return Boolean(
    product.foto_depan &&
    product.foto_samping &&
    product.foto_atas
  );
};

// ==========================================
// SKELETON COMPONENT
// ==========================================
const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 animate-pulse">
    <div className="flex justify-between mb-2">
      <div className="h-5 w-16 bg-slate-200 rounded-full" />
      <div className="h-4 w-4 bg-slate-200 rounded" />
    </div>
    <div className="text-center mb-2">
      <div className="h-3 bg-slate-200 rounded w-3/4 mx-auto mb-1" />
      <div className="h-2.5 bg-slate-100 rounded w-1/2 mx-auto" />
    </div>
    <div className="space-y-1 mb-2">
      <div className="h-2.5 bg-slate-100 rounded w-full" />
      <div className="h-2.5 bg-slate-100 rounded w-2/3 mx-auto" />
    </div>
    <div className="h-8 bg-slate-100 rounded-lg mt-2" />
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================
const ProductionPage = () => {
  const role = useUserRole();
  const isAdmin = role === 'admin';
  const canOperate = role === 'admin' || role === 'operator';

  const { openCreateModal } = useProductionModals();
  const updateStatusMut = useUpdateProductionStatus();
  const deleteMut = useDeleteProduction();
  const { danger, success, info, warning } = useConfirmDialog();

  // Local state
  const [selectedPesanan, setSelectedPesanan] = useState(null);

  // ✅ NEW: Track which production IDs are currently being processed
  // Digunakan untuk disable button + show spinner per card
  const [processingIds, setProcessingIds] = useState(new Set());

  // Helper to manage processing state
  const setProcessing = (id, isProcessing) => {
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (isProcessing) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Data fetching via React Query
  const {
    data: prodData,
    isLoading: loadingProd,
  } = useProductions();
  const { data: pesananData, isLoading: loadingPesanan } = usePesananProduksi();

  const productions = prodData?.productions || [];
  const pesanan = pesananData?.pesanan || [];

  // Group by status
  const grouped = useMemo(() => ({
    antri: productions.filter((p) => p.status === 'antri'),
    produksi: productions.filter((p) => p.status === 'produksi'),
    selesai: productions.filter((p) => p.status === 'selesai'),
    batal: productions.filter((p) => p.status === 'batal'),
  }), [productions]);

  // ==========================================
  // HANDLERS (dengan loading state + pre-check)
  // ==========================================

  /**
   * Update status (mulai / batal) dengan loading indicator
   */
  const handleUpdateStatus = async (id, status) => {
    const statusLabel = {
      produksi: 'Produksi',
      batal: 'Batal',
    }[status] || status;

    const confirmed = await warning(
      'Ubah Status?',
      `Status produksi akan diubah menjadi "${statusLabel}". Lanjutkan?`
    );
    if (!confirmed) return;

    // ✅ Set loading state
    setProcessing(id, true);

    try {
      await updateStatusMut.mutateAsync({ id, data: { status } });
      await success('Berhasil', `Status diubah ke ${statusLabel}`);
    } catch (error) {
      await info(
        'Gagal Mengubah Status',
        error.response?.data?.message || 'Terjadi kesalahan saat mengubah status.'
      );
    } finally {
      // ✅ Clear loading state (even if error)
      setProcessing(id, false);
    }
  };

  /**
   * Handle selesai dengan PRE-CHECK foto di frontend.
   * ✅ AVOID 422 error dengan cek foto sebelum submit.
   */
  const handleSelesaiWithUpload = async (production) => {
    const product = production.product;
    const hasPhotos = hasAllProductPhotos(product);

    // ✅ PRE-CHECK: Jika foto belum lengkap, tawarkan upload LANGSUNG
    // Tidak perlu submit dulu untuk trigger 422
    if (!hasPhotos) {
      const confirmed = await warning(
        'Lengkapi Foto Produk',
        'Produk harus memiliki foto depan, samping, dan atas sebelum diselesaikan. Upload sekarang?'
      );

      if (confirmed) {
        useProductionStore.getState().openUploadFotoModal(
          production.id,
          production.product_id
        );
      }
      return;
    }

    // Foto lengkap, konfirmasi dulu
    const confirmed = await warning(
      'Selesaikan Produksi?',
      `Produksi "${product?.kode || ''}" akan diselesaikan dan stok diperbarui. Lanjutkan?`
    );
    if (!confirmed) return;

    // ✅ Set loading state
    setProcessing(production.id, true);

    try {
      await updateStatusMut.mutateAsync({
        id: production.id,
        data: { status: 'selesai' },
      });
      await success('Produksi Selesai!', 'Stok telah diperbarui.');
    } catch (error) {
      const errorMsg = error.response?.data?.message || '';

      // Fallback: backend tetap reject karena foto (edge case: foto dihapus dari DB)
      if (error.response?.status === 422 && errorMsg.toLowerCase().includes('foto')) {
        const confirmedUpload = await warning(
          'Lengkapi Foto Produk',
          'Produk harus memiliki foto depan, samping, dan atas. Upload sekarang?'
        );
        if (confirmedUpload) {
          useProductionStore.getState().openUploadFotoModal(
            production.id,
            production.product_id
          );
        }
      } else {
        await info(
          'Gagal Menyelesaikan',
          errorMsg || 'Terjadi kesalahan saat menyelesaikan produksi.'
        );
      }
    } finally {
      // ✅ Clear loading state
      setProcessing(production.id, false);
    }
  };

  /**
   * Delete production dengan loading indicator
   */
  const handleDelete = async (production) => {
    const productCode = production.product?.kode || '';

    const confirmed = await danger(
      'Hapus Produksi?',
      `Produksi "${productCode}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    // ✅ Set loading state
    setProcessing(production.id, true);

    try {
      await deleteMut.mutateAsync(production.id);
      await success('Berhasil', `Produksi "${productCode}" berhasil dihapus.`);
    } catch (error) {
      await info(
        'Gagal Menghapus',
        error.response?.data?.message || 'Terjadi kesalahan saat menghapus produksi.'
      );
    } finally {
      // ✅ Clear loading state
      setProcessing(production.id, false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  const isLoading = loadingProd || loadingPesanan;

  return (
    <div className="space-y-6 pb-20">
      {/* LOADING STATE */}
      {isLoading ? (
        <div className="space-y-6">
          <div>
            <div className="h-6 bg-slate-200 rounded w-48 mb-3 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* PESANAN MENUNGGU PRODUKSI */}
          {pesanan.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg shadow-sm shadow-amber-500/30">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pesanan Menunggu Produksi</h2>
                  <p className="text-[11px] text-slate-500">{pesanan.length} pesanan siap diproduksi</p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-auto">
                  Priority
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {pesanan.map((p) => (
                  <PesananCard
                    key={p.id}
                    pesanan={p}
                    onCreateProduction={setSelectedPesanan}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ANTRI */}
          {grouped.antri.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Antri</h2>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                  {grouped.antri.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {grouped.antri.map((p) => (
                  <ProductionCard
                    key={p.id}
                    production={p}
                    isProcessing={processingIds.has(p.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onSelesaiWithUpload={handleSelesaiWithUpload}
                  />
                ))}
              </div>
            </section>
          )}

          {/* PRODUKSI */}
          {grouped.produksi.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Dalam Produksi</h2>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {grouped.produksi.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {grouped.produksi.map((p) => (
                  <ProductionCard
                    key={p.id}
                    production={p}
                    isProcessing={processingIds.has(p.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                    onSelesaiWithUpload={handleSelesaiWithUpload}
                  />
                ))}
              </div>
            </section>
          )}

          {/* EMPTY STATE */}
          {pesanan.length === 0 && productions.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-900 font-semibold text-lg">Belum Ada Produksi</p>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                Buat produksi inventory baru atau tunggu pesanan dari customer
              </p>
              {canOperate && (
                <button
                  onClick={openCreateModal}
                  className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={14} />
                  Buat Produksi
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* FAB - Add Production */}
      {canOperate && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-6 right-6 z-40 group"
          aria-label="Tambah Produksi"
        >
          <span className="absolute inset-0 rounded-full bg-indigo-600 animate-ping opacity-20 group-hover:opacity-0 transition-opacity duration-500" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 active:scale-95 hover:scale-110">
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Produksi Inventory
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
          </div>
        </button>
      )}

      {/* MODALS */}
      <ProductionForm />
      <ProductionUploadFotoModal />
      <PesananCreationModal
        isOpen={!!selectedPesanan}
        pesanan={selectedPesanan}
        onClose={() => setSelectedPesanan(null)}
      />
    </div>
  );
};

export default ProductionPage;