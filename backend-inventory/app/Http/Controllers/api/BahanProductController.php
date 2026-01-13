<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BahanProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class BahanProductController extends Controller
{
    public function index()
    {
        $data = BahanProduct::orderByRaw('LOWER(nama) ASC')->get();

        return response()->json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function show($id)
    {
        $data = BahanProduct::find($id);

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
            'nama' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z\s]+$/'
            ]
        ], [
            'nama.regex' => 'Nama harus menggunakan HURUF KAPITAL semua'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);

        $exists = BahanProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Bahan ini sudah ada'
            ], 422);
        }

        $data = BahanProduct::create([
            'nama' => strtoupper($namaInput)
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil ditambahkan',
            'data'    => $data
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $data = BahanProduct::find($id);

        if (!$data) {
            return response()->json([
                'status'  => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z\s]+$/'
            ]
        ], [
            'nama.regex' => 'Nama harus menggunakan HURUF KAPITAL semua'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);

        $exists = BahanProduct::whereRaw('LOWER(nama) = ?', [strtolower($namaInput)])
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status'  => false,
                'message' => 'Bahan ini sudah ada'
            ], 422);
        }

        $data->update([
            'nama' => strtoupper($namaInput)
        ]);

        return response()->json([
            'status'  => true,
            'message' => 'Data berhasil diperbarui',
            'data'    => $data
        ]);
    }

    public function destroy($id)
    {
        $data = BahanProduct::find($id);

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
