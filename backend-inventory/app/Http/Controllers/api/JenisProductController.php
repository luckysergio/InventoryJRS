<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JenisProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class JenisProductController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => true,
            'data'   => JenisProduct::all()
        ]);
    }

    public function show($id)
    {
        $data = JenisProduct::find($id);

        if (!$data) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);
        $namaNormalized = Str::title(strtolower($namaInput));

        // ✅ Cek duplikasi case-insensitive
        $exists = JenisProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Jenis ini sudah ada'
            ], 422);
        }

        $data = JenisProduct::create(['nama' => $namaNormalized]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan',
            'data'    => $data
        ], 201);
    }

    public function update(Request $request, JenisProduct $jenisProduct)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);
        $namaNormalized = Str::title(strtolower($namaInput));

        // ✅ Cek duplikasi case-insensitive (kecuali diri sendiri)
        $exists = JenisProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])
            ->where('id', '!=', $jenisProduct->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Jenis ini sudah ada'
            ], 422);
        }

        $jenisProduct->update(['nama' => $namaNormalized]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui',
            'data'    => $jenisProduct
        ]);
    }

    public function destroy(JenisProduct $jenisProduct)
    {
        $jenisProduct->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }
}
