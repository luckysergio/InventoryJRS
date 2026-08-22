import { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X, Printer, Wallet, Pencil, Trash2, ChevronRight,
  Package, Calendar, User, Receipt, Factory, Clock,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { usePesananModals } from '../../../lib/zustand/pesananStore';
import {
  useDeletePesanan,
  useCancelPesananDetail,
  useUpdatePesananDetailStatus,
  useCompletePesananDetail,
} from '../../../hooks/usePesanan';
import { useConfirmDialog } from '../../../hooks/useConfirmDialog';
import { useIsAdmin } from '../../../lib/zustand/authStore';
import {
  formatRupiah,
  formatTanggal,
  formatProductName,
  getInvoiceNumber,
  normalizeDetails,
  PESANAN_STATUS_INFO,
  PESANAN_STATUS_MAP,
  getProductionInfo,
  isPesananActive,
} from './utils/pesananUtils';
import { cn } from '../../../lib/utils';
import InvoiceSimplePrint from '../../../components/InvoiceSimplePrint';

const PesananDetail = () => {
  const {
    modals,
    selectedPesanan,
    closeDetailModal,
    openFormModal,
    openPembayaranModal,
  } = usePesananModals();
  const { success, danger, info } = useConfirmDialog();
  const isAdmin = useIsAdmin();

  const deleteMut = useDeletePesanan();
  const cancelMut = useCancelPesananDetail();
  const updateStatusMut = useUpdatePesananDetailStatus();
  const completeMut = useCompletePesananDetail();

  const isSubmitting =
    deleteMut.isPending ||
    cancelMut.isPending ||
    updateStatusMut.isPending ||
    completeMut.isPending;

  const isOpen = modals.detail && !!selectedPesanan;
  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedPesanan
      ? getInvoiceNumber(selectedPesanan).replace(/\//g, '-')
      : 'Pesanan',
  });

  const handleEscKey = useCallback(
    (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        closeDetailModal();
      }
    },
    [isOpen, isSubmitting, closeDetailModal]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscKey]);

  const details = useMemo(
    () => normalizeDetails(selectedPesanan?.details || []),
    [selectedPesanan?.details]
  );

  const totalTagihan = Number(selectedPesanan?.total) || 0;
  const totalBayar = Number(selectedPesanan?.total_bayar) || 0;
  const sisaTagihan = Number(selectedPesanan?.sisa_tagihan) || 0;
  const isLunas = sisaTagihan <= 0;

  const handleDelete = async () => {
    const confirmed = await danger(
      'Hapus Pesanan?',
      'Tindakan ini tidak dapat dibatalkan.'
    );
    if (!confirmed) return;
    try {
      await deleteMut.mutateAsync(selectedPesanan.id);
      await success('Berhasil!', 'Pesanan berhasil dihapus');
      closeDetailModal();
    } catch (err) {
      await info('Gagal', err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleCancelDetail = async (detail) => {
    if (detail.pembayarans && detail.pembayarans.length > 0) {
      await info('Tidak bisa dibatalkan', 'Detail ini sudah memiliki pembayaran');
      return;
    }

    const confirmed = await danger(
      'Batalkan Item?',
      `Item "${formatProductName(detail.product)}" akan dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await cancelMut.mutateAsync(detail.id);
      await success('Dibatalkan', 'Item berhasil dibatalkan');
    } catch (err) {
      await info('Gagal', err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleAdvanceStatus = async (detail) => {
    const statusInfo = PESANAN_STATUS_INFO[detail.status_transaksi_id];
    if (!statusInfo?.nextStatus) return;

    const confirmed = await danger(
      'Ubah Status?',
      `Status "${formatProductName(detail.product)}" akan diubah menjadi ${statusInfo.nextLabel}.`,
      'Ya, Lanjut',
      'Batal'
    );
    if (!confirmed) return;

    try {
      if (statusInfo.nextStatus === PESANAN_STATUS_MAP.SELESAI) {
        await completeMut.mutateAsync(detail.id);
        await success('Berhasil!', 'Item diselesaikan');
      } else {
        await updateStatusMut.mutateAsync({
          detailId: detail.id,
          status_transaksi_id: statusInfo.nextStatus,
        });
        await success(
          'Berhasil!',
          `Status diubah ke ${PESANAN_STATUS_INFO[statusInfo.nextStatus].label}`
        );
      }
    } catch (err) {
      await info('Gagal', err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      closeDetailModal();
    }
  };

  if (!isOpen || !selectedPesanan) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleBackdropClick}
      >
        <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] flex flex-col">
          {/* Header — sama persis dengan TransaksiDetail */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm flex-shrink-0">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate font-mono">
                  {getInvoiceNumber(selectedPesanan)}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {formatTanggal(selectedPesanan.tanggal)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    {selectedPesanan.customer?.name || 'Customer Umum'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={closeDetailModal}
              disabled={isSubmitting}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors group flex-shrink-0"
            >
              <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
            </button>
          </div>

          {/* Summary — sama persis dengan TransaksiDetail */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-3 flex-shrink-0">
            <div>
              <p className="text-xs text-slate-500">Total Tagihan</p>
              <p className="text-base font-bold text-slate-900">
                Rp {formatRupiah(totalTagihan)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Bayar</p>
              <p className="text-base font-bold text-green-600">
                Rp {formatRupiah(totalBayar)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sisa Tagihan</p>
              <p
                className={cn(
                  'text-base font-bold',
                  isLunas ? 'text-green-700' : 'text-red-600'
                )}
              >
                {isLunas ? '✅ LUNAS' : `Rp ${formatRupiah(sisaTagihan)}`}
              </p>
            </div>
          </div>

          {/* Details — sama persis dengan TransaksiDetail + fitur pesanan */}
          <div className="flex-1 overflow-y-auto p-6">
            {details.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Tidak ada detail</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {details.map((d) => {
                  const statusCfg =
                    PESANAN_STATUS_INFO[d.status_transaksi_id] ||
                    PESANAN_STATUS_INFO[PESANAN_STATUS_MAP.PROSES];
                  const isDibatalkan =
                    d.status_transaksi_id === PESANAN_STATUS_MAP.DIBATALKAN;
                  const isActive = isPesananActive(d.status_transaksi_id);
                  const sisa = Number(d.sisa_tagihan) || 0;
                  const sudahBayar = Number(d.total_bayar) || 0;
                  const detailLunas = sisa <= 0;
                  const productionInfo = getProductionInfo(d);
                  const hasNextStatus = statusCfg.nextStatus && statusCfg.nextIcon;

                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'border rounded-xl p-4 transition-all',
                        isDibatalkan
                          ? 'bg-red-50/50 border-red-200 opacity-70'
                          : 'bg-white border-slate-200'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-xs text-indigo-700 mb-0.5">
                            {d.product?.kode || '-'}
                          </p>
                          <p className="text-sm font-medium text-slate-800 line-clamp-2">
                            {formatProductName(d.product)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2',
                            statusCfg.bg,
                            statusCfg.text
                          )}
                        >
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                      </div>

                      {!isDibatalkan ? (
                        <>
                          <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Qty × Harga</span>
                              <span className="font-medium">
                                {d.qty} × Rp {formatRupiah(d.harga)}
                              </span>
                            </div>
                            {d.discount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Diskon</span>
                                <span>- Rp {formatRupiah(d.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold text-sm pt-1 border-t border-slate-100">
                              <span>Tagihan</span>
                              <span>Rp {formatRupiah(d.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Sudah Dibayar</span>
                              <span className="font-medium text-green-600">
                                Rp {formatRupiah(sudahBayar)}
                              </span>
                            </div>
                            <div
                              className={cn(
                                'flex justify-between font-semibold pt-1 border-t border-slate-100',
                                detailLunas ? 'text-green-700' : 'text-red-600'
                              )}
                            >
                              <span>Sisa</span>
                              <span>
                                {detailLunas
                                  ? '✅ Lunas'
                                  : `Rp ${formatRupiah(sisa)}`}
                              </span>
                            </div>
                          </div>

                          {d.catatan && (
                            <p className="text-[10px] text-slate-500 italic mt-2 p-2 bg-slate-50 rounded">
                              "{d.catatan}"
                            </p>
                          )}

                          {/* Production Info (fitur khas pesanan) */}
                          {productionInfo.hasProduction ? (
                            <div
                              className={cn(
                                'mt-3 pt-3 border-t border-slate-100 flex items-center gap-2',
                                'p-2 rounded-lg bg-gradient-to-br from-white to-slate-50 border',
                                productionInfo.config.border
                              )}
                            >
                              <div
                                className={cn(
                                  'p-1.5 rounded-md bg-gradient-to-br flex-shrink-0',
                                  productionInfo.config.gradient
                                )}
                              >
                                <Factory size={12} className="text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p
                                    className={cn(
                                      'text-[10px] font-bold',
                                      productionInfo.config.text
                                    )}
                                  >
                                    {productionInfo.config.label}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  {productionInfo.production.karyawan && (
                                    <span className="truncate">
                                      👤 {productionInfo.production.karyawan.nama}
                                    </span>
                                  )}
                                  {productionInfo.production.tanggal_mulai && (
                                    <span className="flex items-center gap-0.5 flex-shrink-0">
                                      <Clock size={9} />
                                      {formatTanggal(
                                        productionInfo.production.tanggal_mulai,
                                        'short'
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : isActive ? (
                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 flex items-center gap-2 px-2 py-1.5 bg-slate-50/50 rounded">
                              <Factory size={12} className="text-slate-400 flex-shrink-0" />
                              <p className="text-[10px] text-slate-500 italic">
                                Belum dibuat produksi
                              </p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-xs text-center text-slate-500 italic py-2">
                          Item ini telah dibatalkan
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — sama persis dengan TransaksiDetail + Edit/Hapus admin */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-2 bg-white flex-shrink-0 flex-wrap">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" /> Cetak
            </button>
            {isAdmin && isPesananActive(
              PESANAN_STATUS_INFO[
                details.reduce(
                  (max, d) =>
                    ![
                      PESANAN_STATUS_MAP.SELESAI,
                      PESANAN_STATUS_MAP.DIBATALKAN,
                    ].includes(d.status_transaksi_id)
                      ? Math.max(max, d.status_transaksi_id)
                      : max,
                  PESANAN_STATUS_MAP.PROSES
                )
              ]
                ? details.reduce(
                    (max, d) =>
                      ![
                        PESANAN_STATUS_MAP.SELESAI,
                        PESANAN_STATUS_MAP.DIBATALKAN,
                      ].includes(d.status_transaksi_id)
                        ? Math.max(max, d.status_transaksi_id)
                        : max,
                    PESANAN_STATUS_MAP.PROSES
                  )
                : PESANAN_STATUS_MAP.PROSES
            ) && (
              <>
                <button
                  onClick={() => openFormModal(selectedPesanan)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </>
            )}
            <div className="flex-1" />
            <button
              onClick={closeDetailModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Component — sama persis dengan TransaksiDetail */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          padding: '20mm',
          boxSizing: 'border-box',
        }}
      >
        <InvoiceSimplePrint ref={printRef} transaksi={selectedPesanan} />
      </div>
    </>
  );
};

export default PesananDetail;