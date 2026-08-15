<?php

namespace App\Services\Pembayaran;

use App\Models\Pembayaran;
use App\Models\TransaksiDetail;
use Carbon\Carbon;

class PembayaranService
{
    public function getList()
    {
        return Pembayaran::with([
            'transaksiDetail.transaksi.customer',
            'transaksiDetail.product'
        ])->latest()->get();
    }

    public function create(array $data): Pembayaran
    {
        $detail = TransaksiDetail::with('pembayarans')->findOrFail($data['transaksi_detail_id']);

        // 1. Hitung sisa tagihan
        $totalBayarSebelumnya = $detail->pembayarans->sum('jumlah_bayar');
        $sisaTagihan = $detail->subtotal - $totalBayarSebelumnya;

        if ($data['jumlah_bayar'] > $sisaTagihan) {
            throw new \Exception("Jumlah pembayaran melebihi sisa tagihan. Sisa tagihan: Rp " . number_format($sisaTagihan, 0, ',', '.'));
        }

        // 2. Validasi Tanggal
        $tanggalBayarBaru = Carbon::parse($data['tanggal_bayar'])->startOfDay();
        
        $pembayaranTerakhir = $detail->pembayarans
            ->whereNotNull('tanggal_bayar')
            ->sortByDesc('tanggal_bayar')
            ->first();

        if ($pembayaranTerakhir) {
            $tanggalTerakhir = Carbon::parse($pembayaranTerakhir->tanggal_bayar)->startOfDay();

            if ($tanggalBayarBaru->lt($tanggalTerakhir)) {
                throw new \Exception("Tanggal pembayaran tidak boleh lebih awal dari pembayaran terakhir (" . $tanggalTerakhir->format('d M Y') . ").");
            }
        }

        // 3. Simpan
        return Pembayaran::create([
            'transaksi_detail_id' => $data['transaksi_detail_id'],
            'jumlah_bayar'        => $data['jumlah_bayar'],
            'tanggal_bayar'       => $tanggalBayarBaru->toDateString(),
        ]);
    }

    public function update(Pembayaran $pembayaran, array $data): Pembayaran
    {
        if (isset($data['tanggal_bayar'])) {
            $detail = $pembayaran->transaksiDetail;

            $pembayaranTerakhir = $detail->pembayarans
                ->where('id', '!=', $pembayaran->id)
                ->whereNotNull('tanggal_bayar')
                ->sortByDesc('tanggal_bayar')
                ->first();

            $tanggalBaru = Carbon::parse($data['tanggal_bayar'])->startOfDay();

            if ($pembayaranTerakhir) {
                $tanggalTerakhir = Carbon::parse($pembayaranTerakhir->tanggal_bayar)->startOfDay();

                if ($tanggalBaru->lt($tanggalTerakhir)) {
                    throw new \Exception("Tanggal pembayaran tidak boleh lebih awal dari pembayaran terakhir (" . $tanggalTerakhir->format('d M Y') . ").");
                }
            }
        }

        $pembayaran->update($data);

        return $pembayaran->fresh()->load('transaksiDetail');
    }

    public function delete(Pembayaran $pembayaran): array
    {
        $pembayaran->delete();
        return ['success' => true, 'message' => 'Pembayaran berhasil dihapus.'];
    }
}