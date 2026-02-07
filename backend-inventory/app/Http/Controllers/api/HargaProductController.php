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
            'customer'
        ])->get();

        return response()->json([
            'status' => true,
            'data' => $data,
        ]);
    }

    public function getByProduct($productId)
    {
        $data = HargaProduct::with('customer')
            ->where('product_id', $productId)
            ->orderBy('tanggal_berlaku', 'desc')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    public function byProduct($productId, Request $request)
{
    $customerId = $request->query('customer_id');

    $harga = HargaProduct::where('product_id', $productId)
        ->where(function ($q) use ($customerId) {
            $q->whereNull('customer_id')
              ->orWhere('customer_id', $customerId);
        })
        ->orderBy('tanggal_berlaku', 'DESC')
        ->get();

    return response()->json(['data' => $harga]);
}

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id'      => 'required|exists:products,id',
            'customer_id'     => 'nullable|exists:customers,id',
            'harga'           => 'required|integer|min:1',
            'tanggal_berlaku' => 'nullable|date',
            'keterangan'      => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ Cek duplikasi: kombinasi product + customer harus unik
        $exists = HargaProduct::where('product_id', $request->product_id)
            ->where('customer_id', $request->customer_id) // null untuk harga umum
            ->exists();

        if ($exists) {
            $customerMsg = $request->customer_id 
                ? ' untuk customer ini' 
                : ' umum';
            return response()->json([
                'status' => false,
                'message' => 'Harga' . $customerMsg . ' sudah ada'
            ], 422);
        }

        $data = HargaProduct::create($validator->validated());

        return response()->json([
            'status' => true,
            'message' => 'Harga berhasil ditambahkan',
            'data' => $data->load('customer')
        ], 201);
    }

    public function show($id)
    {
        $data = HargaProduct::with(['product', 'customer'])->find($id);

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
            'product_id'      => 'required|exists:products,id',
            'customer_id'     => 'nullable|exists:customers,id',
            'harga'           => 'required|integer|min:1',
            'tanggal_berlaku' => 'nullable|date',
            'keterangan'      => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        // ✅ Cek duplikasi (kecuali diri sendiri)
        $exists = HargaProduct::where('product_id', $request->product_id)
            ->where('customer_id', $request->customer_id)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            $customerMsg = $request->customer_id 
                ? ' untuk customer ini' 
                : ' umum';
            return response()->json([
                'status' => false,
                'message' => 'Harga' . $customerMsg . ' sudah ada'
            ], 422);
        }

        $data->update($validator->validated());

        return response()->json([
            'status' => true,
            'message' => 'Harga berhasil diupdate',
            'data' => $data->load('customer')
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