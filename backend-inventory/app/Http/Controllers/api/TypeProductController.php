<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TypeProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TypeProductController extends Controller
{
    public function index()
    {
        return response()->json([
            'status' => true,
            'data'   => TypeProduct::with('jenis')->get()
        ]);
    }

    public function getByJenis($jenisId)
    {
        $data = TypeProduct::where('jenis_id', $jenisId)->get();
        return response()->json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function show($id)
    {
        $data = TypeProduct::with('jenis')->find($id);

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
            'nama'     => 'required|string|max:255',
            'jenis_id' => 'required|exists:jenis_products,id',
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

        // ✅ Cek duplikasi case-insensitive + jenis_id
        $exists = TypeProduct::where('jenis_id', $request->jenis_id)
            ->whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Type ini sudah ada pada jenis yang dipilih'
            ], 422);
        }

        $data = TypeProduct::create([
            'nama'     => $namaNormalized,
            'jenis_id' => $request->jenis_id,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan',
            'data'    => $data->load('jenis')
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $data = TypeProduct::find($id);

        if (!$data) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama'     => 'required|string|max:255',
            'jenis_id' => 'required|exists:jenis_products,id',
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
        $exists = TypeProduct::where('jenis_id', $request->jenis_id)
            ->whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Type ini sudah ada pada jenis yang dipilih'
            ], 422);
        }

        $data->update([
            'nama'     => $namaNormalized,
            'jenis_id' => $request->jenis_id,
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui',
            'data'    => $data->load('jenis')
        ]);
    }

    public function destroy($id)
    {
        $data = TypeProduct::find($id);

        if (!$data) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $data->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }
}
