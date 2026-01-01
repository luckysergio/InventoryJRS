<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\StatusTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class StatusTransaksiController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => true,
            'data' => StatusTransaksi::all()
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|unique:status_transaksis,nama'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = StatusTransaksi::create([
            'nama' => $request->nama
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Status transaksi berhasil ditambahkan',
            'data' => $data
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $status = StatusTransaksi::find($id);
        if (!$status) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|unique:status_transaksis,nama,' . $id
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $status->update([
            'nama' => $request->nama
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Data berhasil diperbarui',
            'data' => $status
        ]);
    }

    public function destroy($id)
    {
        $status = StatusTransaksi::find($id);
        if (!$status) {
            return response()->json(['status' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $status->delete();
        return response()->json(['status' => true, 'message' => 'Data berhasil dihapus']);
    }
}
