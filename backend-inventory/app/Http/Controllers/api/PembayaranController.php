<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\Pembayaran;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    public function index()
    {
        $pembayarans = Pembayaran::with([
            'transaksiDetail.transaksi.customer',
            'transaksiDetail.product'
        ])->latest()->get();

        return response()->json([
            'status' => true,
            'data' => $pembayarans
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaksi_detail_id' => 'required|exists:transaksi_details,id',
            'jumlah_bayar'        => 'required|numeric|min:0',
            'tanggal_bayar'       => 'required|date',
        ], [
            'transaksi_detail_id.exists' => 'Detail transaksi tidak ditemukan.',
            'jumlah_bayar.min'          => 'Jumlah bayar minimal 0.',
            'jumlah_bayar.required'     => 'Jumlah bayar wajib diisi.',
            'tanggal_bayar.required'    => 'Tanggal bayar wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $detail = TransaksiDetail::with('pembayarans', 'transaksi')->findOrFail($request->transaksi_detail_id);

        $totalBayarSebelumnya = $detail->pembayarans->sum('jumlah_bayar');
        $sisaTagihan = $detail->subtotal - $totalBayarSebelumnya;

        if ($request->jumlah_bayar > $sisaTagihan) {
            return response()->json([
                'status'       => false,
                'message'      => 'Jumlah pembayaran melebihi sisa tagihan.',
                'sisa_tagihan' => (float) $sisaTagihan
            ], 422);
        }

        $pembayaranTerakhir = $detail->pembayarans->sortByDesc('tanggal_bayar')->first();

        $tanggalBayarBaru = Carbon::parse($request->tanggal_bayar)->startOfDay();

        if ($pembayaranTerakhir) {
            $tanggalTerakhir = Carbon::parse($pembayaranTerakhir->tanggal_bayar)->startOfDay();
            if ($tanggalBayarBaru->lt($tanggalTerakhir)) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Tanggal pembayaran tidak boleh lebih awal dari pembayaran sebelumnya (' . $tanggalTerakhir->format('d M Y') . ').'
                ], 422);
            }
        }

        $tanggalTransaksi = Carbon::parse($detail->transaksi->tanggal)->startOfDay();
        if ($tanggalBayarBaru->lt($tanggalTransaksi)) {
            return response()->json([
                'status'  => false,
                'message' => 'Tanggal pembayaran tidak boleh lebih awal dari tanggal transaksi (' . $tanggalTransaksi->format('d M Y') . ').'
            ], 422);
        }

        $pembayaran = Pembayaran::create([
            'transaksi_detail_id' => $request->transaksi_detail_id,
            'jumlah_bayar'        => $request->jumlah_bayar,
            'tanggal_bayar'       => $request->tanggal_bayar,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Pembayaran berhasil ditambahkan',
            'data'    => $pembayaran->load('transaksiDetail')
        ], 201);
    }

    public function show($id)
    {
        $pembayaran = Pembayaran::with([
            'transaksiDetail.transaksi.customer',
            'transaksiDetail.product'
        ])->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => $pembayaran
        ]);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'jumlah_bayar'  => 'sometimes|numeric|min:0',
            'tanggal_bayar' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $pembayaran = Pembayaran::findOrFail($id);
        $pembayaran->update($request->only(['jumlah_bayar', 'tanggal_bayar']));

        return response()->json([
            'status' => true,
            'message' => 'Pembayaran berhasil diupdate',
            'data' => $pembayaran->load('transaksiDetail')
        ]);
    }

    public function destroy($id)
    {
        $pembayaran = Pembayaran::findOrFail($id);
        $pembayaran->delete();

        return response()->json([
            'status' => true,
            'message' => 'Pembayaran berhasil dihapus'
        ]);
    }
}
