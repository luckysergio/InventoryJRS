<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Models\TypeProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TypeProductController extends Controller
{
    public function master()
    {
        $data = TypeProduct::with('jenis')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $data
        ]);
    }

    public function index()
    {
        $data = TypeProduct::with('jenis')
            ->get();

        return response()->json([
            'status' => true,
            'data'   => $data
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
            'nama' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z0-9\s]+$/'
            ],
            'jenis_id' => 'required|exists:jenis_products,id',
        ], [
            'nama.regex' => 'Nama harus menggunakan HURUF KAPITAL dan boleh mengandung ANGKA'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);

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
            'nama'     => strtoupper($namaInput),
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
            'nama' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z0-9\s]+$/'
            ],
            'jenis_id' => 'required|exists:jenis_products,id',
        ], [
            'nama.regex' => 'Nama harus menggunakan HURUF KAPITAL dan boleh mengandung ANGKA'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors()
            ], 422);
        }

        $namaInput = trim($request->nama);

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
            'nama'     => strtoupper($namaInput),
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
