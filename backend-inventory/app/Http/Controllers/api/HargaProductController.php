<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\HargaProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HargaProductController extends Controller
{
    public function index()
    {
        $data = HargaProduct::with([
            'product.jenis',
            'product.type',
            'product.bahan',
        ])->get();

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function getByProduct($productId)
    {
        $data = HargaProduct::where('product_id', $productId)
            ->orderBy('tanggal_berlaku', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'harga'      => 'required|integer|min:1',
            'tanggal_berlaku' => 'nullable|date',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = HargaProduct::create($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Harga berhasil ditambahkan',
            'data' => $data
        ], 201);
    }

    public function show($id)
    {
        $data = HargaProduct::with('product')->find($id);

        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function update(Request $request, $id)
    {
        $data = HargaProduct::find($id);

        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'harga'      => 'required|integer|min:1',
            'tanggal_berlaku' => 'nullable|date',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $data->update($request->all());

        return response()->json([
            'status' => true,
            'message' => 'Harga berhasil diupdate',
            'data' => $data
        ]);
    }

    public function destroy($id)
    {
        $data = HargaProduct::find($id);

        if (!$data) {
            return response()->json([
                'status' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $data->delete();

        return response()->json([
            'status' => true,
            'message' => 'Harga berhasil dihapus'
        ]);
    }
}
