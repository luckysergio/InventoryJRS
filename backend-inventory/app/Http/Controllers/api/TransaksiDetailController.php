<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\TransaksiDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransaksiDetailController extends Controller
{
    public function index()
    {
        $details = TransaksiDetail::with(['transaksi.customer', 'product', 'statusTransaksi', 'pembayarans'])->get();
        return response()->json(['status' => true, 'data' => $details]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaksi_id'        => 'required|exists:transaksis,id',
            'product_id'          => 'required|exists:products,id',
            'status_transaksi_id' => 'required|exists:status_transaksis,id',
            'tanggal'             => 'required|date',
            'qty'                 => 'required|integer|min:1',
            'harga'               => 'required|numeric|min:0',
            'subtotal'            => 'required|numeric|min:0',
            'discount'            => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $detail = TransaksiDetail::create($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Detail transaksi berhasil dibuat',
            'data'    => $detail
        ], 201);
    }

    public function show($id)
    {
        $detail = TransaksiDetail::with(['transaksi.customer', 'product', 'statusTransaksi', 'pembayarans'])->find($id);
        if (!$detail) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }
        return response()->json(['status' => true, 'data' => $detail]);
    }

    public function update(Request $request, $id)
    {
        $detail = TransaksiDetail::find($id);
        if (!$detail) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'transaksi_id'        => 'required|exists:transaksis,id',
            'product_id'          => 'required|exists:products,id',
            'status_transaksi_id' => 'required|exists:status_transaksis,id',
            'tanggal'             => 'required|date',
            'qty'                 => 'required|integer|min:1',
            'harga'               => 'required|numeric|min:0',
            'subtotal'            => 'required|numeric|min:0',
            'discount'            => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $detail->update($request->all());

        return response()->json([
            'status'  => true,
            'message' => 'Detail transaksi berhasil diperbarui',
            'data'    => $detail
        ]);
    }

    public function destroy($id)
    {
        $detail = TransaksiDetail::find($id);
        if (!$detail) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $detail->delete();
        return response()->json(['status' => true, 'message' => 'Detail transaksi berhasil dihapus']);
    }
}
